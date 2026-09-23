import { useState } from 'react';
import { UserWallet, TradingPosition } from '../types';
import { CoinDistributionPieChart } from '../components/CoinDistributionPieChart';
import { CoinLogo } from '../components/common/CoinLogo';
import { SUPPORTED_COINS } from '../data/mockData';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Sliders,
  Key,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  Users,
  Zap,
  PieChart as PieChartIcon,
} from 'lucide-react';

interface HomeViewProps {
  wallet: UserWallet;
  positions: TradingPosition[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenCustomBot: (pair?: string) => void;
  onOpenApiKey: () => void;
  onNavigateTrading: () => void;
  onOpenProfitShare: () => void;
  onOpenTransfer: () => void;
  onNavigateAccount?: () => void;
}

export function HomeView({
  wallet,
  positions,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenCustomBot,
  onOpenApiKey,
  onNavigateTrading,
  onOpenProfitShare,
  onOpenTransfer,
  onNavigateAccount,
}: HomeViewProps) {
  const activePositions = positions.filter((p) => p.status === 'active' || p.status === 'averaging').slice(0, 3);
  const isExchangeConnected = Boolean(wallet.connectedExchange?.isConnected);
  const [showPieChart, setShowPieChart] = useState(true);

  return (
    <div className="space-y-4 pb-20">
      {/* Live User & Exchange Status Banner */}
      <div className="p-3.5 rounded-2xl bg-[#08101D] border border-[#162740] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#00F0C8]/10 border border-[#00F0C8]/30 flex items-center justify-center font-bold font-mono text-[#00F0C8] text-sm shrink-0">
            {wallet.username[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-white truncate max-w-[140px] sm:max-w-none">
                {wallet.username}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${
                  wallet.accountStatus === 'active'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                {wallet.accountStatus === 'active' ? 'ACTIVE' : 'NON-ACTIVE'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] sm:max-w-none">
              {wallet.email}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenApiKey}
          className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
            isExchangeConnected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 animate-pulse'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isExchangeConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          <span>
            {isExchangeConnected
              ? `${wallet.connectedExchange?.exchange} ${wallet.connectedExchange?.isSandbox ? 'Testnet' : 'Live'}`
              : 'Hubungkan API'}
          </span>
        </button>
      </div>

      {/* Portfolio Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1527] via-[#09111E] to-[#060B14] border border-[#162740] p-5 shadow-xl">
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#00F0C8]/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00F0C8] animate-ping"></span>
            <span>Algorithmic Portfolio Balance</span>
          </div>
          <button
            onClick={onOpenProfitShare}
            className="text-[11px] text-[#00F0C8] hover:underline flex items-center gap-0.5"
          >
            Vault Settle <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
            {wallet.liquidBalance.toFixed(2)}
          </span>
          <span className="text-sm font-bold font-mono text-[#00F0C8]">USDT</span>
        </div>

        {/* Sub metrics */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#14233A] text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Aset Koin Alokasi
            </span>
            <span className="text-sm font-bold text-white mt-0.5 block">
              {wallet.allocatedAssetUsdt.toLocaleString()} USDT
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Volume Trading (24h)
            </span>
            <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
              +{wallet.volume24h.toFixed(2)} USDT
            </span>
          </div>
        </div>
      </div>

      {/* The Real Money Machine VIP Banner */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0C1A30] via-[#0A1629] to-[#07111F] border border-[#00F0C8]/30 p-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00F0C8]/10 border border-[#00F0C8]/40 flex items-center justify-center text-[#00F0C8]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-white uppercase">
                The Real Money Machine
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#00F0C8] text-slate-950">
                VIP ACTIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              QUANTITATIVE ASSET AUTOMATION ENGINE
            </p>
          </div>
        </div>
      </div>

      {/* Quick Action Grid (4 Buttons) */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onOpenDeposit}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#08101D] border border-[#14233A] hover:border-[#00F0C8]/50 hover:bg-[#0C1628] transition group text-center cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white">Deposit</span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">BEP-20</span>
        </button>

        <button
          onClick={onOpenWithdraw}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#08101D] border border-[#14233A] hover:border-[#00F0C8]/50 hover:bg-[#0C1628] transition group text-center cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white">Withdraw</span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">2 USDT Fee</span>
        </button>

        <button
          onClick={() => onOpenCustomBot('BTC/USDT')}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#08101D] border border-[#14233A] hover:border-[#00F0C8]/50 hover:bg-[#0C1628] transition group text-center cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-[#00F0C8] flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
            <Sliders className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white">Custom Bot</span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">100 Steps</span>
        </button>

        <button
          onClick={onOpenApiKey}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#08101D] border border-[#14233A] hover:border-[#00F0C8]/50 hover:bg-[#0C1628] transition group text-center cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
            <Key className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-white">API Key</span>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">Exchange</span>
        </button>
      </div>

      {/* Bagan Lingkaran Distribusi Komposisi Koin (Porsi %, Nilai $, PNL) */}
      <div className="pt-1">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-[#00F0C8]" />
            <h3 className="font-bold text-sm text-white tracking-wide">
              Distribusi Portofolio Koin
            </h3>
          </div>
          <button
            onClick={() => setShowPieChart((prev) => !prev)}
            className="text-xs text-[#00F0C8] hover:underline font-mono cursor-pointer flex items-center gap-1"
          >
            <span>{showPieChart ? 'Sembunyikan' : 'Tampilkan Bagan'}</span>
          </button>
        </div>

        {showPieChart && (
          <CoinDistributionPieChart positions={positions} wallet={wallet} />
        )}
      </div>

      {/* Posisi Trading Aktif Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#00F0C8]" />
          <h3 className="font-bold text-sm text-white tracking-wide">Posisi Trading Aktif</h3>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#00F0C8]/10 text-[#00F0C8] font-bold">
            {positions.filter((p) => p.status !== 'inactive').length}
          </span>
        </div>
        <button
          onClick={onNavigateTrading}
          className="text-xs text-[#00F0C8] hover:underline font-mono flex items-center gap-0.5"
        >
          Lihat Semua →
        </button>
      </div>

      {/* Position Cards (Top 3) */}
      <div className="space-y-2.5">
        {activePositions.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[#08101D] border border-dashed border-[#1B2F4D] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00F0C8]/10 border border-[#00F0C8]/20 flex items-center justify-center text-[#00F0C8] mx-auto">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Belum Ada Posisi Trading Aktif</h4>
              <p className="text-xs text-slate-400 font-mono mt-1 max-w-sm mx-auto">
                12 pair koin resmi siap trading. Hubungkan API exchange Anda untuk sinkronisasi saldo riil atau aktifkan bot averaging.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={onOpenApiKey}
                className="px-3.5 py-1.5 rounded-xl bg-[#00F0C8] text-slate-950 font-bold text-xs font-mono glow-cyan-btn transition"
              >
                Hubungkan API Exchange
              </button>
              <button
                onClick={onNavigateTrading}
                className="px-3.5 py-1.5 rounded-xl bg-[#0F1A2D] text-slate-300 hover:text-white border border-[#162740] font-semibold text-xs font-mono transition"
              >
                Lihat 12 Pair Standby
              </button>
            </div>
          </div>
        ) : (
          activePositions.map((pos) => (
            <div
              key={pos.id}
              className="p-4 rounded-xl bg-[#08101D] border border-[#15243B] hover:border-[#00F0C8]/40 transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <CoinLogo
                    coin={pos.coin || pos.pair}
                    size="md"
                    fallbackSymbol={pos.badgeSymbol}
                    fallbackBg={pos.badgeBg}
                    fallbackColor={pos.badgeColor}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white font-mono">{pos.pair}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          pos.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {pos.statusLabel}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{pos.engine}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-white block">
                    ${pos.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`text-[11px] font-mono font-semibold ${
                      pos.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {pos.change24h >= 0 ? `+${pos.change24h}%` : `${pos.change24h}%`}
                  </span>
                </div>
              </div>

              {/* Position stats */}
              <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-lg bg-[#060B14] border border-[#121E31] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">Alokasi / Qty</span>
                  <span className="text-slate-200 font-semibold">{pos.allocationQty}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block">Layer Step</span>
                  <span className="text-[#00F0C8] font-bold">
                    #{pos.stepLayer} / {pos.maxStep}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Floating PnL</span>
                  <span
                    className={`font-bold ${
                      pos.floatingPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {pos.floatingPnl >= 0 ? `+${pos.floatingPnl.toFixed(2)}` : pos.floatingPnl.toFixed(2)} USDT
                  </span>
                </div>
              </div>

              {/* Trailing Progress & Action */}
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[11px] text-slate-400">{pos.trailingInfo}</span>
                <button
                  onClick={() => onOpenCustomBot(pos.pair)}
                  className="px-2.5 py-1 rounded-md bg-[#0F1A2D] border border-[#1C3050] text-[#00F0C8] hover:bg-[#152540] text-[11px] font-semibold transition"
                >
                  Formula 100 Step →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fitur & Ekosistem GAIN */}
      <div className="pt-3 space-y-2.5">
        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          Fitur & Ekosistem GAIN
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div
            onClick={() => onOpenCustomBot('BTC/USDT')}
            className="p-3.5 rounded-xl bg-[#08101D] border border-[#15243B] hover:border-[#00F0C8]/50 transition cursor-pointer flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-[#00F0C8]/30 flex items-center justify-center text-[#00F0C8]">
              <Layers className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">Bot Setting & Grid Matrix</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Konfigurasi 100 layer averaging dinamis & trailing take profit
              </p>
            </div>
          </div>

          <div
            onClick={onNavigateAccount || onOpenTransfer}
            className="p-3.5 rounded-xl bg-[#08101D] border border-[#15243B] hover:border-[#00F0C8]/50 transition cursor-pointer flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">Jaringan & Referral Matrix</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Spillover reward, bagi hasil 20% & transfer instan 0% fee
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
