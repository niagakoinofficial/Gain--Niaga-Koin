export type NavigationRoute = 'home' | 'wallet' | 'bot' | 'trading' | 'akun';

export type ExchangeName = 'Bitget' | 'Binance' | 'OKX' | 'Tokocrypto' | 'Bybit' | 'Indodax';

export type BotMode = 'Avarage Only' | 'Grid Only' | 'Avarage+Grid';

export interface TradingPosition {
  id: string;
  coin: string;
  pair: string;
  botId?: string;
  botName?: string;
  botIndex?: number;
  pairedCoins?: string[];
  logoUrl?: string;
  badgeSymbol: string;
  badgeBg: string;
  badgeColor: string;
  price: number;
  change24h: number;
  engine: string;
  botMode?: BotMode;
  allocationQty: string;
  allocationUsdt: string;
  stepLayer: number;
  maxStep: number;
  layerQuota: string;
  floatingPnl: number;
  roiPct: number;
  status: 'active' | 'averaging' | 'inactive';
  statusLabel: string;
  tpTriggerPrice?: string;
  tpTargetPrice?: string;
  trailingInfo: string;
  trailingProgressPct: number;
  nextAveragingTrigger?: string;
  reserveStepsReady?: number;
  // Bot Enhancement Indicators
  uptrendFilter?: boolean;
  uptrendStatus?: 'Uptrend' | 'Bullish' | 'Sideways' | 'Downtrend';
  tpCallbackPct?: number;
  layerCallbackPct?: number;
  gridTp?: number;
  averagingLayers?: number;
  gridLayers?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  priceBoundaryStatus?: 'IN_RANGE' | 'ABOVE_MAX' | 'BELOW_MIN';
}

export interface BotConfiguration {
  id: string;
  botName: string;
  botMode: BotMode;
  pairedCoins: string[];
  layerCount: number;
  averagingLayers: number;
  gridLayers: number;
  baseAmount: number;
  baseTp: number;
  useMoneyManagement: boolean;
  averageDownPct: number;
  uptrendFilter?: boolean;
  tpCallbackPct?: number;
  layerCallbackPct?: number;
  gridTp?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  steps?: AveragingStep[];
  status?: 'active' | 'inactive';
  createdAt?: number;
}

export interface AveragingStep {
  step: number;
  dropPct: number;
  multiplier: number;
  amountUsdt: number;
  tpPct: number;
  status: 'Filled' | 'In Range' | 'Queued' | 'Safety Zone' | 'Black Swan' | 'Floor Cap';
  subGridSellPrice?: number;
  subGridProfitUsdt?: number;
  layerCallbackPct?: number;
  tpCallbackPct?: number;
  isGridLayer?: boolean;
}

export interface TransactionRecord {
  id: string;
  title: string;
  type: 'inflow' | 'outflow' | 'gas';
  status: 'Success' | 'Completed' | 'Gas Tank' | 'Confirmed';
  statusColor: string;
  timestamp: string;
  counterparty?: string;
  counterpartyLabel?: string;
  amount: number;
  amountFormatted: string;
  feeInfo: string;
  txHash?: string;
  network?: string;
}

export interface ConnectedExchangeConfig {
  exchange: ExchangeName;
  isConnected: boolean;
  isSandbox: boolean;
  apiKeyMasked: string;
  usdtBalance: number;
  lastSynced: string;
}

export interface NetworkMember {
  id: string;
  memberId: string;
  name: string;
  emailMasked: string;
  sponsorId: string;
  joinDate: string;
  accountStatus: 'active' | 'non-active';
  botStatus: 'ACTIVE' | 'STANDBY';
  exchangeConnected?: string;
  totalTurnoverUsdt: number;
  bonusYieldUsdt: number;
}

export interface UserWallet {
  liquidBalance: number; // Saldo Wallet GAIN (Gas Fee & Biaya Aktivasi)
  availableCash: number;
  gasReserve: number;
  totalInflow: number;
  totalOutflow: number;
  gasConsumed: number;
  referralYield: number;
  allocatedAssetUsdt: number;
  volume24h: number;
  memberId: string;
  username: string;
  vipTier?: string; // Optional for backward compatibility, replaced by accountStatus
  accountStatus: 'active' | 'non-active';
  activationFeeUsdt?: number;
  licenseTier?: 'starter_5' | 'pro_10';
  licenseType?: 'lifetime';
  licenseName?: string;
  maxActiveBots?: number;
  tradingBonusUsdt?: number;
  email: string;
  downlineCount?: number;
  winRatePct?: number;
  connectedExchange?: ConnectedExchangeConfig;
  sponsorId?: string;
  sponsorName?: string;
  directReferralsCount?: number;
  teamTurnoverUsdt?: number;
  totalReferralBonusUsdt?: number;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  emailVerified?: boolean;
  emailVerificationCode?: string;
}

export interface BotSettingsConfig {
  pair: string;
  botMode: BotMode;
  useMoneyManagement: boolean;
  averagingLayers: number; // 1 s/d 20 layer (Averager & Hybrid)
  gridLayers: number; // 1 s/d 100 layer (Grid & Hybrid)
  averageDownPercent: number; // default 2%
  baseAmount: number;
  baseTp: number; // Take Profit (%)
  availableExchangeBalance: number;
  uptrendFilter?: boolean; // Filter konfirmasi tren Uptrend
  tpCallbackPct?: number; // Trailing Take Profit Callback (%)
  layerCallbackPct?: number; // Callback tiap layer averaging (%)
  gridTp?: number; // Take Profit Grid (%)
}

export interface TradeRecord {
  id: string;
  orderId?: string;
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  price: number;
  amount: number;
  costUsdt: number;
  fee?: {
    cost: number;
    currency: string;
  };
  realizedPnl?: number;
  pnlPercent?: number;
  timestamp: number;
  datetime: string;
  status: 'filled' | 'closed' | 'open' | 'canceled';
  strategyName?: string;
  layerStep?: number;
  isSandbox?: boolean;
}
