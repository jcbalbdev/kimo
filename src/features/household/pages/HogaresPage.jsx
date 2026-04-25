import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { useInvitations } from '../hooks/useInvitations';
import { useTransfers } from '../../transfers/hooks/useTransfers';
import { useDirectory } from '../../directory/hooks/useDirectory';
import { supabase } from '../../../lib/supabase';
import {
  HomeIcon, HomeDetailIcon, PlusIcon, UserPlusIcon, CopyIcon,
  EditIcon, TrashIcon, PawIcon, OwnerIcon,
  TransferIcon, CheckIcon, MessageSquarePlusIcon, BuildingIcon,
} from '../../../shared/components/Icons';
import TransferSheet from '../../transfers/components/TransferSheet';
import TransferModal from '../../transfers/components/TransferModal';
import DirectoryProfileSheet from '../../directory/components/DirectoryProfileSheet';
import OrgProfileSheet from '../../directory/components/OrgProfileSheet';
import FeedbackModal from '../../feedback/components/FeedbackModal';
import OrgCard from '../../directory/components/OrgCard';
import InviteSheet from '../components/InviteSheet';
import HogarCreateSheet from '../components/HogarCreateSheet';
import HogarDetailSheet from '../components/HogarDetailSheet';
import kimoIcon from '../../../assets/icono.png';
import './HogaresPage.css';

const CURRENT_VERSION = 'v1.0.2';

