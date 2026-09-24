import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Smartphone,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Sparkles,
  Key,
  Copy,
  Check,
} from 'lucide-react';
import {
  verifyTotp,
  getTotpRemainingSeconds,
  getTotpToken,
  formatSecretForDisplay,
} from '../../services/totpService';

interface Login2faModalProps {
  isOpen: boolean;
  userEmail: string;
  userName: string;
  userSecret: string;
  onVerifySuccess: () => void;
  onCancel: () => void;
}

export function Login2faModal({
  isOpen,
  userEmail,
  userName,
  userSecret,
  onVerifySuccess,
  onCancel,
}: Login2faModalProps) {
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number>(getTotpRemainingSeconds());
  const [showKeyHelp, setShowKeyHelp] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Live countdown
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setRemainingSec(getTotpRemainingSeconds());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const cleanCode = code.trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setErrorMsg('Masukkan 6 digit angka kode Google Authenticator.');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      const isValid = verifyTotp(cleanCode, userSecret, 1);
      if (isValid) {
        setIsVerifying(false);
        onVerifySuccess();
      } else {
        setIsVerifying(false);
        setErrorMsg('Kode 2FA tidak valid atau telah kedaluwarsa. Pastikan jam HP Anda akurat.');
      }
    }, 400);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(userSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-lg animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#080E1A] border border-[#162740] rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Top Hardware Accent */}
        <div className="w-full flex justify-center pt-2.5 pb-1 bg-[#060B14]">
          <div className="w-16 h-1 rounded-full bg-[#18263B]"></div>
        </div>

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 text-center border-b border-[#14233A] bg-[#070D17]">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#00F0C8]/10 border border-[#00F0C8]/30 flex items-center justify-center text-[#00F0C8] shadow-[0_0_25px_rgba(0,240,200,0.2)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-white tracking-wide">
            Verifikasi Dua Langkah (2FA)
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Akun terproteksi Google Authenticator
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0E1A2C] border border-[#182C48] text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="truncate max-w-[200px]">{userEmail || userName}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs font-mono">
          <p className="text-center text-slate-300 text-[11px] leading-relaxed">
            Buka aplikasi <strong>Google Authenticator</strong> di HP Anda, lalu masukkan 6 digit kode keamanan akun GAIN Anda untuk melanjutkan masuk ke dashboard:
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
                    setErrorMsg('');
                    if (val.length === 6) {
                      // Auto-submit on 6 digits
                      setTimeout(() => {
                        const isValid = verifyTotp(val, userSecret, 1);
                        if (isValid) {
                          onVerifySuccess();
                        } else {
                          setErrorMsg('Kode 2FA tidak valid atau kedaluwarsa.');
                        }
                      }, 100);
                    }
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#050A12] border-2 border-[#1E3250] focus:border-[#00F0C8] text-center font-mono font-bold text-2xl tracking-[0.35em] text-[#00F0C8] placeholder-slate-600 focus:outline-none transition shadow-inner"
                />
                <div className="absolute right-3.5 top-3.5 flex items-center gap-1 text-[10px] text-slate-400">
                  <span>{remainingSec}s</span>
                </div>
              </div>

              {/* Countdown progress bar */}
              <div className="w-full bg-[#050A12] rounded-full h-1 mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 via-[#00F0C8] to-cyan-400 transition-all duration-1000 ease-linear"
                  style={{ width: `${(remainingSec / 30) * 100}%` }}
                ></div>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-mono flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || code.length !== 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F0C8] to-[#00D0AD] hover:from-[#00D0AD] hover:to-[#00B092] disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00F0C8]/20"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verifikasi & Masuk Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Help: View / Copy Secret Key */}
          <div className="pt-2 border-t border-[#132034] text-center">
            <button
              type="button"
              onClick={() => setShowKeyHelp(!showKeyHelp)}
              className="text-[11px] text-slate-400 hover:text-[#00F0C8] transition underline cursor-pointer"
            >
              {showKeyHelp ? 'Sembunyikan Kunci Cadangan' : 'Tidak bisa akses kode? Lihat Kunci Cadangan'}
            </button>

            {showKeyHelp && (
              <div className="mt-2.5 p-3 rounded-xl bg-[#050A12] border border-[#162740] text-left space-y-2 animate-fadeIn">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Secret Key Akun Ini:
                </span>
                <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0A1220] border border-[#182C48]">
                  <span className="text-xs font-mono font-bold text-[#00F0C8] break-all select-all">
                    {formatSecretForDisplay(userSecret)}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySecret}
                    className="px-2 py-1 rounded bg-[#0F1A2D] hover:bg-[#162740] text-slate-300 text-[10px] flex items-center gap-1 shrink-0"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-tight">
                  Masukkan kunci ini secara manual di aplikasi Google Authenticator jika belum sempat memindai QR Code.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer: Cancel / Sign Out */}
        <div className="px-6 py-3 border-t border-[#14233A] bg-[#060B14] flex items-center justify-between text-xs font-mono">
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-rose-400 transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Batal & Keluar</span>
          </button>
          <span className="text-[10px] text-slate-500">Security Gate GAIN v2.0</span>
        </div>
      </div>
    </div>
  );
}
