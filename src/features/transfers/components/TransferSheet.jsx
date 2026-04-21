import { useState } from 'react';
import FormSheet from '../../../shared/components/FormSheet/FormSheet';
import { getPetImg } from '../../../shared/utils/petAvatars';
import { TransferIcon } from '../../../shared/components/Icons';
import './Transfer.css';

/**
 * Full-screen sheet for initiating a pet transfer.
 * Step 1: Select pet → Step 2: Enter recipient email → Step 3: Confirmation.
 */
export default function TransferSheet({
  isOpen,
  onClose,
  pets,
  householdId,
  householdName,
  onInitiateTransfer,
  outgoingTransfers = [],
  onCancelTransfer,
}) {
  const [step, setStep] = useState(1);         // 1 = select pet, 2 = code, 3 = done
  const [selectedPet, setSelectedPet] = useState(null);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const reset = () => {
    setStep(1);
    setSelectedPet(null);
    setCode('');
    setMessage('');
    setSending(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectPet = (pet) => {
    setSelectedPet(pet);
    setStep(2);
  };

  const handleSend = async () => {
    if (!code.trim() || !selectedPet) return;
    setSending(true);
    setMessage('');

    const { error, alreadySent } = await onInitiateTransfer(
      selectedPet.id,
      householdId,
      code.trim()
    );

    setSending(false);

    if (alreadySent) {
      setMessage('⚠️ Ya enviaste un traslado pendiente de esta mascota a este usuario.');
      return;
    }
    if (error) {
      setMessage(`❌ ${error?.message || JSON.stringify(error)}`);
      return;
    }

    setStep(3);
  };

  if (!isOpen) return null;

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={handleClose}
      title="Trasladar mascota"
    >
      {/* ── Step 1: Select pet ── */}
      {step === 1 && (
        <div className="transfer-step">
          <p className="transfer-step-desc">
            Selecciona la mascota que deseas trasladar desde <strong>{householdName}</strong>
          </p>

          <div className="transfer-pet-grid">
            {pets.map((pet) => (
              <button
                key={pet.id}
                className="transfer-pet-card"
                onClick={() => handleSelectPet(pet)}
              >
                <img src={getPetImg(pet)} alt={pet.name} className="transfer-pet-img" />
                <span className="transfer-pet-name">{pet.name}</span>
              </button>
            ))}
          </div>

          {pets.length === 0 && (
            <p className="transfer-empty">Este hogar no tiene mascotas para trasladar.</p>
          )}
        </div>
      )}

      {/* ── Step 2: Enter email ── */}
      {step === 2 && selectedPet && (
        <div className="transfer-step">
          <div className="transfer-selected-pet">
            <img src={getPetImg(selectedPet)} alt={selectedPet.name} className="transfer-selected-img" />
            <span className="transfer-selected-name">{selectedPet.name}</span>
          </div>

          <p className="transfer-step-desc">
            Ingresa el código KIMO del receptor.
          </p>

          <label className="tab-sheet-label">Código KIMO del receptor</label>
          <input
            className="tab-sheet-input"
            type="text"
            placeholder="ej: A3F7K2"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            autoFocus
            maxLength={6}
            style={{ letterSpacing: '3px', fontWeight: 700, fontSize: '18px', textAlign: 'center' }}
          />

          {message && <p className="transfer-msg">{message}</p>}

          <div className="transfer-actions">
            <button className="transfer-btn-secondary" onClick={() => { setStep(1); setMessage(''); }}>
              ← Cambiar mascota
            </button>
            <button
              className="transfer-btn-primary"
              onClick={handleSend}
              disabled={sending || !code.trim()}
            >
              {sending ? 'Verificando…' : 'Enviar solicitud'}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirmation ── */}
      {step === 3 && (
        <div className="transfer-step transfer-step-success">
          <div className="transfer-success-icon">
            <TransferIcon size={32} />
          </div>
          <h3 className="transfer-success-title">¡Solicitud enviada!</h3>
          <p className="transfer-success-desc">
            La solicitud de traslado de <strong>{selectedPet?.name}</strong> fue enviada.
            Te notificaremos cuando responda.
          </p>
          <button className="transfer-btn-primary" onClick={handleClose}>
            Entendido
          </button>
        </div>
      )}

      {/* ── Outgoing transfers (pending) ── */}
      {outgoingTransfers.length > 0 && step === 1 && (
        <div className="transfer-outgoing">
          <h4 className="transfer-outgoing-title">Traslados pendientes</h4>
          {outgoingTransfers.map((t) => (
            <div key={t.id} className="transfer-outgoing-item">
              <div className="transfer-outgoing-info">
                <span className="transfer-outgoing-pet">{t.pets?.name}</span>
                <span className="transfer-outgoing-email">→ {t.to_email}</span>
                <span className={`transfer-outgoing-status transfer-status-${t.status}`}>
                  {t.status === 'pending' ? 'Pendiente' : 'Aceptado ✓'}
                </span>
              </div>
              {t.status === 'pending' && (
                <button
                  className="transfer-outgoing-cancel"
                  onClick={() => onCancelTransfer(t.id)}
                >
                  Cancelar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </FormSheet>
  );
}
