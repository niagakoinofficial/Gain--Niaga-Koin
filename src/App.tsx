import { useState, useEffect } from 'react';
import {
  NavigationRoute,
  ExchangeName,
  TradingPosition,
  TransactionRecord,
  TradeRecord,
  UserWallet,
  ConnectedExchangeConfig,
  BotMode,
  AveragingStep,
} from './types';
import { initialWallet, initialPositions, initialTransactions } from './data/mockData';
import { HeaderBar } from './components/HeaderBar';
import { BottomDock } from './components/BottomDock';
import { HomeView } from './views/HomeView';
import { WalletView } from './views/WalletView';
import { TradingPositionsView } from './views/TradingPositionsView';
import { BotMatrixView } from './views/BotMatrixView';
import { AccountView } from './views/AccountView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import {
  subscribeToUserWallet,
  subscribeToUserPositions,
  subscribeToUserTransactions,
  subscribeToUserTradeHistory,
  updateUserWallet,
  addTransactionToFirestore,
  addTradeRecordToFirestore,
  syncTradesFromExchangeToFirestore,
  updatePositionInFirestore,
  deletePositionFromFirestore,
  saveConnectedExchangeToFirestore,
  syncRealPortfolioAssetsToFirestore,
  disconnectExchangeFromFirestore,
} from './services/firebaseService';

import { AveragingMatrixModal } from './components/modals/AveragingMatrixModal';
import { DepositModal } from './components/modals/DepositModal';
import { WithdrawModal } from './components/modals/WithdrawModal';
import { TransferMemberModal } from './components/modals/TransferMemberModal';
import { GasFeeModal } from './components/modals/GasFeeModal';
import { ProfitShareModal } from './components/modals/ProfitShareModal';
import { ApiKeyModal } from './components/modals/ApiKeyModal';
import { SimulationModal } from './components/modals/SimulationModal';
import { ExchangeCoinsCheckerModal } from './components/modals/ExchangeCoinsCheckerModal';
import { ActivationFeeModal } from './components/modals/ActivationFeeModal';
import { Google2faModal } from './components/modals/Google2faModal';

