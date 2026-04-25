/**
 * InviteSheet
 * Bottom sheet para invitar miembros a un hogar.
 * Extraído de HogaresPage para aislar su lógica y JSX.
 */

import { CopyIcon, InfoIcon } from '../../../shared/components/Icons';

export default function InviteSheet({
  household,
  inviteCode,
  onCodeChange,
  inviting,
  onInviteByCode,
  inviteMsg,
  generatedLink,
  generatingLink,
  onGenerateLink,
  copied,
  onCopyLink,
  activeTip,
  onToggleTip,
  onClose,
}) {
  if (!household) return null;

  return (
    <div className="hogares-sheet-overlay" onClick={onClose}>
      <div
        className="hogares-sheet hogares-invite-sheet"
        onClick={(e) => { e.stopPropagation(); onToggleTip(null); }}
      >
        <div className="hogares-sheet-handle" />
        <h3 className="hogares-sheet-title">Invitar a {household.name}</h3>

        {/* Invite by KIMO code */}
        <div className="hogares-invite-label-row">
          <p className="hogares-invite-section-label">Código KIMO del usuario</p>
          <button
            className="hogares-invite-info-btn"
            onClick={(e) => { e.stopPropagation(); onToggleTip('email'); }}
            aria-label="Más información"
          >
            <InfoIcon />
          </button>
          {activeTip === 'email' && (
            <span className="hogares-invite-tip">Pídele su código KIMO al usuario. Lo encuentran en su perfil.</span>
          )}
        </div>
        <div className="hogares-invite-email-row">
          <input
            className="hogares-sheet-input hogares-invite-input"
            type="text"
            placeholder="ej: A3F7K2"
            value={inviteCode}
            onChange={(e) => onCodeChange(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ letterSpacing: '3px', fontWeight: 700, textAlign: 'center' }}
          />
          <button
            className="hogares-invite-send-btn"
            onClick={onInviteByCode}
            disabled={inviting || !inviteCode.trim()}
          >
            {inviting ? '…' : 'Invitar'}
          </button>
        </div>

        {inviteMsg && <p className="hogares-invite-msg">{inviteMsg}</p>}

        <div className="hogares-invite-divider">
          <div className="hogares-invite-divider-line" />
          <span>o</span>
          <div className="hogares-invite-divider-line" />
        </div>

        {/* No-account section */}
        <div className="hogares-invite-label-row">
          <p className="hogares-invite-section-label">Si no tiene cuenta</p>
          <button
            className="hogares-invite-info-btn"
            onClick={(e) => { e.stopPropagation(); onToggleTip('noAccount'); }}
            aria-label="Más información"
          >
            <InfoIcon />
          </button>
          {activeTip === 'noAccount' && (
            <span className="hogares-invite-tip">Invita a usar la app para gestionar hogares juntos</span>
          )}
        </div>
        {!generatedLink ? (
          <button
            className="hogares-invite-link-btn"
            onClick={onGenerateLink}
            disabled={generatingLink}
          >
            {generatingLink ? 'Generando…' : '🔗 Generar link de invitación'}
          </button>
        ) : (
          <div className="hogares-invite-link-box">
            <p className="hogares-invite-link-text">{generatedLink}</p>
            <button className="hogares-invite-copy-btn" onClick={onCopyLink}>
              {copied ? '✓ Copiado' : <><CopyIcon /> Copiar</>}
            </button>
          </div>
        )}

        <button
          className="hogares-sheet-cancel hogares-invite-close"
          onClick={onClose}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
