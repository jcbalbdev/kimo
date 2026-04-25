/**
 * HogarDetailSheet
 * Bottom sheet con el detalle de un hogar (mascotas, miembros, acciones).
 * Extraído de HogaresPage para mantener el JSX aislado.
 */

import { useNavigate } from 'react-router-dom';
import { getPetImg } from '../../../shared/utils/petAvatars';
import {
  HomeIcon, EditIcon, TrashIcon, PawIcon,
  CheckIcon, OwnerIcon, MemberIcon, BuildingIcon,
} from '../../../shared/components/Icons';

function MemberAvatar({ name }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  return <div className="hd-member-avatar">{initial}</div>;
}

export default function HogarDetailSheet({
  household,
  detailData,
  detailLoading,
  isOwner,
  userId,
  // Name editing
  editingName, editNameVal, savingName, nameErr,
  onStartEditName, onEditNameChange, onSaveName, onCancelEditName,
  // Delete household
  confirmDelete, deleting,
  onConfirmDelete, onCancelDelete, onDeleteHousehold,
  // Remove member
  removingMemberId,
  onStartRemoveMember, onCancelRemoveMember, onRemoveMember,
  // Pet actions
  focusedPet, removingPetId, deletingPet,
  onFocusPet, onStartRemovePet, onCancelRemovePet, onDeletePet,
  // Directory profile
  onOpenDirProfile,
  // Drag / dismiss
  sheetDragY, isDragging,
  onHandlePointerDown, onHandlePointerMove, onHandlePointerUp,
  onClose,
}) {
  const navigate = useNavigate();
  if (!household) return null;

  return (
    <>
      {/* Pet detail overlay */}
      {focusedPet && (
        <div className="hd-pet-overlay" onClick={() => onFocusPet(null)}>
          <div className="hd-pet-overlay-card" onClick={(e) => e.stopPropagation()}>
            <img
              src={getPetImg(focusedPet)}
              alt={focusedPet.name}
              className={`hd-pet-overlay-img${focusedPet.photo_url ? ' hd-pet-overlay-img--photo' : ''}`}
            />
            <p className="hd-pet-overlay-name">{focusedPet.name}</p>
            {isOwner && (
              removingPetId === focusedPet.id ? (
                <div className="hd-pet-overlay-confirm">
                  <p className="hd-pet-overlay-confirm-text">¿Eliminar a {focusedPet.name} y todos sus datos?</p>
                  <div className="hd-pet-overlay-confirm-actions">
                    <button className="hd-delete-cancel-btn" onClick={onCancelRemovePet} disabled={deletingPet}>
                      Cancelar
                    </button>
                    <button className="hd-delete-yes-btn" onClick={() => onDeletePet(focusedPet.id)} disabled={deletingPet}>
                      {deletingPet ? 'Eliminando…' : 'Sí, eliminar'}
                    </button>
                  </div>
                </div>
              ) : (
                <button className="hd-pet-overlay-delete-btn" onClick={() => onStartRemovePet(focusedPet.id)}>
                  <TrashIcon size={15} /> Eliminar mascota
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* Sheet overlay */}
      <div className="hogares-sheet-overlay" onClick={onClose}>
        <div
          className="hogares-sheet hd-sheet"
          style={{
            transform: `translateY(${sheetDragY}px)`,
            transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)',
            willChange: 'transform',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Swipeable handle */}
          <div
            className="hd-swipe-handle"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
          />

          {/* Header */}
          <div className="hd-header">
            <div className="hd-header-icon">
              <HomeIcon size={20} color="white" />
            </div>
            <div className="hd-header-info">
              {editingName ? (
                <div className="hd-name-edit-row">
                  <input
                    className="hd-name-input"
                    value={editNameVal}
                    onChange={(e) => onEditNameChange(e.target.value)}
                    autoFocus maxLength={40}
                    onKeyDown={(e) => e.key === 'Enter' && onSaveName()}
                  />
                  <button className="hd-name-save" onClick={onSaveName} disabled={savingName}>
                    {savingName ? '…' : <CheckIcon />}
                  </button>
                  <button className="hd-name-cancel" onClick={onCancelEditName}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="hd-name-row">
                  <h3 className="hd-title">{household.name}</h3>
                  {isOwner && (
                    <button className="hd-edit-name-btn" onClick={onStartEditName} title="Editar nombre">
                      <EditIcon />
                    </button>
                  )}
                </div>
              )}
              {nameErr && <p className="hd-error">{nameErr}</p>}
              <span className={`hd-role-badge${isOwner ? ' hd-role-badge--owner' : ' hd-role-badge--member'}`}>
                {isOwner ? <OwnerIcon /> : <MemberIcon />}
                {isOwner ? 'Creador del hogar' : 'Invitado'}
              </span>
            </div>
          </div>

          {/* Body */}
          {detailLoading ? (
            <div className="hd-loading">Cargando información…</div>
          ) : detailData ? (
            <div className="hd-body">

              {/* Mascotas */}
              <div className="hd-section">
                <p className="hd-section-title">
                  <PawIcon /> Mascotas ({detailData.pets.length})
                </p>
                {detailData.pets.length === 0 && !isOwner ? (
                  <p className="hd-empty">Sin mascotas en este hogar</p>
                ) : (
                  <div className="hd-pets-grid">
                    {isOwner && (
                      <button
                        className="hd-pet-add-btn"
                        onClick={() => { onClose(); navigate('/onboarding/especie'); }}
                        title="Agregar mascota"
                      >
                        <span className="hd-pet-add-icon">+</span>
                        <span className="hd-pet-name-pill">Agregar</span>
                      </button>
                    )}
                    {detailData.pets.map((pet) => (
                      <button
                        key={pet.id}
                        className="hd-pet-avatar-btn"
                        onClick={() => { onFocusPet(pet); onCancelRemovePet(); }}
                      >
                        <img
                          src={getPetImg(pet)}
                          alt={pet.name}
                          className={`hd-pet-avatar-img${pet.photo_url ? ' hd-pet-avatar-img--photo' : ''}`}
                        />
                        <span className="hd-pet-name-pill">{pet.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Miembros */}
              <div className="hd-section">
                <p className="hd-section-title">👥 Miembros ({detailData.members.length})</p>
                <div className="hd-members-list">
                  {detailData.members.map((m) => {
                    const isMe = m.id === userId;
                    const isCreator = m.role === 'owner';
                    const isConfirmingRemove = removingMemberId === m.memberId;
                    return (
                      <div key={m.memberId} className="hd-member-row">
                        <MemberAvatar name={m.display_name} />
                        <div className="hd-member-info">
                          <span className="hd-member-name">
                            {m.display_name || 'Sin nombre'}
                            {isMe && <span className="hd-me-tag"> (tú)</span>}
                          </span>
                          <span className={`hd-member-role-pill${isCreator ? ' hd-member-role-pill--owner' : ' hd-member-role-pill--member'}`}>
                            {isCreator ? <OwnerIcon /> : <MemberIcon />}
                            {isCreator ? 'Creador del hogar' : 'Invitado'}
                          </span>
                        </div>
                        {isOwner && !isMe && (
                          isConfirmingRemove ? (
                            <div className="hd-remove-confirm">
                              <span className="hd-remove-confirm-text">¿Eliminar?</span>
                              <button className="hd-remove-yes" onClick={() => onRemoveMember(m.memberId)}>Sí</button>
                              <button className="hd-remove-no" onClick={onCancelRemoveMember}>No</button>
                            </div>
                          ) : (
                            <button
                              className="hd-remove-member-btn"
                              onClick={() => onStartRemoveMember(m.memberId)}
                              title="Eliminar miembro"
                            >
                              <TrashIcon size={14} />
                            </button>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notificaciones */}
              <button
                className="hd-notif-btn"
                onClick={() => {
                  onClose();
                  navigate('/notificaciones', { state: { householdId: household.id, householdName: household.name } });
                }}
              >
                <span className="hd-notif-btn-left">
                  <span className="hd-notif-icon">🔔</span>
                  <span className="hd-notif-label">Notificaciones del hogar</span>
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Directory profile (org owners only) */}
              {isOwner && household.type === 'organization' && (
                <button className="hd-dir-profile-btn" onClick={onOpenDirProfile}>
                  <BuildingIcon size={16} />
                  Editar perfil de vitrina
                </button>
              )}

              {/* Danger zone */}
              {isOwner && (
                <div className="hd-danger-zone">
                  {confirmDelete ? (
                    <div className="hd-delete-confirm">
                      <p className="hd-delete-confirm-text">
                        ¿Seguro que quieres eliminar <strong>{household.name}</strong>?{' '}
                        Se borrarán todas las mascotas y datos asociados.
                      </p>
                      <div className="hd-delete-confirm-actions">
                        <button className="hd-delete-cancel-btn" onClick={onCancelDelete} disabled={deleting}>
                          Cancelar
                        </button>
                        <button className="hd-delete-yes-btn" onClick={onDeleteHousehold} disabled={deleting}>
                          {deleting ? 'Eliminando…' : '🗑 Sí, eliminar'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="hd-delete-btn" onClick={onConfirmDelete}>
                      <TrashIcon size={16} /> Eliminar hogar
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
