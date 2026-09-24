import { useState, useRef, useEffect } from 'react';
import { ExchangeName } from '../types';
import {
  ChevronDown,
  ShieldCheck,
  Check,
  Database,
  LogIn,
  LogOut,
  Sun,
  Moon,
  Key,
  Unlink,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderBarProps {
  currentExchange: ExchangeName;
  onSelectExchange: (exchange: ExchangeName) => void;
  connectedExchange?: import('../types').ConnectedExchangeConfig;
  twoFactorEnabled?: boolean;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onOpenProfitShare?: () => void;
  onOpenApiKey?: () => void;
  onDisconnectApi?: () => void;
  onOpen2faModal?: () => void;
}

export function HeaderBar({
  currentExchange,
  onSelectExchange,
  connectedExchange,
  twoFactorEnabled = true,
  title,
  subtitle,
  showBack,
  onBack,
  onOpenProfitShare,
  onOpenApiKey,
  onDisconnectApi,
  onOpen2faModal,
}: HeaderBarProps) {
  const [exchangeDropdownOpen, setExchangeDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { currentUser, loginWithGoogle, logout, isFirebaseConnected, is2faVerified, isLoggingIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const exchanges: ExchangeName[] = ['Bitget', 'Binance', 'OKX', 'Tokocrypto'];

  const userMenuRef = useRef<HTMLDivElement>(null);
  const exchangeMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (exchangeMenuRef.current && !exchangeMenuRef.current.contains(event.target as Node)) {
        setExchangeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="px-4 sm:px-6 py-3.5 border-b border-[#142033] bg-[#070D14]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      {/* Left: Brand or Back */}
      <div className="flex items-center gap-3">
        {showBack ? (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-[#0F1726] border border-[#1D2E49] flex items-center justify-center text-slate-300 hover:text-white hover:border-[#00F0C8] transition-colors"
            title="Kembali"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
            </svg>
          </button>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-[#0A101D] border border-[#00F0C8]/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,200,0.2)]">
            <svg className="w-5 h-5 text-[#00F0C8]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>
        )}

        <div>
          {title ? (
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">{title}</h2>
              {subtitle && <p className="text-[10px] text-slate-400 font-mono">{subtitle}</p>}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-wider text-sm sm:text-base text-white">GAIN</span>
                <span className="w-2 h-2 rounded-full bg-[#00F0C8] animate-pulse"></span>
              </div>
              <p className="text-[10px] tracking-widest text-[#00F0C8] font-mono uppercase font-semibold">
                Niaga Koin • v2.0
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Exchange Selector & Firebase Cloud Sync & Vault */}
      <div className="flex items-center gap-2 relative">
        {/* Firebase Cloud Sync Badge */}
        <div
          title={isFirebaseConnected ? 'Firebase Firestore Cloud Database Connected' : 'Connecting to Firestore...'}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#091220] border border-[#162740] text-[10px] font-mono text-slate-300"
        >
          <Database className={`w-3 h-3 ${isFirebaseConnected ? 'text-[#00F0C8]' : 'text-amber-400 animate-spin'}`} />
          <span className="hidden md:inline">Firestore</span>
          <span className={`w-1.5 h-1.5 rounded-full ${isFirebaseConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
        </div>

        {/* User Account / Google Sign In */}
        {currentUser ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              title={`Logged in as ${currentUser.displayName || currentUser.email}`}
              className="w-8 h-8 rounded-full bg-[#00F0C8]/20 border border-[#00F0C8]/50 flex items-center justify-center text-xs font-bold text-[#00F0C8] overflow-hidden hover:ring-2 hover:ring-[#00F0C8]/60 transition cursor-pointer"
            >
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}</span>
              )}
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#09111E] border border-[#162942] rounded-2xl shadow-2xl p-3 z-50 overflow-hidden font-mono text-xs animate-in fade-in-50 zoom-in-95">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[#142236]">
                  <div className="w-9 h-9 rounded-full bg-[#00F0C8]/20 border border-[#00F0C8]/40 flex items-center justify-center text-xs font-bold text-[#00F0C8] shrink-0 overflow-hidden">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-white text-xs truncate">
                      {currentUser.displayName || 'Pengguna GAIN'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                </div>

                {/* Account Status */}
                <div className="py-2.5 space-y-1.5 text-[10.5px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Google Auth:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Terhubung
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Gmail Verified:</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Terverifikasi
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>Google 2FA:</span>
                    <span className={`font-bold flex items-center gap-1 ${
                      is2faVerified
                        ? 'text-emerald-400'
                        : twoFactorEnabled
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}>
                      <ShieldCheck className="w-3 h-3" />
                      {is2faVerified ? 'Terverifikasi' : twoFactorEnabled ? 'Perlu Kode 2FA' : 'Non-Aktif'}
                    </span>
                  </div>

                  {connectedExchange?.isConnected ? (
                    <div className="p-2 rounded-xl bg-[#0E1B2E] border border-[#182F4D] space-y-1.5 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">API Exchange:</span>
                        <span className="text-[#00F0C8] font-bold">
                          {connectedExchange.exchange} {connectedExchange.isSandbox ? '(Testnet)' : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Saldo Kas:</span>
                        <span className="text-white font-semibold">
                          {connectedExchange.usdtBalance.toFixed(2)} USDT
                        </span>
                      </div>
                      {onDisconnectApi && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserMenuOpen(false);
                            onDisconnectApi();
                          }}
                          className="w-full mt-1 px-2 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition flex items-center justify-center gap-1.5 font-sans text-[11px] font-semibold cursor-pointer"
                        >
                          <Unlink className="w-3 h-3" />
                          <span>Putuskan API {connectedExchange.exchange}</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-slate-400 pt-1">
                      <span>API Exchange:</span>
                      <span className="text-amber-400">Belum Terhubung</span>
                    </div>
                  )}
                </div>

                {/* Google Log Out Action */}
                <div className="pt-2 border-t border-[#142236]">
                  <button
                    type="button"
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await logout();
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 transition flex items-center justify-center gap-2 font-sans text-xs font-bold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar dari Akun Google</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            disabled={isLoggingIn}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00F0C8]/10 border border-[#00F0C8]/40 text-[#00F0C8] text-xs font-mono font-bold hover:bg-[#00F0C8]/20 disabled:opacity-60 transition cursor-pointer"
            title="Masuk dengan Google"
          >
            {isLoggingIn ? (
              <>
                <div className="w-3 h-3 border-2 border-[#00F0C8] border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Menghubungkan...</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Google Login</span>
              </>
            )}
          </button>
        )}

        <div className="relative" ref={exchangeMenuRef}>
          <button
            type="button"
            onClick={() => setExchangeDropdownOpen(!exchangeDropdownOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              connectedExchange?.isConnected && connectedExchange.exchange === currentExchange
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-[#0A101D] border-[#00F0C8]/30 text-[#00F0C8] hover:border-[#00F0C8]/70'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectedExchange?.isConnected && connectedExchange.exchange === currentExchange
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-[#00F0C8]'
              }`}
            ></span>
            <span>
              {currentExchange}
              {connectedExchange?.isConnected && connectedExchange.exchange === currentExchange
                ? connectedExchange.isSandbox
                  ? ' (Testnet)'
                  : ' (Live)'
                : ''}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${exchangeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Exchange Dropdown Menu */}
          {exchangeDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#09111E] border border-[#162942] rounded-xl shadow-2xl p-1 z-50 overflow-hidden font-mono text-xs">
              <div className="px-2.5 py-1.5 text-[10px] text-slate-400 border-b border-[#142236] uppercase tracking-wider font-semibold">
                Pilih Exchange
              </div>
              {exchanges.map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    onSelectExchange(ex);
                    setExchangeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                    currentExchange === ex
                      ? 'bg-[#00F0C8]/15 text-[#00F0C8] font-bold'
                      : 'text-slate-300 hover:bg-[#111F33] hover:text-white'
                  }`}
                >
                  <span>{ex}</span>
                  {currentExchange === ex && <Check className="w-3.5 h-3.5 text-[#00F0C8]" />}
                </button>
              ))}

              {/* Exchange Quick Actions: Open API Modal or Disconnect API */}
              <div className="pt-1 mt-1 border-t border-[#142236] space-y-1">
                {onOpenApiKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setExchangeDropdownOpen(false);
                      onOpenApiKey();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#111F33] text-[11px] transition text-left"
                  >
                    <Key className="w-3.5 h-3.5 text-[#00F0C8]" />
                    <span>Atur API Key...</span>
                  </button>
                )}

                {connectedExchange?.isConnected && onDisconnectApi && (
                  <button
                    type="button"
                    onClick={() => {
                      setExchangeDropdownOpen(false);
                      onDisconnectApi();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 text-[11px] transition text-left"
                  >
                    <Unlink className="w-3.5 h-3.5 text-red-400" />
                    <span>Putuskan API {connectedExchange.exchange}</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security / Settlement Vault Info */}
        <button
          onClick={onOpenProfitShare}
          className="w-9 h-9 rounded-full bg-[#0A101D] border border-[#16243A] flex items-center justify-center text-slate-400 hover:text-[#00F0C8] hover:border-[#00F0C8]/40 transition"
          title="Rincian Bagi Hasil & Keamanan"
        >
          <ShieldCheck className="w-4 h-4 text-[#00F0C8]" />
        </button>

        {/* Theme Mode Toggle (Dark / Terang) */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full bg-[#0A101D] border border-[#16243A] flex items-center justify-center text-slate-400 hover:text-amber-400 hover:border-amber-400/40 transition cursor-pointer"
          title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          aria-label="Toggle dark and light mode"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500 hover:-rotate-12 transition-transform" />
          )}
        </button>
      </div>
    </header>
  );
}
