import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../../../shared/components/Button/Button';
import Input from '../../../shared/components/Input/Input';
import kimoIcon from '../../../assets/icono.png';
import './AuthPages.css';

// ── Device detection ──────────────────────────────────────
function getDeviceType() {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  if (isIOS && isSafari) return 'ios-safari';
  if (isIOS) return 'ios-other';
  if (isAndroid) return 'android';
  const isChromeLike = /Chrome/.test(ua) || /Edg/.test(ua);
  if (isChromeLike) return 'desktop-chrome';
  return 'desktop-other';
}

// ── SVG icons ─────────────────────────────────────────────
const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);
const PlusSquareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const MenuDotsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const InstallIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12"/>
    <path d="m8 11 4 4 4-4"/>
    <path d="M8 17H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"/>
  </svg>
);
const RocketIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
  </svg>
);
const ChromeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="4"/>
    <line x1="21.17" y1="8" x2="12" y2="8"/>
    <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
    <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
  </svg>
);
const PhoneDownloadIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12"/>
    <path d="m8 11 4 4 4-4"/>
    <rect x="3" y="15" width="18" height="6" rx="2"/>
  </svg>
);
const CloseXIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ── Install instructions per device ───────────────────────
const INSTRUCTIONS = {
  'ios-safari': {
    title: 'Instalar en iPhone / iPad',
    badge: 'iOS · Safari',
    steps: [
      { icon: <ShareIcon />, text: 'Toca el botón Compartir (□↑) en la barra de Safari' },
      { icon: <PlusSquareIcon />, text: 'Desplázate y toca "Agregar a pantalla de inicio"' },
      { icon: <CheckIcon />, text: 'Toca "Agregar" — ¡Kimo aparece como app!' },
    ],
    note: 'Solo funciona en Safari. Si estás en otro navegador, ábrelo de nuevo en Safari.',
  },
  'ios-other': {
    title: 'Instalar en iPhone / iPad',
    badge: 'iOS · Requiere Safari',
    steps: [
      { icon: <ChromeIcon />, text: 'Copia el link y ábrelo en Safari (no Chrome)' },
      { icon: <ShareIcon />, text: 'Toca el botón Compartir (□↑)' },
      { icon: <PlusSquareIcon />, text: 'Toca "Agregar a pantalla de inicio" → "Agregar"' },
    ],
    note: 'La instalación en iOS solo funciona desde Safari.',
  },
  'android': {
    title: 'Instalar en Android',
    badge: 'Android · Chrome',
    steps: [
      { icon: <MenuDotsIcon />, text: 'Toca los tres puntos (⋮) en Chrome' },
      { icon: <DownloadIcon />, text: 'Selecciona "Instalar aplicación" o "Agregar a inicio"' },
      { icon: <CheckIcon />, text: 'Confirma — Kimo se instala como app nativa' },
    ],
    note: 'Compatible con Chrome, Edge y Samsung Internet.',
  },
  'desktop-chrome': {
    title: 'Instalar en PC / Mac',
    badge: 'Escritorio · Chrome / Edge',
    steps: [
      { icon: <InstallIcon />, text: 'Haz clic en el ícono ⊕ en la barra de dirección' },
      { icon: <CheckIcon />, text: 'Haz clic en "Instalar" en el diálogo' },
      { icon: <RocketIcon />, text: '¡Kimo se abre como app independiente!' },
    ],
    note: 'También en Menú (⋮) → "Instalar Kimo".',
  },
  'desktop-other': {
    title: 'Instalar Kimo',
    badge: 'Escritorio',
    steps: [
      { icon: <ChromeIcon />, text: 'Abre este link en Google Chrome o Microsoft Edge' },
      { icon: <InstallIcon />, text: 'Haz clic en el ícono ⊕ en la barra de dirección' },
      { icon: <CheckIcon />, text: '¡Kimo queda en tu escritorio como app!' },
    ],
    note: 'La instalación como app requiere Chrome o Edge.',
  },
};

// ── Install Modal ─────────────────────────────────────────
function InstallModal({ onClose }) {
  const info = INSTRUCTIONS[getDeviceType()];
  return (
    <div className="install-overlay" onClick={onClose}>
      <div className="install-modal" onClick={(e) => e.stopPropagation()}>
        <div className="install-handle" />
        <button className="install-close" onClick={onClose}><CloseXIcon /></button>

        <div className="install-header">
          <img src={kimoIcon} alt="Kimo" className="install-app-icon" />
          <div className="install-header-text">
            <h2 className="install-modal-title">{info.title}</h2>
            <span className="install-badge">{info.badge}</span>
          </div>
        </div>

        <ol className="install-steps">
          {info.steps.map((step, i) => (
            <li key={i} className="install-step">
              <div className="install-step-num">{i + 1}</div>
              <div className="install-step-icon">{step.icon}</div>
              <p className="install-step-text">{step.text}</p>
            </li>
          ))}
        </ol>

        {info.note && <p className="install-note">{info.note}</p>}

        <button className="install-done-btn" onClick={onClose}>Entendido</button>
      </div>
    </div>
  );
}

