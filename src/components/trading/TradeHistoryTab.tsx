import React, { useState, useMemo } from 'react';
import { CoinLogo } from '../common/CoinLogo';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Copy,
  Check,
  Filter,
  Search,
  ExternalLink,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { TradeRecord, UserWallet } from '../../types';

interface TradeHistoryTabProps {
  trades: TradeRecord[];
  wallet: UserWallet;
  activeApiCreds: {
    exchange: string;
    apiKey: string;
    secret: string;
    password?: string;
    isSandbox: boolean;
  } | null;
  onSyncExchangeTrades: () => Promise<void>;
  isSyncing: boolean;
  onOpenApiKeyModal: () => void;
}

export const TradeHistoryTab: React.FC<TradeHistoryTabProps> = ({
  trades,
  wallet,
  activeApiCreds,
  onSyncExchangeTrades,
  isSyncing,
  onOpenApiKeyModal,
}) => {
  const [selectedPair, setSelectedPair] = useState<string>('ALL');
  const [selectedSide, setSelectedSide] = useState<'ALL' | 'buy' | 'sell'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Available pairs from trades
  const availablePairs = useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => set.add(t.symbol));
    return ['ALL', ...Array.from(set)];
  }, [trades]);

  // Filtered trades
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const matchPair = selectedPair === 'ALL' || t.symbol === selectedPair;
      const matchSide = selectedSide === 'ALL' || t.side === selectedSide;
      const matchQuery =
        !searchQuery ||
        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.orderId && t.orderId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.exchange.toLowerCase().includes(searchQuery.toLowerCase());
      return matchPair && matchSide && matchQuery;
    });
  }, [trades, selectedPair, selectedSide, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalFilled = trades.filter((t) => t.status === 'filled' || t.status === 'closed');
    const buyCount = totalFilled.filter((t) => t.side === 'buy').length;
    const sellCount = totalFilled.filter((t) => t.side === 'sell').length;

    const totalVolumeUsdt = totalFilled.reduce((sum, t) => sum + (t.costUsdt || 0), 0);

    const totalRealizedPnl = totalFilled.reduce((sum, t) => sum + (t.realizedPnl || 0), 0);

    const winTrades = totalFilled.filter((t) => (t.realizedPnl ?? 0) > 0).length;
    const closedWithPnl = totalFilled.filter((t) => t.realizedPnl !== undefined && t.realizedPnl !== 0).length;
    const winRate = closedWithPnl > 0 ? ((winTrades / closedWithPnl) * 100).toFixed(1) : '100.0';

    return {
      totalCount: totalFilled.length,
      buyCount,
      sellCount,
      totalVolumeUsdt,
      totalRealizedPnl,
      winRate,
    };
  }, [trades]);

  const handleCopy = (id: string, textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCsv = () => {
    if (filteredTrades.length === 0) return;
    const headers = [
      'Trade ID',
      'Order ID',
      'Exchange',
      'Symbol',
      'Side',
      'Price (USDT)',
      'Amount',
      'Cost (USDT)',
      'Realized PnL (USDT)',
      'Timestamp',
      'Status',
    ];
    const rows = filteredTrades.map((t) => [
      t.id,
      t.orderId || '-',
      t.exchange,
      t.symbol,
      t.side.toUpperCase(),
      t.price,
      t.amount,
      t.costUsdt,
      t.realizedPnl ?? 0,
      new Date(t.timestamp).toLocaleString('id-ID'),
      t.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GAIN_Trade_History_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Overview Metric Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-xl bg-[#08101D] border border-[#14233A]">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
            Total Realized PnL
          </span>
          <div
            className={`text-lg font-bold font-mono mt-1 ${
              metrics.totalRealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}
          >
            {metrics.totalRealizedPnl >= 0
              ? `+${metrics.totalRealizedPnl.toFixed(2)}`
              : metrics.totalRealizedPnl.toFixed(2)}{' '}
            <span className="text-xs text-slate-400">USDT</span>
          </div>
          <span className="text-[10px] text-emerald-300 font-mono mt-0.5 block">
            {metrics.sellCount} Order Take Profit Selesai
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#08101D] border border-[#14233A]">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
            Volume Selesai
          </span>
          <div className="text-lg font-bold text-white font-mono mt-1">
            ${metrics.totalVolumeUsdt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            {metrics.totalCount} Order Terisi (Filled)
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#08101D] border border-[#14233A]">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
            Rasio Win Rate
          </span>
          <div className="text-lg font-bold text-[#00F0C8] font-mono mt-1">
            {metrics.winRate}%
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            Algoritma 100-Step Trailing
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#08101D] border border-[#14233A]">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">
            Distribusi Eksekusi
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {metrics.buyCount} BUY
            </span>
            <span className="text-slate-600 font-mono">/</span>
            <span className="text-sm font-bold text-[#00F0C8] font-mono">
              {metrics.sellCount} SELL
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
            Spot DCA & Averaging
          </span>
        </div>
      </div>

      {/* Action and Filter Controls */}
      <div className="p-3 rounded-xl bg-[#08101D] border border-[#14233A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Pair filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#060B14] px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#162740]">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPair}
              onChange={(e) => setSelectedPair(e.target.value)}
              className="bg-transparent text-xs text-slate-900 dark:text-white font-mono focus:outline-none cursor-pointer"
            >
              {availablePairs.map((p) => (
                <option key={p} value={p} className="bg-white dark:bg-[#0B1525] text-slate-900 dark:text-white">
                  {p === 'ALL' ? 'Semua Pair' : p}
                </option>
              ))}
            </select>
          </div>

          {/* Side filter pills */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-[#060B14] p-0.5 border border-slate-200 dark:border-[#162740] font-mono text-xs">
            <button
              onClick={() => setSelectedSide('ALL')}
              className={`px-2.5 py-1 rounded-md transition ${
                selectedSide === 'ALL'
                  ? 'bg-white dark:bg-[#152742] text-slate-900 dark:text-white font-bold shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedSide('buy')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                selectedSide === 'buy'
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3" />
              BUY
            </button>
            <button
              onClick={() => setSelectedSide('sell')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                selectedSide === 'sell'
                  ? 'bg-teal-500/20 text-teal-700 dark:text-[#00F0C8] font-bold border border-teal-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-[#00F0C8]'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              SELL
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Pair / ID Order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-[#060B14] border border-slate-300 dark:border-[#162740] text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-teal-500 dark:focus:border-[#00F0C8]/50 w-36 md:w-48"
            />
          </div>
        </div>

        {/* Sync & Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={activeApiCreds ? onSyncExchangeTrades : onOpenApiKeyModal}
            disabled={isSyncing}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1E33] hover:bg-[#152B4A] border border-[#1F3A60] text-xs font-mono text-[#00F0C8] font-semibold transition disabled:opacity-50 cursor-pointer"
            title="Tarik transaksi riil dari bursa via CCXT API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sinkronisasi...' : 'Tarik Riwayat Bursa'}
          </button>

          <button
            onClick={handleExportCsv}
            disabled={filteredTrades.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1E33] hover:bg-[#152B4A] border border-[#1F3A60] text-xs font-mono text-slate-300 hover:text-white transition disabled:opacity-40 cursor-pointer"
            title="Ekspor data ke file CSV"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Trade Log Items */}
      {filteredTrades.length === 0 ? (
        <div className="p-10 rounded-2xl bg-[#08101D] border border-dashed border-[#1B2F4D] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00F0C8]/10 border border-[#00F0C8]/20 flex items-center justify-center text-[#00F0C8] mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Belum Ada Riwayat Trading Terfilter</h4>
            <p className="text-xs text-slate-400 font-mono mt-1 max-w-md mx-auto">
              Setiap kali bot melakukan averaging atau take profit di bursa, data order tereksekusi akan tersimpan otomatis di sini. Anda juga dapat menarik riwayat order bursa melalui tombol di atas.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={activeApiCreds ? onSyncExchangeTrades : onOpenApiKeyModal}
              disabled={isSyncing}
              className="px-4 py-1.5 rounded-xl bg-[#00F0C8] text-slate-950 font-bold text-xs font-mono glow-cyan-btn transition"
            >
              {activeApiCreds ? 'Tarik Riwayat dari Exchange' : 'Hubungkan API Exchange Dulu'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTrades.map((t) => {
            const isBuy = t.side === 'buy';
            const formattedDate = new Date(t.timestamp).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-[#08101D] border border-[#14233A] hover:border-[#1E365C] transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
              >
                {/* Left: Side badge, Pair, Exchange & Date */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isBuy
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-[#00F0C8]/10 text-[#00F0C8] border border-[#00F0C8]/20'
                    }`}
                  >
                    {isBuy ? (
                      <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-[#00F0C8]" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <CoinLogo coin={t.symbol} size="xs" />
                        <span className="font-bold text-sm text-white">{t.symbol}</span>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isBuy
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-[#00F0C8]/15 text-[#00F0C8] border border-[#00F0C8]/30'
                        }`}
                      >
                        {isBuy ? 'BUY / MASUK' : 'SELL / TAKE PROFIT'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700">
                        {t.exchange} {t.isSandbox ? '(Testnet)' : ''}
                      </span>
                      {t.layerStep && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#142844] text-[#00F0C8] border border-[#00F0C8]/20">
                          Step #{t.layerStep}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {formattedDate}
                      </span>
                      <span>·</span>
                      <span className="text-slate-400 capitalize">{t.type} Order</span>
                      {t.orderId && (
                        <>
                          <span>·</span>
                          <button
                            onClick={() => handleCopy(t.id, t.orderId!)}
                            className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                            title="Salin Order ID"
                          >
                            <span>ID: {t.orderId.substring(0, 8)}...</span>
                            {copiedId === t.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-500" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Price, Amount, Cost & Realized PnL */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-[#121E31]">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Harga Eksekusi</span>
                    <span className="font-bold text-white">
                      ${t.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Jumlah Koin</span>
                    <span className="font-semibold text-slate-200">
                      {t.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </span>
                  </div>

                  <div className="text-right min-w-[90px]">
                    <span className="text-[10px] text-slate-500 block uppercase">Total Nilai</span>
                    <span className="font-bold text-white block">
                      ${t.costUsdt.toFixed(2)} <span className="text-[10px] text-slate-400">USDT</span>
                    </span>
                    {t.realizedPnl !== undefined && t.realizedPnl !== 0 && (
                      <span
                        className={`text-[10px] font-bold block ${
                          t.realizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {t.realizedPnl >= 0 ? `+${t.realizedPnl.toFixed(2)}` : t.realizedPnl.toFixed(2)} USDT (PnL)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
