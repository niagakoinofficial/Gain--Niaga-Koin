import { useState } from 'react';
import { UserWallet, ExchangeName } from '../types';
import {
  User,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Database,
  LogIn,
  LogOut,
  Sun,
  Moon,
  Unlink,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NetworkReferralSection } from '../components/account/NetworkReferralSection';

interface AccountViewProps {
  wallet: UserWallet;
  currentExchange: ExchangeName;
  onOpenApiKey: () => void;
  onDisconnectApi?: () => void;
  onOpenProfitShare: () => void;
  onOpenGasModal: () => void;
  onOpenTransfer?: () => void;
  onOpenActivationModal?: () => void;
  onOpen2faModal?: () => void;
}

export function AccountView({
  wallet,
  currentExchange,
  onOpenApiKey,
  onDisconnectApi,
  onOpenProfitShare,
  onOpenGasModal,
  onOpenTransfer,
  onOpenActivationModal,
  onOpen2faModal,
}: AccountViewProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [confirmDisconnectApi, setConfirmDisconnectApi] = useState(false);
  const { currentUser, loginWithGoogle, logout, isFirebaseConnected } = useAuth();
  const { theme, setTheme } = useTheme();

  const referralLink = `https://gainkoin.io/register?ref=${wallet.memberId}`;

  const copyReferral = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyMemberId = () => {
    navigator.clipboard.writeText(wallet.memberId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isAccountActive = wallet.accountStatus === 'active';

  return (
    <div className="space-y-4 pb-20">
      {/* Profile Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B1527] via-[#09111E] to-[#060B14] border border-[#162740] shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00F0C8]/10 border border-[#00F0C8]/30 flex items-center justify-center text-[#00F0C8] font-bold text-lg font-mono overflow-hidden">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                wallet.username[0].toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base text-white">{currentUser?.displayName || wallet.username}</h3>
                <button
                  onClick={onOpenActivationModal}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition cursor-pointer flex items-center gap-1 ${
                    isAccountActive
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                  title="Klik untuk melihat info Biaya Aktivasi"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAccountActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>{isAccountActive ? 'STATUS: ACTIVE' : 'STATUS: NON-ACTIVE'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser?.email || wallet.email}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-mono block">Member ID:</span>
            <button
              onClick={copyMemberId}
              className="mt-0.5 font-mono text-xs font-bold text-[#00F0C8] hover:underline flex items-center gap-1"
            >
              <span>{wallet.memberId}</span>
              {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#14233A] text-xs font-mono text-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Active Downline</span>
            <span className="text-white font-bold block mt-0.5">
              {wallet.downlineCount && wallet.downlineCount > 0 ? `${wallet.downlineCount} Member` : '0 Member'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Matrix Spillover</span>
            <span className="text-[#00F0C8] font-bold block mt-0.5">
              +{(wallet.referralYield ?? 0).toFixed(2)} USDT
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Bot Performance</span>
            <span className="text-emerald-400 font-bold block mt-0.5">
              {wallet.winRatePct && wallet.winRatePct > 0 ? `${wallet.winRatePct.toFixed(1)}% Win` : 'Siap Trading'}
            </span>
          </div>
        </div>
      </div>

      {/* Firebase Cloud Sync & Authentication Section */}
      <div className="p-4 rounded-2xl bg-[#08101D] border border-[#14233A] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00F0C8]/10 text-[#00F0C8] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white font-mono">Firebase Firestore Cloud Sync</h4>
              <p className="text-[10px] text-slate-400 font-mono">
                {isFirebaseConnected ? 'Terkoneksi ke Database Cloud Firestore (asia-southeast1)' : 'Memeriksa koneksi Firestore...'}
              </p>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${isFirebaseConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
            {isFirebaseConnected ? 'ONLINE' : 'CONNECTING'}
          </span>
        </div>

        <div className="pt-2 border-t border-[#121E31] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <>
                <div className="w-9 h-9 rounded-full bg-[#00F0C8]/20 border border-[#00F0C8]/40 flex items-center justify-center text-xs font-bold text-[#00F0C8] overflow-hidden shrink-0">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}</span>
                  )}
                </div>
                <div className="text-xs font-mono">
                  <span className="text-white font-semibold block leading-tight">
                    {currentUser.displayName || 'Pengguna GAIN'}
                  </span>
                  <span className="text-slate-400 text-[10px] block truncate max-w-[200px]">
                    {currentUser.email}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xs font-mono">
                <span className="text-slate-400 text-[10px] block">Status Otentikasi:</span>
                <span className="text-slate-300 font-semibold">Mode Tamu (Lokal)</span>
              </div>
            )}
          </div>

          {currentUser ? (
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition text-xs font-mono font-semibold flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="Keluar dari sesi akun Google"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Akun Google</span>
            </button>
          ) : (
            <button
              onClick={loginWithGoogle}
              className="px-3.5 py-1.5 rounded-lg bg-[#00F0C8] text-slate-950 hover:bg-[#00D0AD] transition text-xs font-mono font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk dengan Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Comprehensive Network, Referral & Member ID Section */}
      <NetworkReferralSection
        wallet={wallet}
        userId={currentUser?.uid}
        onOpenTransfer={onOpenTransfer}
        onOpenProfitShare={onOpenProfitShare}
        onOpenActivationModal={onOpenActivationModal}
      />

      {/* Theme Preference Card (Dark / Terang) */}
      <div className="p-4 rounded-2xl bg-[#08101D] border border-[#162740] shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide">Tema Tampilan Aplikasi</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Pilih mode visual yang nyaman bagi mata Anda saat memantau bot
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00F0C8]/10 text-[#00F0C8] border border-[#00F0C8]/30">
            {theme === 'dark' ? 'Mode Gelap Aktif' : 'Mode Terang Aktif'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
          <button
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#0B1527] border-[#00F0C8] text-white shadow-lg shadow-[#00F0C8]/10'
                : 'bg-[#060B14] border-[#14233A] text-slate-400 hover:text-white'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#060B14] border border-[#162740] flex items-center justify-center text-indigo-400">
              <Moon className="w-4 h-4" />
            </div>
            <div className="text-center">
              <span className="font-bold text-xs block text-white">Mode Gelap</span>
              <span className="text-[9px] text-slate-400">Cyber Night Trading</span>
            </div>
          </button>

          <button
            onClick={() => setTheme('light')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition cursor-pointer ${
              theme === 'light'
                ? 'bg-slate-100 border-[#0D9488] text-slate-900 shadow-lg shadow-teal-500/10'
                : 'bg-[#060B14] border-[#14233A] text-slate-400 hover:text-white'
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Sun className="w-4 h-4" />
            </div>
            <div className="text-center">
              <span className="font-bold text-xs block">Mode Terang</span>
              <span className="text-[9px] text-slate-500">Daytime Clean Contrast</span>
            </div>
          </button>
        </div>
      </div>

      {/* Settings Navigation List */}
      <div className="space-y-2">
        {/* Exchange API Card */}
        <div className="p-3.5 rounded-xl bg-[#08101D] border border-[#14233A] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                wallet.connectedExchange?.isConnected
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}>
                <Key className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs text-white">Koneksi API Exchange</span>
                  {wallet.connectedExchange?.isConnected ? (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {wallet.connectedExchange.exchange} {wallet.connectedExchange.isSandbox ? '(Testnet)' : ''} Connected
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
                      Belum Terhubung
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {wallet.connectedExchange?.isConnected
                    ? `Key: ${wallet.connectedExchange.apiKeyMasked} • Saldo: ${wallet.connectedExchange.usdtBalance.toFixed(2)} USDT • Spot OK`
                    : 'Klik untuk menghubungkan API Binance / Bitget / OKX'}
                </p>
              </div>
            </div>

            {!wallet.connectedExchange?.isConnected && (
              <button
                onClick={onOpenApiKey}
                className="px-3 py-1.5 rounded-lg bg-[#00F0C8]/10 hover:bg-[#00F0C8]/20 text-[#00F0C8] border border-[#00F0C8]/30 text-xs font-mono font-bold transition cursor-pointer shrink-0"
              >
                Hubungkan
              </button>
            )}
          </div>

          {/* Quick Actions if API is Connected */}
          {wallet.connectedExchange?.isConnected && (
            <div className="pt-2 border-t border-[#121E31] flex items-center justify-end gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={onOpenApiKey}
                className="px-3 py-1.5 rounded-lg bg-[#0F1B2D] hover:bg-[#152740] text-slate-300 hover:text-white border border-[#1B2F4C] transition cursor-pointer text-[11px]"
              >
                Atur Ulang Key
              </button>

              {!confirmDisconnectApi ? (
                <button
                  type="button"
                  onClick={() => setConfirmDisconnectApi(true)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Putuskan API</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-red-400 font-sans mr-1">Yakin putuskan?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDisconnectApi(false);
                      if (onDisconnectApi) onDisconnectApi();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition cursor-pointer shadow-sm animate-pulse"
                  >
                    Ya, Putuskan
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDisconnectApi(false)}
                    className="px-2 py-1 rounded-lg bg-[#0F1A2D] text-slate-300 text-[11px] hover:text-white cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 20% Profit Share Info */}
        <div
          onClick={onOpenProfitShare}
          className="p-3.5 rounded-xl bg-[#08101D] border border-[#14233A] hover:border-[#00F0C8]/40 transition flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-[#00F0C8] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs text-white">Rincian Bagi Hasil 20% & Gas Pool</span>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                80% Net Trader • 20% Platform (Infra, Affiliate, Buffer)
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </div>

        {/* Security 2FA */}
        <div
          onClick={onOpen2faModal}
          className="p-3.5 rounded-xl bg-[#08101D] border border-[#14233A] hover:border-emerald-500/40 hover:bg-[#0A1424] transition flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
              wallet.twoFactorEnabled !== false
                ? 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-400'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white group-hover:text-emerald-300 transition">
                  Google 2FA Authenticator
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono border ${
                  wallet.twoFactorEnabled !== false
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {wallet.twoFactorEnabled !== false ? 'Aktif' : 'Non-Aktif'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Proteksi penarikan vault dan transfer P2P • Kelola Kunci &amp; QR
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] font-mono text-[#00F0C8] opacity-0 group-hover:opacity-100 transition">
              Kelola 2FA
            </span>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
          </div>
        </div>
      </div>
    </div>
  );
}
