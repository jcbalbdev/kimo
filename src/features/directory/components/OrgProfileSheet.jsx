import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { getPetImg } from '../../../shared/utils/petAvatars';
import { ADOPTION_STATUSES } from '../../home/components/PerfilTab';
import './OrgProfileSheet.css';

const SPECIES_LABEL = { cat: 'Gato', dog: 'Perro', rabbit: 'Conejo' };
const GENDER_LABEL  = { male: '♂ Macho', female: '♀ Hembra' };

function AdoptionBadge({ status, size = 'md' }) {
  if (!status) return null;
  const s = ADOPTION_STATUSES.find(x => x.key === status);
  if (!s) return null;
  return (
    <span
      className={`ops-adoption-badge ops-adoption-badge--${size}`}
      style={{ background: s.bg, color: s.color, borderColor: s.color }}
    >
      {s.label}
    </span>
  );
}

function PetDetailScreen({ pet, onClose }) {
  if (!pet) return null;
  const img = getPetImg(pet);
  const age = getPetAge(pet);
  const genderLabel = pet.gender ? GENDER_LABEL[pet.gender] || pet.gender : null;
  const speciesLabel = pet.species ? SPECIES_LABEL[pet.species] || pet.species : null;

  return (
    <div className="ops-pet-screen">

      {/* ── Top bar (in normal flow, never overlapped) ── */}
      <div className="ops-pet-screen-topbar">
        <button className="ops-pet-screen-back" onClick={onClose} aria-label="Volver">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="ops-pet-screen-name-chip">{pet.name}</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Large circular photo hero */}
      <div className="ops-pet-screen-hero">
        <div className="ops-pet-screen-avatar-ring">
          <img
            src={img}
            alt={pet.name}
            className={`ops-pet-screen-avatar${pet.photo_url ? ' ops-pet-screen-avatar--photo' : ''}`}
          />
        </div>
      </div>

      {/* Scrollable info below */}
      <div className="ops-pet-screen-body">
        {/* Info chips row */}
        {(speciesLabel || genderLabel || age || pet.adoption_status) && (
          <div className="ops-pet-screen-chips">
            {pet.adoption_status && <AdoptionBadge status={pet.adoption_status} size="lg" />}
            {speciesLabel && <span className="ops-pet-screen-chip ops-pet-screen-chip--species">{speciesLabel}</span>}
            {genderLabel  && <span className="ops-pet-screen-chip ops-pet-screen-chip--gender">{genderLabel}</span>}
            {age          && <span className="ops-pet-screen-chip ops-pet-screen-chip--age">🎂 {age}</span>}
          </div>
        )}

        {/* Info grid cards */}
        <div className="ops-pet-screen-grid">
          {age && (
            <div className="ops-pet-screen-card">
              <span className="ops-pet-screen-card-label">EDAD</span>
              <span className="ops-pet-screen-card-value">{age}</span>
            </div>
          )}
          {speciesLabel && (
            <div className="ops-pet-screen-card">
              <span className="ops-pet-screen-card-label">ESPECIE</span>
              <span className="ops-pet-screen-card-value">{speciesLabel}</span>
            </div>
          )}
          {genderLabel && (
            <div className="ops-pet-screen-card">
              <span className="ops-pet-screen-card-label">GÉNERO</span>
              <span className="ops-pet-screen-card-value">{genderLabel}</span>
            </div>
          )}
        </div>

        {/* Bio / descripción */}
        {pet.bio && (
          <div className="ops-pet-screen-bio-card">
            <span className="ops-pet-screen-card-label">DESCRIPCIÓN</span>
            <p className="ops-pet-screen-bio">{pet.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getPetAge(pet) {
  if (pet.birth_date) {
    const birth = new Date(pet.birth_date);
    const now   = new Date();
    const total = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (total < 1)  return 'Recién nacido';
    if (total < 12) return `${total} mes${total !== 1 ? 'es' : ''}`;
    const y = Math.floor(total / 12);
    const m = total % 12;
    return m > 0 ? `${y} año${y !== 1 ? 's' : ''} ${m}m` : `${y} año${y !== 1 ? 's' : ''}`;
  }
  if (pet.age != null && pet.age > 0) {
    return `${pet.age} año${pet.age !== 1 ? 's' : ''}`;
  }
  return null;
}

const IG_SVG = <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>;
const WA_SVG = <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>;
const FB_SVG = <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const TT_SVG = <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.52V6.75a4.85 4.85 0 01-1.02-.06z"/></svg>;

export default function OrgProfileSheet({ org, onClose }) {
  const [pets,        setPets]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    if (!org?.id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('pets')
        .select('id, name, species, birth_date, age, avatar_emoji, photo_url, gender, bio, adoption_status')
        .eq('household_id', org.id)
        .order('name');
      setPets(data || []);
      setLoading(false);
    })();
  }, [org?.id]);

  if (!org) return null;

  // Support both old directory_* columns and new non-prefixed ones
  const ig      = org.directory_instagram || org.instagram;
  // WhatsApp only shown if user explicitly enabled visibility
  const wa      = org.directory_whatsapp_public ? (org.directory_whatsapp || org.whatsapp) : null;
  const fb      = org.directory_facebook  || org.facebook;
  const tt      = org.directory_tiktok    || org.tiktok;
  const website = org.directory_website   || null;
  const maps    = org.directory_maps      || null;
  const desc    = org.directory_description || org.description;
  const city    = org.directory_city || org.city;
  const { country } = org;

  return (
    <div className="ops-fullscreen">
      {/* Fixed top bar */}
      <div className="ops-topbar">
        <button className="ops-back-btn" onClick={onClose} aria-label="Volver">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="ops-topbar-title">Albergue</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Scrollable content */}
      <div className="ops-scroll">
        {/* Cover */}
        <div className="ops-cover">
          {org.directory_cover_url
            ? <img src={org.directory_cover_url} alt={org.name} className="ops-cover-img" />
            : <div className="ops-cover-placeholder">🏠</div>
          }
        </div>

        <div className="ops-body">
          {/* Name + location */}
          <h1 className="ops-name">{org.name}</h1>
          <div className="ops-location-row">
            {city && (
              <span className="ops-location-chip">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {city}
              </span>
            )}
            {country && (
              <span className="ops-location-chip">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                {country}
              </span>
            )}
          </div>

          {desc && <p className="ops-desc">{desc}</p>}

          {/* Social links + Web + Maps */}
          {(ig || wa || fb || tt || website || maps) && (
            <div className="ops-socials">
              {ig && (
                <a href={`https://instagram.com/${ig.replace('@', '')}`}
                   target="_blank" rel="noopener noreferrer"
                   className="ops-social-btn ops-social-ig">
                  {IG_SVG} Instagram
                </a>
              )}
              {wa && (
                <a href={`https://wa.me/${wa.replace(/[^0-9]/g, '')}`}
                   target="_blank" rel="noopener noreferrer"
                   className="ops-social-btn ops-social-wa">
                  {WA_SVG} WhatsApp
                </a>
              )}
              {fb && (
                <a href={fb.startsWith('http') ? fb : `https://facebook.com/${fb}`}
                   target="_blank" rel="noopener noreferrer"
                   className="ops-social-btn ops-social-fb">
                  {FB_SVG} Facebook
                </a>
              )}
              {tt && (
                <a href={`https://tiktok.com/@${tt.replace('@', '')}`}
                   target="_blank" rel="noopener noreferrer"
                   className="ops-social-btn ops-social-tt">
                  {TT_SVG} TikTok
                </a>
              )}
              {website && (
                <a href={website.startsWith('http') ? website : `https://${website}`}
                   target="_blank" rel="noopener noreferrer"
                   className="ops-social-btn ops-social-web">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  Sitio web
                </a>
              )}
              {maps && (
                <a href={maps}
                   target="_blank" rel="noopener noreferrer"
                   className="ops-social-btn ops-social-maps">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Cómo llegar
                </a>
              )}
            </div>
          )}

          {/* Pets section */}
          <div className="ops-section-header">
            <span className="ops-section-title">🐾 Mascotas en el albergue</span>
            {!loading && <span className="ops-pet-count">{pets.length}</span>}
          </div>

          {loading ? (
            <p className="ops-loading">Cargando mascotas…</p>
          ) : pets.length === 0 ? (
            <p className="ops-empty">Este albergue aún no tiene mascotas registradas en KIMO.</p>
          ) : (
            <div className="ops-pets-grid">
              {pets.map((pet) => {
                const img = getPetImg(pet);
                return (
                  <button
                    key={pet.id}
                    className="ops-pet-card"
                    onClick={() => setSelectedPet(pet)}
                    aria-label={`Ver perfil de ${pet.name}`}
                  >
                    <div className="ops-pet-avatar-circle">
                      <img
                        src={img}
                        alt={pet.name}
                        className={`ops-pet-img${pet.photo_url ? ' ops-pet-img--photo' : ''}`}
                      />
                      {pet.adoption_status && (
                        <AdoptionBadge status={pet.adoption_status} size="sm" />
                      )}
                    </div>
                    <p className="ops-pet-name">{pet.name}</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Bottom spacer */}
          <div style={{ height: 32 }} />
        </div>
      </div>

      {/* Pet detail screen — sibling of ops-scroll so it sits above everything */}
      {selectedPet && (
        <PetDetailScreen pet={selectedPet} onClose={() => setSelectedPet(null)} />
      )}
    </div>
  );
}
