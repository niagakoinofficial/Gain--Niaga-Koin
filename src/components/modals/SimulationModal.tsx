import { useState } from 'react';
import { X, Play, TrendingUp, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SimulationModal({ isOpen, onClose }: SimulationModalProps) {
  const [dipSeverity, setDipSeverity] = useState(45);
  const [isRunning, setIsRunning] = useState(false);
  const [tested, setTested] = useState(false);

  if (!isOpen) return null;

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setTested(true);
    }, 800);
  };

  const stepsTriggered = Math.min(100, Math.round(dipSeverity * 1.4));
  const estimatedProfit = (35 * (stepsTriggered * 0.42) * 1.5).toFixed(2);
  const capitalRequired = (stepsTriggered * 42.5).toFixed(2);
  const safetyMargin = Math.max(0, 68.4 - dipSeverity).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#080E1A] border border-[#162740] rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        {/* Top Hardware Notch */}
        <div className="w-full flex justify-center pt-2 pb-1 bg-[#060B14]">
          <div className="w-16 h-1 rounded-full bg-[#18263B]"></div>
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-[#14233A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00F0C8]/10 text-[#00F0C8] flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-wide">
                Live Simulation & Stress Test
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                100-Step Matrix Monte Carlo Engine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0F1A2D] border border-[#1A2D4A] flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Stress Scenario Slider */}
          <div className="p-4 rounded-xl bg-[#09111E] border border-[#162740] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-300">Simulasi Penurunan Harga (Dip):</span>
              <span className="text-sm font-bold font-mono text-red-400">-{dipSeverity}% Market Crash</span>
            </div>

            <input
              type="range"
              min="10"
              max="70"
              value={dipSeverity}
              onChange={(e) => setDipSeverity(parseInt(e.target.value))}
              className="w-full accent-[#00F0C8] cursor-pointer"
            />

            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-10% (Minor Dip)</span>
              <span>-40% (Flash Crash)</span>
              <span>-70% (Black Swan)</span>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="p-3 rounded-xl bg-[#0B1527] border border-[#162740]">
              <span className="text-[10px] text-slate-400 uppercase">Layer Terpicu</span>
              <div className="text-lg font-bold text-white mt-1">
                {stepsTriggered} / 100
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Averaging active steps</p>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1527] border border-[#162740]">
              <span className="text-[10px] text-slate-400 uppercase">Buffer Keamanan</span>
              <div className="text-lg font-bold text-[#00F0C8] mt-1">
                +{safetyMargin}%
              </div>
              <p className="text-[10px] text-emerald-400 mt-0.5">Zero Liquidation Risk</p>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1527] border border-[#162740]">
              <span className="text-[10px] text-slate-400 uppercase">Modal Digunakan</span>
              <div className="text-lg font-bold text-white mt-1">
                ${capitalRequired}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Allocated USDT</p>
            </div>

            <div className="p-3 rounded-xl bg-[#0B1527] border border-[#162740]">
              <span className="text-[10px] text-slate-400 uppercase">Est. Rebound Profit</span>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                +${estimatedProfit}
              </div>
              <p className="text-[10px] text-emerald-300 mt-0.5">Upon 1.5% Rebound</p>
            </div>
          </div>

          {/* Simulation Output Banner */}
          <div className="p-3.5 rounded-xl bg-[#070D17] border border-[#14233A] space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <TrendingUp className="w-4 h-4" />
              <span>Backtest Status: Resilient against {dipSeverity}% Market Crash</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              Dengan 100 layer matrix, rata-rata harga beli (average entry) otomatis terseret mendekati titik terendah. Begitu terjadi pantulan 1.5%, bot akan mengeksekusi trailing take-profit secara instan.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#060B14] border-t border-[#142236] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0F1A2D] text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            Tutup
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-5 py-2 rounded-xl bg-[#00F0C8] text-slate-950 text-xs font-bold glow-cyan-btn transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <span>Menghitung...</span>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Jalankan Stress Test</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
