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

          {/* 3-Card Distribution Breakdown */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-2 uppercase tracking-wider">
              Rincian Alokasi Pemotongan 20% Gas Fee
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-[#09111E] border border-[#162740]">
                <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                  <Server className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Infra & Server</span>
                </div>
                <div className="text-lg font-bold font-mono text-white">40%</div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">8.00 USDT</p>
                <p className="text-[9px] text-slate-500 mt-1">High-frequency algorithmic node & cloud</p>
              </div>

              <div className="p-3 rounded-xl bg-[#09111E] border border-[#162740]">
                <div className="flex items-center gap-1.5 text-purple-400 mb-1">
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Affiliate & VIP</span>
                </div>
                <div className="text-lg font-bold font-mono text-white">50%</div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">10.00 USDT</p>
                <p className="text-[9px] text-slate-500 mt-1">Distributed to sponsor matrix tree</p>
              </div>

              <div className="p-3 rounded-xl bg-[#09111E] border border-[#162740]">
                <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Buffer Reserve</span>
                </div>
                <div className="text-lg font-bold font-mono text-white">10%</div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">2.00 USDT</p>
                <p className="text-[9px] text-slate-500 mt-1">Black swan insurance liquidity pool</p>
              </div>
            </div>
          </div>

          {/* Gas Tank Impact Simulation */}
          <div className="p-3.5 rounded-xl bg-[#070D17] border border-[#14233A] space-y-2 text-xs font-mono">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider">
              Simulasi Dampak Saldo Gas Fee Tank
            </span>
            <div className="flex justify-between text-slate-300">
              <span>Saldo Gas Sebelum:</span>
              <span>28.029313 USDT</span>
            </div>
            <div className="flex justify-between text-amber-400">
              <span>Pemotongan Gas Fee (20% Profit):</span>
              <span>-20.000000 USDT</span>
            </div>
            <div className="border-t border-[#132034] pt-2 flex justify-between font-bold text-[#00F0C8]">
              <span>Saldo Gas Sesudah:</span>
              <span>+8.029313 USDT</span>
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
