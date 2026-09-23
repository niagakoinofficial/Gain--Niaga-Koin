import { useState } from 'react';
import { TradingPosition, UserWallet, TradeRecord, BotMode } from '../types';
import { CoinDistributionPieChart } from '../components/CoinDistributionPieChart';
import { TradeHistoryTab } from '../components/trading/TradeHistoryTab';
import { CoinLogo } from '../components/common/CoinLogo';
import {
  TrendingUp,
  Sliders,
  Play,
  Pause,
  AlertCircle,
  AlertTriangle,
  Search,
  Fuel,
  CheckCircle2,
  DollarSign,
  Layers,
  Sparkles,
  PieChart as PieChartIcon,
  History,
  Activity,
  ArrowDownRight,
  Split,
  Maximize2,
  X,
  Plus,
  Trash2,
  Coins,
  Bot,
  Zap
} from 'lucide-react';

interface TradingPositionsViewProps {
  positions: TradingPosition[];
  wallet: UserWallet;
  tradeHistory?: TradeRecord[];
  activeApiCreds?: {
    exchange: string;
    apiKey: string;
    secret: string;
    password?: string;
    isSandbox: boolean;
  } | null;
  onSyncExchangeTrades?: () => Promise<void>;
  isSyncingTrades?: boolean;
  onOpenApiKeyModal?: () => void;
  onOpenMatrixModal: (
    pair: string,
    mode?: BotMode,
    layers?: number,
    botId?: string | null,
    botName?: string,
    isNewBot?: boolean,
    minPrice?: number | null,
    maxPrice?: number | null,
    pairedCoins?: string[]
  ) => void;
  onDeleteBot?: (posId: string) => void;
  onOpenGasModal: () => void;
  onForceTakeProfit: (posId: string) => Promise<{
    success: boolean;
    orderId?: string;
    isLiveExchange?: boolean;
    netProfit?: number;
    gasDeduction?: number;
    exchangeError?: string;
    error?: string;
  } | void> | void;
  onTogglePause: (posId: string) => void;
  onBatchForceTp: () => void;
  onBatchPauseAll: () => void;
  onOpenActivationModal?: () => void;
  onExecuteBotOrder?: (
    pair: string,
    side: 'buy' | 'sell',
    amount?: number
  ) => Promise<{ success: boolean; orderId?: string; message?: string; error?: string }>;
}

