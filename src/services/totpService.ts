// RFC 6238 Time-Based One-Time Password (TOTP) & RFC 4226 HMAC-Based OTP
// Zero-dependency pure TypeScript implementation compatible with Google Authenticator, Authy, and Aegis

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Decode Base32 string into Uint8Array
export function base32Decode(input: string): Uint8Array {
  const cleanInput = input.toUpperCase().replace(/[\s=-]/g, '');
  const output: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleanInput.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleanInput[i]);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return new Uint8Array(output);
}

// Encode Uint8Array into Base32 string
export function base32Encode(data: Uint8Array): string {
  let output = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < data.length; i++) {
    value = (value << 8) | data[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

// Generate secure random Base32 secret for Google Authenticator (default: 20 chars / 100 bits)
export function generateTotpSecret(length: number = 20): string {
  const array = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Node environment fallback
    try {
      const crypto = require('crypto');
      const bytes = crypto.randomBytes(length);
      for (let i = 0; i < length; i++) array[i] = bytes[i];
    } catch {
      for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 256);
    }
  }

  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_ALPHABET[array[i] % BASE32_ALPHABET.length];
  }
  return secret;
}

// Pure SHA-1 implementation
function sha1(bytes: Uint8Array): Uint8Array {
  const words: number[] = [];
  for (let i = 0; i < bytes.length; i++) {
    words[i >>> 2] |= (bytes[i] & 0xff) << (24 - (i % 4) * 8);
  }

  const bitLength = bytes.length * 8;
  words[bitLength >>> 5] |= 0x80 << (24 - (bitLength % 32));
  words[(((bitLength + 64) >>> 9) << 4) + 15] = bitLength;

  let H0 = 0x67452301;
  let H1 = 0xefcdab89;
  let H2 = 0x98badcfe;
  let H3 = 0x10325476;
  let H4 = 0xc3d2e1f0;

  const w = new Int32Array(80);

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) {
      w[t] = words[i + t] | 0;
    }
    for (let t = 16; t < 80; t++) {
      const v = w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16];
      w[t] = (v << 1) | (v >>> 31);
    }

    let a = H0;
    let b = H1;
    let c = H2;
    let d = H3;
    let e = H4;

    for (let t = 0; t < 80; t++) {
      let f = 0;
      let k = 0;

      if (t < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (t < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[t]) | 0;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = temp;
    }

    H0 = (H0 + a) | 0;
    H1 = (H1 + b) | 0;
    H2 = (H2 + c) | 0;
    H3 = (H3 + d) | 0;
    H4 = (H4 + e) | 0;
  }

  const result = new Uint8Array(20);
  const hashes = [H0, H1, H2, H3, H4];
  for (let i = 0; i < 5; i++) {
    result[i * 4] = (hashes[i] >>> 24) & 0xff;
    result[i * 4 + 1] = (hashes[i] >>> 16) & 0xff;
    result[i * 4 + 2] = (hashes[i] >>> 8) & 0xff;
    result[i * 4 + 3] = hashes[i] & 0xff;
  }
  return result;
}

// HMAC-SHA1
function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let formattedKey = new Uint8Array(blockSize);

  if (key.length > blockSize) {
    const hashed = sha1(key);
    formattedKey.set(hashed);
  } else {
    formattedKey.set(key);
  }

  const iPad = new Uint8Array(blockSize + message.length);
  const oPad = new Uint8Array(blockSize + 20); // 20 is sha1 output length

  for (let i = 0; i < blockSize; i++) {
    iPad[i] = formattedKey[i] ^ 0x36;
    oPad[i] = formattedKey[i] ^ 0x5c;
  }
  iPad.set(message, blockSize);

  const innerHash = sha1(iPad);
  oPad.set(innerHash, blockSize);

  return sha1(oPad);
}

// Generate 6-digit TOTP Token (RFC 6238)
export function getTotpToken(secret: string, timestampMs: number = Date.now()): string {
  const secretBytes = base32Decode(secret);
  const timeStep = 30; // 30 seconds interval
  const counter = Math.floor(timestampMs / 1000 / timeStep);

  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = temp & 0xff;
    temp = Math.floor(temp / 256);
  }

  const hmac = hmacSha1(secretBytes, counterBytes);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString();
  return otp.padStart(6, '0');
}

// Verify 6-digit TOTP Token with clock drift allowance (window = ±1 step = ±30s)
export function verifyTotp(
  token: string,
  secret: string,
  window: number = 1,
  currentTimestampMs: number = Date.now()
): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.trim().replace(/\s+/g, '');
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  const timeStepMs = 30 * 1000;

  for (let i = -window; i <= window; i++) {
    const testTime = currentTimestampMs + i * timeStepMs;
    const expected = getTotpToken(secret, testTime);
    if (expected === cleanToken) {
      return true;
    }
  }

  return false;
}

// Seconds remaining in current 30s cycle
export function getTotpRemainingSeconds(): number {
  const currentSec = Math.floor(Date.now() / 1000);
  return 30 - (currentSec % 30);
}

// Standard URI for Google Authenticator QR Code
export function getTotpUri(
  secret: string,
  accountName: string,
  issuer: string = 'GAIN Niaga Koin'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// Format secret with spaces for easy manual reading: ABCD EFGH IJKL MNOP
export function formatSecretForDisplay(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}
