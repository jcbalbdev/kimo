import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePets } from '../../pets/hooks/usePets';
import { SPECIES_AVATARS, PET_IMG } from '../../../shared/utils/petAvatars';
import Button from '../../../shared/components/Button/Button';
import './PetNamePage.css';

export default function PetNamePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addPet } = usePets();
  const [name, setName]             = useState('');
  const [saving, setSaving]         = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null); // null = use default

  const { species, customSpecies } = location.state || { species: 'other', customSpecies: null };

  // Avatars available for this species
  const avatarOptions = SPECIES_AVATARS[species] || SPECIES_AVATARS.other;

  // Preview image: chosen avatar or species default
  const previewImg = selectedKey
    ? (avatarOptions.find((a) => a.key === selectedKey)?.img ?? avatarOptions[0].img)
    : (PET_IMG[species] ?? avatarOptions[0].img);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await addPet({
      name: name.trim(),
      species,
      customSpecies,
      avatarKey: selectedKey || 'img',
    });
    setTimeout(() => navigate('/'), 400);
  };

  return (
    <div className="petname-page">
      {/* ── Close button ── */}
      <button className="petname-close-btn" onClick={() => navigate(-1)} aria-label="Volver">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <form className="petname-content" onSubmit={handleSubmit}>

        {/* ── Tappable avatar ── */}
        <div className="petname-avatar-wrap animate-scale-in">
          <button type="button" className="petname-avatar-btn" onClick={() => setShowPicker((v) => !v)}>
            <img src={previewImg} alt="avatar" className="petname-avatar-img" />
            <span className="petname-avatar-hint">{showPicker ? 'Cerrar' : 'Cambiar avatar'}</span>
          </button>
        </div>

        {/* ── Avatar picker grid ── */}
        {showPicker && (
          <div className="petname-picker animate-fade-in-up">
            {avatarOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`petname-picker-opt${
                  (selectedKey === opt.key || (!selectedKey && opt.key === 'img'))
                    ? ' petname-picker-opt--active'
                    : ''
                }`}
                onClick={() => { setSelectedKey(opt.key); setShowPicker(false); }}
              >
                <img src={opt.img} alt={opt.key} />
              </button>
            ))}
          </div>
        )}

        {customSpecies && (
          <p className="petname-species animate-fade-in">{customSpecies}</p>
        )}

        <h1 className="petname-title animate-fade-in-up">
          ¿Cómo se llama?
        </h1>

        <div className="petname-input-wrapper animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <input
            className="petname-input"
            type="text"
            placeholder="Nombre de tu mascota"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={30}
          />
        </div>

        <div className="petname-action animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Button type="submit" size="lg" disabled={!name.trim()} loading={saving}>
            ¡Listo!
          </Button>
        </div>
      </form>
    </div>
  );
}
