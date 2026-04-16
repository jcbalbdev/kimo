import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../../../shared/components/Button/Button';
import Input from '../../../shared/components/Input/Input';
import kimoIcon from '../../../assets/icono.png';
import './AuthPages.css';

export default function LoginPage() {
  const { signInWithEmail, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState('');

  // Si ya está autenticado, verificar si hay un token de invitación pendiente
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!registerName.trim()) {
      setError('Ingresa tu nombre');
      return;
    }
    setLoading(true);
    const { signUpWithEmail } = useAuth;
    // We access signUpWithEmail from the hook
    const { error: err } = await signUpWithEmail(email, password, registerName.trim());
    if (err) setError(err.message);
    else setError('');
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    const { error: err } = await signInWithGoogle();
    if (err) setError(err.message);
  };

  if (showRegister) {
    return <RegisterView
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      registerName={registerName}
      setRegisterName={setRegisterName}
      error={error}
      loading={loading}
      onBack={() => setShowRegister(false)}
      onGoogle={handleGoogle}
    />;
  }

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-content">
        <div className="auth-logo">
          <img src={kimoIcon} alt="KIMO" className="auth-logo-img" />
        </div>
        <h1 className="auth-title">KIMO</h1>
        <p className="auth-subtitle">Inicia sesión para continuar</p>

        <form className="auth-form" onSubmit={handleEmailLogin}>
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="auth-error">{error}</p>}

          <Button type="submit" loading={loading}>
            Iniciar sesión
          </Button>
        </form>

        <button className="auth-switch" onClick={() => setShowRegister(true)}>
          ¿No tienes cuenta? <strong>Regístrate</strong>
        </button>
      </div>
    </div>
  );
}

function RegisterView({ email, setEmail, password, setPassword, registerName, setRegisterName, error, loading, onBack, onGoogle }) {
  const { signUpWithEmail } = useAuth();
  const [localErr, setLocalErr] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalErr('');
    if (!registerName.trim()) { setLocalErr('Ingresa tu nombre'); return; }
    if (password.length < 6) { setLocalErr('La contraseña debe tener al menos 6 caracteres'); return; }

    setLocalLoading(true);
    const { data, error: err } = await signUpWithEmail(email, password, registerName.trim());
    if (err) {
      setLocalErr(err.message);
    }
    setLocalLoading(false);
    // Si no hay error, el AuthProvider detectará la sesión y LoginPage redirigirá
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-content">
        <div className="auth-logo"><img src={kimoIcon} alt="KIMO" className="auth-logo-img" /></div>
        <h1 className="auth-title">Crear cuenta</h1>
        <p className="auth-subtitle">Registra tu cuenta para empezar</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="Tu nombre"
            placeholder="¿Cómo te llamas?"
            value={registerName}
            onChange={(e) => setRegisterName(e.target.value)}
            autoFocus
          />
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {(localErr || error) && <p className="auth-error">{localErr || error}</p>}

          <Button type="submit" loading={localLoading || loading}>
            Crear cuenta
          </Button>
        </form>

        <button className="auth-switch" onClick={onBack}>
          ¿Ya tienes cuenta? <strong>Inicia sesión</strong>
        </button>
      </div>
    </div>
  );
}
