import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { useInvitations } from '../hooks/useInvitations';
import { useTransfers } from '../../transfers/hooks/useTransfers';
import { supabase } from '../../../lib/supabase';
import { getPetImg } from '../../../shared/utils/petAvatars';
import {
  HomeIcon, HomeDetailIcon, PlusIcon, UserPlusIcon, CopyIcon,
  EditIcon, TrashIcon, PawIcon, CheckIcon, OwnerIcon, MemberIcon,
  TransferIcon, BuildingIcon, InfoIcon,
} from '../../../shared/components/Icons';
import TransferSheet from '../../transfers/components/TransferSheet';
import TransferModal from '../../transfers/components/TransferModal';
import kimoIcon from '../../../assets/icono.png';
import COUNTRIES from '../../../shared/constants/countries';
import './HogaresPage.css';

// ── Member avatar placeholder ──────────────────────────────
const MemberAvatar = ({ name }) => {
  const initials = (name || '?').charAt(0).toUpperCase();
  return <div className="hd-member-avatar">{initials}</div>;
};

export default function HogaresPage() {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const {
    households, loading, createHousehold, selectHousehold, fetchHouseholds,
    deleteHousehold, updateHouseholdName, removeMember, getHouseholdDetail,
  } = useHousehold();
  const {
    pendingInvitations,
    inviteByCode,
    generateInviteLink,
    acceptInvitation,
    declineInvitation,
  } = useInvitations();
  const {
    incomingTransfers,
    outgoingTransfers,
    initiateTransfer,
    acceptTransfer,
    declineTransfer: declineTransferFn,
    cancelTransfer,
  } = useTransfers();

  const [householdPets, setHouseholdPets] = useState({});
  const [householdMemberCounts, setHouseholdMemberCounts] = useState({});
  
  // ── Transfer completed modal ──
  const [completedTransfer, setCompletedTransfer] = useState(null);
  const previousOutgoing = useRef(outgoingTransfers);

  useEffect(() => {
    if (outgoingTransfers && previousOutgoing.current) {
      const newlyAccepted = outgoingTransfers.find(t => 
        t.status === 'accepted' && 
        previousOutgoing.current.find(pt => pt.id === t.id && pt.status === 'pending')
      );
      if (newlyAccepted) {
        setCompletedTransfer(newlyAccepted);
        fetchHouseholds(true); // refresh pets count
      }
    }
    previousOutgoing.current = outgoingTransfers;
  }, [outgoingTransfers, fetchHouseholds]);

  // ── Create hogar ───────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('personal');
  const [newCountry, setNewCountry] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');

  const resetCreateForm = () => {
    setShowCreate(false); setNewName(''); setNewType('personal');
    setNewCountry(''); setNewPhone(''); setCreateErr('');
  };

  // ── Transfer sheet ────────────────────────────────────
  const [transferHH, setTransferHH] = useState(null);

  // ── Invite sheet ───────────────────────────────────────
  const [inviteHH, setInviteHH] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  // 'email' | 'noAccount' | null
  const [activeTip, setActiveTip] = useState(null);

  // ── Pending invitation ─────────────────────────────────
  const [currentInvIdx, setCurrentInvIdx] = useState(0);
  const [acceptingInv, setAcceptingInv] = useState(false);

  // ── Detail sheet ───────────────────────────────────────
  const [detailHH, setDetailHH] = useState(null);       // which household
  const [detailData, setDetailData] = useState(null);   // { members, pets }
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit name inline
  const [editingName, setEditingName] = useState(false);
  const [editNameVal, setEditNameVal] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameErr, setNameErr] = useState('');

  // Delete household confirm
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Remove member confirm
  const [removingMemberId, setRemovingMemberId] = useState(null);

  // Remove pet confirm
  const [removingPetId, setRemovingPetId] = useState(null);
  const [deletingPet, setDeletingPet] = useState(false);

  // Pet detail overlay (tap avatar)
  const [focusedPet, setFocusedPet] = useState(null);

  // ── Swipe-to-dismiss for detail sheet ─────────────────
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [closingSheet, setClosingSheet] = useState(false);
  const dragStart = useRef(null);

  const dismissDetail = useCallback(() => {
    setIsDragging(false);
    setClosingSheet(true);
    setSheetDragY(window.innerHeight);
    setTimeout(() => {
      setDetailHH(null); setDetailData(null); setConfirmDelete(false);
      setEditingName(false); setRemovingMemberId(null);
      setRemovingPetId(null); setFocusedPet(null);
      setClosingSheet(false); setSheetDragY(0);
    }, 320);
  }, []);

  const onHandlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = e.clientY;
    setIsDragging(true);
    setSheetDragY(0);
  };
  const onHandlePointerMove = (e) => {
    if (dragStart.current === null) return;
    setSheetDragY(Math.max(0, e.clientY - dragStart.current));
  };
  const onHandlePointerUp = () => {
    dragStart.current = null;
    setIsDragging(false);
    if (sheetDragY > 80) dismissDetail();
    else setSheetDragY(0);
  };

  // Load pets + member counts per household for the list — all in parallel
  useEffect(() => {
    async function fetchHouseholdData() {
      if (!households.length) return;
      const results = await Promise.all(
        households.map(async (hh) => {
          const [{ data: petData }, { data: memberCount }] = await Promise.all([
            supabase.from('pets').select('id, name, avatar_emoji, species').eq('household_id', hh.id),
            supabase.rpc('get_household_member_count', { p_household_id: hh.id }),
          ]);
          return { id: hh.id, pets: petData || [], memberCount: memberCount ?? 0 };
        })
      );
      const pets = {};
      const memberCounts = {};
      for (const r of results) {
        pets[r.id] = r.pets;
        memberCounts[r.id] = r.memberCount;
      }
      setHouseholdPets(pets);
      setHouseholdMemberCounts(memberCounts);
    }
    fetchHouseholdData();
  }, [households]);

  // ── Handlers ──────────────────────────────────────────
  const handleSelect = (hh) => { selectHousehold(hh); navigate('/'); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (newType === 'organization' && !newCountry) { setCreateErr('Selecciona un país'); return; }
    if (newType === 'organization' && !newPhone.trim()) { setCreateErr('El número de contacto es obligatorio'); return; }
    setCreating(true); setCreateErr('');

    const selectedCountry = COUNTRIES.find(c => c.code === newCountry);
    const fullPhone = selectedCountry ? `${selectedCountry.dial} ${newPhone.trim()}` : newPhone.trim();

    const { error: err } = await createHousehold(newName.trim(), newType, {
      country: selectedCountry?.name || null,
      contactPhone: fullPhone || null,
    });
    if (err) { setCreateErr(err); setCreating(false); }
    else { resetCreateForm(); setCreating(false); navigate('/onboarding/especie'); }
  };

  // ── Invite handlers ────────────────────────────────────
  const openInviteSheet = (hh) => {
    setInviteHH(hh); setInviteCode(''); setInviteMsg(''); setGeneratedLink(''); setCopied(false); setActiveTip(null);
  };
  const closeInviteSheet = () => { setInviteHH(null); setInviteMsg(''); setGeneratedLink(''); setActiveTip(null); };

  const handleInviteByCode = async () => {
    if (!inviteCode.trim()) return;
    setInviting(true); setInviteMsg('');
    const { error, alreadySent } = await inviteByCode(inviteHH.id, inviteCode.trim());
    setInviting(false);
    if (alreadySent) { setInviteMsg('⚠️ Ya enviaste una invitación pendiente a este usuario.'); return; }
    if (error) { setInviteMsg(`❌ ${error?.message || JSON.stringify(error)}`); return; }
    setInviteMsg('✅ ¡Invitación enviada!'); setInviteCode('');
  };

  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    const { link, error } = await generateInviteLink(inviteHH.id);
    setGeneratingLink(false);
    if (error || !link) { setInviteMsg('❌ Error al generar el link.'); return; }
    setGeneratedLink(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Pending invitation ─────────────────────────────────
  const handleAcceptInv = async (inv) => {
    setAcceptingInv(true);
    await acceptInvitation(inv.id, inv.households.id);
    await fetchHouseholds(true);
    setAcceptingInv(false); setCurrentInvIdx(0);
  };
  const handleDeclineInv = async (inv) => {
    await declineInvitation(inv.id); setCurrentInvIdx(0);
  };

  // ── Detail sheet ───────────────────────────────────────
  const openDetail = async (hh) => {
    setDetailHH(hh);
    setDetailData(null);
    setDetailLoading(true);
    setEditingName(false);
    setEditNameVal(hh.name);
    setConfirmDelete(false);
    setRemovingMemberId(null);
    setRemovingPetId(null);
    setFocusedPet(null);
    setSheetDragY(0);
    setClosingSheet(false);
    setNameErr('');
    const data = await getHouseholdDetail(hh.id);
    setDetailData(data);
    setDetailLoading(false);
  };

  const closeDetail = () => dismissDetail();

  const handleSaveName = async () => {
    if (!editNameVal.trim() || editNameVal.trim() === detailHH.name) { setEditingName(false); return; }
    setSavingName(true); setNameErr('');
    const { error } = await updateHouseholdName(detailHH.id, editNameVal.trim());
    setSavingName(false);
    if (error) { setNameErr(error); }
    else {
      setDetailHH((prev) => ({ ...prev, name: editNameVal.trim() }));
      setEditingName(false);
    }
  };

  const handleDeleteHousehold = async () => {
    setDeleting(true);
    const { error } = await deleteHousehold(detailHH.id);
    setDeleting(false);
    if (error) { setNameErr(error); setConfirmDelete(false); }
    else { closeDetail(); }
  };

  const handleRemoveMember = async (memberId) => {
    const { error } = await removeMember(detailHH.id, memberId);
    if (!error) {
      setDetailData((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.memberId !== memberId),
      }));
      setRemovingMemberId(null);
    }
  };

  const handleDeletePet = async (petId) => {
    setDeletingPet(true);
    const { error } = await supabase.from('pets').delete().eq('id', petId);
    setDeletingPet(false);
    if (!error) {
      // Close the pet overlay first
      setFocusedPet(null);
      setRemovingPetId(null);
      // Update the detail sheet pet list
      setDetailData((prev) => ({
        ...prev,
        pets: prev.pets.filter((p) => p.id !== petId),
      }));
      // Update the count chip in the background list immediately
      setHouseholdPets((prev) => ({
        ...prev,
        [detailHH.id]: (prev[detailHH.id] || []).filter((p) => p.id !== petId),
      }));
    }
  };

  const isOwner = detailHH?.created_by === user?.id;
  const displayName = profile?.display_name || 'Usuario';
  const currentInv = pendingInvitations[currentInvIdx];

  return (
    <div className="hogares-page">

      {/* ── Transfer completed success modal ── */}
      {completedTransfer && (
        <div className="hogares-inv-overlay">
          <div className="hogares-inv-modal">
            <div className="hogares-inv-icon"><CheckIcon /></div>
            <p className="hogares-inv-label">Traslado Exitoso</p>
            <h2 className="hogares-inv-hh" style={{ fontSize: '18px', margin: '8px 0' }}>
              {completedTransfer.pets?.name} se unió a {completedTransfer.to_household?.name}
            </h2>
            <p className="hogares-inv-sub">
              El traslado de tu mascota ha sido aceptado y completado.
            </p>
            <div className="hogares-inv-actions">
              <button 
                className="hogares-inv-accept" 
                style={{ width: '100%', flex: 'none' }}
                onClick={() => setCompletedTransfer(null)}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pending invitation modal ── */}
      {currentInv && (
        <div className="hogares-inv-overlay">
          <div className="hogares-inv-modal">
            <div className="hogares-inv-icon"><HomeIcon /></div>
            <p className="hogares-inv-label">Te invitaron a unirse</p>
            <h2 className="hogares-inv-hh">{currentInv.households?.name}</h2>
            <p className="hogares-inv-sub">
              <strong>{currentInv.inviter?.display_name}</strong> te invitó a gestionar
              las mascotas de este hogar junto a los demás miembros.
            </p>
            {pendingInvitations.length > 1 && (
              <p className="hogares-inv-count">
                {currentInvIdx + 1} de {pendingInvitations.length} invitaciones
              </p>
            )}
            <div className="hogares-inv-actions">
              <button className="hogares-inv-decline" onClick={() => handleDeclineInv(currentInv)} disabled={acceptingInv}>
                Rechazar
              </button>
              <button className="hogares-inv-accept" onClick={() => handleAcceptInv(currentInv)} disabled={acceptingInv}>
                {acceptingInv ? 'Uniéndome…' : 'Unirme al hogar →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="hogares-header">
        <div className="hogares-logo">
          <img src={kimoIcon} alt="KIMO" className="hogares-logo-img" />
          <span className="hogares-brand">KIMO</span>
        </div>
        <button className="hogares-signout" onClick={signOut} title="Cerrar sesión">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {/* ── Greeting ── */}
      <div className="hogares-greeting">
        <h1 className="hogares-greeting-title">
          Hola,<br />
          <span className="hogares-greeting-name">{displayName}</span>
        </h1>
        <p className="hogares-greeting-sub">Tus hogares de mascotas</p>
      </div>

      {/* ── Households list ── */}
      <div className="hogares-list-wrapper">

        {/* KIMO Code card */}
        {profile?.kimo_code && (
          <button
            className="hogares-kimo-code-card"
            onClick={() => {
              navigator.clipboard.writeText(profile.kimo_code);
              const el = document.getElementById('kimo-code-text');
              if (el) { el.textContent = '¡Copiado!'; setTimeout(() => { el.textContent = profile.kimo_code; }, 1500); }
            }}
            title="Copiar código"
          >
            <span className="hogares-kimo-code-label">Tu código KIMO</span>
            <div className="hogares-kimo-code-value">
              <span id="kimo-code-text" className="hogares-kimo-code-text">{profile.kimo_code}</span>
              <CopyIcon size={14} />
            </div>
          </button>
        )}
        {loading ? (
          <div className="hogares-loading">Cargando hogares...</div>
        ) : (
          <div className="hogares-list">
            {households.length === 0 && !showCreate && (
              <div className="hogares-onboarding">
                <h2 className="hogares-onboarding-title">
                  ¡Crea tu primer hogar!
                </h2>
                <p className="hogares-onboarding-desc">
                  Un hogar es el espacio donde gestionas a tus mascotas y puedes invitar a tu familia o cuidadores.
                </p>

                {/* Feature pills */}
                <div className="hogares-onboarding-features">
                  {/* 1 — UserPlus icon */}
                  <div className="hogares-onboarding-feature">
                    <span className="hogares-onboarding-feature-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <line x1="19" y1="8" x2="19" y2="14"/>
                        <line x1="22" y1="11" x2="16" y2="11"/>
                      </svg>
                    </span>
                    <span>Invita a personas como miembros a tu hogar</span>
                  </div>
                  {/* 2 — Pill / medicine icon */}
                  <div className="hogares-onboarding-feature">
                    <span className="hogares-onboarding-feature-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/>
                        <path d="m8.5 8.5 7 7"/>
                      </svg>
                    </span>
                    <span>Registra medicinas, vacunas, comida y mucho más</span>
                  </div>
                  {/* 3 — Paw print icon */}
                  <div className="hogares-onboarding-feature">
                    <span className="hogares-onboarding-feature-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="4"  r="2"/>
                        <circle cx="18" cy="8"  r="2"/>
                        <circle cx="4"  cy="8"  r="2"/>
                        <circle cx="6.5" cy="15.5" r="1"/>
                        <path d="M12 15c-2 0-5 1-5 4h10c0-3-3-4-5-4z"/>
                      </svg>
                    </span>
                    <span>Elige entre distintos avatares según tu mascota</span>
                  </div>
                </div>

                {/* CTA */}
                <button className="hogares-onboarding-cta" onClick={() => setShowCreate(true)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Crear mi primer hogar
                </button>
              </div>
            )}
            {households.map((hh) => {
              const petCount = (householdPets[hh.id] || []).length;
              const memberCount = householdMemberCounts[hh.id] ?? 0;
              const petStr = petCount === 0 ? 'Sin mascotas' : `${petCount} mascota${petCount !== 1 ? 's' : ''}`;
              const memberStr = memberCount === 1 ? '1 cuidador' : `${memberCount} cuidadores`;

              return (
                <div key={hh.id} className="hogares-item-row">
                  {/* Main tap → enter household */}
                  <button className="hogares-item" onClick={() => handleSelect(hh)}>
                    <div className="hogares-item-avatar"><HomeIcon /></div>
                    <div className="hogares-item-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="hogares-item-name">{hh.name}</span>
                        {hh.type === 'organization' && (
                          <span className="hogares-item-type-badge type-organization">Org</span>
                        )}
                      </div>
                      <span className="hogares-item-role">{petStr} · {memberStr}</span>
                    </div>
                  </button>

                  {/* House detail icon */}
                  <button
                    className="hogares-detail-btn"
                    onClick={() => openDetail(hh)}
                    title="Ver detalle del hogar"
                  >
                    <HomeDetailIcon />
                  </button>

                  {/* Invite button */}
                  <button
                    className="hogares-invite-btn"
                    onClick={() => openInviteSheet(hh)}
                    title="Invitar a alguien"
                  >
                    <UserPlusIcon />
                  </button>

                  {/* Transfer button */}
                  {(householdPets[hh.id] || []).length > 0 && (
                    <button
                      className="hogares-invite-btn"
                      onClick={() => setTransferHH(hh)}
                      title="Trasladar mascota"
                      style={{ color: '#ff9500' }}
                    >
                      <TransferIcon size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add hogar button — hidden on empty state (CTA handles it) */}
        {households.length > 0 && (
          <button className="hogares-add-btn" onClick={() => setShowCreate(true)}>
            <PlusIcon />
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── Pet detail overlay (tap avatar) ── */}
      {/* ══════════════════════════════════════════════════ */}
      {focusedPet && (
        <div className="hd-pet-overlay" onClick={() => setFocusedPet(null)}>
          <div className="hd-pet-overlay-card" onClick={(e) => e.stopPropagation()}>
            <img src={getPetImg(focusedPet)} alt={focusedPet.name} className="hd-pet-overlay-img" />
            <p className="hd-pet-overlay-name">{focusedPet.name}</p>
            {isOwner && (
              removingPetId === focusedPet.id ? (
                <div className="hd-pet-overlay-confirm">
                  <p className="hd-pet-overlay-confirm-text">¿Eliminar a {focusedPet.name} y todos sus datos?</p>
                  <div className="hd-pet-overlay-confirm-actions">
                    <button className="hd-delete-cancel-btn" onClick={() => setRemovingPetId(null)} disabled={deletingPet}>Cancelar</button>
                    <button className="hd-delete-yes-btn" onClick={() => handleDeletePet(focusedPet.id)} disabled={deletingPet}>
                      {deletingPet ? 'Eliminando…' : 'Sí, eliminar'}
                    </button>
                  </div>
                </div>
              ) : (
                <button className="hd-pet-overlay-delete-btn" onClick={() => setRemovingPetId(focusedPet.id)}>
                  <TrashIcon size={15} /> Eliminar mascota
                </button>
              )
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════ */}
      {/* ── Bottom sheet: DETAIL DEL HOGAR ── */}
      {/* ══════════════════════════════════════════════════ */}
      {detailHH && (
        <div
          className={`hogares-sheet-overlay${closingSheet ? ' hogares-sheet-overlay-closing' : ''}`}
          onClick={closeDetail}
        >
          <div
            className="hogares-sheet hd-sheet"
            style={{
              transform: `translateY(${sheetDragY}px)`,
              transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)',
              willChange: 'transform',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Swipeable handle ── */}
            <div
              className="hd-swipe-handle"
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
              onPointerCancel={onHandlePointerUp}
            />

            {/* ── Sheet header ── */}
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
                      onChange={(e) => setEditNameVal(e.target.value)}
                      autoFocus
                      maxLength={40}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <button className="hd-name-save" onClick={handleSaveName} disabled={savingName}>
                      {savingName ? '…' : <CheckIcon />}
                    </button>
                    <button className="hd-name-cancel" onClick={() => { setEditingName(false); setEditNameVal(detailHH.name); }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="hd-name-row">
                    <h3 className="hd-title">{detailHH.name}</h3>
                    {isOwner && (
                      <button className="hd-edit-name-btn" onClick={() => setEditingName(true)} title="Editar nombre">
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

            {detailLoading ? (
              <div className="hd-loading">Cargando información…</div>
            ) : detailData ? (
              <div className="hd-body">

                {/* ── Mascotas ── */}
                <div className="hd-section">
                  <p className="hd-section-title">
                    <PawIcon /> Mascotas ({detailData.pets.length})
                  </p>
                  {detailData.pets.length === 0 ? (
                    <p className="hd-empty">Sin mascotas en este hogar</p>
                  ) : (
                    <div className="hd-pets-grid">
                      {detailData.pets.map((pet) => (
                        <button
                          key={pet.id}
                          className="hd-pet-avatar-btn"
                          onClick={() => { setFocusedPet(pet); setRemovingPetId(null); }}
                        >
                          <img src={getPetImg(pet)} alt={pet.name} className="hd-pet-avatar-img" />
                          <span className="hd-pet-name-pill">{pet.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Miembros ── */}
                <div className="hd-section">
                  <p className="hd-section-title">
                    👥 Miembros ({detailData.members.length})
                  </p>
                  <div className="hd-members-list">
                    {detailData.members.map((m) => {
                      const isMe = m.id === user?.id;
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
                          {/* Only owner can remove others (not themselves) */}
                          {isOwner && !isMe && (
                            isConfirmingRemove ? (
                              <div className="hd-remove-confirm">
                                <span className="hd-remove-confirm-text">¿Eliminar?</span>
                                <button className="hd-remove-yes" onClick={() => handleRemoveMember(m.memberId)}>Sí</button>
                                <button className="hd-remove-no" onClick={() => setRemovingMemberId(null)}>No</button>
                              </div>

                            ) : (
                              <button
                                className="hd-remove-member-btn"
                                onClick={() => setRemovingMemberId(m.memberId)}
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

                {/* ── Danger zone: delete household ── */}
                {isOwner && (
                  <div className="hd-danger-zone">
                    {confirmDelete ? (
                      <div className="hd-delete-confirm">
                        <p className="hd-delete-confirm-text">
                          ¿Seguro que quieres eliminar <strong>{detailHH.name}</strong>? 
                          Se borrarán todas las mascotas y datos asociados.
                        </p>
                        <div className="hd-delete-confirm-actions">
                          <button className="hd-delete-cancel-btn" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                            Cancelar
                          </button>
                          <button className="hd-delete-yes-btn" onClick={handleDeleteHousehold} disabled={deleting}>
                            {deleting ? 'Eliminando…' : '🗑 Sí, eliminar'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button className="hd-delete-btn" onClick={() => setConfirmDelete(true)}>
                        <TrashIcon size={16} /> Eliminar hogar
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Bottom sheet: crear hogar ── */}
      {showCreate && (
        <div className="hogares-sheet-overlay"
          onClick={resetCreateForm}>
          <form className="hogares-sheet" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <div className="hogares-sheet-handle" />
            <h3 className="hogares-sheet-title">🏠 Nuevo hogar</h3>

            {/* Type selector */}
            <div className="hogares-type-selector">
              <button
                type="button"
                className={`hogares-type-btn ${newType === 'personal' ? 'hogares-type-btn-active' : ''}`}
                onClick={() => setNewType('personal')}
              >
                <div className="hogares-type-icon"><HomeIcon size={20} color="#1c1c1e" /></div>
                <span className="hogares-type-label">Personal</span>
                <span className="hogares-type-desc">Familias, parejas, roomies</span>
              </button>
              <button
                type="button"
                className={`hogares-type-btn ${newType === 'organization' ? 'hogares-type-btn-active' : ''}`}
                onClick={() => setNewType('organization')}
              >
                <div className="hogares-type-icon"><BuildingIcon size={20} /></div>
                <span className="hogares-type-label">Organización</span>
                <span className="hogares-type-desc">Albergues, refugios, criadores</span>
              </button>
            </div>

            <input
              className="hogares-sheet-input"
              placeholder={newType === 'organization' ? 'Nombre de la organización' : 'Nombre del hogar (ej: Casa Pérez)'}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus maxLength={40}
            />

            {/* Organization-only fields */}
            {newType === 'organization' && (
              <>
                {/* Country selector */}
                <div className="hogares-country-select-wrap" style={{ marginTop: '10px' }}>
                  <select
                    className="hogares-sheet-input hogares-country-select"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                  >
                    <option value="">Selecciona un país</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone with auto dial code */}
                <div className="hogares-phone-row" style={{ marginTop: '10px' }}>
                  <span className="hogares-phone-prefix">
                    {(() => {
                      const c = newCountry ? COUNTRIES.find(x => x.code === newCountry) : null;
                      return c ? c.dial : '+__';
                    })()}
                  </span>
                  <input
                    className="hogares-sheet-input hogares-phone-input"
                    placeholder="Número de contacto *"
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    maxLength={15}
                  />
                </div>

                <p className="hogares-org-hint">
                  El número de contacto nos permite comunicarnos con tu organización para ofrecerte promociones y beneficios exclusivos.
                </p>
              </>
            )}

            {createErr && <p className="hogares-sheet-error">{createErr}</p>}
            <div className="hogares-sheet-actions">
              <button type="button" className="hogares-sheet-cancel"
                onClick={resetCreateForm}>
                Cancelar
              </button>
              <button type="submit" className="hogares-sheet-save" disabled={!newName.trim() || creating}>
                {creating ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* ── Bottom sheet: invitar persona ── */}
      {inviteHH && (
        <div className="hogares-sheet-overlay" onClick={closeInviteSheet}>
          <div className="hogares-sheet hogares-invite-sheet" onClick={(e) => { e.stopPropagation(); setActiveTip(null); }}>
            <div className="hogares-sheet-handle" />
            <h3 className="hogares-sheet-title">Invitar a {inviteHH.name}</h3>

            {/* Invite by KIMO code */}
            <div className="hogares-invite-label-row">
              <p className="hogares-invite-section-label">Código KIMO del usuario</p>
              <button
                className="hogares-invite-info-btn"
                onClick={(e) => { e.stopPropagation(); setActiveTip(v => v === 'email' ? null : 'email'); }}
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
                onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setInviteMsg(''); }}
                maxLength={6}
                style={{ letterSpacing: '3px', fontWeight: 700, textAlign: 'center' }}
              />
              <button className="hogares-invite-send-btn" onClick={handleInviteByCode}
                disabled={inviting || !inviteCode.trim()}>
                {inviting ? '…' : 'Invitar'}
              </button>
            </div>

            {inviteMsg && <p className="hogares-invite-msg">{inviteMsg}</p>}

            <div className="hogares-invite-divider">
              <div className="hogares-invite-divider-line" />
              <span>o</span>
              <div className="hogares-invite-divider-line" />
            </div>

            {/* Label: no tiene cuenta */}
            <div className="hogares-invite-label-row">
              <p className="hogares-invite-section-label">Si no tiene cuenta</p>
              <button
                className="hogares-invite-info-btn"
                onClick={(e) => { e.stopPropagation(); setActiveTip(v => v === 'noAccount' ? null : 'noAccount'); }}
                aria-label="Más información"
              >
                <InfoIcon />
              </button>
              {activeTip === 'noAccount' && (
                <span className="hogares-invite-tip">Invita a usar la app para gestionar hogares juntos</span>
              )}
            </div>
            {!generatedLink ? (
              <button className="hogares-invite-link-btn" onClick={handleGenerateLink} disabled={generatingLink}>
                {generatingLink ? 'Generando…' : '🔗 Generar link de invitación'}
              </button>
            ) : (
              <div className="hogares-invite-link-box">
                <p className="hogares-invite-link-text">{generatedLink}</p>
                <button className="hogares-invite-copy-btn" onClick={handleCopyLink}>
                  {copied ? '✓ Copiado' : <><CopyIcon /> Copiar</>}
                </button>
              </div>
            )}

            <button className="hogares-sheet-cancel hogares-invite-close" onClick={closeInviteSheet}>
              Cerrar
            </button>
          </div>
        </div>
      )}
      {/* ── Transfer Sheet (sender flow) ── */}
      <TransferSheet
        isOpen={!!transferHH}
        onClose={() => setTransferHH(null)}
        pets={transferHH ? (householdPets[transferHH.id] || []) : []}
        householdId={transferHH?.id}
        householdName={transferHH?.name}
        onInitiateTransfer={initiateTransfer}
        outgoingTransfers={outgoingTransfers.filter(t => t.status === 'pending')}
        onCancelTransfer={cancelTransfer}
      />

      {/* ── Transfer Modal (receiver flow — real-time) ── */}
      {incomingTransfers.length > 0 && (
        <TransferModal
          transfer={incomingTransfers[0]}
          households={households}
          onAccept={acceptTransfer}
          onDecline={declineTransferFn}
        />
      )}
    </div>
  );
}
