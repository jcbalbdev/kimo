import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { useInvitations, isInviteToken } from '../hooks/useInvitations';
import kimoIcon from '../../../assets/icono.png';
import './HouseholdPages.css';

const JOIN_TOKEN_KEY = 'kimo_join_token';

export default function JoinHouseholdPage() {
  const { code } = useParams();
  const navigate  = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { joinHousehold, selectHousehold } = useHousehold();
  const { getInvitationByToken, acceptInvitation, declineInvitation } = useInvitations();

  const [invitation, setInvitation]   = useState(null);  // for token flow
  const [status,     setStatus]       = useState('idle'); // idle | loading | done | error | declined | not_found | already_used
  const [err,        setErr]          = useState('');

  const isToken = isInviteToken(code);

  // ── Step 1: if not authenticated, store token/code and redirect to login ──
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      localStorage.setItem(JOIN_TOKEN_KEY, code || '');
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, code, navigate]);

  // ── Step 2: once authenticated, load invitation info ──
  useEffect(() => {
    if (authLoading || !isAuthenticated || !code) return;

    if (isToken) {
      // New token-based flow
      (async () => {
        setStatus('loading');
        const { data, error } = await getInvitationByToken(code);
        if (error || !data) {
          setStatus('not_found');
          return;
        }
        if (data.status !== 'pending') {
          setStatus('already_used');
          return;
        }
        setInvitation(data);
        setStatus('idle');
      })();
    }
    // Old invite_code flow is handled inline in handleOldJoin
  }, [authLoading, isAuthenticated, code, isToken]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAccept = async () => {
    setStatus('loading');
    const { error } = await acceptInvitation(invitation.id, invitation.households.id);
    if (error) {
      setErr(error.message);
      setStatus('error');
      return;
    }
    // Clear any stored token
    localStorage.removeItem(JOIN_TOKEN_KEY);
    setStatus('done');
    setTimeout(() => navigate('/hogares', { replace: true }), 1500);
  };

  const handleDecline = async () => {
    await declineInvitation(invitation.id);
    localStorage.removeItem(JOIN_TOKEN_KEY);
    setStatus('declined');
    setTimeout(() => navigate('/hogares', { replace: true }), 1500);
  };

  const handleOldJoin = async () => {
    setStatus('loading');
    const { data, error } = await joinHousehold(code);
    if (error) {
      setErr(error);
      setStatus('error');
      return;
    }
    localStorage.removeItem(JOIN_TOKEN_KEY);
    setStatus('done');
    setTimeout(() => navigate('/hogares', { replace: true }), 1500);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (authLoading || status === 'loading') {
    return (
      <div className="auth-page">
        <div className="auth-content">
          <div className="auth-logo">
            <img src={kimoIcon} alt="KIMO" className="auth-logo-img" />
          </div>
          <p className="auth-subtitle">Cargando invitación…</p>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (status === 'done') {
    return (
      <div className="auth-page animate-fade-in">
        <div className="auth-content join-success">
          <div className="join-success-icon">✓</div>
          <h1 className="auth-title">¡Bienvenido!</h1>
          <p className="auth-subtitle">
            Ya formas parte de <strong>{invitation?.households?.name}</strong>.<br />
            Redirigiendo…
          </p>
        </div>
      </div>
    );
  }

  // ── Declined ──────────────────────────────────────────────────────────────
  if (status === 'declined') {
    return (
      <div className="auth-page animate-fade-in">
        <div className="auth-content">
          <h1 className="auth-title">Invitación rechazada</h1>
          <p className="auth-subtitle">No pasa nada. Puedes cerrar esta ventana.</p>
        </div>
      </div>
    );
  }

  // ── Not found / already used ──────────────────────────────────────────────
  if (status === 'not_found' || status === 'already_used') {
    return (
      <div className="auth-page animate-fade-in">
        <div className="auth-content">
          <h1 className="auth-title">
            {status === 'already_used' ? 'Invitación ya usada' : 'Invitación no válida'}
          </h1>
          <p className="auth-subtitle">
            {status === 'already_used'
              ? 'Esta invitación ya fue aceptada o rechazada.'
              : 'El link de invitación no es válido o expiró.'}
          </p>
          <button className="join-back-btn" onClick={() => navigate('/hogares', { replace: true })}>
            Ir a mis hogares
          </button>
        </div>
      </div>
    );
  }

  // ── Token-based invitation card ───────────────────────────────────────────
  if (isToken && invitation) {
    return (
      <div className="auth-page animate-fade-in">
        <div className="auth-content">
          <div className="auth-logo">
            <img src={kimoIcon} alt="KIMO" className="auth-logo-img" />
          </div>

          <div className="join-inv-card">
            <div className="join-inv-home-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <h2 className="join-inv-hh-name">{invitation.households?.name}</h2>
            <p className="join-inv-sub">
              <strong>{invitation.inviter?.display_name}</strong> te invitó a unirse a este hogar.
              Podrás co-gestionar las mascotas junto a los demás miembros.
            </p>
          </div>

          {err && <p className="auth-error">{err}</p>}

          <div className="join-inv-actions">
            <button className="join-decline-btn" onClick={handleDecline}>
              Rechazar
            </button>
            <button className="join-accept-btn" onClick={handleAccept}>
              Unirme al hogar →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Legacy invite_code flow ───────────────────────────────────────────────
  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-content">
        <div className="auth-logo">
          <img src={kimoIcon} alt="KIMO" className="auth-logo-img" />
        </div>
        <h1 className="auth-title">Unirse al hogar</h1>
        <p className="auth-subtitle">
          Te invitaron a un hogar en KIMO. Únete para compartir el cuidado de sus mascotas.
        </p>

        {err && <p className="auth-error">{err}</p>}

        <div className="join-inv-actions">
          <button className="join-decline-btn" onClick={() => navigate('/hogares')}>
            Cancelar
          </button>
          <button className="join-accept-btn" onClick={handleOldJoin}>
            Unirme al hogar →
          </button>
        </div>
      </div>
    </div>
  );
}
