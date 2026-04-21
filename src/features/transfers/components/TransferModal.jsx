import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPetImg } from '../../../shared/utils/petAvatars';
import { TransferIcon, HomeIcon } from '../../../shared/components/Icons';
import './Transfer.css';

/**
 * Modal that appears when someone wants to transfer a pet to the current user.
 * Shows pet info, the sender's household, and lets the user choose a destination household.
 */
export default function TransferModal({
  transfer,
  households = [],
  onAccept,
  onDecline,
  accepting = false,
}) {
  const navigate = useNavigate();
  const [selectedHH, setSelectedHH] = useState(null);
  const [step, setStep] = useState('info'); // 'info' | 'select-household' | 'success'

  if (!transfer) return null;

  const pet = transfer.pets;
  const sender = transfer.from_household;
  const initiator = transfer.initiator;

  const handleAccept = () => {
    if (households.length === 0) {
      // No households — redirect to create one
      navigate('/hogares');
      return;
    }
    if (households.length === 1) {
      // Only one household — auto-select
      setSelectedHH(households[0]);
      setStep('select-household');
      return;
    }
    setStep('select-household');
  };

  const handleConfirmAccept = async () => {
    if (!selectedHH) return;
    const { error } = await onAccept(transfer.id, selectedHH.id);
    if (!error) setStep('success');
  };

  return (
    <div className="transfer-modal-overlay">
      <div className="transfer-modal">

        {/* ── Step 1: Info ── */}
        {step === 'info' && (
          <>
            <div className="transfer-modal-icon">
              <TransferIcon size={28} />
            </div>
            <p className="transfer-modal-label">Solicitud de traslado</p>

            {/* Pet preview */}
            {pet && (
              <div className="transfer-modal-pet">
                <img src={getPetImg(pet)} alt={pet.name} className="transfer-modal-pet-img" />
                <span className="transfer-modal-pet-name">{pet.name}</span>
              </div>
            )}

            <p className="transfer-modal-desc">
              <strong>{initiator?.display_name || sender?.name}</strong> quiere
              transferirte a <strong>{pet?.name}</strong>
              {sender?.name && <> desde el hogar <strong>{sender.name}</strong></>}.
              Recibirás toda su información médica y registros.
            </p>

            {households.length === 0 && (
              <p className="transfer-modal-warning">
                ⚠️ No tienes ningún hogar creado. Primero debes crear uno para recibir a {pet?.name}.
              </p>
            )}

            <div className="transfer-modal-actions">
              <button className="transfer-modal-decline" onClick={() => onDecline(transfer.id)} disabled={accepting}>
                Rechazar
              </button>
              <button className="transfer-modal-accept" onClick={handleAccept} disabled={accepting}>
                {households.length === 0 ? 'Crear hogar →' : 'Aceptar traslado →'}
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: Select household ── */}
        {step === 'select-household' && (
          <>
            <h3 className="transfer-modal-select-title">
              ¿En cuál hogar quieres ubicar a {pet?.name}?
            </h3>

            <div className="transfer-hh-list">
              {households.map((hh) => (
                <button
                  key={hh.id}
                  className={`transfer-hh-item ${selectedHH?.id === hh.id ? 'transfer-hh-active' : ''}`}
                  onClick={() => setSelectedHH(hh)}
                >
                  <div className="transfer-hh-icon"><HomeIcon size={18} /></div>
                  <span className="transfer-hh-name">{hh.name}</span>
                  {hh.type === 'organization' && <span className="transfer-hh-badge">Organización</span>}
                </button>
              ))}
            </div>

            <div className="transfer-modal-actions">
              <button className="transfer-modal-decline" onClick={() => setStep('info')}>
                ← Atrás
              </button>
              <button
                className="transfer-modal-accept"
                onClick={handleConfirmAccept}
                disabled={!selectedHH || accepting}
              >
                {accepting ? 'Trasladando…' : `Confirmar traslado`}
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Success ── */}
        {step === 'success' && (
          <div className="transfer-step transfer-step-success">
            <div className="transfer-success-icon transfer-success-big">🎉</div>
            <h3 className="transfer-success-title">
              ¡{pet?.name} ahora es parte de {selectedHH?.name}!
            </h3>
            <p className="transfer-success-desc">
              Toda la información médica, vacunas y registros fueron trasladados exitosamente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
