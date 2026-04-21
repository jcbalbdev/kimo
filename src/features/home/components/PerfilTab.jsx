import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import FormSheet from '../../../shared/components/FormSheet/FormSheet';
import { useScrollLock } from '../../../shared/hooks/useScrollLock';
import './PerfilTab.css';

const SHEET_TITLES = {
  age: 'Edad',
  weight: 'Peso',
  bio: 'Descripción',
  gender: 'Género',
  sterilized: 'Esterilizado',
};

export default function PerfilTab({ pet, onPetUpdated }) {
  const [editing, setEditing] = useState(null);
  const [inputVal, setInputVal] = useState('');   // for age, weight, bio
  const [toggleVal, setToggleVal] = useState(null); // for gender, sterilized
  const [saving, setSaving] = useState(false);

  useScrollLock(!!editing);

  const isToggleField = (f) => f === 'gender' || f === 'sterilized';

  const openEdit = (field, currentVal) => {
    setEditing(field);
    if (isToggleField(field)) {
      setToggleVal(currentVal ?? null);
    } else {
      setInputVal(currentVal ?? '');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    let updates;

    if (editing === 'gender') {
      if (toggleVal === null) { setSaving(false); return; }
      updates = { gender: toggleVal };
    } else if (editing === 'sterilized') {
      if (toggleVal === null) { setSaving(false); return; }
      updates = { sterilized: toggleVal };
    } else {
      if (!inputVal.trim() && editing !== 'bio') { setSaving(false); return; }
      updates = {
        [editing === 'weight' ? 'weight_kg' : editing]: inputVal.trim() || null,
      };
    }

    const { error } = await supabase.from('pets').update(updates).eq('id', pet.id);
    if (!error) onPetUpdated();
    setSaving(false);
    setEditing(null);
  };

  const handleCancel = () => { setEditing(null); setInputVal(''); setToggleVal(null); };

  const genderLabel = { male: 'Macho', female: 'Hembra' };

  return (
    <div className="pt-root">
      {/* Row: Edad + Peso */}
      <div className="pt-stats-row">
        {pet.age ? (
          <button className="pt-stat-card pt-stat-card-btn" onClick={() => openEdit('age', pet.age)}>
            <span className="pt-stat-label">Edad</span>
            <span className="pt-stat-value">{pet.age}</span>
          </button>
        ) : (
          <button className="pt-stat-card pt-stat-card-add" onClick={() => openEdit('age', '')}>
            <span className="pt-add-icon">+</span>
            <span className="pt-add-text">Edad</span>
          </button>
        )}

        {pet.weight_kg ? (
          <button className="pt-stat-card pt-stat-card-btn" onClick={() => openEdit('weight', pet.weight_kg)}>
            <span className="pt-stat-label">Peso</span>
            <span className="pt-stat-value">{pet.weight_kg} kg</span>
          </button>
        ) : (
          <button className="pt-stat-card pt-stat-card-add" onClick={() => openEdit('weight', '')}>
            <span className="pt-add-icon">+</span>
            <span className="pt-add-text">Peso</span>
          </button>
        )}
      </div>

      {/* Row: Género + Esterilizado — same style as Edad/Peso */}
      <div className="pt-stats-row">
        {/* Género */}
        {pet.gender ? (
          <button className="pt-stat-card pt-stat-card-btn" onClick={() => openEdit('gender', pet.gender)}>
            <span className="pt-stat-label">Género</span>
            <span className="pt-stat-value">{genderLabel[pet.gender]}</span>
          </button>
        ) : (
          <button className="pt-stat-card pt-stat-card-add" onClick={() => openEdit('gender', null)}>
            <span className="pt-add-icon">+</span>
            <span className="pt-add-text">Género</span>
          </button>
        )}

        {/* Esterilizado */}
        {pet.sterilized !== null && pet.sterilized !== undefined ? (
          <button className="pt-stat-card pt-stat-card-btn" onClick={() => openEdit('sterilized', pet.sterilized)}>
            <span className="pt-stat-label">Esterilizado</span>
            <span className="pt-stat-value">{pet.sterilized ? 'Sí' : 'No'}</span>
          </button>
        ) : (
          <button className="pt-stat-card pt-stat-card-add" onClick={() => openEdit('sterilized', null)}>
            <span className="pt-add-icon">+</span>
            <span className="pt-add-text">Esterilizado</span>
          </button>
        )}
      </div>

      {/* Bio / Descripción */}
      {pet.bio ? (
        <button className="pt-bio-card pt-bio-card-btn" onClick={() => openEdit('bio', pet.bio)}>
          <span className="pt-bio-label">Descripción</span>
          <p className="pt-bio-text">{pet.bio}</p>
        </button>
      ) : (
        <button className="pt-bio-card pt-bio-card-add" onClick={() => openEdit('bio', '')}>
          <svg className="pt-add-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          <span className="pt-add-text">Agrega una descripción de {pet.name}…</span>
        </button>
      )}

      {/* Edit Sheet — uses shared FormSheet */}
      <FormSheet
        isOpen={!!editing}
        onClose={handleCancel}
        title={SHEET_TITLES[editing] || ''}
        onSave={handleSave}
        saving={saving}
        saveDisabled={isToggleField(editing) && toggleVal === null}
      >
        {/* Toggle fields — segmented control */}
        {editing === 'gender' && (
          <div className="pt-seg-control-lg">
            <button
              className={`pt-seg-btn-lg ${toggleVal === 'male' ? 'pt-seg-active' : ''}`}
              onClick={() => setToggleVal('male')}
            >
              Macho
            </button>
            <button
              className={`pt-seg-btn-lg ${toggleVal === 'female' ? 'pt-seg-active' : ''}`}
              onClick={() => setToggleVal('female')}
            >
              Hembra
            </button>
          </div>
        )}

        {editing === 'sterilized' && (
          <div className="pt-seg-control-lg">
            <button
              className={`pt-seg-btn-lg ${toggleVal === false ? 'pt-seg-active' : ''}`}
              onClick={() => setToggleVal(false)}
            >
              No
            </button>
            <button
              className={`pt-seg-btn-lg ${toggleVal === true ? 'pt-seg-active' : ''}`}
              onClick={() => setToggleVal(true)}
            >
              Sí
            </button>
          </div>
        )}

        {/* Text / Number fields */}
        {editing === 'bio' && (
          <textarea
            className="pt-sheet-textarea"
            placeholder={`Describe a ${pet.name}… personalidad, gustos, historia…`}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            rows={4}
            autoFocus
          />
        )}

        {(editing === 'age' || editing === 'weight') && (
          <input
            className="pt-sheet-input"
            type={editing === 'weight' ? 'number' : 'text'}
            placeholder={editing === 'age' ? 'Ej: 2 años' : 'Ej: 4.5'}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            autoFocus
          />
        )}

        {editing === 'weight' && (
          <p className="pt-sheet-hint">Ingresa el peso en kg (ej: 4.5)</p>
        )}
      </FormSheet>
    </div>
  );
}
