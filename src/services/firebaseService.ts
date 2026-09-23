import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { UserWallet, TradingPosition, TransactionRecord, TradeRecord } from '../types';
import { initialWallet, initialPositions, initialTransactions } from '../data/mockData';
import { generateCleanMemberId, registerMemberInDirectory } from './memberService';

export async function initUserProfile(user: { uid: string; displayName?: string | null; email?: string | null }) {
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    const googleName = user.displayName || user.email?.split('@')[0] || 'Member GAIN';
    const googleEmail = user.email || 'user@gainkoin.io';

    if (!snap.exists()) {
      const cleanMemberId = generateCleanMemberId(user.uid);
      const newWallet: UserWallet = {
        ...initialWallet,
        username: googleName,
        email: googleEmail,
        memberId: cleanMemberId,
        sponsorId: 'GN-10001',
        sponsorName: 'Master GAIN Foundation',
        directReferralsCount: 4,
        accountStatus: 'non-active',
        activationFeeUsdt: 100,
        teamTurnoverUsdt: 60100,
        totalReferralBonusUsdt: 34.00,
      };

      await setDoc(userRef, {
        id: user.uid,
        username: newWallet.username,
        email: newWallet.email,
        memberId: newWallet.memberId,
        accountStatus: newWallet.accountStatus || 'non-active',
        activationFeeUsdt: 100,
        liquidBalance: newWallet.liquidBalance,
        availableCash: newWallet.availableCash,
        gasReserve: newWallet.gasReserve,
        totalInflow: newWallet.totalInflow,
        totalOutflow: newWallet.totalOutflow,
        gasConsumed: newWallet.gasConsumed,
        referralYield: newWallet.referralYield,
        allocatedAssetUsdt: newWallet.allocatedAssetUsdt,
        volume24h: newWallet.volume24h,
        sponsorId: newWallet.sponsorId,
        sponsorName: newWallet.sponsorName,
        directReferralsCount: newWallet.directReferralsCount,
        teamTurnoverUsdt: newWallet.teamTurnoverUsdt,
        totalReferralBonusUsdt: newWallet.totalReferralBonusUsdt,
        twoFactorEnabled: newWallet.twoFactorEnabled ?? true,
        twoFactorSecret: newWallet.twoFactorSecret ?? 'JBSWY3DPEHPK3PXPJA2G6ZRA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      await registerMemberInDirectory({
        memberId: cleanMemberId,
        userId: user.uid,
        username: googleName,
        accountStatus: 'non-active',
        emailMasked: googleEmail
          ? `${googleEmail.slice(0, 3)}***@${googleEmail.split('@')[1] || 'gmail.com'}`
          : 'user***@gmail.com',
        sponsorId: 'GN-10001',
        joinedAt: new Date().toISOString(),
      });

      // Initialize subcollections
      for (const pos of initialPositions) {
        const posRef = doc(db, 'users', user.uid, 'positions', pos.id);
        await setDoc(posRef, {
          ...pos,
          userId: user.uid,
          updatedAt: new Date().toISOString(),
        });
      }

      const welcomeTx = {
        id: `tx-welcome-${Date.now()}`,
        title: 'Akun Member GAIN Diaktifkan via Google',
        type: 'inflow',
        status: 'Confirmed',
        statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        timestamp: 'Baru saja',
        counterparty: googleEmail || 'Google Verified',
        counterpartyLabel: 'Google: ',
        amount: 0,
        amountFormatted: `ID: ${cleanMemberId}`,
        feeInfo: 'Sponsor: Master GAIN (GN-10001)',
        userId: user.uid,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid, 'transactions', welcomeTx.id), welcomeTx);
    } else {
      // Synchronize Google User details if different or missing clean memberId
      const existing = snap.data();
      const updates: Record<string, any> = {};
      if (googleName && existing.username !== googleName) {
        updates.username = googleName;
      }
      if (googleEmail && existing.email !== googleEmail) {
        updates.email = googleEmail;
      }

      let activeMemberId = existing.memberId;
      if (!activeMemberId || !activeMemberId.startsWith('GN-')) {
        activeMemberId = generateCleanMemberId(user.uid);
        updates.memberId = activeMemberId;
      }
      if (!existing.sponsorId) {
        updates.sponsorId = 'GN-10001';
        updates.sponsorName = 'Master GAIN Foundation';
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date().toISOString();
        await updateDoc(userRef, updates);
      }

      await registerMemberInDirectory({
        memberId: activeMemberId,
        userId: user.uid,
        username: googleName,
        accountStatus: (existing.accountStatus as 'active' | 'non-active') || 'non-active',
        emailMasked: googleEmail
          ? `${googleEmail.slice(0, 3)}***@${googleEmail.split('@')[1] || 'gmail.com'}`
          : 'user***@gmail.com',
        sponsorId: existing.sponsorId || 'GN-10001',
        joinedAt: existing.createdAt || new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
  }
}

export function subscribeToUserWallet(
  userId: string,
  onUpdate: (wallet: UserWallet) => void
) {
  const path = `users/${userId}`;
  return onSnapshot(
    doc(db, 'users', userId),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate({
          liquidBalance: data.liquidBalance ?? initialWallet.liquidBalance,
          availableCash: data.availableCash ?? initialWallet.availableCash,
          gasReserve: data.gasReserve ?? initialWallet.gasReserve,
          totalInflow: data.totalInflow ?? initialWallet.totalInflow,
          totalOutflow: data.totalOutflow ?? initialWallet.totalOutflow,
          gasConsumed: data.gasConsumed ?? initialWallet.gasConsumed,
          referralYield: data.referralYield ?? initialWallet.referralYield,
          allocatedAssetUsdt: data.allocatedAssetUsdt ?? initialWallet.allocatedAssetUsdt,
          volume24h: data.volume24h ?? initialWallet.volume24h,
          memberId: data.memberId ?? initialWallet.memberId,
          username: data.username ?? initialWallet.username,
          accountStatus: data.accountStatus ?? initialWallet.accountStatus ?? 'non-active',
          activationFeeUsdt: data.activationFeeUsdt ?? 100,
          vipTier: data.vipTier ?? initialWallet.vipTier,
          email: data.email ?? initialWallet.email,
          downlineCount: data.downlineCount ?? 4,
          winRatePct: data.winRatePct ?? 98.4,
          connectedExchange: data.connectedExchange,
          sponsorId: data.sponsorId ?? initialWallet.sponsorId,
          sponsorName: data.sponsorName ?? initialWallet.sponsorName,
          directReferralsCount: data.directReferralsCount ?? initialWallet.directReferralsCount,
          teamTurnoverUsdt: data.teamTurnoverUsdt ?? initialWallet.teamTurnoverUsdt,
          totalReferralBonusUsdt: data.totalReferralBonusUsdt ?? initialWallet.totalReferralBonusUsdt,
          twoFactorEnabled: data.twoFactorEnabled ?? initialWallet.twoFactorEnabled ?? true,
          twoFactorSecret: data.twoFactorSecret ?? initialWallet.twoFactorSecret ?? 'JBSWY3DPEHPK3PXPJA2G6ZRA',
        });
      }
    },
    (err) => {
      handleFirestoreError(err, OperationType.GET, path);
    }
  );
}

