import { useState, useEffect } from 'react';
import {
  Mail,
  ShieldCheck,
  Send,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  LogOut,
  Inbox,
  Info,
} from 'lucide-react';

interface GmailVerificationModalProps {
  isOpen: boolean;
  userEmail: string;
  userName: string;
  onVerificationSuccess: () => void;
  onCancel: () => void;
}

export function GmailVerificationModal({
  isOpen,
  userEmail,
  userName,
  onVerificationSuccess,
  onCancel,
}: GmailVerificationModalProps) {
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldownSec, setCooldownSec] = useState(0);
  const [latestCodeHint, setLatestCodeHint] = useState<string | null>(null);

  // Send verification code automatically on open if not sent yet
  useEffect(() => {
    if (isOpen && userEmail) {
      handleSendCode();
    }
  }, [isOpen, userEmail]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = setInterval(() => {
      setCooldownSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSec]);

  if (!isOpen) return null;

  const handleSendCode = async () => {
    if (isSending || cooldownSec > 0) return;
    setIsSending(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const res = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengirim kode verifikasi ke Gmail.');
      }

      setInfoMessage(data.message || `Kode 6 digit telah dikirim ke ${userEmail}`);
      if (data.otpCode) {
        setLatestCodeHint(data.otpCode);
      }
      setCooldownSec(30); // 30 seconds wait before next resend
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengirim kode ke Gmail.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setErrorMessage('Masukkan 6 digit angka kode verifikasi dari Gmail Anda.');
      return;
    }

    setIsVerifying(true);

    try {
      const res = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          code: cleanCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Kode verifikasi tidak valid atau telah kedaluwarsa.');
      }

      setSuccessMessage('Email Gmail berhasil diverifikasi!');
      setTimeout(() => {
        onVerificationSuccess();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memverifikasi kode Gmail.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#080E1A] border border-[#162740] rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Accent Bar */}
        <div className="w-full flex justify-center pt-2.5 pb-1 bg-[#060B14]">
          <div className="w-16 h-1 rounded-full bg-[#18263B]"></div>
        </div>

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 text-center border-b border-[#14233A] bg-[#070D17]">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-[0_0_25px_rgba(239,68,68,0.2)]">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-white tracking-wide">
            Verifikasi Email Registrasi (Gmail)
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Konfirmasi Kepemilikan Akun Baru GAIN
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0E1A2C] border border-[#182C48] text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
            <span className="truncate max-w-[220px] font-bold text-white">{userEmail}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs font-mono">
          <p className="text-center text-slate-300 text-[11px] leading-relaxed">
            Demi keamanan data dan transaksi, akun registrasi baru wajib memverifikasi kode 6-digit yang dikirimkan ke kotak masuk Gmail Anda:
          </p>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setCode(val);
                    setErrorMessage('');
                    if (val.length === 6) {
                      // Trigger submit
                      setTimeout(() => {
                        handleVerify();
                      }, 150);
                    }
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#050A12] border-2 border-[#1E3250] focus:border-red-400 text-center font-mono font-bold text-2xl tracking-[0.35em] text-white placeholder-slate-600 focus:outline-none transition shadow-inner"
                />
              </div>

              {/* Status or simulation hint banner */}
              {latestCodeHint && (
                <div className="mt-2 p-2.5 rounded-xl bg-[#0B1526] border border-[#182E4E] flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Inbox className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>Kode Gmail Anda:</span>
                    <strong className="text-emerald-400 font-mono tracking-widest text-xs">
                      {latestCodeHint}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCode(latestCodeHint);
                    }}
                    className="px-2 py-0.5 rounded bg-[#132238] hover:bg-[#1A2E4C] text-[#00F0C8] text-[10px] font-bold cursor-pointer"
                  >
                    Isi Otomatis
                  </button>
                </div>
              )}
            </div>

            {infoMessage && !errorMessage && !successMessage && (
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-mono flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-mono flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || code.length !== 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/20"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Memvalidasi Kode...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verifikasi & Aktifkan Akun</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Resend Action */}
          <div className="pt-2 text-center">
            <button
              type="button"
              disabled={isSending || cooldownSec > 0}
              onClick={handleSendCode}
              className="text-[11px] text-slate-400 hover:text-white disabled:opacity-50 transition flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isSending ? 'animate-spin text-red-400' : ''}`} />
              {cooldownSec > 0 ? (
                <span>Kirim ulang kode dalam {cooldownSec} detik</span>
              ) : (
                <span>Tidak menerima email? Kirim Ulang Kode</span>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#14233A] bg-[#060B14] flex items-center justify-between text-xs font-mono">
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-rose-400 transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Batal & Keluar</span>
          </button>
          <span className="text-[10px] text-slate-500">GAIN Email Gate v2.0</span>
        </div>
      </div>
    </div>
  );
}
