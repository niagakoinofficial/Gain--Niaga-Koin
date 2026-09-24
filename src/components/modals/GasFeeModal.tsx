import { useState } from 'react';
import { X, Fuel, ShieldCheck, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface GasFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  currentGasReserve: number;
  onTopUpSuccess: (amount: number) => void;
  onOpenProfitShare?: () => void;
}

export function GasFeeModal({
  isOpen,
  onClose,
  availableBalance,
  currentGasReserve,
  onTopUpSuccess,
  onOpenProfitShare,
}: GasFeeModalProps) {
  const [amount, setAmount] = useState('15');
  const [autoRefill, setAutoRefill] = useState(true);
  const [otp2fa, setOtp2fa] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const newGasTotal = currentGasReserve + numAmount;

  // Gas Health Status Calculation (Based on 10 USDT Warning & 5 USDT Critical rules)
  const isCritical = currentGasReserve <= 5.0;
  const isWarning = currentGasReserve > 5.0 && currentGasReserve <= 10.0;
  const gasStatusText = isCritical
    ? 'Zona Kritis (≤ 5 USDT)'
    : isWarning
    ? 'Zona Waspada (≤ 10 USDT)'
    : 'Aman (> 10 USDT)';
  const gasStatusBadge = isCritical
    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    : isWarning
    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  const healthPercent = Math.min(100, Math.max(5, (currentGasReserve / 25) * 100));

  if (!isOpen) return null;

  const handleAddAmount = (addVal: number) => {
    setAmount((prev) => {
      const current = parseFloat(prev) || 0;
      return (current + addVal).toString();
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (numAmount <= 0) {
      setErrorMsg('Masukkan jumlah alokasi gas pool.');
      return;
    }

    if (numAmount > availableBalance) {
      setErrorMsg('Saldo vault tidak mencukupi untuk alokasi gas pool.');
      return;
    }

    if (otp2fa.length < 6) {
      setErrorMsg('Masukkan 6 digit kode Google 2FA.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      onTopUpSuccess(numAmount);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1400);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#080E1A] border border-[#162740] rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        {/* Top Hardware Notch */}
        <div className="w-full flex justify-center pt-2 pb-1 bg-[#060B14]">
          <div className="w-16 h-1 rounded-full bg-[#18263B]"></div>
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-[#14233A] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white tracking-wide flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-400" />
              <span>Top-Up Gas Fee Pool</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              20% Profit-Share Reserve & Execution Fuel
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0F1A2D] border border-[#1A2D4A] flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Current Gas Tank & Health Bar */}
          <div className="p-4 rounded-xl bg-[#0B1527] border border-[#162740] space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Current Gas Tank</span>
                <div className="text-xl font-bold font-mono text-[#00F0C8]">
                  +{currentGasReserve.toFixed(6)} <span className="text-xs text-slate-400">USDT</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono border font-semibold ${gasStatusBadge}`}>
                  {gasStatusText}
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  {isCritical ? '24h Grace Period Aktif' : isWarning ? 'Bot Berjalan Normal' : 'Semua Bot Normal'}
                </p>
              </div>
            </div>

            {/* Health Bar */}
            <div className="w-full h-2 rounded-full bg-[#070D17] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCritical
                    ? 'bg-rose-500'
                    : isWarning
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                }`}
                style={{ width: `${healthPercent}%` }}
              ></div>
            </div>

            {/* Critical Alert Warning */}
            {isCritical && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span>
                  Gas ≤ 5 USDT: Bot dilarang membuka layer averaging baru. Segera top-up agar siklus averaging berjalan tanpa hambatan.
                </span>
              </div>
            )}

            {isWarning && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Gas ≤ 10 USDT: Peringatan saldo gas menipis. Bot tetap berjalan normal, disarankan melakukan top-up.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span>Vault Tersedia: {availableBalance.toFixed(2)} USDT</span>
              {onOpenProfitShare && (
                <button
                  type="button"
                  onClick={onOpenProfitShare}
                  className="text-[#00F0C8] hover:underline"
                >
                  Formula Bagi Hasil 70/30 →
                </button>
              )}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider">
                Jumlah Alokasi Gas
              </label>
              <span className="text-[11px] text-slate-400 font-mono">Min: 5 USDT</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="1"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#09111E] border border-[#162740] font-mono text-sm text-white focus:outline-none focus:border-[#00F0C8]"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">
                USDT
              </span>
            </div>

            {/* Quick Chips (+5, +10, +15, +25, +50, MAX) */}
            <div className="grid grid-cols-6 gap-1.5 mt-2">
              {[5, 10, 15, 25, 50].map((add) => (
                <button
                  key={add}
                  type="button"
                  onClick={() => handleAddAmount(add)}
                  className="py-1 rounded-lg bg-[#0C1628] border border-[#172A46] text-[11px] font-mono text-slate-300 hover:text-[#00F0C8] hover:border-[#00F0C8]/40 transition text-center"
                >
                  +{add}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(availableBalance.toFixed(0))}
                className="py-1 rounded-lg bg-[#00F0C8]/10 border border-[#00F0C8]/30 text-[11px] font-mono text-[#00F0C8] font-bold hover:bg-[#00F0C8]/20 transition"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Auto-Refill Guard Toggle */}
          <div className="p-3 rounded-xl bg-[#070D17] border border-[#14233A] flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Sparkles className="w-3.5 h-3.5 text-[#00F0C8]" />
                <span>Auto-Refill Threshold Protection</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Isi otomatis 10 USDT dari vault jika gas pool &lt; 3 USDT untuk mencegah bot terhenti
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoRefill(!autoRefill)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                autoRefill ? 'bg-[#00F0C8]' : 'bg-[#162740]'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  autoRefill ? 'translate-x-5' : 'translate-x-0'
                }`}
              ></span>
            </button>
          </div>

          {/* Google 2FA */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-mono text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00F0C8]" />
                Google 2FA Autentikasi
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">Secured</span>
            </div>
            <input
              type="text"
              maxLength={6}
              placeholder="6 Digit Kode Google Authenticator"
              value={otp2fa}
              onChange={(e) => setOtp2fa(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#09111E] border border-[#162740] font-mono text-center tracking-widest text-sm text-white focus:outline-none focus:border-[#00F0C8]"
            />
          </div>

          {/* Breakdown summary */}
          <div className="p-3.5 rounded-xl bg-[#070D17] border border-[#14233A] space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Sumber Dana:</span>
              <span className="text-white">Saldo Vault ({availableBalance.toFixed(2)} USDT)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Target Alokasi:</span>
              <span className="text-emerald-400">Smart Gas Reserve</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Biaya Alokasi:</span>
              <span className="text-emerald-400">0.00 USDT (Internal Pool)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimasi Ketahanan Trading:</span>
              <span className="text-cyan-400 font-semibold">~35 Hari Siklus Bot</span>
            </div>
            <div className="border-t border-[#132034] pt-2 flex justify-between items-baseline">
              <span className="text-slate-300 font-sans font-medium">Estimasi Saldo Gas Baru:</span>
              <span className="text-base font-bold text-[#00F0C8]">
                +{newGasTotal.toFixed(6)} USDT
              </span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Gas Fee Pool Berhasil Ditambahkan!</span>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#0F1A2D] text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-[#00F0C8] text-slate-950 text-xs font-bold glow-cyan-btn transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Fuel className="w-4 h-4" />
              {isProcessing ? 'Mengalokasikan...' : 'Konfirmasi & Isi Gas Fee Pool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
