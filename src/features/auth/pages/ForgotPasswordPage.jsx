import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../../../shared/components/Button/Button';
import Input from '../../../shared/components/Input/Input';
import kimoIcon from '../../../assets/icono.png';
import './AuthPages.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPasswordForEmail } = useAuth();
  
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico');
      return;
    }
    setError('');
    setLoading(true);

    const redirectTo = `${window.location.origin}/actualizar-password`;
    const { error: err } = await resetPasswordForEmail(email, redirectTo);

    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-content">
        <div className="auth-logo">
          <img src={kimoIcon} alt="KIMO" className="auth-logo-img" />
        </div>
        <h1 className="auth-title">Recuperar contraseña</h1>

        {!success ? (
          <>
            <p className="auth-subtitle">
              Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para restablecerla.
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <Input 
                label="Email" 
                type="email" 
                placeholder="tu@email.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                autoFocus 
              />
              
              {error && <p className="auth-error">{error}</p>}
              
              <Button type="submit" loading={loading}>
                Enviar enlace de recuperación
              </Button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-subtitle" style={{ color: 'var(--color-success)', marginBottom: '1.5rem' }}>
              ✓ ¡Enlace enviado! Revisa tu bandeja de entrada o la carpeta de spam para continuar.
            </p>
          </>
        )}

        <button className="auth-switch" onClick={() => navigate('/login')} style={{ marginTop: '1rem' }}>
          Volver a <strong>Iniciar sesión</strong>
        </button>
      </div>
    </div>
  );
}
