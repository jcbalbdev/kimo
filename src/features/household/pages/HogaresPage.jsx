import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { useInvitations } from '../hooks/useInvitations';
import { supabase } from '../../../lib/supabase';
import kimoIcon from '../../../assets/icono.png';
import './HogaresPage.css';

// ── Icons ─────────────────────────────────────────────────
const HomeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" className="hogares-item-arrow">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const UserPlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/>
    <line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

export default function HogaresPage() {
  const navigate  = useNavigate();
  const { profile, signOut } = useAuth();
  const { households, loading, createHousehold, selectHousehold, fetchHouseholds } = useHousehold();
  const {
    pendingInvitations,
    inviteByEmail,
    generateInviteLink,
    acceptInvitation,
    declineInvitation,
  } = useInvitations();

  const [householdPets, setHouseholdPets]               = useState({});
  const [householdMemberCounts, setHouseholdMemberCounts] = useState({});

  // ── Create hogar ───────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState('');
  const [creating,   setCreating]   = useState(false);
  const [createErr,  setCreateErr]  = useState('');

  // ── Invite sheet ───────────────────────────────────────
  const [inviteHH,    setInviteHH]    = useState(null); // household being invited to
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting,    setInviting]    = useState(false);
  const [inviteMsg,   setInviteMsg]   = useState(''); // success/error message
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied,      setCopied]      = useState(false);

  // ── Pending invitation shown in modal ──────────────────
  const [currentInvIdx, setCurrentInvIdx] = useState(0);
  const [acceptingInv,  setAcceptingInv]  = useState(false);

  // Load pets per household
  useEffect(() => {
    async function fetchHouseholdData() {
      if (!households.length) return;
      const pets = {};
      const memberCounts = {};

      for (const hh of households) {
        // pets
        const { data: petData } = await supabase
          .from('pets')
          .select('id')
          .eq('household_id', hh.id);
        pets[hh.id] = petData || [];

        // member count via SECURITY DEFINER function (bypasses RLS self-reference)
        const { data: memberCount } = await supabase
          .rpc('get_household_member_count', { p_household_id: hh.id });
        memberCounts[hh.id] = memberCount ?? 0;
      }

      setHouseholdPets(pets);
      setHouseholdMemberCounts(memberCounts);
    }
    fetchHouseholdData();
  }, [households]);

  const handleSelect = (hh) => { selectHousehold(hh); navigate('/'); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true); setCreateErr('');
    const { error: err } = await createHousehold(newName.trim());
    if (err) { setCreateErr(err); setCreating(false); }
    else { setShowCreate(false); setNewName(''); setCreating(false); navigate('/onboarding/especie'); }
  };

  // ── Invite sheet handlers ──────────────────────────────
  const openInviteSheet = (hh) => {
    setInviteHH(hh);
    setInviteEmail('');
    setInviteMsg('');
    setGeneratedLink('');
    setCopied(false);
  };

  const closeInviteSheet = () => {
    setInviteHH(null);
    setInviteMsg('');
    setGeneratedLink('');
  };

  const handleInviteByEmail = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true); setInviteMsg('');
    const { error, alreadySent } = await inviteByEmail(inviteHH.id, inviteEmail);
    setInviting(false);
    if (alreadySent) { setInviteMsg('⚠️ Ya enviaste una invitación pendiente a este email.'); return; }
    if (error) {
      // Show actual DB error to help diagnose (table not found, RLS, etc.)
      const msg = error?.message || JSON.stringify(error);
      setInviteMsg(`❌ ${msg}`);
      return;
    }
    setInviteMsg('✅ ¡Invitación enviada! La verán al abrir la app.');
    setInviteEmail('');
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Pending invitation accept/decline ──────────────────
  const handleAcceptInv = async (inv) => {
    setAcceptingInv(true);
    await acceptInvitation(inv.id, inv.households.id);
    // Reload households list so the new hogar appears immediately
    await fetchHouseholds(true);
    setAcceptingInv(false);
    setCurrentInvIdx(0);
  };

  const handleDeclineInv = async (inv) => {
    await declineInvitation(inv.id);
    setCurrentInvIdx(0);
  };

  const displayName = profile?.display_name || 'Usuario';
  const currentInv  = pendingInvitations[currentInvIdx];

  return (
    <div className="hogares-page">

      {/* ── Pending invitation modal ── */}
      {currentInv && (
        <div className="hogares-inv-overlay">
          <div className="hogares-inv-modal">
            <div className="hogares-inv-icon">
              <HomeIcon />
            </div>
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
              <button
                className="hogares-inv-decline"
                onClick={() => handleDeclineInv(currentInv)}
                disabled={acceptingInv}
              >
                Rechazar
              </button>
              <button
                className="hogares-inv-accept"
                onClick={() => handleAcceptInv(currentInv)}
                disabled={acceptingInv}
              >
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
        {loading ? (
          <div className="hogares-loading">Cargando hogares...</div>
        ) : (
          <div className="hogares-list">
            {households.length === 0 && !showCreate && (
              <p className="hogares-empty">No tienes hogares aún. Crea uno para empezar.</p>
            )}
            {households.map((hh) => {
              return (
                <div key={hh.id} className="hogares-item-row">
                  <button className="hogares-item" onClick={() => handleSelect(hh)}>
                    <div className="hogares-item-avatar"><HomeIcon /></div>
                    <div className="hogares-item-info">
                      <span className="hogares-item-name">{hh.name}</span>
                      <span className="hogares-item-role">
                        {(() => {
                          const petCount = (householdPets[hh.id] || []).length;
                          const memberCount = householdMemberCounts[hh.id] ?? 0;
                          const petStr = petCount === 0 ? 'Sin mascotas' : `${petCount} mascota${petCount !== 1 ? 's' : ''}`;
                          const memberStr = memberCount === 1 ? '1 cuidador' : `${memberCount} cuidadores`;
                          return `${petStr} · ${memberStr}`;
                        })()}
                      </span>
                    </div>
                    <ChevronIcon />
                  </button>
                  {/* Invite button */}
                  <button
                    className="hogares-invite-btn"
                    onClick={() => openInviteSheet(hh)}
                    title="Invitar a alguien"
                  >
                    <UserPlusIcon />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add hogar button */}
        <button className="hogares-add-btn" onClick={() => setShowCreate(true)}>
          <PlusIcon />
        </button>
      </div>

      {/* ── Bottom sheet: crear hogar ── */}
      {showCreate && (
        <div className="hogares-sheet-overlay"
          onClick={() => { setShowCreate(false); setNewName(''); setCreateErr(''); }}>
          <form className="hogares-sheet" onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <div className="hogares-sheet-handle" />
            <h3 className="hogares-sheet-title">🏠 Nuevo hogar</h3>
            <input
              className="hogares-sheet-input"
              placeholder="Nombre del hogar (ej: Casa Pérez)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus maxLength={40}
            />
            {createErr && <p className="hogares-sheet-error">{createErr}</p>}
            <div className="hogares-sheet-actions">
              <button type="button" className="hogares-sheet-cancel"
                onClick={() => { setShowCreate(false); setNewName(''); setCreateErr(''); }}>
                Cancelar
              </button>
              <button type="submit" className="hogares-sheet-save"
                disabled={!newName.trim() || creating}>
                {creating ? 'Creando…' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Bottom sheet: invitar persona ── */}
      {inviteHH && (
        <div className="hogares-sheet-overlay" onClick={closeInviteSheet}>
          <div className="hogares-sheet hogares-invite-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="hogares-sheet-handle" />
            <h3 className="hogares-sheet-title">Invitar a {inviteHH.name}</h3>

            {/* ── Case 1: tiene cuenta ── */}
            <p className="hogares-invite-section-label">Si tiene cuenta en KIMO</p>
            <div className="hogares-invite-email-row">
              <input
                className="hogares-sheet-input hogares-invite-input"
                type="email"
                placeholder="email@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteMsg(''); }}
              />
              <button
                className="hogares-invite-send-btn"
                onClick={handleInviteByEmail}
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? '…' : 'Invitar'}
              </button>
            </div>

            {inviteMsg && <p className="hogares-invite-msg">{inviteMsg}</p>}

            {/* ── Divider ── */}
            <div className="hogares-invite-divider">
              <div className="hogares-invite-divider-line" />
              <span>o</span>
              <div className="hogares-invite-divider-line" />
            </div>

            {/* ── Case 2: sin cuenta — generate link ── */}
            <p className="hogares-invite-section-label">Si no tiene cuenta</p>

            {!generatedLink ? (
              <button
                className="hogares-invite-link-btn"
                onClick={handleGenerateLink}
                disabled={generatingLink}
              >
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

            <button className="hogares-sheet-cancel hogares-invite-close"
              onClick={closeInviteSheet}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
