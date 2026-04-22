import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Pill, Drumstick, CalendarDays, Syringe, Activity } from 'lucide-react';
import { usePets } from '../../pets/hooks/usePets';
import { useHousehold } from '../../household/hooks/useHousehold';
import {
  SPECIES_AVATARS, PET_IMG, AVATAR_KEY_TO_IMG, DEFAULT_SPECIES_KEYS, getPetImg,
} from '../../../shared/utils/petAvatars';
import PerfilTab from '../components/PerfilTab';
import MedsTab from '../components/MedsTab';
import AlimentosTab from '../components/AlimentosTab';
import CitasTab from '../components/CitasTab';
import VacunasTab from '../components/VacunasTab';
import SaludTab from '../components/SaludTab';
import ShareModal from '../../../shared/components/ShareModal/ShareModal';
import './HomePage.css';



const TABS = [
  { id: 'perfil',       label: 'Perfil',    Icon: PawPrint },
  { id: 'salud',        label: 'Salud',     Icon: Activity },
  { id: 'medicamentos', label: 'Medicinas', Icon: Pill },
  { id: 'alimentos',    label: 'Comida',    Icon: Drumstick },
  { id: 'vacunas',      label: 'Vacunas',   Icon: Syringe },
  { id: 'citas',        label: 'Citas',     Icon: CalendarDays },
];



