import { useState } from 'react';
import { UserWallet, TransactionRecord, TradingPosition } from '../types';
import { CoinDistributionPieChart } from '../components/CoinDistributionPieChart';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Fuel,
  Search,
  Download,
  Filter,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  PieChart as PieChartIcon,
  Wallet,
  Building2,
  Key,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface WalletViewProps {
  wallet: UserWallet;
  transactions: TransactionRecord[];
  positions?: TradingPosition[];
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenTransfer: () => void;
  onOpenGas: () => void;
  onOpenProfitShare: () => void;
  onOpenApiKey?: () => void;
  onOpenActivationModal?: () => void;
  onOpenCoinsChecker?: () => void;
}

export function WalletView({
  wallet,
  transactions,
  positions = [],
  onOpenDeposit,
  onOpenWithdraw,
  onOpenTransfer,
  onOpenGas,
  onOpenProfitShare,
  onOpenApiKey,
  onOpenActivationModal,
  onOpenCoinsChecker,
}: WalletViewProps) {
  const [filterTab, setFilterTab] = useState<'all' | 'inflow' | 'outflow' | 'gas'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [period, setPeriod] = useState('Semua Periode');
  const [showDistribution, setShowDistribution] = useState(false);

  const filteredTransactions = transactions.filter((tx) => {
    if (filterTab !== 'all' && tx.type !== filterTab) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.title.toLowerCase().includes(q) ||
      (tx.counterparty && tx.counterparty.toLowerCase().includes(q)) ||
      (tx.txHash && tx.txHash.toLowerCase().includes(q))
    );
  });

  const handleExportCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Title,Type,Status,Timestamp,Counterparty,Amount,Fee\n' +
      transactions
        .map(
          (t) =>
            `${t.id},"${t.title}",${t.type},${t.status},"${t.timestamp}","${t.counterparty || ''}",${t.amount},"${t.feeInfo}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'GAIN_Ledger_Mutasi.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exchangeUsdtBalance = wallet.connectedExchange?.isConnected
    ? (wallet.connectedExchange.usdtBalance ?? 0)
    : 0;
  const isExchangeConnected = Boolean(wallet.connectedExchange?.isConnected);

  return (
    <div className="space-y-4 pb-20">
      {/* Notice Bar Explaining Two Balances */}
      <div className="p-3 rounded-xl bg-[#08101E] border border-[#162740] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#00F0C8] shrink-0" />
          <span className="text-slate-300 text-[11px]">
            Sistem membedakan <strong className="text-[#00F0C8]">Saldo Wallet GAIN</strong> (Aktivasi & Gas Fee) dengan <strong className="text-white">Saldo API Exchanger</strong> (Modal Trading Spot).
          </span>
        </div>
        {onOpenCoinsChecker && (
          <button
            onClick={onOpenCoinsChecker}
            className="px-2.5 py-1 rounded-lg bg-[#0E1E34] hover:bg-[#142B4C] border border-[#1A375E] text-[#00F0C8] text-[10px] font-bold transition shrink-0 cursor-pointer flex items-center gap-1"
          >
            <Layers className="w-3 h-3" />
            <span>Cek 12 Koin</span>
          </button>
        )}
      </div>

      {/* DUAL BALANCE SECTION: Wallet GAIN vs Exchange API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* CARD 1: SALDO WALLET GAIN (INTERNAL) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1527] via-[#09111E] to-[#060B14] border border-[#1A3355] p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#00F0C8]/10 text-[#00F0C8] flex items-center justify-center">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  1. Saldo Wallet GAIN (Internal)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                BEP-20 Ledger
              </span>
            </div>

            <p className="text-[10px] text-slate-400 font-mono mt-1.5 leading-relaxed">
              Khusus untuk membayar <strong className="text-slate-200">Biaya Aktivasi Lisensi</strong> & mencadangkan <strong className="text-[#00F0C8]">Gas Fee Trading (20%)</strong>.
            </p>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-[#00F0C8]">
                {wallet.liquidBalance.toFixed(2)}
              </span>
              <span className="text-sm font-bold font-mono text-slate-300">USDT</span>
            </div>

            {/* Sub-details: Available Cash vs Gas Tank */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#14233A] text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Liquid Bebas Dipakai
                </span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {wallet.availableCash.toFixed(2)} USDT
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Cadangan Gas Fee (20% Profit)
                </span>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <span className={`text-sm font-bold block ${
                    wallet.gasReserve <= 5.0
                      ? 'text-rose-400 font-extrabold animate-pulse'
                      : wallet.gasReserve <= 10.0
                      ? 'text-amber-400 font-bold'
                      : 'text-emerald-400'
                  }`}>
                    +{wallet.gasReserve.toFixed(4)} USDT
                  </span>
                  {wallet.gasReserve <= 5.0 ? (
                    <span className="px-1 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      Kritis
                    </span>
                  ) : wallet.gasReserve <= 10.0 ? (
                    <span className="px-1 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40">
                      Waspada
                    </span>
                  ) : (
                    <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Aman
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick status & activation helper */}
          <div className="mt-4 pt-3 border-t border-[#14233A] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400">Status Lisensi:</span>
              <span className={`font-bold ${wallet.accountStatus === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {wallet.accountStatus === 'active' ? 'ACTIVE' : 'NON-ACTIVE'}
              </span>
            </div>
            {onOpenActivationModal && (
              <button
                onClick={onOpenActivationModal}
                className="text-[10px] text-[#00F0C8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Info Biaya Aktivasi</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* CARD 2: SALDO EXCHANGER API (SPOT TRADING) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B1527] via-[#091220] to-[#070D18] border border-[#1C2C42] p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  2. Saldo Exchanger API (Spot)
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                isExchangeConnected
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {wallet.connectedExchange?.exchange || 'Belum Terhubung'}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 font-mono mt-1.5 leading-relaxed">
              Modal trading riil di akun bursa Anda. <strong className="text-slate-200">100% aman</strong>, bot hanya mengeksekusi order buy/sell spot tanpa hak penarikan.
            </p>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {isExchangeConnected ? exchangeUsdtBalance.toFixed(2) : '0.00'}
              </span>
              <span className="text-sm font-bold font-mono text-blue-400">USDT</span>
            </div>

            {/* Sub-details: Connected API status */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#14233A] text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Status Koneksi API
                </span>
                <span className="text-sm font-bold text-white mt-0.5 block flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isExchangeConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>{isExchangeConnected ? 'Aktif Real-time' : 'Disinkronkan'}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Alokasi Aset Koin
                </span>
                <span className="text-sm font-bold text-blue-400 mt-0.5 block">
                  ~{(wallet.allocatedAssetUsdt || 0).toFixed(2)} USDT
                </span>
              </div>
            </div>
          </div>

          {/* Quick API action button & Coin Compatibility Checker */}
          <div className="mt-4 pt-3 border-t border-[#14233A] flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] text-slate-400">
              Mode: {wallet.connectedExchange?.isSandbox ? 'Testnet / Demo' : 'Live Real Account'}
            </span>
            {onOpenApiKey && (
              <button
                onClick={onOpenApiKey}
                className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Key className="w-3 h-3" />
                <span>{isExchangeConnected ? 'Kelola API Key' : 'Hubungkan API Bursa'}</span>
              </button>
            )}
          </div>

          {onOpenCoinsChecker && (
            <button
              onClick={onOpenCoinsChecker}
              className="w-full mt-3 p-2 rounded-xl bg-[#0B1527] hover:bg-[#0F1D36] border border-cyan-500/20 hover:border-cyan-400/40 text-cyan-300 hover:text-cyan-200 transition flex items-center justify-between text-[11px] font-mono cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#00F0C8]" />
                <span className="font-semibold">Cek Ketersediaan 12 Koin di Binance, Bitget, OKX, Bybit...</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Action Buttons Grid (For GAIN Internal Wallet) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Deposit */}
        <button
          onClick={onOpenDeposit}
          className="p-3 rounded-xl bg-[#08101D] border border-[#14233A] hover:border-[#00F0C8]/50 hover:bg-[#0C1628] transition group text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-white">Deposit USDT</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Isi Gas & Aktivasi</div>
        </button>

        {/* Withdraw */}
        <button
          onClick={onOpenWithdraw}
          className="p-3 rounded-xl bg-[#08101D] border border-[#14233A] hover:border-[#00F0C8]/50 hover:bg-[#0C1628] transition group text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-white">Withdraw</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Fee 2 USDT • 2FA</div>
        </button>

        {/* Transfer */}
        <button
          onClick={onOpenTransfer}
          className="p-3 rounded-xl bg-[#08101D] border border-[#14233A] hover:border-[#00F0C8]/50 hover:bg-[#0C1628] transition group text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-[#00F0C8] flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Send className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-white">Transfer P2P</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Kirim Antar Member</div>
        </button>

        {/* Gas Fee */}
        <button
          onClick={onOpenGas}
          className="p-3 rounded-xl bg-[#08101D] border border-[#14233A] hover:border-[#00F0C8]/50 hover:bg-[#0C1628] transition group text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition">
            <Fuel className="w-4 h-4" />
          </div>
          <div className="text-xs font-bold text-white">Gas Fee Tank</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Bagi Hasil 20%</div>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        <div className="p-3 rounded-xl bg-[#08101D] border border-[#14233A]">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Total Inflow
          </span>
          <span className="text-sm font-bold text-emerald-400 mt-1 block">
            +{wallet.totalInflow.toFixed(2)} USDT
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#08101D] border border-[#14233A]">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Total Outflow
          </span>
          <span className="text-sm font-bold text-red-400 mt-1 block">
            -{wallet.totalOutflow.toFixed(2)} USDT
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#08101D] border border-[#14233A]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Gas Consumed
            </span>
            <button
              onClick={onOpenProfitShare}
              className="text-[9px] text-[#00F0C8] hover:underline"
            >
              20%
            </button>
          </div>
          <span className="text-sm font-bold text-amber-400 mt-1 block">
            {wallet.gasConsumed.toFixed(2)} USDT
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#08101D] border border-[#14233A]">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Bonus Sponsor
          </span>
          <span className="text-sm font-bold text-[#00F0C8] mt-1 block">
            +{wallet.referralYield.toFixed(2)} USDT
          </span>
        </div>
      </div>

      {/* Toggleable Coin Distribution Pie Chart */}
      {positions && positions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-[#00F0C8]" />
              <span className="text-xs font-bold text-white font-mono">
                Bagan Distribusi Komposisi Koin
              </span>
            </div>
            <button
              onClick={() => setShowDistribution((prev) => !prev)}
              className="text-xs text-[#00F0C8] hover:underline font-mono cursor-pointer"
            >
              {showDistribution ? 'Sembunyikan' : 'Buka Bagan (%)'}
            </button>
          </div>

          {showDistribution && (
            <CoinDistributionPieChart positions={positions} wallet={wallet} />
          )}
        </div>
      )}

      {/* Riwayat Mutasi & Transaksi Section */}
      <div className="p-4 rounded-2xl bg-[#08101D] border border-[#14233A] space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              Riwayat Mutasi & Transaksi
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Live Ledger Synchronized
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 rounded-lg bg-[#0C1628] border border-[#182B46] text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1 transition"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5 text-[#00F0C8]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari TxID, Member ID, atau tipe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#060B14] border border-slate-300 dark:border-[#142236] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-teal-500 dark:focus:border-[#00F0C8] font-mono"
            />
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#060B14] border border-slate-300 dark:border-[#142236] text-xs text-slate-900 dark:text-slate-300 focus:outline-none focus:border-teal-500 dark:focus:border-[#00F0C8] font-mono cursor-pointer"
          >
            <option value="Semua Periode">Semua Periode</option>
            <option value="7 Hari Terakhir">7 Hari Terakhir</option>
            <option value="30 Hari Terakhir">30 Hari Terakhir</option>
          </select>
        </div>

        {/* Filter Tabs */}
        <div className="flex border-b border-[#142236] text-xs font-mono overflow-x-auto custom-scrollbar">
          {[
            { id: 'all', label: 'Semua Riwayat (All)' },
            { id: 'inflow', label: 'Deposit & Reward (Inflow)' },
            { id: 'outflow', label: 'Withdraw & Fee (Outflow)' },
            { id: 'gas', label: 'Gas Trading Fee' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`py-2 px-3 whitespace-nowrap transition-colors border-b-2 font-medium ${
                filterTab === tab.id
                  ? 'border-[#00F0C8] text-[#00F0C8] font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transaction Ledger Items */}
        <div className="space-y-2 pt-1">
          {filteredTransactions.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs font-mono">
              Tidak ada data transaksi yang cocok.
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-xl bg-[#060B14] border border-[#121E31] hover:border-[#1A2E4C] transition flex items-center justify-between gap-3 text-xs font-mono"
              >
                {/* Left icon & details */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'inflow'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : tx.type === 'gas'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-blue-500/10 text-blue-400'
                    }`}
                  >
                    {tx.type === 'inflow' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : tx.type === 'gas' ? (
                      <Fuel className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-sans text-xs">{tx.title}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${tx.statusColor}`}
                      >
                        {tx.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5 space-x-2">
                      <span>{tx.timestamp}</span>
                      {tx.counterparty && (
                        <span>
                          • {tx.counterpartyLabel || ''}
                          <strong className="text-slate-300 font-normal">{tx.counterparty}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Fee */}
                <div className="text-right shrink-0">
                  <span
                    className={`font-bold text-xs ${
                      tx.amount >= 0 ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                  >
                    {tx.amountFormatted}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{tx.feeInfo}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
