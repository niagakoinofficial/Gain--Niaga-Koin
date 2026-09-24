import { X, Server, Users, ShieldAlert, Sparkles, Check } from 'lucide-react';

interface ProfitShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenGasModal?: () => void;
}

export function ProfitShareModal({ isOpen, onClose, onOpenGasModal }: ProfitShareModalProps) {
  if (!isOpen) return null;

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
            <h3 className="font-bold text-base text-white tracking-wide">
              Rincian Kalkulasi Bagi Hasil (20% Profit Bot)
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              20% Platform System Fee • 80% Net Trader Realized Profit
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0F1A2D] border border-[#1A2D4A] flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Sample Transaction Box */}
          <div className="p-3.5 rounded-xl bg-[#0B1527] border border-[#162740]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Sample Transaksi Bot</span>
                <p className="font-bold text-sm text-white font-mono mt-0.5">
                  BTC/USDT Take Profit L-33
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Gross Realized Profit</span>
                <p className="font-bold text-base text-emerald-400 font-mono mt-0.5">
                  +100.00 USDT
                </p>
              </div>
            </div>
          </div>

          {/* 80 / 20 Visual Split */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-emerald-400 font-bold">80% Porsi Trader (+80.00 USDT)</span>
              <span className="text-amber-400 font-bold">20% Gas Fee (20.00 USDT)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-[#070D17] overflow-hidden flex border border-[#162740]">
              <div className="h-full bg-emerald-400 w-[80%]"></div>
              <div className="h-full bg-amber-400 w-[20%]"></div>
            </div>
          </div>

          {/* 2-Card Exact 70/30 Distribution Breakdown */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-2 uppercase tracking-wider">
              Rincian Alokasi Pemotongan 20% Gas Fee (Non-MLM)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#09111E] border border-blue-500/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-blue-400">
                    <Server className="w-4 h-4" />
                    <span className="text-xs font-bold">GAIN Foundation & Server</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-blue-400">70%</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">14.00 USDT</div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Operasional Server Node & Engine 24/7</p>
                <p className="text-[9px] text-slate-500 mt-1">Dikelola langsung oleh GAIN Foundation</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#09111E] border border-emerald-500/30">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold">Sponsor Langsung (Direct Upline)</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-400">30%</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">6.00 USDT</div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">Dibagikan Instan ke Wallet Upline</p>
                <p className="text-[9px] text-slate-500 mt-1">1 Tingkat Non-MLM (Bebas Biaya)</p>
              </div>
            </div>
          </div>

          {/* Circuit Breaker & Safety Threshold Box */}
          <div className="p-3.5 rounded-xl bg-[#0B1527] border border-[#162740] space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">
              Aturan Ambang Batas Gas Fee Tank (Circuit Breaker)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25">
                <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
                  <span>Zona Waspada (Warning)</span>
                  <span>≤ 10 USDT</span>
                </div>
                <p className="text-[10px] text-slate-300 font-sans leading-tight">
                  Muncul alert banner untuk top up. <strong>Bot TETAP berjalan normal</strong> tanpa ada pembatasan.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25">
                <div className="flex items-center justify-between text-rose-400 font-bold mb-1">
                  <span>Zona Kritis (Auto-Standby)</span>
                  <span>≤ 5 USDT</span>
                </div>
                <p className="text-[10px] text-slate-300 font-sans leading-tight">
                  Dilarang membuka layer averaging baru. <strong>Masa tenggang (Grace Period) 24 jam</strong> untuk menyelesaikan posisi floating secara aman.
                </p>
              </div>
            </div>
          </div>

          {/* Gas Tank Impact Simulation */}
          <div className="p-3.5 rounded-xl bg-[#070D17] border border-[#14233A] space-y-2 text-xs font-mono">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">
              Simulasi Dampak Saldo Gas Fee Tank (Profit $100)
            </span>
            <div className="flex justify-between text-slate-300">
              <span>Saldo Gas Sebelum:</span>
              <span>28.00 USDT</span>
            </div>
            <div className="flex justify-between text-amber-400">
              <span>Potongan Gas Fee 20%:</span>
              <span>-20.00 USDT (70% Kas: 14.00 | 30% Sponsor: 6.00)</span>
            </div>
            <div className="border-t border-[#132034] pt-2 flex justify-between font-bold text-amber-400">
              <span>Saldo Gas Sesudah:</span>
              <span>+8.00 USDT (Masuk Zona Waspada ≤ 10 USDT)</span>
            </div>
          </div>

          {/* Transparent Policy Box */}
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Kebijakan Anti Rugi (Zero Fee During Drawdown)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              Gas fee dipotong <strong>hanya saat bot membukukan realized profit bersih</strong> di akun exchange Anda. Posisi drawdown atau averaging <strong>tidak pernah dikenakan biaya apapun</strong>.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#060B14] border-t border-[#142236] flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              if (onOpenGasModal) onOpenGasModal();
            }}
            className="px-4 py-2 rounded-xl bg-[#0F1A2D] border border-[#1B3052] text-slate-200 hover:text-white text-xs font-semibold transition"
          >
            Top-Up Gas Pool
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#00F0C8] text-slate-950 text-xs font-bold glow-cyan-btn transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Tutup & Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