export function TradingPositionsView({
  positions,
  wallet,
  tradeHistory = [],
  activeApiCreds,
  onSyncExchangeTrades,
  isSyncingTrades = false,
  onOpenApiKeyModal,
  onOpenMatrixModal,
  onOpenGasModal,
  onForceTakeProfit,
  onTogglePause,
  onBatchForceTp,
  onBatchPauseAll,
  onOpenActivationModal,
  onExecuteBotOrder,
  onDeleteBot,
}: TradingPositionsViewProps) {
  const [mainTab, setMainTab] = useState<'positions' | 'history'>('positions');
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'profit' | 'drawdown' | 'inactive' | 'avg_only' | 'grid_only' | 'hybrid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'pnl_desc' | 'pnl_asc' | 'layer_desc'>('pnl_desc');
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');
  const [isConfirmBatchTpOpen, setIsConfirmBatchTpOpen] = useState(false);
  const [isConfirmBatchPauseOpen, setIsConfirmBatchPauseOpen] = useState(false);
  const [selectedSingleTpPos, setSelectedSingleTpPos] = useState<TradingPosition | null>(null);
  const [isExecutingSingleTp, setIsExecutingSingleTp] = useState(false);
  const [executingPosId, setExecutingPosId] = useState<string | null>(null);
  const [showPieChart, setShowPieChart] = useState(true);

  // Active Bots calculation (distinct bot configurations)
  const activeBotIds = new Set(
    positions
      .filter((p) => p.status === 'active' || p.status === 'averaging')
      .map((p) => p.botId || p.id)
  );
  const activeBotsCount = activeBotIds.size;
  const maxActiveBots = wallet.accountStatus === 'active' ? (wallet.maxActiveBots || 5) : 5;
  const isStarterTier = wallet.licenseTier !== 'pro_10';

  const activeCount = positions.filter((p) => p.status === 'active' || p.status === 'averaging').length;
  const totalFloatingPnl = positions.reduce((acc, p) => acc + p.floatingPnl, 0);
  const profitablePositions = positions.filter((p) => p.floatingPnl > 0);
  const profitCount = profitablePositions.length;
  const totalProfitUsdt = profitablePositions.reduce((acc, p) => acc + p.floatingPnl, 0);
  const drawdownCount = positions.filter((p) => p.floatingPnl < 0 && p.status !== 'inactive').length;
  const inactiveCount = positions.filter((p) => p.status === 'inactive').length;

  const totalCapital = wallet.liquidBalance + wallet.allocatedAssetUsdt;
  const portfolioRoi = wallet.allocatedAssetUsdt > 0
    ? ((totalFloatingPnl / wallet.allocatedAssetUsdt) * 100).toFixed(2)
    : '0.00';
  const poolExposurePct = totalCapital > 0
    ? Math.round((wallet.allocatedAssetUsdt / totalCapital) * 100)
    : 0;
  const gasHealthPct = Math.min(100, Math.round((wallet.gasReserve / 100) * 100));

  const filteredPositions = positions
    .filter((pos) => {
      if (filterTab === 'active' && pos.status === 'inactive') return false;
      if (filterTab === 'profit' && pos.floatingPnl <= 0) return false;
      if (filterTab === 'drawdown' && (pos.floatingPnl >= 0 || pos.status === 'inactive')) return false;
      if (filterTab === 'inactive' && pos.status !== 'inactive') return false;
      if (filterTab === 'avg_only' && pos.botMode !== 'Avarage Only') return false;
      if (filterTab === 'grid_only' && pos.botMode !== 'Grid Only') return false;
      if (filterTab === 'hybrid' && pos.botMode !== 'Avarage+Grid' && pos.botMode !== undefined) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        pos.pair.toLowerCase().includes(q) ||
        pos.coin.toLowerCase().includes(q) ||
        (pos.botMode && pos.botMode.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'pnl_desc') return b.floatingPnl - a.floatingPnl;
      if (sortBy === 'pnl_asc') return a.floatingPnl - b.floatingPnl;
      if (sortBy === 'layer_desc') return b.stepLayer - a.stepLayer;
      return 0;
    });

  const showToast = (msg: string, type: 'success' | 'warning' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleTriggerBatchTp = () => {
    if (profitCount === 0) {
      showToast('Tidak ada posisi aktif yang sedang dalam profit untuk di-Take Profit.', 'warning');
      return;
    }
    setIsConfirmBatchTpOpen(true);
  };

  const handleConfirmBatchTp = () => {
    setIsConfirmBatchTpOpen(false);
    onBatchForceTp();
    showToast(`Berhasil mengeksekusi Take Profit untuk ${profitCount} posisi profit (+${totalProfitUsdt.toFixed(2)} USDT)!`, 'success');
  };

  const handleTriggerBatchPause = () => {
    setIsConfirmBatchPauseOpen(true);
  };

  const handleConfirmBatchPause = () => {
    setIsConfirmBatchPauseOpen(false);
    onBatchPauseAll();
    showToast(`Perintah Pause berhasil dikirim untuk seluruh (${activeCount}) bot trading!`, 'success');
  };

  const handleOpenSingleTpModal = (pos: TradingPosition) => {
    if (pos.floatingPnl <= 0) {
      showToast(`Posisi ${pos.pair} belum menghasilkan floating profit untuk di-Take Profit.`, 'warning');
      return;
    }
    setSelectedSingleTpPos(pos);
  };

  const handleConfirmSingleTp = async () => {
    if (!selectedSingleTpPos) return;
    setIsExecutingSingleTp(true);
    try {
      const res = await onForceTakeProfit(selectedSingleTpPos.id);
      setIsExecutingSingleTp(false);
      setSelectedSingleTpPos(null);

      if (res && typeof res === 'object' && res.success) {
        if (res.isLiveExchange && res.orderId) {
          showToast(`✅ Take Profit Berhasil! Order Market Sell terisi di ${activeApiCreds?.exchange || 'Exchange'} (ID #${res.orderId}). Net: +${res.netProfit?.toFixed(2)} USDT.`, 'success');
        } else {
          showToast(`✅ Take Profit Berhasil! Net +${res.netProfit?.toFixed(2)} USDT dikreditkan ke Vault (Gas: -${res.gasDeduction?.toFixed(2)} USDT).`, 'success');
        }
      } else {
        showToast(`✅ Force Take Profit dieksekusi untuk ${selectedSingleTpPos.pair}!`, 'success');
      }
    } catch (err: any) {
      setIsExecutingSingleTp(false);
      showToast(`Gagal mengeksekusi Take Profit: ${err.message || 'Kesalahan sistem'}`, 'warning');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* View Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-100 via-white to-slate-100 dark:from-[#0C172A] dark:via-[#091222] dark:to-[#060B14] border border-slate-200 dark:border-[#162740] shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600 dark:text-[#00F0C8]" />
              <span>Posisi Trading Aktif · Live Bot Positions</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              3 Mode: Averager (20L) • Grid (100L) • Avg+Grid (120L) • Filter Uptrend • Trailing TP • Rebound Callback
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => setShowPieChart((prev) => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
                showPieChart
                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-700 dark:text-[#00F0C8]'
                  : 'bg-white dark:bg-[#0C1628] border-slate-200 dark:border-[#182B46] text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>{showPieChart ? 'Sembunyikan Bagan' : 'Bagan Distribusi'}</span>
            </button>

            <button
              onClick={() => onOpenMatrixModal('BTC/USDT', 'Avarage+Grid', 20, null, 'GAIN Matrix Multi-Pair Bot', true, null, null, ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'])}
              className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 dark:bg-[#00F0C8] dark:hover:bg-[#00d8b4] text-slate-950 font-bold text-xs font-mono glow-cyan-btn transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Buat Bot Baru (Multi-Koin)</span>
            </button>

            <button
              onClick={() => onOpenMatrixModal('BTC/USDT', 'Avarage+Grid', 20, null, 'Formula Matrix Bot', false)}
              className="px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-[#00F0C8] hover:bg-teal-500/20 transition text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Matrix Formula</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Tab Switcher: Positions vs Trade History */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#08101D] border border-slate-200 dark:border-[#162740] shadow-sm">
        <button
          onClick={() => setMainTab('positions')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            mainTab === 'positions'
              ? 'bg-teal-500 text-slate-950 dark:bg-[#00F0C8] dark:text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Posisi Berjalan & Standby</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              mainTab === 'positions'
                ? 'bg-slate-900/20 text-slate-950 font-black'
                : 'bg-slate-200 dark:bg-[#152540] text-slate-700 dark:text-slate-300'
            }`}
          >
            {positions.length}
          </span>
        </button>

        <button
          onClick={() => setMainTab('history')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            mainTab === 'history'
              ? 'bg-teal-500 text-slate-950 dark:bg-[#00F0C8] dark:text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Trading & Orders</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              mainTab === 'history'
                ? 'bg-slate-900/20 text-slate-950 font-black'
                : 'bg-slate-200 dark:bg-[#152540] text-slate-700 dark:text-slate-300'
            }`}
          >
            {tradeHistory.length}
          </span>
        </button>
      </div>

      {mainTab === 'history' ? (
        <TradeHistoryTab
          trades={tradeHistory}
          wallet={wallet}
          activeApiCreds={activeApiCreds || null}
          onSyncExchangeTrades={onSyncExchangeTrades || (async () => {})}
          isSyncing={isSyncingTrades}
          onOpenApiKeyModal={onOpenApiKeyModal || (() => {})}
        />
      ) : (
        <>
          {/* Bot Quota & Lifetime License Banner */}
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-slate-100 to-indigo-500/10 dark:from-[#081525] dark:via-[#09111E] dark:to-[#081222] border border-teal-500/25 dark:border-[#162740] shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-[#00F0C8] border border-teal-500/30 flex items-center justify-center shrink-0 shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white">
                    Kuota Bot Aktif: <span className={activeBotsCount >= maxActiveBots ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>{activeBotsCount}</span> / {maxActiveBots} Bot
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/15 text-teal-700 dark:text-[#00F0C8] border border-teal-500/30">
                    {wallet.licenseName || (wallet.accountStatus === 'active' ? 'Starter Lifetime (5 Bot)' : 'Belum Teraktivasi')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    • Draft Setting: <strong className="text-slate-900 dark:text-white">Tanpa Batas</strong>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {activeBotsCount >= maxActiveBots
                    ? `Batas kuota ${maxActiveBots} bot aktif tercapai. Bot baru akan disimpan sebagai Draft (bisa dibuat tanpa batas).`
                    : `Tersedia sisa kuota ${maxActiveBots - activeBotsCount} bot untuk dijalankan bersamaan. Draft bot dapat dibuat tanpa batas.`}
                </p>
              </div>
            </div>

            {onOpenActivationModal && (
              <button
                onClick={onOpenActivationModal}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-500/15 to-indigo-500/15 hover:from-teal-500/25 hover:to-indigo-500/25 text-teal-700 dark:text-[#00F0C8] border border-teal-500/40 text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-teal-600 dark:text-[#00F0C8]" />
                <span>
                  {wallet.accountStatus === 'active'
                    ? isStarterTier
                      ? 'Upgrade ke 10 Bot ($75)'
                      : 'Paket Pro Lifetime (10 Bot)'
                    : 'Aktivasi Lisensi ($100 Promo)'}
                </span>
              </button>
            )}
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            <div className="p-3 rounded-xl bg-white dark:bg-[#08101D] border border-slate-200 dark:border-[#14233A] shadow-sm">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Active Positions
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {activeCount} <span className="text-xs text-slate-400 font-normal">/ {positions.length}</span>
              </div>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-sans mt-0.5 block">Alokasi Otomatis</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#08101D] border border-slate-200 dark:border-[#14233A] shadow-sm">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Floating PnL
              </span>
              <div className={`text-base font-bold mt-1 ${totalFloatingPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {totalFloatingPnl >= 0 ? `+${totalFloatingPnl.toFixed(2)}` : totalFloatingPnl.toFixed(2)} USDT
              </div>
              <span className={`text-[9px] font-mono mt-0.5 block ${Number(portfolioRoi) >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-red-500 dark:text-red-300'}`}>
                {Number(portfolioRoi) >= 0 ? `+${portfolioRoi}%` : `${portfolioRoi}%`} Portfolio ROI
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#08101D] border border-slate-200 dark:border-[#14233A] shadow-sm">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Capital Deployed
              </span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {wallet.allocatedAssetUsdt.toFixed(2)} USDT
              </div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-sans mt-0.5 block">{poolExposurePct}% Pool Exposure</span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#08101D] border border-slate-200 dark:border-[#14233A] shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Gas Pool Health
                </span>
                <button onClick={onOpenGasModal} className="text-[9px] text-teal-600 dark:text-[#00F0C8] hover:underline cursor-pointer">
                  Top-Up
                </button>
              </div>
              <div className="text-base font-bold text-teal-600 dark:text-[#00F0C8] mt-1">
                {gasHealthPct}% {wallet.gasReserve >= 10 ? 'Aman' : 'Perlu Top-Up'}
              </div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                +{wallet.gasReserve.toFixed(2)} USDT
              </span>
            </div>
          </div>

          {/* Coin Distribution Pie Chart */}
          {showPieChart && (
            <CoinDistributionPieChart positions={positions} wallet={wallet} />
          )}

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-200 dark:border-[#142236] text-xs font-mono overflow-x-auto custom-scrollbar">
            {[
              { id: 'all', label: `Semua (${positions.length})` },
              { id: 'active', label: `Aktif (${activeCount})` },
              { id: 'profit', label: `Profit (${profitCount})` },
              { id: 'drawdown', label: `Drawdown (${drawdownCount})` },
              { id: 'avg_only', label: 'Avarage Only' },
              { id: 'grid_only', label: 'Grid Only' },
              { id: 'hybrid', label: 'Avarage+Grid' },
              { id: 'inactive', label: `Standby (${inactiveCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`py-2 px-3 whitespace-nowrap transition-colors border-b-2 font-medium cursor-pointer ${
                  filterTab === tab.id
                    ? 'border-teal-600 dark:border-[#00F0C8] text-teal-700 dark:text-[#00F0C8] font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Sort controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari aset (cth: BTC, SOL, ETH, Grid)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#08101D] border border-slate-300 dark:border-[#142236] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-teal-500 shadow-sm"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[10px]">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#08101D] border border-slate-300 dark:border-[#142236] text-slate-800 dark:text-slate-300 focus:outline-none focus:border-teal-500 shadow-sm"
              >
                <option value="pnl_desc">PnL Tertinggi</option>
                <option value="pnl_asc">PnL Terendah</option>
                <option value="layer_desc">Layer Tertinggi</option>
              </select>
            </div>
          </div>

          {toastMsg && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 justify-center animate-fadeIn shadow-sm ${
                toastType === 'warning'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
              }`}
            >
              {toastType === 'warning' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              )}
              <span>{toastMsg}</span>
            </div>
          )}

          {/* Positions Grid */}
          <div className="space-y-3">
            {filteredPositions.map((pos) => {
              const currentMode: BotMode = pos.botMode || 'Avarage+Grid';
              const maxLayers = pos.maxStep || 10;
              return (
                <div
                  key={pos.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#08101D] border border-slate-200 dark:border-[#14233A] hover:border-slate-300 dark:hover:border-[#1E3456] transition space-y-3 shadow-sm"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <CoinLogo
                        coin={pos.coin || pos.pair}
                        size="lg"
                        fallbackSymbol={pos.badgeSymbol}
                        fallbackBg={pos.badgeBg}
                        fallbackColor={pos.badgeColor}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-base text-slate-900 dark:text-white font-mono">{pos.pair}</span>
                          {pos.botName && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
                              {pos.botName}
                            </span>
                          )}
                          {pos.pairedCoins && pos.pairedCoins.length > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/15 text-teal-700 dark:text-[#00F0C8] border border-teal-500/30 flex items-center gap-1">
                              <Coins className="w-3 h-3" />
                              <span>{pos.pairedCoins.length} Koin Dipairing</span>
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              pos.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                : pos.status === 'averaging'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {pos.statusLabel}
                          </span>

                          {/* Bot Mode Tag */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border ${
                              currentMode === 'Avarage Only'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                : currentMode === 'Grid Only'
                                ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30'
                                : 'bg-teal-500/10 text-teal-700 dark:text-[#00F0C8] border-teal-500/30'
                            }`}
                          >
                            {currentMode === 'Avarage Only' && <ArrowDownRight className="w-3 h-3" />}
                            {currentMode === 'Grid Only' && <Split className="w-3 h-3" />}
                            {currentMode === 'Avarage+Grid' && <Maximize2 className="w-3 h-3" />}
                            <span>{currentMode}</span>
                          </span>

                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-[#0D1829] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#162740]">
                            {maxLayers} Layer
                          </span>

                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Uptrend: {pos.uptrendFilter !== false ? 'ON' : 'OFF'}
                          </span>

                          {currentMode !== 'Grid Only' && (
                            <>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                TP-CB: {pos.tpCallbackPct || 0.2}%
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Layer-CB: {pos.layerCallbackPct || 0.2}%
                              </span>
                            </>
                          )}

                          {currentMode !== 'Avarage Only' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                              Grid-TP: {pos.gridTp || 1.2}%
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{pos.engine}</p>
                      </div>
                    </div>

                    {/* Price & 24h */}
                    <div className="text-right">
                      <div className="text-base font-bold font-mono text-slate-900 dark:text-white">
                        ${typeof pos.price === 'number' ? pos.price.toLocaleString(undefined, { minimumFractionDigits: 2 }) : pos.price}
                      </div>
                      <div
                        className={`text-xs font-mono font-bold ${
                          pos.change24h >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                        }`}
                      >
                        {pos.change24h >= 0 ? `+${pos.change24h}%` : `${pos.change24h}%`}
                      </div>
                    </div>
                  </div>

                  {/* Middle metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#060B14] border border-slate-200 dark:border-[#121E31] text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Alokasi USDT</span>
                      <span className="text-slate-900 dark:text-white font-semibold block mt-0.5">{pos.allocationUsdt}</span>
                      <span className="text-[10px] text-slate-400">{pos.allocationQty}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Layer Step Terpakai</span>
                      <span className="text-teal-600 dark:text-[#00F0C8] font-bold block mt-0.5">
                        #{pos.stepLayer} <span className="text-slate-400 font-normal">/ {maxLayers}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{pos.layerQuota || `1 s/d ${maxLayers} Layer`}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Floating PnL</span>
                      <span
                        className={`font-bold block mt-0.5 ${
                          pos.floatingPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                        }`}
                      >
                        {pos.floatingPnl >= 0 ? `+${pos.floatingPnl.toFixed(2)}` : pos.floatingPnl.toFixed(2)} USDT
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">ROI: {pos.roiPct}%</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">
                        {currentMode === 'Grid Only' ? 'Grid Target' : 'Target TP'}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold block mt-0.5">
                        {pos.tpTriggerPrice || pos.tpTargetPrice || 'Dynamic'}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {currentMode === 'Grid Only' ? 'Sub-Grid Active' : 'Trailing Active'}
                      </span>
                    </div>
                  </div>

                  {/* Pairs Price Range Display (Exact Layout from User Screenshot) */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#060D18] border border-slate-200 dark:border-[#132034] text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Pairs</span>
                      <span className="font-extrabold text-slate-800 dark:text-white bg-slate-200/70 dark:bg-[#0D1829] px-2.5 py-0.5 rounded-lg border border-slate-300 dark:border-[#1A2E4C] tracking-wide">
                        {pos.pair.replace('/', '')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Min Price (Floor) with Red Down Arrow */}
                      <div className="flex items-center gap-1" title="Min Price (Batas Bawah)">
                        <ArrowDownRight className="w-4 h-4 text-rose-500 shrink-0 stroke-[2.5]" />
                        <span className="font-bold text-rose-500 dark:text-rose-400">
                          {pos.minPrice != null && pos.minPrice > 0 ? pos.minPrice.toFixed(8) : '0.00000000'}
                        </span>
                      </div>

                      {/* Max Price (Ceiling) with Green Up Arrow */}
                      <div className="flex items-center gap-1" title="Max Price (Batas Atas)">
                        <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-[#00F0C8] shrink-0 stroke-[2.5]" />
                        <span className="font-bold text-emerald-600 dark:text-[#00F0C8]">
                          {pos.maxPrice != null && pos.maxPrice > 0 ? pos.maxPrice.toFixed(8) : '0.00000000'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Boundary Protection Status Banner */}
                  {pos.maxPrice != null && pos.maxPrice > 0 && pos.price > pos.maxPrice ? (
                    <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-mono flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                        <span>Harga (${typeof pos.price === 'number' ? pos.price.toFixed(2) : pos.price}) &gt; Max Price (${pos.maxPrice.toFixed(2)})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold border border-amber-500/30">
                        BOT ON • TIDAK BUY
                      </span>
                    </div>
                  ) : pos.minPrice != null && pos.minPrice > 0 && pos.price < pos.minPrice ? (
                    <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                        <span>Harga (${typeof pos.price === 'number' ? pos.price.toFixed(2) : pos.price}) &lt; Min Price (${pos.minPrice.toFixed(2)})</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold border border-rose-500/30">
                        BOT ON • TIDAK BUY
                      </span>
                    </div>
                  ) : null}

                  {/* Trailing progress bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1 text-slate-500 dark:text-slate-400">
                      <span>{pos.trailingInfo || `${currentMode} Multiplier Step`}</span>
                      <span>{pos.trailingProgressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#060B14] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all"
                        style={{ width: `${pos.trailingProgressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => onOpenMatrixModal(pos.pair, currentMode, maxLayers, pos.botId || pos.id, pos.botName, false, pos.minPrice, pos.maxPrice, pos.pairedCoins || [pos.pair])}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#0F1B2F] border border-slate-200 dark:border-[#1A3152] text-teal-700 dark:text-[#00F0C8] text-xs font-mono font-semibold hover:bg-slate-200 dark:hover:bg-[#142642] transition flex items-center gap-1.5 cursor-pointer"
                        title="Setting konfigurasi bot ini & atur koin apa saja yang dipairing"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Setting Bot & Pairing Koin</span>
                      </button>

                      <button
                        onClick={() => onOpenMatrixModal('BTC/USDT', 'Avarage+Grid', 20, undefined, 'GAIN Multi-Pair Bot', true, null, null, ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'])}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/25 text-teal-700 dark:text-[#00F0C8] text-xs font-mono font-semibold hover:bg-teal-500/20 transition flex items-center gap-1 cursor-pointer"
                        title="Buat bot baru dengan pairing multi-koin"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Bot Baru</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {onExecuteBotOrder && (
                        <button
                          disabled={executingPosId === pos.id}
                          onClick={async () => {
                            if (pos.maxPrice != null && pos.maxPrice > 0 && pos.price > pos.maxPrice) {
                              showToast(`⚠️ Batas Max Price: Harga ${pos.pair} (${pos.price}) masih di atas batas Max Price (${pos.maxPrice}). Bot dilarang buy!`);
                              return;
                            }
                            if (pos.minPrice != null && pos.minPrice > 0 && pos.price < pos.minPrice) {
                              showToast(`⚠️ Batas Min Price: Harga ${pos.pair} (${pos.price}) di bawah batas Min Price (${pos.minPrice}). Bot dilarang buy!`);
                              return;
                            }
                            setExecutingPosId(pos.id);
                            showToast(`Mengirim order ${pos.pair} ke Exchange Testnet...`);
                            const res = await onExecuteBotOrder(pos.pair, 'buy');
                            setExecutingPosId(null);
                            if (res.success) {
                              showToast(`✅ Order Terisi! ID: #${res.orderId || 'SUCCESS'}`);
                            } else {
                              showToast(`❌ Gagal: ${res.error}`);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/40 text-teal-700 dark:text-[#00F0C8] hover:bg-teal-500/25 text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Kirim order averaging layer langsung ke Exchange Testnet"
                        >
                          <Sparkles className={`w-3.5 h-3.5 ${executingPosId === pos.id ? 'animate-spin' : ''}`} />
                          <span>{executingPosId === pos.id ? 'Mengirim...' : 'Eksekusi Step Testnet'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          onTogglePause(pos.id);
                          showToast(`Status bot ${pos.pair} berhasil diubah.`);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#0E1726] border border-slate-200 dark:border-[#1A2A42] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition cursor-pointer"
                        title={pos.status === 'active' ? 'Pause Bot' : 'Resume Bot'}
                      >
                        {pos.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleOpenSingleTpModal(pos)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-mono font-semibold transition flex items-center gap-1 cursor-pointer"
                        title="Eksekusi Force Take Profit & Order Jual Pasar"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Force TP</span>
                      </button>

                      {onDeleteBot && positions.filter(p => (p.coin || p.pair.split('/')[0]) === (pos.coin || pos.pair.split('/')[0])).length > 1 && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus instance bot "${pos.botName || pos.pair}"?`)) {
                              onDeleteBot(pos.id);
                              showToast(`Bot ${pos.botName || pos.pair} dihapus.`);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                          title="Hapus instance bot ini (tersedia jika ada >1 bot pada koin ini)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Batch Control Footer Bar */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#070D17] border border-slate-200 dark:border-[#14233A] space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400">Batch Global Controls:</span>
              <span className="text-teal-600 dark:text-[#00F0C8] font-bold">
                {positions.length} Bots Connected to {wallet.connectedExchange?.exchange || 'Exchange'} {wallet.connectedExchange?.isSandbox ? '(Testnet)' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleTriggerBatchTp}
                className="py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold hover:bg-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
              >
                <Sparkles className="w-4 h-4" />
                <span>Batch Force Take Profit ({profitCount} In-Profit)</span>
              </button>

              <button
                onClick={handleTriggerBatchPause}
                className="py-2.5 rounded-xl bg-white dark:bg-[#0E1A2D] border border-slate-300 dark:border-[#1E3456] text-slate-800 dark:text-slate-300 text-xs font-mono font-semibold hover:text-slate-950 dark:hover:text-white transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
              >
                <Pause className="w-4 h-4" />
                <span>Pause / Standby All Bots ({activeCount} Aktif)</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal: Single Coin Force Take Profit */}
      {selectedSingleTpPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0A1220] border border-slate-200 dark:border-[#182B48] rounded-2xl p-5 shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#162740] pb-3">
              <div className="flex items-center gap-2.5">
                <CoinLogo
                  coin={selectedSingleTpPos.pair}
                  className="w-9 h-9 rounded-xl border border-slate-200 dark:border-[#1E3558] bg-slate-100 dark:bg-[#0E1B30]"
                />
                <div>
                  <h3 className="text-sm font-bold tracking-wide flex items-center gap-1.5">
                    <span>Force Take Profit {selectedSingleTpPos.pair}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                      +{selectedSingleTpPos.roiPct.toFixed(2)}%
                    </span>
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    Eksekusi Order Jual Pasar & Kunci Keuntungan
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isExecutingSingleTp && setSelectedSingleTpPos(null)}
                disabled={isExecutingSingleTp}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#0F1B2D] border border-slate-200 dark:border-[#1A2C46] flex items-center justify-center text-slate-500 hover:text-slate-950 dark:hover:text-white disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Exchange Connection Banner */}
            <div
              className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
                activeApiCreds && activeApiCreds.apiKey
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-900 dark:text-teal-200'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
              }`}
            >
              <Sparkles
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  activeApiCreds && activeApiCreds.apiKey
                    ? 'text-teal-600 dark:text-[#00F0C8]'
                    : 'text-amber-500'
                }`}
              />
              <div className="space-y-0.5 text-[11px]">
                {activeApiCreds && activeApiCreds.apiKey ? (
                  <>
                    <p className="font-bold">
                      Order Riil Exchanger Aktif ({activeApiCreds.exchange}{' '}
                      {activeApiCreds.isSandbox ? 'Testnet' : 'Live'})
                    </p>
                    <p className="opacity-90 leading-tight">
                      Sistem akan mengirimkan <strong className="text-emerald-600 dark:text-emerald-400">Market Sell Order</strong> langsung via CCXT ke akun exchanger Anda untuk melikuidasi aset koin ini.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold">Mode Simulasi Vault Internal</p>
                    <p className="opacity-90 leading-tight">
                      API Key belum tersambung di sesi ini. Take profit akan diselesaikan langsung ke saldo Vault GAIN.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Financial Breakdown Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070D18] border border-slate-200 dark:border-[#152744] space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Estimasi Kuantitas Dijual:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedSingleTpPos.allocationQty || `${(parseFloat(selectedSingleTpPos.allocationUsdt.replace(/[^0-9.]/g, '')) / (selectedSingleTpPos.price || 1)).toFixed(4)} ${selectedSingleTpPos.coin}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span>Harga Pasar Saat Ini:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  ${selectedSingleTpPos.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-[#14233D] pt-2 flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300">Total Floating Gross Profit:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  +{selectedSingleTpPos.floatingPnl.toFixed(2)} USDT
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Alokasi Net Trader (80%):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  +{(selectedSingleTpPos.floatingPnl * 0.8).toFixed(2)} USDT
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Potongan Gas Tank (20%):</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  -{(selectedSingleTpPos.floatingPnl * 0.2).toFixed(2)} USDT
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Setelah dieksekusi, keuntungan bersih langsung dicairkan ke saldo liquid Anda, kuota gas tank didebet, dan bot {selectedSingleTpPos.pair} akan memulai siklus layer baru.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isExecutingSingleTp}
                onClick={() => setSelectedSingleTpPos(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0E1A2C] border border-slate-300 dark:border-[#1E3456] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#152540] transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isExecutingSingleTp}
                onClick={handleConfirmSingleTp}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-mono transition shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <DollarSign className={`w-3.5 h-3.5 ${isExecutingSingleTp ? 'animate-spin' : ''}`} />
                <span>
                  {isExecutingSingleTp ? 'Mengeksekusi Order...' : 'Konfirmasi Force TP'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Batch Force Take Profit */}
      {isConfirmBatchTpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0A1220] border border-slate-200 dark:border-[#182B48] rounded-2xl p-5 shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#162740] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">Konfirmasi Batch Force TP</h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Eksekusi Take Profit Serentak</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmBatchTpOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#0F1B2D] border border-slate-200 dark:border-[#1A2C46] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Posisi Siap Take Profit:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{profitCount} Pasang Koin</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Total Floating Profit:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+{totalProfitUsdt.toFixed(2)} USDT</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px]">
                <span>Alokasi Net Trader (80%):</span>
                <span>+{(totalProfitUsdt * 0.8).toFixed(2)} USDT</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px]">
                <span>Deduction Gas Tank (20%):</span>
                <span>-{(totalProfitUsdt * 0.2).toFixed(2)} USDT</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tindakan ini akan langsung mengunci floating profit dari seluruh posisi yang sedang hijau, mengkreditkan saldo bersih ke vault, dan memulai siklus averaging baru.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setIsConfirmBatchTpOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0E1A2C] border border-slate-300 dark:border-[#1E3456] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#152540] transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmBatchTp}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-mono transition shadow-lg flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Eksekusi TP ({profitCount})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Batch Pause All */}
      {isConfirmBatchPauseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-[#0A1220] border border-slate-200 dark:border-[#182B48] rounded-2xl p-5 shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#162740] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Pause className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">Konfirmasi Pause Seluruh Bot</h3>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">Standby Algorithmic Execution</p>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmBatchPauseOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-[#0F1B2D] border border-slate-200 dark:border-[#1A2C46] flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                <span>Bot Aktif yang Ditarget:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{activeCount} Bot</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Order averaging yang sedang menunggu trigger tidak akan dieksekusi selama bot berstatus PAUSED.
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Apakah Anda yakin ingin menghentikan sementara seluruh bot trading aktif? Anda dapat melanjutkan kembali kapan saja dari tombol Play di kartu posisi masing-masing.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setIsConfirmBatchPauseOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-[#0E1A2C] border border-slate-300 dark:border-[#1E3456] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#152540] transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmBatchPause}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono transition shadow-lg flex items-center justify-center gap-1.5"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Seluruh Bot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