export default function HomePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('perfil');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [newName, setNewName] = useState('');
  const [pendingAvatarKey, setPendingAvatarKey] = useState(null);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [closingSheet, setClosingSheet] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // ── Scroll-based sticky header state ──
  const [hogarVisible, setHogarVisible] = useState(true);
  const [tabsVisible, setTabsVisible] = useState(true);
  const [showTabDropdown, setShowTabDropdown] = useState(false);

  const dragStart = useRef(null);
  const sheetRef = useRef(null);
  const rootRef = useRef(null);
  const headerRef = useRef(null);
  const hogarSentinelRef = useRef(null);
  const tabsSentinelRef = useRef(null);

  const { pets, currentPet, selectPet, fetchPets, updatePet } = usePets();
  const { currentHousehold } = useHousehold();

  // Reset scroll & header to top when switching pets
  useEffect(() => {
    if (rootRef.current) rootRef.current.scrollTop = 0;
    setHogarVisible(true);
    setTabsVisible(true);
    setShowTabDropdown(false);
  }, [currentPet?.id]);

  // IntersectionObserver: watches sentinels to drive sticky header
  useEffect(() => {
    const headerEl = headerRef.current;
    const hogarEl  = hogarSentinelRef.current;
    const tabsEl   = tabsSentinelRef.current;
    if (!headerEl || !hogarEl || !tabsEl) return;

    // Offset equals the sticky header height so sentinels "exit" right as they
    // hit the bottom edge of the header bar.
    const headerH = headerEl.offsetHeight || 56;
    const opts = { rootMargin: `-${headerH}px 0px 0px 0px` };

    const hogarObs = new IntersectionObserver(
      ([e]) => setHogarVisible(e.isIntersecting),
      opts
    );
    const tabsObs = new IntersectionObserver(
      ([e]) => setTabsVisible(e.isIntersecting),
      opts
    );

    hogarObs.observe(hogarEl);
    tabsObs.observe(tabsEl);

    return () => { hogarObs.disconnect(); tabsObs.disconnect(); };
  }, [currentPet?.id]);

  // ── dismissSheet: slides down from current position ──
  const dismissSheet = useCallback(() => {
    setIsDragging(false);
    setClosingSheet(true);
    setSheetDragY(window.innerHeight);
    setTimeout(() => {
      setShowAvatarPicker(false);
      setClosingSheet(false);
      setSheetDragY(0);
    }, 320);
  }, []);

  if (!currentPet) return null;

  // Determine hero image
  const avatarKey = currentPet.avatar_emoji;
  const heroImg = getPetImg(currentPet);

  const avatarOptions = SPECIES_AVATARS[currentPet.species] || SPECIES_AVATARS.other;
  const currentAvatarKey = (avatarKey && !DEFAULT_SPECIES_KEYS.has(avatarKey))
    ? avatarKey
    : 'img';

  const activeTabData = TABS.find(t => t.id === activeTab);

  const openEditSheet = () => {
    setNewName(currentPet.name || '');
    setPendingAvatarKey(currentAvatarKey);
    setSheetDragY(0);
    setClosingSheet(false);
    setShowAvatarPicker(true);
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  // ── Drag-to-dismiss handlers (handle bar only) ──
  const onHandlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = e.clientY;
    setIsDragging(true);
    setSheetDragY(0);
  };

  const onHandlePointerMove = (e) => {
    if (dragStart.current === null) return;
    const delta = e.clientY - dragStart.current;
    setSheetDragY(Math.max(0, delta));
  };

  const onHandlePointerUp = () => {
    dragStart.current = null;
    setIsDragging(false);
    if (sheetDragY > 80) {
      dismissSheet();
    } else {
      setSheetDragY(0);
    }
  };

  const handleAvatarSelect = (key) => setPendingAvatarKey(key);

  const handleSaveEdit = async () => {
    if (!newName.trim()) return;
    setSavingAvatar(true);
    const updates = {};
    if (newName.trim() !== currentPet.name) updates.name = newName.trim();
    if (pendingAvatarKey !== currentAvatarKey) updates.avatar_emoji = pendingAvatarKey;
    if (Object.keys(updates).length > 0) {
      await updatePet(currentPet.id, updates);
      await fetchPets();
    }
    setSavingAvatar(false);
    setShowAvatarPicker(false);
  };

  // Derived display flags
  const showHogarInHeader   = !hogarVisible;
  const showSectionInHeader = !tabsVisible; // implies showHogarInHeader

  return (
    <div className="hp-root" ref={rootRef}>

      {/* ══════════════════════════════════════
          STICKY HEADER — 3-column grid layout
          [hogar pill] | [section pill or name] | [name pill]
          ══════════════════════════════════════ */}
      <div
        ref={headerRef}
        className={`hp-header ${showHogarInHeader ? 'hp-header-compact' : ''}`}
      >
        {/* ── LEFT: Hogar pill ── */}
        <div className="hp-header-left">
          <button
            className={`hp-header-hogar-btn ${showHogarInHeader ? 'hp-header-hogar-in' : ''}`}
            onClick={() => navigate('/hogares')}
            tabIndex={showHogarInHeader ? 0 : -1}
            aria-hidden={!showHogarInHeader}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span>{currentHousehold?.name || 'Mi hogar'}</span>
          </button>
        </div>

        {/* ── CENTER: Section pill (scrolled) OR Pet name (default) ── */}
        <div className="hp-header-center">
          {showSectionInHeader ? (
            /* Section picker pill */
            <div className="hp-header-section-wrap">
              <button
                className="hp-header-section-pill"
                onClick={() => setShowTabDropdown(d => !d)}
                aria-label={`Sección: ${activeTabData?.label}`}
              >
                <span>{activeTabData?.label}</span>
                <svg
                  width="9" height="9" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5"
                  style={{
                    transform: showTabDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {/* Dropdown list of sections */}
              {showTabDropdown && (
                <div className="hp-header-dropdown" role="menu">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      role="menuitem"
                      className={`hp-header-dropdown-item ${tab.id === activeTab ? 'hp-header-dropdown-item-active' : ''}`}
                      onClick={() => { setActiveTab(tab.id); setShowTabDropdown(false); }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Default: pet name centered; fades out when compact kicks in */
            <span
              className={`hp-name-pill ${showHogarInHeader ? 'hp-name-pill-out' : ''}`}
              aria-hidden={showHogarInHeader}
            >
              {currentPet.name}
            </span>
          )}
        </div>

        {/* ── RIGHT: Pet name pill (compact mode) ── */}
        <div className="hp-header-right">
          <span
            className={`hp-name-pill ${showHogarInHeader ? '' : 'hp-name-pill-out'}`}
            aria-hidden={!showHogarInHeader}
          >
            {currentPet.name}
          </span>
        </div>
      </div>

      {/* Transparent backdrop — closes dropdown when clicked outside */}
      {showTabDropdown && (
        <div
          className="hp-dropdown-backdrop"
          onClick={() => setShowTabDropdown(false)}
          aria-hidden="true"
        />
      )}

      {/* ══════════════════════════════════════
          HERO AREA
          ══════════════════════════════════════ */}
      <div className="hp-hero-area">
        <div className="hp-hero">
          <div className="hp-hero-img-wrap">
            <img src={heroImg} alt={currentPet.name} className="hp-hero-img" />

            {/* Share button — bottom left */}
            <button
              className="hp-hero-share-btn"
              onClick={handleShare}
              aria-label="Compartir perfil"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </button>

            {/* Edit button — bottom right */}
            <button
              className="hp-hero-edit-btn"
              onClick={() => openEditSheet()}
              aria-label="Cambiar avatar"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
          <div className="hp-hero-shadow" />
        </div>
      </div>

      {/* ══════════════════════════════════════
          HOGAR PILL (in-page)
          ══════════════════════════════════════ */}
      <div className="hp-hogar-row">
        <button className="hp-hogar-pill" onClick={() => navigate('/hogares')}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          {currentHousehold?.name || 'Mi hogar'}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Sentinel 1 — exits viewport when hogar pill scrolls behind sticky header */}
      <div ref={hogarSentinelRef} className="hp-sentinel" aria-hidden="true" />

      {/* ══════════════════════════════════════
          ICON TABS
          ══════════════════════════════════════ */}
      <div className="hp-tabs-wrap" onContextMenu={e => e.preventDefault()}>
        <div className="hp-tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`hp-tab-btn ${isActive ? 'hp-tab-btn-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-label={tab.label}
              >
                <tab.Icon
                  size={22}
                  strokeWidth={1.5}
                  color={isActive ? '#ffffff' : '#8e8e93'}
                />
              </button>
            );
          })}
        </div>
      </div>
      <p className="hp-tab-active-label">{activeTabData?.label}</p>

      {/* Sentinel 2 — exits viewport when tabs scroll behind sticky header */}
      <div ref={tabsSentinelRef} className="hp-sentinel" aria-hidden="true" />

      {/* ══════════════════════════════════════
          TAB CONTENT
          ══════════════════════════════════════ */}
      <div className="hp-content">
        {activeTab === 'perfil'       && <PerfilTab   pet={currentPet} onPetUpdated={fetchPets} />}
        {activeTab === 'salud'        && <SaludTab    petId={currentPet.id} />}
        {activeTab === 'medicamentos' && <MedsTab     petId={currentPet.id} />}
        {activeTab === 'alimentos'    && <AlimentosTab petId={currentPet.id} />}
        {activeTab === 'citas'        && <CitasTab    petId={currentPet.id} />}
        {activeTab === 'vacunas'      && <VacunasTab  petId={currentPet.id} />}
      </div>

      {/* ══════════════════════════════════════
          AVATAR PICKER SHEET
          (position: fixed — above everything)
          ══════════════════════════════════════ */}
      {showAvatarPicker && (
        <div
          className={`hp-avatar-overlay ${closingSheet ? 'hp-avatar-overlay-closing' : ''}`}
          onClick={dismissSheet}
        >
          <div
            ref={sheetRef}
            className="hp-avatar-sheet"
            style={{
              transform: `translateY(${sheetDragY}px)`,
              transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              willChange: 'transform',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle — drag to dismiss */}
            <div
              className="hp-avatar-handle"
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
              onPointerCancel={onHandlePointerUp}
            />

            {/* Name editing */}
            <p className="hp-avatar-name-label">Nombre de la mascota</p>
            <input
              className="hp-avatar-name-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre…"
              maxLength={30}
            />

            <h3 className="hp-avatar-title">Cambiar avatar</h3>
            <div className="hp-avatar-grid">
              {avatarOptions.map((opt) => {
                const isActive = pendingAvatarKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    className={`hp-avatar-option ${isActive ? 'hp-avatar-option-active' : ''}`}
                    onClick={() => handleAvatarSelect(opt.key)}
                    disabled={savingAvatar}
                  >
                    <img src={opt.img} alt="avatar" className="hp-avatar-opt-img" />
                  </button>
                );
              })}
            </div>

            <button
              className="hp-avatar-save-btn"
              onClick={handleSaveEdit}
              disabled={savingAvatar || !newName.trim()}
            >
              {savingAvatar ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          PET SELECTOR — fixed bottom bar
          ══════════════════════════════════════ */}
      <div className="hp-selector-row">
        {pets.map((pet) => {
          const isActive = pet.id === currentPet.id;
          const bubbleImg = getPetImg(pet);
          return (
            <button
              key={pet.id}
              className={`hp-pet-bubble ${isActive ? 'hp-pet-bubble-active' : ''}`}
              onClick={() => selectPet(pet.id)}
              aria-label={pet.name}
            >
              <img src={bubbleImg} alt={pet.name} className="hp-bubble-img" />
            </button>
          );
        })}
        <button
          className="hp-pet-bubble hp-pet-bubble-add"
          onClick={() => navigate('/onboarding/especie')}
          aria-label="Agregar mascota"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {/* ══════════════════════════════════════
          SHARE MODAL
          ══════════════════════════════════════ */}
      {showShareModal && (
        <ShareModal
          petName={currentPet.name}
          url={`${window.location.origin}/pet/${currentPet.kimo_code || currentPet.id}`}
          onClose={() => setShowShareModal(false)}
        />
      )}

    </div>
  );
}
