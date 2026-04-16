import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Pill, UtensilsCrossed, CalendarDays, Syringe } from 'lucide-react';
import { usePets } from '../../pets/hooks/usePets';
import { useHousehold } from '../../household/hooks/useHousehold';
import PerfilTab from '../components/PerfilTab';
import MedsTab from '../components/MedsTab';
import AlimentosTab from '../components/AlimentosTab';
import CitasTab from '../components/CitasTab';
import VacunasTab from '../components/VacunasTab';
import gatoIcon from '../../../assets/gatito.webp';
import gatoGrisIcon from '../../../assets/gatito-gris.webp';
import persianCatIcon from '../../../assets/persian-cat.webp';
import gatoBlancoNegroIcon from '../../../assets/gato-blanco-negro.webp';
import gatoCareyIcon from '../../../assets/gato-carey.webp';
import calicoIcon from '../../../assets/calico.webp';
import huskyIcon from '../../../assets/husky.webp';
import dalmataIcon from '../../../assets/dalmata.webp';
import viringoIcon from '../../../assets/viringo.webp';
import shihtzuIcon from '../../../assets/shihtzu.webp';
import cockerSpanielIcon from '../../../assets/cocker-spaniel.webp';
import conejitoIcon from '../../../assets/conejito.webp';
import conejoNaranjaIcon from '../../../assets/conejo-naranja.webp';
import './HomePage.css';


// Avatar options per species — ONLY images, no emojis
const SPECIES_AVATARS = {
  cat: [
    { key: 'img',                  img: gatoIcon },
    { key: 'img-gris',             img: gatoGrisIcon },
    { key: 'img-persian',          img: persianCatIcon },
    { key: 'img-blanco-negro',     img: gatoBlancoNegroIcon },
    { key: 'img-carey',            img: gatoCareyIcon },
    { key: 'img-calico',           img: calicoIcon },
  ],
  dog: [
    { key: 'img',                  img: huskyIcon },
    { key: 'img-dalm',             img: dalmataIcon },
    { key: 'img-viringo',          img: viringoIcon },
    { key: 'img-shihtzu',          img: shihtzuIcon },
    { key: 'img-cocker',           img: cockerSpanielIcon },
  ],
  rabbit: [
    { key: 'img',               img: conejitoIcon },
    { key: 'img-conejo-nrj',    img: conejoNaranjaIcon },
  ],
  other: [
    { key: 'img-gato',            img: gatoIcon },
    { key: 'img-gris',            img: gatoGrisIcon },
    { key: 'img-persian',         img: persianCatIcon },
    { key: 'img-blanco-negro',    img: gatoBlancoNegroIcon },
    { key: 'img-carey',           img: gatoCareyIcon },
    { key: 'img-calico',          img: calicoIcon },
    { key: 'img-husky',           img: huskyIcon },
    { key: 'img-dalm',            img: dalmataIcon },
    { key: 'img-viringo',         img: viringoIcon },
    { key: 'img-shihtzu',         img: shihtzuIcon },
    { key: 'img-cocker',          img: cockerSpanielIcon },
    { key: 'img-conejito',        img: conejitoIcon },
    { key: 'img-conejo-nrj',      img: conejoNaranjaIcon },
  ],
};

const PET_IMG = {
  cat:    gatoIcon,
  dog:    huskyIcon,
  rabbit: conejitoIcon,
};

// Map stored avatar keys to actual image sources
// NOTE: 'img' (generic default) is intentionally NOT listed here —
// when a pet has key 'img', the code falls back to PET_IMG[species]
// which returns the correct default per species (husky for dog, gato for cat, etc.)
const AVATAR_KEY_TO_IMG = {
  'img-gris':          gatoGrisIcon,
  'img-persian':       persianCatIcon,
  'img-blanco-negro':  gatoBlancoNegroIcon,
  'img-carey':         gatoCareyIcon,
  'img-calico':        calicoIcon,
  'img-husky':         huskyIcon,
  'img-dalm':          dalmataIcon,
  'img-viringo':       viringoIcon,
  'img-shihtzu':       shihtzuIcon,
  'img-cocker':        cockerSpanielIcon,
  'img-conejito':      conejitoIcon,
  'img-conejo-nrj':    conejoNaranjaIcon,
};