export async function syncRealPortfolioAssetsToFirestore(
  userId: string,
  exchangeName: string,
  isSandbox: boolean,
  usdtBalance: number,
  portfolioAssets: Array<{
    coin: string;
    pair: string;
    total: number;
    price: number;
    change24h: number;
    valueUsdt: number;
  }>
) {
  const userRef = doc(db, 'users', userId);
  try {
    const totalCoinValue = portfolioAssets.reduce((sum, a) => sum + (a.valueUsdt || 0), 0);
    const totalAllocated = Number(totalCoinValue.toFixed(2));

    await updateDoc(userRef, {
      liquidBalance: usdtBalance,
      availableCash: usdtBalance,
      allocatedAssetUsdt: totalAllocated,
      updatedAt: new Date().toISOString(),
    });

    // Update or create positions in users/${userId}/positions
    const posSnap = await getDocs(collection(db, 'users', userId, 'positions'));
    const existingPositions = new Map<string, any>();
    posSnap.docs.forEach((d) => {
      const data = d.data();
      if (data.coin) {
        existingPositions.set(data.coin.toUpperCase(), { ref: d.ref, data });
      }
    });

    const activeCoinSet = new Set<string>();

    for (const asset of portfolioAssets) {
      const coinKey = asset.coin.toUpperCase();
      activeCoinSet.add(coinKey);
      const existing = existingPositions.get(coinKey);

      if (existing) {
        await updateDoc(existing.ref, {
          allocationQty: `${asset.total} ${asset.coin}`,
          allocationUsdt: `~${asset.valueUsdt.toFixed(2)} USDT`,
          price: asset.price,
          change24h: asset.change24h,
          status: 'active',
          statusLabel: 'HOLDING / ACTIVE',
          engine: `${exchangeName.toUpperCase()} Spot ${isSandbox ? '(Testnet)' : ''} · Saldo Riil`,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const newPosRef = doc(db, 'users', userId, 'positions', `${asset.coin.toLowerCase()}-usdt`);
        await setDoc(newPosRef, {
          id: `${asset.coin.toLowerCase()}-usdt`,
          coin: asset.coin,
          pair: asset.pair || `${asset.coin}/USDT`,
          logoUrl: `/coins/${asset.coin.toLowerCase()}.svg`,
          badgeSymbol: asset.coin.substring(0, 1),
          badgeBg: 'bg-emerald-500/10',
          badgeColor: 'text-emerald-400',
          price: asset.price,
          change24h: asset.change24h,
          engine: `${exchangeName.toUpperCase()} Spot ${isSandbox ? '(Testnet)' : ''} · Saldo Riil`,
          allocationQty: `${asset.total} ${asset.coin}`,
          allocationUsdt: `~${asset.valueUsdt.toFixed(2)} USDT`,
          stepLayer: 1,
          maxStep: 100,
          layerQuota: 'Exchange Asset Synced',
          floatingPnl: 0,
          roiPct: 0,
          status: 'active',
          statusLabel: 'HOLDING / ACTIVE',
          trailingInfo: 'Real Portfolio Live',
          trailingProgressPct: 100,
          userId,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Set non-holding positions to inactive/standby
    for (const [coin, { ref, data }] of existingPositions.entries()) {
      if (!activeCoinSet.has(coin)) {
        await updateDoc(ref, {
          allocationQty: `0 ${coin}`,
          allocationUsdt: '0.00 USDT',
          status: 'inactive',
          statusLabel: 'STANDBY',
          floatingPnl: 0,
          roiPct: 0,
          engine: `${exchangeName.toUpperCase()} Spot ${isSandbox ? '(Testnet)' : ''} · Standby`,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/portfolio-sync`);
  }
}

export async function saveConnectedExchangeToFirestore(
  userId: string,
  config: import('../types').ConnectedExchangeConfig
) {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, {
      connectedExchange: config,
      liquidBalance: config.usdtBalance,
      availableCash: config.usdtBalance,
      updatedAt: new Date().toISOString(),
    });

    // Add transaction record for audit
    const txRef = doc(db, 'users', userId, 'transactions', `tx-ex-${Date.now()}`);
    await setDoc(txRef, {
      id: `tx-ex-${Date.now()}`,
      userId,
      title: `Sinkronisasi API ${config.exchange} ${config.isSandbox ? '(Testnet)' : ''}`,
      type: 'inflow',
      status: 'Confirmed',
      statusColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      timestamp: 'Just now',
      counterparty: `${config.exchange} Spot Exchange`,
      counterpartyLabel: 'Exchange: ',
      amount: config.usdtBalance,
      amountFormatted: `${config.usdtBalance.toFixed(2)} USDT`,
      feeInfo: 'API Live Synced',
      createdAt: new Date().toISOString(),
    });

    // Update positions engine labels to match the connected exchange
    const posSnap = await getDocs(collection(db, 'users', userId, 'positions'));
    for (const pDoc of posSnap.docs) {
      const posData = pDoc.data();
      await updateDoc(pDoc.ref, {
        engine: `${config.exchange} Spot ${config.isSandbox ? '(Testnet)' : ''} · Moon Logic Engine`,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/exchange`);
  }
}

export async function disconnectExchangeFromFirestore(userId: string) {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, {
      connectedExchange: {
        exchange: 'Tokocrypto',
        isConnected: false,
        isSandbox: false,
        apiKeyMasked: '',
        usdtBalance: 0,
        lastSynced: new Date().toLocaleTimeString(),
      },
      liquidBalance: 2500,
      availableCash: 2500,
      allocatedAssetUsdt: 0,
      updatedAt: new Date().toISOString(),
    });

    // Add transaction record for audit
    const txRef = doc(db, 'users', userId, 'transactions', `tx-dc-${Date.now()}`);
    await setDoc(txRef, {
      id: `tx-dc-${Date.now()}`,
      userId,
      title: 'Pemutusan Sambungan API Exchange (Disconnected)',
      type: 'neutral',
      status: 'Confirmed',
      statusColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      timestamp: 'Baru saja',
      counterparty: 'API Gateway',
      counterpartyLabel: 'Status: ',
      amount: 0,
      amountFormatted: '0.00 USDT',
      feeInfo: 'API Cleared & Disconnected',
      createdAt: new Date().toISOString(),
    });

    // Reset positions back to Standby
    const posSnap = await getDocs(collection(db, 'users', userId, 'positions'));
    for (const pDoc of posSnap.docs) {
      await updateDoc(pDoc.ref, {
        allocationQty: '0',
        allocationUsdt: '0.00 USDT',
        status: 'inactive',
        statusLabel: 'STANDBY',
        engine: 'Algorithmic Standby · Menunggu API',
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${userId}/disconnect-exchange`);
  }
}

export function subscribeToUserPositions(
  userId: string,
  onUpdate: (positions: TradingPosition[]) => void
) {
  const path = `users/${userId}/positions`;
  return onSnapshot(
    collection(db, 'users', userId, 'positions'),
    (snap) => {
      const list: TradingPosition[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as TradingPosition);
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeToUserTransactions(
  userId: string,
  onUpdate: (transactions: TransactionRecord[]) => void
) {
  const path = `users/${userId}/transactions`;
  return onSnapshot(
    collection(db, 'users', userId, 'transactions'),
    (snap) => {
      const list: TransactionRecord[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as TransactionRecord);
      });
      if (list.length > 0) {
        onUpdate(list);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function updateUserWallet(userId: string, partial: Partial<UserWallet>) {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...partial,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function addTransactionToFirestore(userId: string, tx: TransactionRecord) {
  const path = `users/${userId}/transactions/${tx.id}`;
  try {
    const txRef = doc(db, 'users', userId, 'transactions', tx.id);
    await setDoc(txRef, {
      ...tx,
      userId,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updatePositionInFirestore(userId: string, pos: TradingPosition) {
  const path = `users/${userId}/positions/${pos.id}`;
  try {
    const posRef = doc(db, 'users', userId, 'positions', pos.id);
    await setDoc(posRef, {
      ...pos,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePositionFromFirestore(userId: string, posId: string) {
  const path = `users/${userId}/positions/${posId}`;
  try {
    const posRef = doc(db, 'users', userId, 'positions', posId);
    await deleteDoc(posRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserTradeHistory(
  userId: string,
  onUpdate: (trades: TradeRecord[]) => void
) {
  const path = `users/${userId}/trade_history`;
  return onSnapshot(
    collection(db, 'users', userId, 'trade_history'),
    (snap) => {
      const list: TradeRecord[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data() as TradeRecord);
      });
      // Sort newest trades first
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addTradeRecordToFirestore(userId: string, trade: TradeRecord) {
  const path = `users/${userId}/trade_history/${trade.id}`;
  try {
    const tradeRef = doc(db, 'users', userId, 'trade_history', trade.id);
    await setDoc(tradeRef, {
      ...trade,
      userId,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function syncTradesFromExchangeToFirestore(userId: string, trades: TradeRecord[]) {
  try {
    for (const trade of trades) {
      const tradeRef = doc(db, 'users', userId, 'trade_history', trade.id);
      await setDoc(
        tradeRef,
        {
          ...trade,
          userId,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/trade_history_batch`);
  }
}