// ── Download Banner ───────────────────────────────────────
function isRunningAsPWA() {
  // iOS Safari standalone flag
  if (window.navigator.standalone === true) return true;
  // Android / desktop: check display-mode media query
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return false;
}

function DownloadBanner({ onClick }) {
  // Don't show if already installed
  if (isRunningAsPWA()) return null;

  return (
    <button className="install-banner" onClick={onClick}>
      <span className="install-banner-icon"><PhoneDownloadIcon /></span>
      <span className="install-banner-text">
        Descarga Kimo en tu dispositivo favorito
      </span>
      <span className="install-banner-chevron">›</span>
    </button>
  );
}

// ── LoginPage ─────────────────────────────────────────────
export default function LoginPage() {
  const { signInWithEmail, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [showInstall, setShowInstall] = useState(false);

  if (isAuthenticated) {
    const joinToken = localStorage.getItem('kimo_join_token');
    if (joinToken) return <Navigate to={`/unirse/${joinToken}`} replace />;
    return <Navigate to="/hogares" replace />;
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signInWithEmail(email, password);
    if (err) setError(err.message);
    setLoading(false);
  };

  if (showRegister) {
    return (
      <>
        <RegisterView
          email={email} setEmail={setEmail}
          password={password} setPassword={setPassword}
          registerName={registerName} setRegisterName={setRegisterName}
          error={error} loading={loading}
          onBack={() => setShowRegister(false)}
          onShowInstall={() => setShowInstall(true)}
        />
        {showInstall && <InstallModal onClose={() => setShowInstall(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="auth-page animate-fade-in">
        <div className="auth-content">
          <div className="auth-logo">
            <img src={kimoIcon} alt="KIMO" className="auth-logo-img" />
          </div>
          <h1 className="auth-title">KIMO</h1>
          <p className="auth-subtitle">Inicia sesión para continuar</p>

          <form className="auth-form" onSubmit={handleEmailLogin}>
            <Input label="Email" type="email" placeholder="tu@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            <Input label="Contraseña" type="password" placeholder="Tu contraseña"
              value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="auth-error">{error}</p>}
            <Button type="submit" loading={loading}>Iniciar sesión</Button>
          </form>

          <button className="auth-switch" onClick={() => setShowRegister(true)}>
            ¿No tienes cuenta? <strong>Regístrate</strong>
          </button>

          <DownloadBanner onClick={() => setShowInstall(true)} />
        </div>
      </div>
      {showInstall && <InstallModal onClose={() => setShowInstall(false)} />}
    </>
  );
}

// ── RegisterView ──────────────────────────────────────────
function RegisterView({ email, setEmail, password, setPassword, registerName, setRegisterName, error, loading, onBack, onShowInstall }) {
  const { signUpWithEmail } = useAuth();
  const [localErr, setLocalErr] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr('');
    if (!registerName.trim()) { setLocalErr('Ingresa tu nombre'); return; }
    if (password.length < 6) { setLocalErr('La contraseña debe tener al menos 6 caracteres'); return; }
    setLocalLoading(true);
    const { error: err } = await signUpWithEmail(email, password, registerName.trim());
    if (err) setLocalErr(err.message);
    setLocalLoading(false);
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-content">
        <div className="auth-logo"><img src={kimoIcon} alt="KIMO" className="auth-logo-img" /></div>
        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Registra tu cuenta para empezar</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input label="Tu nombre" placeholder="¿Cómo te llamas?"
            value={registerName} onChange={(e) => setRegisterName(e.target.value)} autoFocus />
          <Input label="Email" type="email" placeholder="tu@email.com"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Contraseña" type="password" placeholder="Mínimo 6 caracteres"
            value={password} onChange={(e) => setPassword(e.target.value)} />
          {(localErr || error) && <p className="auth-error">{localErr || error}</p>}
          <Button type="submit" loading={localLoading || loading}>Crear cuenta</Button>
        </form>

        <button className="auth-switch" onClick={onBack}>
          ¿Ya tienes cuenta? <strong>Inicia sesión</strong>
        </button>

        <DownloadBanner onClick={onShowInstall} />
      </div>
    </div>
  );
}