const TABS = [
  { id: 'perfil',       label: 'Perfil',    Icon: PawPrint },
  { id: 'medicamentos', label: 'Meds',      Icon: Pill },
  { id: 'alimentos',    label: 'Comida',    Icon: UtensilsCrossed },
  { id: 'vacunas',      label: 'Vacunas',   Icon: Syringe },
  { id: 'citas',        label: 'Citas',     Icon: CalendarDays },
];

// Keys that mean "use the default species illustration"
const DEFAULT_SPECIES_KEYS = new Set(['🐕', '🐈', '🐇', '🐾', 'img']);

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

  const dragStart = useRef(null);
  const sheetRef = useRef(null);

  const { pets, currentPet, selectPet, fetchPets, updatePet } = usePets();
  const { currentHousehold } = useHousehold();

  // ── dismissSheet: desliza hacia abajo desde donde esté (sin saltar) ──
  const dismissSheet = useCallback(() => {
    setIsDragging(false);           // activa la transición
    setClosingSheet(true);          // fade-out del overlay
    setSheetDragY(window.innerHeight); // continúa bajando
    setTimeout(() => {
      setShowAvatarPicker(false);
      setClosingSheet(false);
      setSheetDragY(0);
    }, 320);
  }, []);

  if (!currentPet) return null;

  // Determine what image to show
  const avatarKey = currentPet.avatar_emoji;
  const heroImg = (avatarKey && AVATAR_KEY_TO_IMG[avatarKey])
    ? AVATAR_KEY_TO_IMG[avatarKey]
    : (PET_IMG[currentPet.species] || gatoIcon);

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

  // ── Drag-to-dismiss handlers (handle bar only) ──
  const onHandlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = e.clientY;
    setIsDragging(true);   // desactiva transición → sigue el dedo directo
    setSheetDragY(0);
  };

  const onHandlePointerMove = (e) => {
    if (dragStart.current === null) return;
    const delta = e.clientY - dragStart.current;
    setSheetDragY(Math.max(0, delta));
  };

  const onHandlePointerUp = () => {
    dragStart.current = null;
    setIsDragging(false);  // reactiva transición
    if (sheetDragY > 80) {
      dismissSheet();
    } else {
      setSheetDragY(0);    // snap-back suave hacia arriba
    }
  };

  const handleAvatarSelect = (key) => {
    setPendingAvatarKey(key);
  };

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

  return (
    <div className="hp-root">

      {/* ── 1. NOMBRE SIEMPRE COMO PILL ── */}
      <div className="hp-name-bar">
        <span className="hp-name-pill">{currentPet.name}</span>
      </div>

      {/* ── 2. HERO AREA (ocupa hasta la mitad de la pantalla) ── */}
      <div className="hp-hero-area">
        <div className="hp-hero">
          <div className="hp-hero-img-wrap">
            <img src={heroImg} alt={currentPet.name} className="hp-hero-img" />
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

        {/* Avatar picker sheet */}
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
              {/* Handle — arrastra para cerrar */}
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

              {/* Save button */}
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

        {/* Hogar pill */}
        <div className="hp-hogar-row">
          <button className="hp-hogar-pill" onClick={() => navigate('/hogares')}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            {currentHousehold?.name || 'Mi hogar'}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>{/* /hp-hero-area */}

      {/* ── 3. TABS — siempre al centro de la pantalla ── */}
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
      <p className="hp-tab-active-label">{activeTabData?.label}</p>

      {/* ── 4. CONTENT — solo esto scrollea ── */}
      <div className="hp-content">
        {activeTab === 'perfil' && (
          <PerfilTab pet={currentPet} onPetUpdated={fetchPets} />
        )}
        {activeTab === 'medicamentos' && (
          <MedsTab petId={currentPet.id} />
        )}
        {activeTab === 'alimentos' && (
          <AlimentosTab petId={currentPet.id} />
        )}
        {activeTab === 'citas' && (
          <CitasTab petId={currentPet.id} />
        )}
        {activeTab === 'vacunas' && (
          <VacunasTab petId={currentPet.id} />
        )}
      </div>

      {/* ── 5. PET SELECTOR (bottom fixed) ── */}
      <div className="hp-selector-row">
        {pets.map((pet) => {
          const isActive = pet.id === currentPet.id;
          const pKey = pet.avatar_emoji;
          const bubbleImg = (pKey && AVATAR_KEY_TO_IMG[pKey])
            ? AVATAR_KEY_TO_IMG[pKey]
            : (PET_IMG[pet.species] || gatoIcon);
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

    </div>
  );
}
