import { useState } from 'react';
import { useHousehold } from '../hooks/useHousehold';
import { useAuth } from '../../auth/hooks/useAuth';
import { useToast } from '../../../shared/hooks/useToast';
import Card from '../../../shared/components/Card/Card';
import Button from '../../../shared/components/Button/Button';
import Input from '../../../shared/components/Input/Input';
import Modal from '../../../shared/components/Modal/Modal';
import './HouseholdPages.css';

export default function HouseholdPage() {
  const { currentHousehold, members, getInviteUrl, leaveHousehold } = useHousehold();
  const { user, signOut } = useAuth();
  const { addToast } = useToast();
  const [showInvite, setShowInvite] = useState(false);
  const [showLeave, setShowLeave] = useState(false);

  if (!currentHousehold) return null;

  const inviteUrl = getInviteUrl();

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      addToast('¡Link copiado! Envíalo por WhatsApp 📋', 'success');
    } catch {
      addToast('No se pudo copiar. Copia el link manualmente.', 'warning');
    }
  };

  const handleLeave = async () => {
    await leaveHousehold(currentHousehold.id);
    setShowLeave(false);
    addToast('Saliste del hogar', 'warning');
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">{currentHousehold.name}</h1>
        <p className="page-subtitle">Tu hogar compartido</p>
      </div>

      {/* Invite section */}
      <section className="hh-section">
        <Card interactive onClick={() => setShowInvite(true)} className="hh-invite-card">
          <div className="hh-invite-content">
            <span className="hh-invite-icon">🔗</span>
            <div>
              <span className="hh-invite-title">Invitar cuidador</span>
              <span className="hh-invite-sub">Comparte el enlace por WhatsApp</span>
            </div>
            <span className="hh-invite-arrow">→</span>
          </div>
        </Card>
      </section>

      {/* Members */}
      <section className="hh-section">
        <h3 className="section-label">Miembros ({members.length})</h3>
        <div className="ios-group">
          {members.map((member) => (
            <div key={member.id} className="ios-group-item">
              <span className="hh-member-avatar">{member.avatar_emoji}</span>
              <div className="hh-member-info">
                <span className="hh-member-name">
                  {member.display_name}
                  {member.id === user?.id && <span className="hh-member-you"> (tú)</span>}
                </span>
                <span className="hh-member-role">
                  {member.role === 'owner' ? 'Creador' : 'Miembro'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <section className="hh-section hh-actions">
        <Button variant="ghost" onClick={() => setShowLeave(true)} className="hh-leave-btn">
          Salir del hogar
        </Button>
        <Button variant="ghost" onClick={signOut} className="hh-logout-btn">
          Cerrar sesión
        </Button>
      </section>

      {/* Invite modal */}
      <Modal isOpen={showInvite} onClose={() => setShowInvite(false)} title="Invitar cuidador">
        <div className="hh-invite-modal">
          <p className="hh-invite-desc">
            Comparte este enlace con tu pareja, roommate o familiar para que pueda
            ver y editar las mascotas de este hogar.
          </p>
          <div className="hh-invite-url-box">
            <span className="hh-invite-url">{inviteUrl}</span>
          </div>
          <Button onClick={copyInvite}>
            📋 Copiar enlace
          </Button>
          <p className="hh-invite-hint">
            Pega el enlace en WhatsApp, Telegram o donde prefieras
          </p>
        </div>
      </Modal>

      {/* Leave confirm */}
      <Modal isOpen={showLeave} onClose={() => setShowLeave(false)} title="¿Salir del hogar?">
        <div className="hh-leave-modal">
          <p>Ya no podrás ver ni editar las mascotas de "{currentHousehold.name}".</p>
          <div className="hh-leave-actions">
            <Button variant="secondary" onClick={() => setShowLeave(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleLeave}>Sí, salir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