export default function HogaresPage() {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const { organizations, loadingDir, fetchOrganizations } = useDirectory();
  const [dirProfileHH, setDirProfileHH] = useState(null);
  const [selectedOrg, setSelectedOrg]   = useState(null);
  const [activeTab, setActiveTab] = useState('hogares');
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
  // Org-specific profile fields
  const [newCity, setNewCity] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newInstagram, setNewInstagram] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newFacebook, setNewFacebook] = useState('');
  const [newTiktok, setNewTiktok] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newMaps, setNewMaps] = useState('');
  const [newDirectoryVisible, setNewDirectoryVisible] = useState(true);
  // Cover photo
  const [newCoverBlob, setNewCoverBlob]           = useState(null);
  const [newCoverPreview, setNewCoverPreview]     = useState('');
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');

  // ── Type-picker modal (first-time onboarding) ──────────
  const [typePickerModal, setTypePickerModal] = useState(null); // 'personal' | 'organization' | null
  const [typeLocked, setTypeLocked] = useState(false); // true = type chosen from modal, hide selector

  const resetCreateForm = () => {
    setShowCreate(false); setNewName(''); setNewType('personal');
    setNewCountry(''); setNewPhone(''); setCreateErr('');
    setNewCity(''); setNewDescription(''); setNewInstagram('');
    setNewWhatsapp(''); setNewFacebook(''); setNewTiktok('');
    setNewWebsite(''); setNewMaps('');
    setNewDirectoryVisible(true);
    setNewCoverBlob(null); setNewCoverPreview('');
    setTypeLocked(false);
  };

  const handleOpenCreateFromModal = (type) => {
    setTypePickerModal(null);
    setNewType(type);
    setTypeLocked(true);
    setNewName('');
    setCreateErr('');
    setShowCreate(true);
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

  // ── Version / Changelog Modal ──────────────────────────
  const [showChangelog, setShowChangelog] = useState(false);
  // ── Feedback Modal ────────────────────────────────────
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const savedVer = localStorage.getItem('kimo_version');
    if (savedVer !== CURRENT_VERSION) {
      setShowChangelog(true);
      localStorage.setItem('kimo_version', CURRENT_VERSION);
    }
  }, []);

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
    setCreating(true); setCreateErr('');

    const selectedCountry = COUNTRIES.find(c => c.code === newCountry);

    const { data: hh, error: err } = await createHousehold(newName.trim(), newType, {
      country:          selectedCountry?.name || null,
      contactPhone:     null,
      city:             newCity.trim()        || null,
      description:      newDescription.trim() || null,
      instagram:        newInstagram.trim()   || null,
      whatsapp:         newWhatsapp.trim()    || null,
      facebook:         newFacebook.trim()    || null,
      tiktok:           newTiktok.trim()      || null,
      directoryVisible: true,
      directory_website: newWebsite.trim()   || null,
      directory_maps:    newMaps.trim()      || null,
    });
    if (err) { setCreateErr(err); setCreating(false); return; }

    // Upload cover photo if one was selected
    if (newCoverBlob && hh?.id) {
      const path = `${hh.id}/cover.webp`;
      const { error: upErr } = await supabase.storage
        .from('org-covers')
        .upload(path, newCoverBlob, { contentType: 'image/webp', upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('org-covers').getPublicUrl(path);
        await supabase.from('households').update({ directory_cover_url: urlData.publicUrl }).eq('id', hh.id);
      }
    }

    resetCreateForm();
    setCreating(false);
    navigate('/onboarding/especie');
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="hogares-brand" style={{ lineHeight: '1' }}>KIMO</span>
            <span className="hogares-version">{CURRENT_VERSION}</span>
          </div>
        </div>
        <button className="hogares-signout" onClick={signOut} title="Cerrar sesión">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {/* ── TAB: HOGARES ── */}
      {activeTab === 'hogares' && (
        <div className="tab-panel">
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
          <>
            {households.length === 0 && !showCreate && (
              <div className="hogares-onboarding">
                <h2 className="hogares-onboarding-title">
                  Crea tu primer hogar
                </h2>

                {/* Type picker buttons */}
                <div className="hogares-type-picker">
                  {/* Hogar Personal */}
                  <button
                    className="hogares-type-pick-btn"
                    onClick={() => setTypePickerModal('personal')}
                  >
                    <div className="hogares-type-pick-icon hogares-type-pick-icon--personal">
                      <HomeIcon size={26} color="#2a8a6a" />
                    </div>
                    <span className="hogares-type-pick-label">Hogar Personal</span>
                    <span className="hogares-type-pick-sub">Familias y cuidadores</span>
                  </button>

                  {/* Organización */}
                  <button
                    className="hogares-type-pick-btn"
                    onClick={() => setTypePickerModal('organization')}
                  >
                    <div className="hogares-type-pick-icon hogares-type-pick-icon--org">
                      <BuildingIcon size={26} />
                    </div>
                    <span className="hogares-type-pick-label">Organización</span>
                    <span className="hogares-type-pick-sub">Albergues y refugios</span>
                  </button>
                </div>

                {/* What's New card */}
                <button
                  className="hogares-whats-new-card"
                  onClick={() => setShowChangelog(true)}
                >
                  <span className="hogares-whats-new-badge">NUEVO</span>
                  <div className="hogares-whats-new-body">
                    <span className="hogares-whats-new-emoji">🚀</span>
                    <div>
                      <p className="hogares-whats-new-title">¡Novedades en KIMO!</p>
                      <p className="hogares-whats-new-sub">Hay cosas nuevas esperándote — toca para ver</p>
                    </div>
                  </div>
                </button>
              </div>
            )}
            <div className="hogares-list">
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
          </>
        )}

        {/* Add hogar button — hidden on empty state (CTA handles it) */}
        {households.length > 0 && (
          <div className="hogares-bottom-actions">
            <button className="hogares-add-btn hogares-add-btn--secondary" onClick={() => setShowCreate(true)}>
              <PlusIcon /> Nuevo Hogar
            </button>
            <button className="hogares-whats-new-card" onClick={() => setShowChangelog(true)}>
              <span className="hogares-whats-new-badge">NUEVO</span>
              <div className="hogares-whats-new-body">
                <span className="hogares-whats-new-emoji">🚀</span>
                <div>
                  <p className="hogares-whats-new-title">¡Novedades en KIMO!</p>
                  <p className="hogares-whats-new-sub">Hay cosas nuevas esperándote — toca para ver</p>
                </div>
              </div>
            </button>

            {/* Feedback button */}
            <button
              className="hogares-feedback-btn"
              onClick={() => setShowFeedback(true)}
            >
              <span className="hogares-feedback-btn-icon">
                <MessageSquarePlusIcon size={22} color="#2a8a6a" />
              </span>
              <span className="hogares-feedback-btn-text">
                <span className="hogares-feedback-btn-label">Enviar comentario o reporte</span>
                <span className="hogares-feedback-btn-sublabel">Tu opinión mejora KIMO</span>
              </span>
              <span className="hogares-feedback-btn-arrow">›</span>
            </button>
          </div>
        )}

      </div>
        </div>
      )}

      {/* ── TAB: COMUNIDAD ── */}
      {activeTab === 'comunidad' && (
        <div className="tab-panel comunidad-page">
          <div className="comunidad-hero">
            <p className="comunidad-hero-title">Organizaciones en KIMO</p>
            <p className="comunidad-hero-sub">Albergues y refugios que cuidan mascotas con KIMO</p>
          </div>

          {loadingDir ? (
            <p className="vitrina-loading">Cargando…</p>
          ) : organizations.length === 0 ? (
            <div className="comunidad-empty">
              <div className="comunidad-empty-icon">🏠</div>
              <p className="comunidad-empty-title">Muy pronto los primeros albergues estarán aquí</p>
              <p className="comunidad-empty-sub">Los albergues que usan KIMO aparecerán en esta sección con sus redes y contacto directo</p>
            </div>
          ) : (
            <div className="comunidad-cards">
              {organizations.map((org) => (
                <OrgCard
                  key={org.id}
                  org={org}
                  onClick={() => setSelectedOrg(org)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom Tab Bar (iOS Segmented Control) ── */}
      <div className="hogares-bottom-tabs">
        <div className="hogares-tabs-segment">
          <button
            className={`hogares-tab-btn ${activeTab === 'hogares' ? 'hogares-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('hogares')}
          >
            Hogares
          </button>
          <button
            className={`hogares-tab-btn ${activeTab === 'comunidad' ? 'hogares-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('comunidad')}
          >
            Comunidad
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════ */}
      {/* ── Changelog / What's New Modal ── */}
      {/* ══════════════════════════════════════════════════ */}
      {showChangelog && (
        <div className="hogares-inv-overlay" onClick={() => setShowChangelog(false)}>
          <div className="hogares-inv-modal" style={{ textAlign: 'left', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setShowChangelog(false)}
              style={{
                position: 'absolute', top: '14px', right: '14px',
                width: '28px', height: '28px',
                borderRadius: '50%', border: 'none',
                background: '#f2f2f7', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#8e8e93', fontSize: '16px', lineHeight: 1,
              }}
              aria-label="Cerrar"
            >
              ✕
            </button>
            <div className="hogares-inv-icon" style={{ margin: '0 auto 12px', background: 'transparent', boxShadow: 'none' }}>
              <img src={kimoIcon} alt="KIMO" style={{ width: '52px', height: '52px', borderRadius: '14px', objectFit: 'cover', boxShadow: '0 4px 14px rgba(168,230,207,0.5)' }} />
            </div>
            <p className="hogares-inv-label" style={{ textAlign: 'center' }}>Novedades en KIMO</p>


            <div className="hogares-changelog-content">

              {/* ── v1.0.2 ── */}
              <h2 style={{ fontSize: '18px', margin: '0 0 4px', fontWeight: 800 }}>Versión v1.0.2</h2>
              <p style={{ color: '#8e8e93', fontSize: '12px', margin: '0 0 12px' }}>24 de abril de 2026</p>
              <ul>
                <li><strong>App Android disponible:</strong> KIMO ya tiene una app nativa para Android. Aún no está en la Play Store, pero ya puedes descargarla y probarla. Descárgala desde la pantalla de login.</li>
                <li><strong>Notificaciones en tiempo real:</strong> Con la app Android recibirás alertas automáticas cuando sea la hora de alimentar a tu mascota. Es esa tranquilidad de saber que aunque estés ocupado, KIMO te recuerda que tus peludos te necesitan.</li>
                <li><strong>Hogares Personales y Organizaciones:</strong> Por primera vez puedes elegir el tipo de hogar que mejor representa tu situación. Un Hogar Personal está pensado para familias y cuidadores que conviven con sus mascotas. Una Organización es para albergues, refugios o criaderos que gestionan muchas mascotas y equipos. Esta diferencia no es solo una categoría: define cómo KIMO trabaja para ti.</li>
                <li><strong>Próximamente en iOS:</strong> La app para iPhone ya está en camino. ¡Muy pronto la tendrás disponible!</li>
              </ul>

              {/* ── divider ── */}
              <div style={{ borderTop: '1px solid #f0f0f5', margin: '16px 0' }} />

              {/* ── v1.0.1 ── */}
              <h2 style={{ fontSize: '16px', margin: '0 0 4px', fontWeight: 800, color: '#3c3c43' }}>Versión v1.0.1</h2>
              <p style={{ color: '#8e8e93', fontSize: '12px', margin: '0 0 12px' }}>21 de abril de 2026</p>
              <ul>
                <li><strong>Perfil público para veterinarios:</strong> Comparte el historial completo de tu mascota con cualquier veterinario mediante un enlace único, sin necesidad de cuenta.</li>
                <li><strong>Fechas en alergias y condiciones crónicas:</strong> Ahora el veterinario puede ver exactamente cuándo inició cada alergia o enfermedad, y si sigue activa o fue resuelta.</li>
                <li><strong>Exportar historial en PDF:</strong> El veterinario puede descargar el historial clínico completo en PDF directamente desde el enlace que le compartes, sin necesidad de instalar nada.</li>
                <li><strong>Microchip en el perfil:</strong> El número de microchip ahora aparece visible en el perfil digital de cada mascota.</li>
              </ul>

              {/* ── divider ── */}
              <div style={{ borderTop: '1px solid #f0f0f5', margin: '16px 0' }} />

              {/* ── v1.0.0 ── */}
              <h2 style={{ fontSize: '16px', margin: '0 0 4px', fontWeight: 800, color: '#3c3c43' }}>Versión v1.0.0</h2>
              <p style={{ color: '#8e8e93', fontSize: '12px', margin: '0 0 12px' }}>Lanzamiento oficial</p>
              <p>¡Bienvenido a la versión oficial v1.0.0 de KIMO!</p>
              <ul>
                <li><strong>Códigos KIMO:</strong> Ahora invitas y trasladas mascotas de manera privada sin usar correos electrónicos. Tu código 100% único está en tu perfil.</li>
                <li><strong>Adopciones y Traslados:</strong> Los albergues y organizaciones pueden ceder digitalmente el perfil médico de una mascota de por vida a los usuarios adoptantes.</li>
                <li><strong>Cuidados Inteligentes:</strong> Generamos la agenda exacta de próximas vacunas y medicinas automáticamente según la frecuencia que elijas, además de un historial súper preciso.</li>
                <li><strong>Experiencia Premium:</strong> Disfruta de una navegación ultrarrápida, suave y espectacularmente fluida en cualquier dispositivo móvil.</li>
              </ul>

            </div>

            <div className="hogares-inv-actions" style={{ marginTop: '20px' }}>
              <button
                className="hogares-inv-accept"
                style={{ width: '100%', flex: 'none' }}
                onClick={() => setShowChangelog(false)}
              >
                ¡Me encanta!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hogar Detail Sheet (includes pet overlay) ── */}
      {detailHH && (
        <HogarDetailSheet
          household={detailHH}
          detailData={detailData}
          detailLoading={detailLoading}
          isOwner={isOwner}
          userId={user?.id}
          editingName={editingName} editNameVal={editNameVal} savingName={savingName} nameErr={nameErr}
          onStartEditName={() => setEditingName(true)}
          onEditNameChange={setEditNameVal}
          onSaveName={handleSaveName}
          onCancelEditName={() => { setEditingName(false); setEditNameVal(detailHH.name); }}
          confirmDelete={confirmDelete} deleting={deleting}
          onConfirmDelete={() => setConfirmDelete(true)}
          onCancelDelete={() => setConfirmDelete(false)}
          onDeleteHousehold={handleDeleteHousehold}
          removingMemberId={removingMemberId}
          onStartRemoveMember={setRemovingMemberId}
          onCancelRemoveMember={() => setRemovingMemberId(null)}
          onRemoveMember={handleRemoveMember}
          focusedPet={focusedPet} removingPetId={removingPetId} deletingPet={deletingPet}
          onFocusPet={setFocusedPet}
          onStartRemovePet={setRemovingPetId}
          onCancelRemovePet={() => setRemovingPetId(null)}
          onDeletePet={handleDeletePet}
          onOpenDirProfile={() => setDirProfileHH(detailHH)}
          sheetDragY={sheetDragY} isDragging={isDragging}
          onHandlePointerDown={onHandlePointerDown}
          onHandlePointerMove={onHandlePointerMove}
          onHandlePointerUp={onHandlePointerUp}
          onClose={closeDetail}
        />
      )}

      {/* ── DEAD CODE placeholder so git diff stays clean ── */}
      {false && (
        <div className="hd-pet-overlay" onClick={() => setFocusedPet(null)}>
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

      {/* removed — now rendered by HogarDetailSheet above */}
      {false && (
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
                  {detailData.pets.length === 0 && !isOwner ? (
                    <p className="hd-empty">Sin mascotas en este hogar</p>
                  ) : (
                    <div className="hd-pets-grid">
                      {/* ── Add pet button — first position ── */}
                      {isOwner && (
                        <button
                          className="hd-pet-add-btn"
                          onClick={() => { setDetailHH(null); navigate('/onboarding/especie'); }}
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
                          onClick={() => { setFocusedPet(pet); setRemovingPetId(null); }}
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

                {/* ── Notificaciones ── */}
                <button
                  className="hd-notif-btn"
                  onClick={() => { closeDetail(); navigate('/notificaciones', { state: { householdId: detailHH.id, householdName: detailHH.name } }); }}
                >
                  <span className="hd-notif-btn-left">
                    <span className="hd-notif-icon">🔔</span>
                    <span className="hd-notif-label">Notificaciones del hogar</span>
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>

                {/* ── Directory profile button (org owners only) ── */}
                {isOwner && detailHH?.type === 'organization' && (
                  <button
                    className="hd-dir-profile-btn"
                    onClick={() => setDirProfileHH(detailHH)}
                  >
                    <BuildingIcon size={16} />
                    Editar perfil de vitrina
                  </button>
                )}

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

      {/* ══════════════════════════════════════════════════ */}
      {/* ── Type-picker modal ── */}
      {/* ══════════════════════════════════════════════════ */}
      {typePickerModal && (() => {
        const isPersonal = typePickerModal === 'personal';
        return (
          <div className="hogares-inv-overlay" onClick={() => setTypePickerModal(null)}>
            <div className="hogares-inv-modal hogares-typepick-modal" onClick={(e) => e.stopPropagation()}>

              {/* Close */}
              <button
                className="hogares-typepick-close"
                onClick={() => setTypePickerModal(null)}
                aria-label="Cerrar"
              >✕</button>

              {/* Icon */}
              <div className={`hogares-typepick-icon ${isPersonal ? 'hogares-typepick-icon--personal' : 'hogares-typepick-icon--org'}`}>
                {isPersonal ? <HomeIcon size={28} color="#2a8a6a" /> : <BuildingIcon size={28} />}
              </div>

              {/* Title */}
              <p className="hogares-inv-label">
                {isPersonal ? 'Hogar Personal' : 'Organización'}
              </p>
              <h2 className="hogares-typepick-title">
                {isPersonal ? '¿Para quién es?' : '¿Para quién es?'}
              </h2>
              <p className="hogares-inv-sub">
                {isPersonal
                  ? 'Ideal para familias, parejas o cuidadores que comparten el cuidado de sus mascotas en casa. Invita a quienes conviven con ellas y lleva el historial completo juntos.'
                  : 'Perfecto para albergues, refugios, criaderos o clínicas. Gestiona muchas mascotas, coordina tu equipo y cede perfiles a adoptantes de forma digital.'}
              </p>

              {/* Feature list */}
              <div className="hogares-typepick-features">
                {isPersonal ? (
                  <>
                    <div className="hogares-typepick-feature">
                      <span className="hogares-typepick-feature-icon">👨‍👩‍👧</span>
                      <span>Invita a tu familia o roomies como cuidadores</span>
                    </div>
                    <div className="hogares-typepick-feature">
                      <span className="hogares-typepick-feature-icon">💊</span>
                      <span>Registra medicinas, vacunas y comida fácilmente</span>
                    </div>
                    <div className="hogares-typepick-feature">
                      <span className="hogares-typepick-feature-icon">🐾</span>
                      <span>Un perfil completo para cada mascota del hogar</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hogares-typepick-feature">
                      <span className="hogares-typepick-feature-icon">🏢</span>
                      <span>Gestiona múltiples mascotas con tu equipo</span>
                    </div>
                    <div className="hogares-typepick-feature">
                      <span className="hogares-typepick-feature-icon">🤝</span>
                      <span>Cede perfiles médicos a adoptantes digitalmente</span>
                    </div>
                    <div className="hogares-typepick-feature">
                      <span className="hogares-typepick-feature-icon">🎁</span>
                      <span>Accede a beneficios y promociones exclusivas</span>
                    </div>
                  </>
                )}
              </div>

              {/* CTA */}
              <button
                className="hogares-typepick-cta"
                onClick={() => handleOpenCreateFromModal(typePickerModal)}
              >
                Crear
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Create Hogar Sheet ── */}
      {showCreate && (
        <HogarCreateSheet
          newType={newType} onTypeChange={setNewType} typeLocked={typeLocked}
          newName={newName} onNameChange={setNewName}
          newCountry={newCountry} onCountryChange={setNewCountry}
          newCity={newCity} onCityChange={setNewCity}
          newDescription={newDescription} onDescriptionChange={setNewDescription}
          newInstagram={newInstagram} onInstagramChange={setNewInstagram}
          newWhatsapp={newWhatsapp} onWhatsappChange={setNewWhatsapp}
          newFacebook={newFacebook} onFacebookChange={setNewFacebook}
          newTiktok={newTiktok} onTiktokChange={setNewTiktok}
          newWebsite={newWebsite} onWebsiteChange={setNewWebsite}
          newMaps={newMaps} onMapsChange={setNewMaps}
          newCoverPreview={newCoverPreview}
          onCoverReady={(blob, preview) => { setNewCoverBlob(blob); setNewCoverPreview(preview); }}
          creating={creating} createErr={createErr}
          onSubmit={handleCreate} onCancel={resetCreateForm}
        />
      )}
      {/* ── Invite Sheet ── */}
      <InviteSheet
        household={inviteHH}
        inviteCode={inviteCode}
        onCodeChange={(v) => { setInviteCode(v); setInviteMsg(''); }}
        inviting={inviting}
        onInviteByCode={handleInviteByCode}
        inviteMsg={inviteMsg}
        generatedLink={generatedLink}
        generatingLink={generatingLink}
        onGenerateLink={handleGenerateLink}
        copied={copied}
        onCopyLink={handleCopyLink}
        activeTip={activeTip}
        onToggleTip={(tip) => setActiveTip(v => v === tip ? null : tip)}
        onClose={closeInviteSheet}
      />


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

      {/* ── Directory Profile Editor ── */}
      {dirProfileHH && (
        <DirectoryProfileSheet
          household={dirProfileHH}
          onClose={() => setDirProfileHH(null)}
          onSaved={() => { fetchOrganizations(); setDirProfileHH(null); }}
        />
      )}

      {/* ── Org Public Profile Sheet ── */}
      {selectedOrg && (
        <OrgProfileSheet
          org={selectedOrg}
          onClose={() => setSelectedOrg(null)}
        />
      )}

      {/* ── Feedback Modal ── */}
      {showFeedback && (
        <FeedbackModal
          userId={user?.id}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