function AppContent() {
  const [currentRoute, setCurrentRoute] = useState<NavigationRoute>('home');
  const [currentExchange, setCurrentExchange] = useState<ExchangeName>('Bitget');

  const { currentUser } = useAuth();

  // Application State
  const [wallet, setWallet] = useState<UserWallet>(initialWallet);
  const [positions, setPositions] = useState<TradingPosition[]>(initialPositions);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(initialTransactions);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);

  // Sync Google user profile immediately to wallet state
  useEffect(() => {
    if (currentUser) {
      const googleName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Member GAIN';
      const googleEmail = currentUser.email || 'user@gainkoin.io';
      setWallet((prev) => ({
        ...prev,
        username: googleName,
        email: googleEmail,
      }));
    }
  }, [currentUser]);

  // Firestore Real-time Subscriptions
  useEffect(() => {
    if (!currentUser) return;

    const unsubWallet = subscribeToUserWallet(currentUser.uid, (remoteWallet) => {
      setWallet(remoteWallet);
      if (remoteWallet.connectedExchange?.exchange) {
        setCurrentExchange(remoteWallet.connectedExchange.exchange);
      }
    });

    const unsubPositions = subscribeToUserPositions(currentUser.uid, (remotePositions) => {
      if (remotePositions.length > 0) {
        setPositions(remotePositions);
      }
    });

    const unsubTransactions = subscribeToUserTransactions(currentUser.uid, (remoteTx) => {
      if (remoteTx.length > 0) {
        setTransactions(remoteTx);
      }
    });

    const unsubTrades = subscribeToUserTradeHistory(currentUser.uid, (remoteTrades) => {
      if (remoteTrades.length > 0) {
        setTradeHistory(remoteTrades);
      }
    });

    return () => {
      unsubWallet();
      unsubPositions();
      unsubTransactions();
      unsubTrades();
    };
  }, [currentUser]);

  // Fetch real-time live ticker prices from connected exchange
  useEffect(() => {
    let isMounted = true;
    const updateTickers = async () => {
      const exchangeToUse = currentExchange.toLowerCase();
      try {
        const pairs = [
          'BTC/USDT',
          'ETH/USDT',
          'BNB/USDT',
          'SOL/USDT',
          'HYPE/USDT',
          'LINK/USDT',
          'AVAX/USDT',
          'NEAR/USDT',
          'XRP/USDT',
          'SUI/USDT',
          'ZEC/USDT',
          'DOGE/USDT',
        ];
        const results = await Promise.allSettled(
          pairs.map((symbol) =>
            fetch('/api/exchange/fetch-ticker', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ exchange: exchangeToUse, symbol }),
            }).then((res) => res.json())
          )
        );

        if (!isMounted) return;

        setPositions((prev) =>
          prev.map((pos) => {
            const matchIndex = pairs.indexOf(pos.pair);
            if (matchIndex !== -1 && results[matchIndex].status === 'fulfilled') {
              const res = (results[matchIndex] as PromiseFulfilledResult<any>).value;
              if (res.success && res.last) {
                return {
                  ...pos,
                  price: res.last,
                  change24h: res.percentage ?? pos.change24h,
                };
              }
            }
            return pos;
          })
        );
      } catch (err) {
        // Fallback silently if offline or exchange error
      }
    };

    updateTickers();
    const interval = setInterval(updateTickers, 10000); // 10s poll
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentExchange]);

  // In-session active exchange credentials for placing testnet / live orders
  const [activeApiCreds, setActiveApiCreds] = useState<{
    exchange: ExchangeName;
    apiKey: string;
    secret: string;
    password?: string;
    isSandbox: boolean;
  } | null>(null);

  // Handle Exchange API Connect Success
  const handleConnectExchangeSuccess = async (
    exchange: ExchangeName,
    balance: number,
    isSandbox: boolean,
    apiKey: string,
    secret?: string,
    passphrase?: string,
    portfolioAssets?: Array<{
      coin: string;
      pair: string;
      total: number;
      price: number;
      change24h: number;
      valueUsdt: number;
    }>,
    totalPortfolioUsdt?: number
  ) => {
    setCurrentExchange(exchange);

    if (apiKey && secret) {
      setActiveApiCreds({
        exchange,
        apiKey,
        secret,
        password: passphrase,
        isSandbox,
      });
    }

    const maskedKey = apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'API_CONNECTED';
    const exchangeConfig: ConnectedExchangeConfig = {
      exchange,
      isConnected: true,
      isSandbox,
      apiKeyMasked: maskedKey,
      usdtBalance: balance,
      lastSynced: new Date().toLocaleTimeString(),
    };

    const totalAllocated = portfolioAssets
      ? Number(portfolioAssets.reduce((sum, a) => sum + (a.valueUsdt || 0), 0).toFixed(2))
      : 0;

    setWallet((prev) => ({
      ...prev,
      liquidBalance: balance,
      availableCash: balance,
      allocatedAssetUsdt: totalAllocated,
      connectedExchange: exchangeConfig,
    }));

    if (portfolioAssets && portfolioAssets.length > 0) {
      const activeCoinMap = new Map(portfolioAssets.map((a) => [a.coin.toUpperCase(), a]));
      setPositions((prev) =>
        prev.map((pos) => {
          const matched = activeCoinMap.get(pos.coin.toUpperCase());
          if (matched) {
            return {
              ...pos,
              allocationQty: `${matched.total} ${matched.coin}`,
              allocationUsdt: `~${matched.valueUsdt.toFixed(2)} USDT`,
              price: matched.price,
              change24h: matched.change24h,
              status: 'active',
              statusLabel: 'HOLDING / ACTIVE',
              engine: `${exchange} Spot ${isSandbox ? '(Testnet)' : ''} · Saldo Riil`,
            };
          }
          return {
            ...pos,
            allocationQty: `0 ${pos.coin}`,
            allocationUsdt: '0.00 USDT',
            status: 'inactive',
            statusLabel: 'STANDBY',
            engine: `${exchange} Spot ${isSandbox ? '(Testnet)' : ''} · Standby`,
          };
        })
      );
    } else {
      setPositions((prev) =>
        prev.map((pos) => ({
          ...pos,
          engine: `${exchange} Spot ${isSandbox ? '(Testnet)' : ''} · Standby Ready`,
        }))
      );
    }

    if (currentUser) {
      await saveConnectedExchangeToFirestore(currentUser.uid, exchangeConfig);
      if (portfolioAssets && portfolioAssets.length > 0) {
        await syncRealPortfolioAssetsToFirestore(
          currentUser.uid,
          exchange,
          isSandbox,
          balance,
          portfolioAssets
        );
      }
    }
  };

  // Disconnect exchange API, clear memory credentials and reset positions
  const handleDisconnectExchange = async () => {
    const disconnectedExName = wallet.connectedExchange?.exchange || currentExchange;
    setActiveApiCreds(null);
    setWallet((prev) => ({
      ...prev,
      connectedExchange: {
        isConnected: false,
        exchange: currentExchange,
        isSandbox: false,
        apiKeyMasked: '',
        usdtBalance: 0,
        lastSynced: new Date().toLocaleTimeString(),
      },
    }));

    setPositions((prev) =>
      prev.map((pos) => ({
        ...pos,
        engine: 'Simulasi Spot · Ready',
        status: 'inactive',
        statusLabel: 'STANDBY',
        allocationQty: `0 ${pos.coin}`,
        allocationUsdt: '0.00 USDT',
      }))
    );

    const disconnectTx: TransactionRecord = {
      id: `tx-disc-${Date.now()}`,
      title: `Disconnect API ${disconnectedExName}`,
      type: 'outflow',
      status: 'Success',
      statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      timestamp: 'Just now',
      counterparty: 'API Revoked',
      counterpartyLabel: 'Koneksi: ',
      amount: 0,
      amountFormatted: 'Diputuskan',
      feeInfo: 'Manual Disconnect',
    };
    setTransactions((prev) => [disconnectTx, ...prev]);

    if (currentUser) {
      await disconnectExchangeFromFirestore(currentUser.uid);
    }
  };

  // Dedicated function to refresh real portfolio from active exchange credentials
  const [isRefreshingExchange, setIsRefreshingExchange] = useState(false);
  const handleRefreshExchangePortfolio = async () => {
    if (!activeApiCreds) {
      setIsApiKeyModalOpen(true);
      return;
    }

    setIsRefreshingExchange(true);
    try {
      const res = await fetch('/api/exchange/fetch-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange: activeApiCreds.exchange.toLowerCase(),
          apiKey: activeApiCreds.apiKey,
          secret: activeApiCreds.secret,
          password: activeApiCreds.password,
          isSandbox: activeApiCreds.isSandbox,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        handleConnectExchangeSuccess(
          activeApiCreds.exchange,
          data.usdtBalance ?? 0,
          activeApiCreds.isSandbox,
          activeApiCreds.apiKey,
          activeApiCreds.secret,
          activeApiCreds.password,
          data.portfolioAssets,
          data.totalPortfolioUsdt
        );
      }
    } catch {
      // Ignore network errors on auto-refresh
    } finally {
      setIsRefreshingExchange(false);
    }
  };

  // Execute bot order on Exchange Testnet / Live
  const handleExecuteLiveBotOrder = async (
    pair: string = 'BTC/USDT',
    side: 'buy' | 'sell' = 'buy',
    amount?: number
  ) => {
    if (!activeApiCreds) {
      setIsApiKeyModalOpen(true);
      return {
        success: false,
        error: 'API Key belum tersambung di sesi aktif ini. Silakan buka modal API Key dan simpan koneksi.',
      };
    }

    const targetCoin = pair.split('/')[0] || 'BTC';
    const coinRef = positions.find((p) => p.pair === pair);
    const coinPrice = coinRef?.price || (targetCoin === 'BTC' ? 67250 : targetCoin === 'ETH' ? 3480 : targetCoin === 'SOL' ? 178 : targetCoin === 'ZEC' ? 32.5 : 10);

    const orderAmount =
      amount ||
      (targetCoin === 'BTC'
        ? 0.001
        : targetCoin === 'ETH'
        ? 0.01
        : targetCoin === 'SOL'
        ? 0.1
        : targetCoin === 'BNB'
        ? 0.05
        : targetCoin === 'ZEC'
        ? 0.5
        : targetCoin === 'HYPE'
        ? 1.0
        : targetCoin === 'LINK'
        ? 1.5
        : targetCoin === 'AVAX'
        ? 1.0
        : targetCoin === 'NEAR'
        ? 5.0
        : targetCoin === 'SUI'
        ? 10.0
        : targetCoin === 'XRP'
        ? 25.0
        : targetCoin === 'DOGE'
        ? 100.0
        : Number((25 / coinPrice).toFixed(3)));

    try {
      const res = await fetch('/api/exchange/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange: activeApiCreds.exchange.toLowerCase(),
          apiKey: activeApiCreds.apiKey,
          secret: activeApiCreds.secret,
          password: activeApiCreds.password,
          symbol: pair,
          side,
          type: 'market',
          amount: orderAmount,
          isSandbox: activeApiCreds.isSandbox,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Create Transaction audit
        const newTx: TransactionRecord = {
          id: `tx-bot-${Date.now()}`,
          title: `Bot Order ${side.toUpperCase()} ${pair} [${activeApiCreds.isSandbox ? 'Testnet' : 'Live'}]`,
          type: side === 'buy' ? 'outflow' : 'inflow',
          status: 'Completed',
          statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          timestamp: 'Just now',
          counterparty: `${activeApiCreds.exchange} ${activeApiCreds.isSandbox ? 'Testnet' : 'Spot'}`,
          counterpartyLabel: 'Engine: ',
          amount: data.filled ? Number((data.filled * (data.price || 1)).toFixed(2)) : 35,
          amountFormatted: `${data.amount} ${pair.split('/')[0]}`,
          feeInfo: `Order #${data.orderId}`,
          txHash: `0x${data.orderId}`,
          network: `${activeApiCreds.exchange} API`,
        };

        setTransactions((prev) => [newTx, ...prev]);

        // Update target position status to active
        setPositions((prev) =>
          prev.map((pos) =>
            pos.pair === pair
              ? {
                  ...pos,
                  status: 'active',
                  statusLabel: 'RUNNING',
                  stepLayer: Math.min(pos.maxStep, pos.stepLayer + 1),
                }
              : pos
          )
        );

        if (currentUser) {
          await addTransactionToFirestore(currentUser.uid, newTx);
        }

        return {
          success: true,
          orderId: data.orderId,
          message: data.message,
        };
      } else {
        return {
          success: false,
          error: data.error,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Gagal menghubungi server.',
      };
    }
  };

  // Modals
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [selectedPairForMatrix, setSelectedPairForMatrix] = useState('BTC/USDT');
  const [selectedPairsForMatrix, setSelectedPairsForMatrix] = useState<string[]>(['BTC/USDT', 'ETH/USDT', 'SOL/USDT']);
  const [selectedModeForMatrix, setSelectedModeForMatrix] = useState<BotMode>('Avarage+Grid');
  const [selectedLayersForMatrix, setSelectedLayersForMatrix] = useState<number>(10);
  const [selectedBotIdForMatrix, setSelectedBotIdForMatrix] = useState<string | null>(null);
  const [selectedBotNameForMatrix, setSelectedBotNameForMatrix] = useState<string>('');
  const [selectedMinPriceForMatrix, setSelectedMinPriceForMatrix] = useState<number | null>(null);
  const [selectedMaxPriceForMatrix, setSelectedMaxPriceForMatrix] = useState<number | null>(null);
  const [isNewBotModeForMatrix, setIsNewBotModeForMatrix] = useState<boolean>(true);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [isProfitShareModalOpen, setIsProfitShareModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [isCoinsCheckerModalOpen, setIsCoinsCheckerModalOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [is2faModalOpen, setIs2faModalOpen] = useState(false);

  const handleSave2fa = async (enabled: boolean, secret: string) => {
    setWallet((prev) => ({
      ...prev,
      twoFactorEnabled: enabled,
      twoFactorSecret: secret,
    }));

    if (currentUser) {
      await updateUserWallet(currentUser.uid, {
        twoFactorEnabled: enabled,
        twoFactorSecret: secret,
      });
    }
  };

  // Secure Account Activation with Backend License Verification
  const handleProcessActivation = async (
    tier: 'starter_5' | 'pro_10' = 'starter_5',
    isUpgrade: boolean = false
  ) => {
    const isUp = isUpgrade || (wallet.accountStatus === 'active' && wallet.licenseTier === 'starter_5' && tier === 'pro_10');
    let requiredFee = 100;
    if (tier === 'pro_10') {
      requiredFee = isUp ? 75 : 175;
    } else {
      requiredFee = 100;
    }

    if (wallet.liquidBalance < requiredFee) {
      throw new Error(
        `Saldo GAIN tidak mencukupi (Tersedia: ${wallet.liquidBalance.toFixed(2)} USDT, Diperlukan: ${requiredFee.toFixed(2)} USDT). Silakan lakukan deposit saldo terlebih dahulu.`
      );
    }

    const response = await fetch('/api/wallet/process-activation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: currentUser?.uid || wallet.memberId,
        memberId: wallet.memberId,
        liquidBalance: wallet.liquidBalance,
        tier,
        isUpgrade: isUp,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Gagal memproses aktivasi lisensi.');
    }

    const newLiquidBalance = data.newLiquidBalance ?? Math.max(0, wallet.liquidBalance - requiredFee);
    const tradingBonus = data.tradingBonusGranted ?? (tier === 'pro_10' ? (isUp ? 15 : 35) : 20);
    const newGasReserve = wallet.gasReserve + tradingBonus;
    const newOutflow = wallet.totalOutflow + requiredFee;
    const newInflow = wallet.totalInflow + tradingBonus;
    const maxBots = data.maxActiveBots ?? (tier === 'pro_10' ? 10 : 5);
    const licenseName = data.licenseName ?? (tier === 'pro_10' ? 'Pro Lifetime (10 Bot Aktif)' : 'Starter Lifetime (5 Bot Aktif)');

    setWallet((prev) => ({
      ...prev,
      liquidBalance: newLiquidBalance,
      gasReserve: newGasReserve,
      totalOutflow: newOutflow,
      totalInflow: newInflow,
      accountStatus: 'active',
      licenseTier: tier,
      licenseType: 'lifetime',
      licenseName,
      maxActiveBots: maxBots,
      tradingBonusUsdt: (prev.tradingBonusUsdt || 0) + tradingBonus,
      activationFeeUsdt: (prev.activationFeeUsdt || 0) + requiredFee,
    }));

    const txId = data.activationReceipt?.txId || `tx-act-${Date.now()}`;
    const txHash = data.activationReceipt?.txHash || `0x${Date.now().toString(16)}`;

    const newTx: TransactionRecord = {
      id: txId,
      title: isUp ? 'Upgrade ke Pro Lifetime (10 Bot)' : `Aktivasi Lisensi ${licenseName}`,
      type: 'outflow',
      status: 'Success',
      statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      timestamp: 'Just now',
      counterparty: 'GAIN Foundation Licensing Node',
      counterpartyLabel: 'License: ',
      amount: -requiredFee,
      amountFormatted: `-${requiredFee.toFixed(2)} USDT`,
      feeInfo: 'Lifetime License (Bukan Sewa Tahunan)',
      txHash,
      network: 'BEP-20 (Internal)',
    };

    const bonusTx: TransactionRecord = {
      id: `tx-bonus-${Date.now()}`,
      title: `Bonus Fee Trading 20% (+${tradingBonus} USDT)`,
      type: 'inflow',
      status: 'Gas Tank',
      statusColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      timestamp: 'Just now',
      counterparty: 'GAIN Promo Pool',
      counterpartyLabel: 'Promo: ',
      amount: tradingBonus,
      amountFormatted: `+${tradingBonus.toFixed(2)} USDT`,
      feeInfo: 'Otomatis Masuk ke Gas Fee Tank',
      txHash: `0xbonus${Date.now().toString(16)}`,
      network: 'Gas Tank',
    };

    setTransactions((prev) => [bonusTx, newTx, ...prev]);

    if (currentUser) {
      await updateUserWallet(currentUser.uid, {
        liquidBalance: newLiquidBalance,
        gasReserve: newGasReserve,
        totalOutflow: newOutflow,
        totalInflow: newInflow,
        accountStatus: 'active',
        licenseTier: tier,
        licenseType: 'lifetime',
        licenseName,
        maxActiveBots: maxBots,
        tradingBonusUsdt: (wallet.tradingBonusUsdt || 0) + tradingBonus,
        activationFeeUsdt: (wallet.activationFeeUsdt || 0) + requiredFee,
      });
      await addTransactionToFirestore(currentUser.uid, newTx);
      await addTransactionToFirestore(currentUser.uid, bonusTx);
    }
  };

  const handleDepositSuccess = async (amount: number, target: 'gas' | 'vault', txHash: string) => {
    if (target === 'gas') {
      const newGasReserve = wallet.gasReserve + amount;
      const newInflow = wallet.totalInflow + amount;
      setWallet((prev) => ({
        ...prev,
        gasReserve: newGasReserve,
        totalInflow: newInflow,
      }));

      const newTx: TransactionRecord = {
        id: `tx-dep-${Date.now()}`,
        title: 'Deposit Gas Fee Tank',
        type: 'inflow',
        status: 'Success',
        statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        timestamp: 'Just now',
        counterparty: `${txHash.slice(0, 8)}...${txHash.slice(-6)}`,
        counterpartyLabel: 'TxID: ',
        amount: amount,
        amountFormatted: `+${amount.toFixed(2)} USDT`,
        feeInfo: 'Network: BEP-20',
        txHash,
        network: 'BEP-20',
      };
      setTransactions((prev) => [newTx, ...prev]);

      if (currentUser) {
        await updateUserWallet(currentUser.uid, {
          gasReserve: newGasReserve,
          totalInflow: newInflow,
        });
        await addTransactionToFirestore(currentUser.uid, newTx);
      }
    } else {
      const newLiquid = wallet.liquidBalance + amount;
      const newInflow = wallet.totalInflow + amount;
      setWallet((prev) => ({
        ...prev,
        liquidBalance: newLiquid,
        totalInflow: newInflow,
      }));

      const newTx: TransactionRecord = {
        id: `tx-dep-${Date.now()}`,
        title: 'Deposit Vault Liquidity',
        type: 'inflow',
        status: 'Success',
        statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        timestamp: 'Just now',
        counterparty: `${txHash.slice(0, 8)}...${txHash.slice(-6)}`,
        counterpartyLabel: 'TxID: ',
        amount: amount,
        amountFormatted: `+${amount.toFixed(2)} USDT`,
        feeInfo: 'Network: BEP-20',
        txHash,
        network: 'BEP-20',
      };
      setTransactions((prev) => [newTx, ...prev]);

      if (currentUser) {
        await updateUserWallet(currentUser.uid, {
          liquidBalance: newLiquid,
          totalInflow: newInflow,
        });
        await addTransactionToFirestore(currentUser.uid, newTx);
      }
    }
  };

  const handleWithdrawSuccess = async (amount: number, address: string) => {
    const newLiquid = Math.max(0, wallet.liquidBalance - amount);
    const newOutflow = wallet.totalOutflow + amount;

    setWallet((prev) => ({
      ...prev,
      liquidBalance: newLiquid,
      totalOutflow: newOutflow,
    }));

    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      title: 'Withdrawal BEP-20',
      type: 'outflow',
      status: 'Success',
      statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      timestamp: 'Just now',
      counterparty: `${address.slice(0, 6)}...${address.slice(-4)}`,
      counterpartyLabel: 'TxID: ',
      amount: -amount,
      amountFormatted: `-${amount.toFixed(6)} USDT`,
      feeInfo: 'Fee: 2.00 USDT',
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (currentUser) {
      await updateUserWallet(currentUser.uid, {
        liquidBalance: newLiquid,
        totalOutflow: newOutflow,
      });
      await addTransactionToFirestore(currentUser.uid, newTx);
    }
  };

  const handleTransferSuccess = async (recipientId: string, recipientName: string, amount: number) => {
    const newLiquid = Math.max(0, wallet.liquidBalance - amount);
    const newOutflow = wallet.totalOutflow + amount;

    setWallet((prev) => ({
      ...prev,
      liquidBalance: newLiquid,
      totalOutflow: newOutflow,
    }));

    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      title: 'Transfer ke Member',
      type: 'outflow',
      status: 'Completed',
      statusColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      timestamp: 'Just now',
      counterparty: `${recipientName} (${recipientId})`,
      counterpartyLabel: 'To: ',
      amount: -amount,
      amountFormatted: `-${amount.toFixed(6)} USDT`,
      feeInfo: 'Fee: 0 USDT (P2P)',
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (currentUser) {
      await updateUserWallet(currentUser.uid, {
        liquidBalance: newLiquid,
        totalOutflow: newOutflow,
      });
      await addTransactionToFirestore(currentUser.uid, newTx);
    }
  };

  const handleTopUpGasSuccess = async (amount: number) => {
    const newLiquid = Math.max(0, wallet.liquidBalance - amount);
    const newGasReserve = wallet.gasReserve + amount;

    setWallet((prev) => ({
      ...prev,
      liquidBalance: newLiquid,
      gasReserve: newGasReserve,
    }));

    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      title: 'Top-Up Gas Fee Pool',
      type: 'gas',
      status: 'Gas Tank',
      statusColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      timestamp: 'Just now',
      counterparty: 'Smart Gas Reserve Vault',
      counterpartyLabel: 'Pool: ',
      amount: amount,
      amountFormatted: `+${amount.toFixed(6)} USDT`,
      feeInfo: 'Internal Allocation',
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (currentUser) {
      await updateUserWallet(currentUser.uid, {
        liquidBalance: newLiquid,
        gasReserve: newGasReserve,
      });
      await addTransactionToFirestore(currentUser.uid, newTx);
    }
  };

  const handleForceTakeProfit = async (posId: string) => {
    const target = positions.find((p) => p.id === posId);
    if (!target) return { success: false, error: 'Posisi tidak ditemukan.' };
    if (target.floatingPnl <= 0) return { success: false, error: 'Posisi tidak dalam kondisi profit.' };

    const grossProfit = target.floatingPnl;
    const netProfitTrader = grossProfit * 0.8;
    const gasDeduction = grossProfit * 0.2;

    // Calculate real sell quantity based on allocation or unit price
    let sellAmount = 0.001;
    if (target.allocationQty) {
      const parsed = parseFloat(target.allocationQty.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed) && parsed > 0) {
        sellAmount = parsed;
      }
    }
    if (sellAmount <= 0.00001 && target.price > 0) {
      const usdtVal = parseFloat(target.allocationUsdt.replace(/[^0-9.]/g, '')) || 25;
      sellAmount = Number((usdtVal / target.price).toFixed(5));
    }

    let exchangeOrderId: string | undefined;
    let exchangeOrderSuccess = false;
    let exchangeErrorMessage = '';

    // If active Exchange API credentials exist, send real CCXT Market Sell Order to Exchanger!
    if (activeApiCreds && activeApiCreds.apiKey) {
      try {
        const res = await fetch('/api/exchange/place-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exchange: activeApiCreds.exchange.toLowerCase(),
            apiKey: activeApiCreds.apiKey,
            secret: activeApiCreds.secret,
            password: activeApiCreds.password,
            symbol: target.pair,
            side: 'sell',
            type: 'market',
            amount: sellAmount,
            isSandbox: activeApiCreds.isSandbox,
          }),
        });
        const data = await res.json();
        if (data.success) {
          exchangeOrderId = data.orderId;
          exchangeOrderSuccess = true;
        } else {
          exchangeErrorMessage = data.error || 'Gagal mengirim order ke exchange';
        }
      } catch (err: any) {
        exchangeErrorMessage = err.message || 'Koneksi ke backend exchange terputus';
      }
    }

    const newLiquid = wallet.liquidBalance + netProfitTrader;
    const newGasReserve = Math.max(0, wallet.gasReserve - gasDeduction);
    const newGasConsumed = wallet.gasConsumed + gasDeduction;
    const newVolume = wallet.volume24h + grossProfit;

    setWallet((prev) => ({
      ...prev,
      liquidBalance: newLiquid,
      gasReserve: newGasReserve,
      gasConsumed: newGasConsumed,
      volume24h: newVolume,
    }));

    // Reset position pnl to small profit or initial step
    const updatedPos: TradingPosition = {
      ...target,
      stepLayer: 1,
      floatingPnl: 0.25,
      roiPct: 0.20,
      trailingProgressPct: 10,
      trailingInfo: exchangeOrderSuccess
        ? `TP Executed (${activeApiCreds?.exchange} #${exchangeOrderId})`
        : 'New Cycle Initiated',
    };

    setPositions((prev) =>
      prev.map((p) => (p.id === posId ? updatedPos : p))
    );

    // Add transaction record to ledger
    const profitTx: TransactionRecord = {
      id: `tx-tp-${Date.now()}`,
      title: `Take Profit ${target.pair}${exchangeOrderId ? ` [${activeApiCreds?.exchange} #${exchangeOrderId}]` : ''}`,
      type: 'inflow',
      status: 'Success',
      statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      timestamp: 'Just now',
      counterparty: exchangeOrderId
        ? `${activeApiCreds?.exchange} Spot (Order #${exchangeOrderId})`
        : `${target.engine}`,
      counterpartyLabel: 'Engine: ',
      amount: netProfitTrader,
      amountFormatted: `+${netProfitTrader.toFixed(2)} USDT`,
      feeInfo: `Net 80% (Gas: -${gasDeduction.toFixed(2)} USDT)${exchangeOrderId ? ' • Market Sell Executed' : ''}`,
      txHash: exchangeOrderId ? `0x${exchangeOrderId}` : undefined,
      network: activeApiCreds ? `${activeApiCreds.exchange} ${activeApiCreds.isSandbox ? 'Testnet' : 'Live'}` : 'GAIN Vault',
    };
    setTransactions((prev) => [profitTx, ...prev]);

    // Record trade execution in trade history
    const tradeRec: TradeRecord = {
      id: exchangeOrderId ? `order-${exchangeOrderId}` : `trade-tp-${Date.now()}`,
      orderId: exchangeOrderId,
      exchange: activeApiCreds ? activeApiCreds.exchange : 'GAIN Vault',
      symbol: target.pair,
      side: 'sell',
      type: 'market',
      status: 'closed',
      strategyName: target.engine,
      layerStep: target.stepLayer,
      isSandbox: activeApiCreds?.isSandbox ?? true,
      price: target.price || 100,
      amount: sellAmount,
      costUsdt: Number((sellAmount * (target.price || 1)).toFixed(2)),
      fee: {
        cost: gasDeduction,
        currency: 'USDT',
      },
      realizedPnl: netProfitTrader,
      pnlPercent: target.roiPct,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
    };
    setTradeHistory((prev) => [tradeRec, ...prev]);

    if (currentUser) {
      await updateUserWallet(currentUser.uid, {
        liquidBalance: newLiquid,
        gasReserve: newGasReserve,
        gasConsumed: newGasConsumed,
        volume24h: newVolume,
      });
      await updatePositionInFirestore(currentUser.uid, updatedPos);
      await addTransactionToFirestore(currentUser.uid, profitTx);
      await addTradeRecordToFirestore(currentUser.uid, tradeRec);
    }

    return {
      success: true,
      orderId: exchangeOrderId,
      isLiveExchange: exchangeOrderSuccess,
      netProfit: netProfitTrader,
      gasDeduction,
      exchangeError: exchangeErrorMessage,
    };
  };

  const handleTogglePause = async (posId: string) => {
    const targetPos = positions.find((p) => p.id === posId);
    if (!targetPos) return;

    const willActivate = targetPos.status !== 'active';

    if (willActivate) {
      // Calculate active bots count (unique bot configurations)
      const targetBotId = targetPos.botId || targetPos.id;
      const activeBotIds = new Set(
        positions
          .filter((p) => (p.status === 'active' || p.status === 'averaging') && (p.botId || p.id) !== targetBotId)
          .map((p) => p.botId || p.id)
      );

      const maxAllowed = wallet.accountStatus === 'active' ? (wallet.maxActiveBots || 5) : 5;

      if (activeBotIds.size >= maxAllowed) {
        alert(
          `⚠️ Batas Kuota Bot Aktif Tercapai!\n\n` +
          `Saat ini Anda telah menjalankan ${activeBotIds.size} dari maksimal ${maxAllowed} bot aktif (${wallet.licenseName || 'Starter Lifetime (5 Bot)'}).\n\n` +
          `• Anda bebas menyimpan DRAFT bot tanpa batas.\n` +
          `• Untuk mengaktifkan bot ini secara bersamaan, silakan upgrade ke Paket Pro Lifetime (10 Bot Aktif - $175 Promo) atau jeda bot lain yang sedang aktif.`
        );
        setIsActivationModalOpen(true);
        return;
      }
    }

    let updatedTarget: TradingPosition | null = null;
    setPositions((prev) =>
      prev.map((p) => {
        if (p.id !== posId) return p;
        const newStatus = p.status === 'active' ? 'inactive' : 'active';
        updatedTarget = {
          ...p,
          status: newStatus,
          statusLabel: newStatus === 'active' ? 'AKTIF RUNNING' : 'DRAFT / PAUSED',
        };
        return updatedTarget;
      })
    );

    if (currentUser && updatedTarget) {
      await updatePositionInFirestore(currentUser.uid, updatedTarget);
    }
  };

  const handleBatchForceTp = () => {
    positions.forEach((pos) => {
      if (pos.floatingPnl > 0) {
        handleForceTakeProfit(pos.id);
      }
    });
  };

  const handleBatchPauseAll = async () => {
    const updated = positions.map((p) => ({
      ...p,
      status: 'inactive' as const,
      statusLabel: 'PAUSED',
    }));
    setPositions(updated);

    if (currentUser) {
      for (const pos of updated) {
        await updatePositionInFirestore(currentUser.uid, pos);
      }
    }
  };

  const handleOpenCustomBot = (
    pair: string = 'BTC/USDT',
    mode?: BotMode,
    layers?: number,
    botId?: string | null,
    botName?: string,
    isNewBot?: boolean,
    minPrice?: number | null,
    maxPrice?: number | null,
    pairedCoins?: string[]
  ) => {
    setSelectedPairForMatrix(pair);
    if (pairedCoins && pairedCoins.length > 0) {
      setSelectedPairsForMatrix(pairedCoins);
    } else {
      const existingPos = positions.find((p) => p.id === botId || p.pair === pair);
      if (existingPos?.pairedCoins && existingPos.pairedCoins.length > 0) {
        setSelectedPairsForMatrix(existingPos.pairedCoins);
      } else {
        setSelectedPairsForMatrix([pair]);
      }
    }
    if (mode) setSelectedModeForMatrix(mode);
    if (layers) setSelectedLayersForMatrix(layers);
    setSelectedBotIdForMatrix(botId || null);
    setSelectedBotNameForMatrix(botName || '');
    setIsNewBotModeForMatrix(isNewBot ?? (!botId));
    setSelectedMinPriceForMatrix(minPrice !== undefined ? minPrice : null);
    setSelectedMaxPriceForMatrix(maxPrice !== undefined ? maxPrice : null);
    setIsMatrixModalOpen(true);
  };

  const handleDeleteBotPosition = async (posId: string) => {
    setPositions((prev) => prev.filter((p) => p.id !== posId));
    if (currentUser) {
      await deletePositionFromFirestore(currentUser.uid, posId);
    }
    try {
      fetch('/api/bot/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: posId }),
      }).catch(() => {});
    } catch {}
  };

  const handleDeployBotConfiguration = async (config: {
    botId?: string;
    botName?: string;
    isNewBot?: boolean;
    pair: string;
    pairedCoins?: string[];
    botMode: BotMode;
    layerCount: number;
    baseAmount: number;
    baseTp: number;
    useMoneyManagement?: boolean;
    averageDownPct?: number;
    averagingLayers?: number;
    gridLayers?: number;
    uptrendFilter?: boolean;
    tpCallbackPct?: number;
    layerCallbackPct?: number;
    gridTp?: number;
    minPrice?: number;
    maxPrice?: number;
    steps?: AveragingStep[];
  }) => {
    const coinsToDeploy = Array.isArray(config.pairedCoins) && config.pairedCoins.length > 0
      ? config.pairedCoins
      : [config.pair];

    const primaryBotId = config.botId && !config.isNewBot
      ? config.botId
      : `bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const finalBotName = config.botName?.trim() || `GAIN Matrix Bot (${coinsToDeploy.length} Koin Terpairing)`;

    const avgL = config.averagingLayers ?? (config.botMode === 'Grid Only' ? 0 : config.botMode === 'Avarage+Grid' ? 20 : config.layerCount);
    const gridL = config.gridLayers ?? (config.botMode === 'Avarage Only' ? 0 : config.botMode === 'Avarage+Grid' ? 100 : config.layerCount);

    // Calculate active bots count excluding current primaryBotId
    const activeBotIds = new Set(
      positions
        .filter((p) => (p.status === 'active' || p.status === 'averaging') && (p.botId || p.id) !== primaryBotId)
        .map((p) => p.botId || p.id)
    );

    const maxAllowed = wallet.accountStatus === 'active' ? (wallet.maxActiveBots || 5) : 5;
    const isOverQuota = activeBotIds.size >= maxAllowed;

    const initialStatus = isOverQuota ? 'inactive' : 'active';
    const initialStatusLabel = isOverQuota ? 'DRAFT (KUOTA PENUH)' : 'AKTIF RUNNING';

    if (isOverQuota) {
      alert(
        `ℹ️ Bot Disimpan Sebagai DRAFT (Tanpa Batas Kuota Draft)!\n\n` +
        `Saat ini Anda telah menjalankan ${activeBotIds.size}/${maxAllowed} bot aktif (${wallet.licenseName || 'Starter Lifetime (5 Bot)'}).\n\n` +
        `Bot "${finalBotName}" berhasil dibuat dan disimpan ke daftar Bot Anda sebagai DRAFT.\n\n` +
        `• Anda bebas membuat & mengatur DRAFT bot sebanyak mungkin tanpa batas!\n` +
        `• Untuk mengaktifkan bot ini secara bersamaan, silakan upgrade ke Paket Pro Lifetime (10 Bot Aktif - $175 Promo) atau jeda bot lain yang sedang aktif.`
      );
    }

    const updatedOrNewPositions: TradingPosition[] = [];

    for (const coinPair of coinsToDeploy) {
      const coin = coinPair.split('/')[0] || 'CRYPTO';
      const existingForBotAndCoin = positions.find((p) => p.botId === primaryBotId && p.pair === coinPair) ||
                                    positions.find((p) => p.id === primaryBotId && p.pair === coinPair) ||
                                    (!config.isNewBot ? positions.find((p) => p.pair === coinPair) : null);

      const coinPriceMap: Record<string, number> = {
        BTC: 67250,
        ETH: 3480,
        SOL: 178,
        BNB: 595,
        ZEC: 32.50,
        HYPE: 24.50,
        LINK: 13.20,
        AVAX: 26.50,
        NEAR: 4.85,
        SUI: 1.95,
        XRP: 0.58,
        DOGE: 0.38,
      };
      const currentPrice = existingForBotAndCoin?.price || coinPriceMap[coin] || 100;
      const minPriceVal = typeof config.minPrice === 'number' ? config.minPrice : (existingForBotAndCoin?.minPrice ?? 0);
      const maxPriceVal = typeof config.maxPrice === 'number' ? config.maxPrice : (existingForBotAndCoin?.maxPrice ?? (coin === 'SOL' ? 115 : 0));
      const isAbove = maxPriceVal > 0 && currentPrice > maxPriceVal;
      const isBelow = minPriceVal > 0 && currentPrice < minPriceVal;
      const boundaryStatus = isAbove ? 'ABOVE_MAX' : isBelow ? 'BELOW_MIN' : 'IN_RANGE';

      if (existingForBotAndCoin) {
        const updated: TradingPosition = {
          ...existingForBotAndCoin,
          botId: primaryBotId,
          botName: finalBotName,
          pairedCoins: coinsToDeploy,
          botMode: config.botMode,
          maxStep: config.layerCount,
          layerQuota: `1 s/d ${config.layerCount} Layer (${config.botMode})`,
          allocationUsdt: `${(config.baseAmount * 1.5).toFixed(2)} USDT`,
          status: initialStatus,
          statusLabel: initialStatusLabel,
          engine: `${config.botMode} (${avgL > 0 ? `${avgL}L Avg` : ''}${avgL > 0 && gridL > 0 ? ' + ' : ''}${gridL > 0 ? `${gridL}L Grid` : ''}) · 1 Bot ${coinsToDeploy.length} Koin`,
          uptrendFilter: config.uptrendFilter ?? true,
          tpCallbackPct: config.tpCallbackPct ?? 0.2,
          layerCallbackPct: config.layerCallbackPct ?? 0.2,
          gridTp: config.gridTp ?? 1.2,
          minPrice: minPriceVal,
          maxPrice: maxPriceVal,
          priceBoundaryStatus: boundaryStatus,
        };
        updatedOrNewPositions.push(updated);
        if (currentUser) {
          await updatePositionInFirestore(currentUser.uid, updated);
        }
      } else {
        const uniqueId = `pos-${coinPair.replace('/', '').toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const newPos: TradingPosition = {
          id: uniqueId,
          botId: primaryBotId,
          botName: finalBotName,
          pairedCoins: coinsToDeploy,
          pair: coinPair,
          coin,
          status: initialStatus,
          statusLabel: initialStatusLabel,
          price: currentPrice,
          change24h: 1.2,
          engine: `${config.botMode} (${avgL > 0 ? `${avgL}L Avg` : ''}${avgL > 0 && gridL > 0 ? ' + ' : ''}${gridL > 0 ? `${gridL}L Grid` : ''}) · 1 Bot ${coinsToDeploy.length} Koin`,
          allocationUsdt: `${config.baseAmount.toFixed(2)} USDT`,
          allocationQty: `0.00 ${coin}`,
          floatingPnl: 0.0,
          roiPct: 0.0,
          stepLayer: 1,
          maxStep: config.layerCount,
          layerQuota: `1 s/d ${config.layerCount} Layer`,
          tpTargetPrice: `+${config.baseTp}% Trailing`,
          tpTriggerPrice: `+${config.baseTp}%`,
          nextAveragingTrigger: `-${config.averageDownPct || 2.0}%`,
          trailingProgressPct: 10,
          trailingInfo: `${config.botMode} (${avgL}L Avg + ${gridL}L Grid) Ready`,
          badgeSymbol: coin.slice(0, 3).toUpperCase(),
          logoUrl: `/coins/${coin.toLowerCase()}.svg`,
          badgeBg: 'bg-teal-500/20',
          badgeColor: 'text-teal-400',
          botMode: config.botMode,
          uptrendFilter: config.uptrendFilter ?? true,
          tpCallbackPct: config.tpCallbackPct ?? 0.2,
          layerCallbackPct: config.layerCallbackPct ?? 0.2,
          gridTp: config.gridTp ?? 1.2,
          minPrice: minPriceVal,
          maxPrice: maxPriceVal,
          priceBoundaryStatus: boundaryStatus,
        };
        updatedOrNewPositions.push(newPos);
        if (currentUser) {
          await updatePositionInFirestore(currentUser.uid, newPos);
        }
      }
    }

    // Update local positions state
    setPositions((prev) => {
      const updatedIds = new Set(updatedOrNewPositions.map((p) => p.id));
      const remaining = prev.filter((p) => !updatedIds.has(p.id));
      return [...updatedOrNewPositions, ...remaining];
    });

    // Sync with 24/7 backend background bot runner only if active
    if (initialStatus === 'active') {
      try {
        fetch('/api/bot/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            botId: primaryBotId,
            botName: finalBotName,
            pair: coinsToDeploy[0],
            pairedCoins: coinsToDeploy,
            botMode: config.botMode,
            baseAmount: config.baseAmount,
            baseTp: config.baseTp,
            averagingLayers: avgL,
            gridLayers: gridL,
            uptrendFilter: config.uptrendFilter ?? true,
            tpCallbackPct: config.tpCallbackPct ?? 0.2,
            layerCallbackPct: config.layerCallbackPct ?? 0.2,
            gridTp: config.gridTp ?? 1.2,
            averageDownPct: config.averageDownPct ?? 2.0,
            minPrice: config.minPrice || 0,
            maxPrice: config.maxPrice || 0,
            steps: config.steps,
            exchange: currentExchange,
            isSandbox: wallet.connectedExchange?.isSandbox || false,
            apiKey: activeApiCreds?.apiKey,
            secret: activeApiCreds?.secret,
            password: activeApiCreds?.password,
          }),
        }).catch(() => {});
      } catch {}
    }

    setIsMatrixModalOpen(false);
    setCurrentRoute('trading');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#05080E] text-slate-900 dark:text-slate-100 font-sans selection:bg-teal-500 dark:selection:bg-[#00F0C8] selection:text-slate-950 flex flex-col justify-between transition-colors">
      {/* Top Header */}
      <HeaderBar
        currentExchange={currentExchange}
        onSelectExchange={setCurrentExchange}
        connectedExchange={wallet.connectedExchange}
        onOpenApiKey={() => setIsApiKeyModalOpen(true)}
        onDisconnectApi={handleDisconnectExchange}
        onOpenProfitShare={() => setIsProfitShareModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="w-full max-w-xl mx-auto px-4 py-4 flex-1">
        {currentRoute === 'home' && (
          <HomeView
            wallet={wallet}
            positions={positions}
            onOpenDeposit={() => setIsDepositModalOpen(true)}
            onOpenWithdraw={() => setIsWithdrawModalOpen(true)}
            onOpenCustomBot={handleOpenCustomBot}
            onOpenApiKey={() => setIsApiKeyModalOpen(true)}
            onNavigateTrading={() => setCurrentRoute('trading')}
            onOpenProfitShare={() => setIsProfitShareModalOpen(true)}
            onOpenTransfer={() => setIsTransferModalOpen(true)}
          />
        )}

        {currentRoute === 'wallet' && (
          <WalletView
            wallet={wallet}
            transactions={transactions}
            positions={positions}
            onOpenDeposit={() => setIsDepositModalOpen(true)}
            onOpenWithdraw={() => setIsWithdrawModalOpen(true)}
            onOpenTransfer={() => setIsTransferModalOpen(true)}
            onOpenGas={() => setIsGasModalOpen(true)}
            onOpenProfitShare={() => setIsProfitShareModalOpen(true)}
            onOpenApiKey={() => setIsApiKeyModalOpen(true)}
            onOpenActivationModal={() => setIsActivationModalOpen(true)}
            onOpenCoinsChecker={() => setIsCoinsCheckerModalOpen(true)}
          />
        )}

        {currentRoute === 'trading' && (
          <TradingPositionsView
            positions={positions}
            wallet={wallet}
            tradeHistory={tradeHistory}
            activeApiCreds={activeApiCreds}
            onOpenMatrixModal={handleOpenCustomBot}
            onDeleteBot={handleDeleteBotPosition}
            onOpenGasModal={() => setIsGasModalOpen(true)}
            onOpenActivationModal={() => setIsActivationModalOpen(true)}
            onForceTakeProfit={handleForceTakeProfit}
            onTogglePause={handleTogglePause}
            onBatchForceTp={handleBatchForceTp}
            onBatchPauseAll={handleBatchPauseAll}
            onExecuteBotOrder={handleExecuteLiveBotOrder}
          />
        )}

        {currentRoute === 'bot' && (
          <BotMatrixView
            onOpenMatrixModal={handleOpenCustomBot}
            onOpenSimulation={() => setIsSimulationModalOpen(true)}
            onDeployBotToExchange={handleExecuteLiveBotOrder}
            connectedExchangeName={wallet.connectedExchange?.exchange || currentExchange}
            isSandbox={wallet.connectedExchange?.isSandbox ?? true}
          />
        )}

        {currentRoute === 'akun' && (
          <AccountView
            wallet={wallet}
            currentExchange={currentExchange}
            onOpenApiKey={() => setIsApiKeyModalOpen(true)}
            onDisconnectApi={handleDisconnectExchange}
            onOpenProfitShare={() => setIsProfitShareModalOpen(true)}
            onOpenGasModal={() => setIsGasModalOpen(true)}
            onOpenTransfer={() => setIsTransferModalOpen(true)}
            onOpenActivationModal={() => setIsActivationModalOpen(true)}
            onOpen2faModal={() => setIs2faModalOpen(true)}
          />
        )}
      </main>

      {/* Sticky Bottom Dock */}
      <BottomDock
        currentRoute={currentRoute}
        onRouteChange={setCurrentRoute}
        activePositionsCount={positions.filter((p) => p.status === 'active').length}
      />

      {/* All Application Modals */}
      <AveragingMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
        selectedPair={selectedPairForMatrix}
        selectedPairs={selectedPairsForMatrix}
        initialMode={selectedModeForMatrix}
        initialLayers={selectedLayersForMatrix}
        initialBotId={selectedBotIdForMatrix}
        initialBotName={selectedBotNameForMatrix}
        isNewBot={isNewBotModeForMatrix}
        initialMinPrice={selectedMinPriceForMatrix}
        initialMaxPrice={selectedMaxPriceForMatrix}
        currentMarketPrice={
          positions.find((p) => p.id === selectedBotIdForMatrix)?.price ??
          positions.find((p) => p.pair === selectedPairForMatrix || p.coin === selectedPairForMatrix.split('/')[0])?.price
        }
        existingBotsForCoin={positions.filter(
          (p) => p.pair === selectedPairForMatrix || p.coin === selectedPairForMatrix.split('/')[0]
        )}
        availableBalance={
          wallet.connectedExchange?.isConnected
            ? (wallet.connectedExchange.usdtBalance ?? 70)
            : (wallet.liquidBalance || 70)
        }
        onOpenSimulation={() => {
          setIsMatrixModalOpen(false);
          setIsSimulationModalOpen(true);
        }}
        onDeployBot={handleDeployBotConfiguration}
      />

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onViewLedger={() => setCurrentRoute('wallet')}
        onDepositSuccess={handleDepositSuccess}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        availableBalance={wallet.liquidBalance}
        userSecret={wallet.twoFactorSecret}
        onWithdrawSuccess={handleWithdrawSuccess}
      />

      <TransferMemberModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        availableBalance={wallet.liquidBalance}
        userSecret={wallet.twoFactorSecret}
        senderMemberId={wallet.memberId}
        onTransferSuccess={handleTransferSuccess}
      />

      <Google2faModal
        isOpen={is2faModalOpen}
        onClose={() => setIs2faModalOpen(false)}
        userEmail={wallet.email}
        username={wallet.username}
        twoFactorEnabled={wallet.twoFactorEnabled !== false}
        twoFactorSecret={wallet.twoFactorSecret}
        onSave2fa={handleSave2fa}
      />

      <GasFeeModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        availableBalance={wallet.liquidBalance}
        currentGasReserve={wallet.gasReserve}
        onTopUpSuccess={handleTopUpGasSuccess}
        onOpenProfitShare={() => {
          setIsGasModalOpen(false);
          setIsProfitShareModalOpen(true);
        }}
      />

      <ProfitShareModal
        isOpen={isProfitShareModalOpen}
        onClose={() => setIsProfitShareModalOpen(false)}
        onOpenGasModal={() => {
          setIsProfitShareModalOpen(false);
          setIsGasModalOpen(true);
        }}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentExchange={currentExchange}
        connectedExchange={wallet.connectedExchange}
        onDisconnectApi={handleDisconnectExchange}
        onConnectSuccess={handleConnectExchangeSuccess}
      />

      <SimulationModal
        isOpen={isSimulationModalOpen}
        onClose={() => setIsSimulationModalOpen(false)}
      />

      <ExchangeCoinsCheckerModal
        isOpen={isCoinsCheckerModalOpen}
        onClose={() => setIsCoinsCheckerModalOpen(false)}
        currentExchange={currentExchange}
        activeApiCreds={activeApiCreds}
        onSelectExchange={setCurrentExchange}
      />

      <ActivationFeeModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        wallet={wallet}
        onProcessActivation={handleProcessActivation}
        onOpenDepositModal={() => setIsDepositModalOpen(true)}
        activeBotsCount={
          new Set(
            positions
              .filter((p) => p.status === 'active' || p.status === 'averaging')
              .map((p) => p.botId || p.id)
          ).size
        }
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
