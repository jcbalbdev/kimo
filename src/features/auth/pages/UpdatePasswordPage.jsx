import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../../../shared/components/Button/Button';
import Input from '../../../shared/components/Input/Input';
import kimoIcon from '../../../assets/icono.png';
import './AuthPages.css';
import { supabase } from '../../../lib/supabase';

export default function UpdatePasswordPage() {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // When the user clicks the email link, Supabase will parse the URL hash and log the user in temporarily.
    // We should wait briefly to ensure the session is active before allowing a password update.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Just in case, listen for the event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            setCheckingSession(false);
            subscription.unsubscribe();
          }
        });
        
        // Timeout after 3 seconds if no session is captured
        setTimeout(() => {
          setCheckingSession(false);
        }, 3000);
      } else {
        setCheckingSession(false);
      }
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError('Por favor, rellena todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setError('');
    setLoading(true);

    const { error: err } = await updatePassword(password);

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      // Success: redirect to home or login
      navigate('/hogares', { replace: true });
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-content">
        <div className="auth-logo">
          <img src={kimoIcon} alt="KIMO" className="auth-logo-img" />
        </div>
        <h1 className="auth-title">Crear nueva contraseña</h1>
        <p className="auth-subtitle">Ingresa la nueva contraseña para tu cuenta.</p>

        {checkingSession ? (
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>Verificando enlace...</p>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <Input 
              label="Nueva contraseña" 
              type="password" 
              placeholder="Mínimo 6 caracteres"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              autoFocus 
            />
            
            <Input 
              label="Confirmar nueva contraseña" 
              type="password" 
              placeholder="Mínimo 6 caracteres"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
            
            {error && <p className="auth-error">{error}</p>}
            
            <Button type="submit" loading={loading}>
              Actualizar contraseña
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
