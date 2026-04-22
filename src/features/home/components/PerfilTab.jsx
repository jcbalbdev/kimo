import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import FormSheet from '../../../shared/components/FormSheet/FormSheet';
import { useScrollLock } from '../../../shared/hooks/useScrollLock';
import DatePicker from '../../../shared/components/DatePicker/DatePicker';
import './PerfilTab.css';

const SHEET_TITLES = {
  age: 'Edad',
  weight: 'Peso',
  bio: 'Descripción',
  gender: 'Género',
  sterilized: 'Esterilizado',
  microchip: 'Microchip'
};

const formatMicrochip = (value) => {
  if (!value) return '';
  const cleaned = value.toString().replace(/\D/g, '').slice(0, 15);
  const match = cleaned.match(/.{1,3}/g);
  return match ? match.join(' ') : cleaned;
};

export const calculateAge = (birthDate) => {
  if (!birthDate) return '';
  // ensure we handle timezone correctly by parsing YYYY-MM-DD
  const [year, month, day] = birthDate.split('-');
  const birth = new Date(year, month - 1, day || 1);
  const now = new Date();
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  
  if (years > 0) {
    if (months === 0) return years === 1 ? '1 año' : `${years} años`;
    return `${years} año${years > 1 ? 's' : ''}, ${months} mes${months > 1 ? 'es' : ''}`;
  }
  
  if (months > 0) return `${months} mes${months > 1 ? 'es' : ''}`;
  return 'Menos de 1 mes';
};

export default function PerfilTab({ pet, onPetUpdated }) {
  const [editing, setEditing] = useState(null);
  const [inputVal, setInputVal] = useState('');   // for age (manual), weight, bio, microchip
  const [toggleVal, setToggleVal] = useState(null); // for gender, sterilized
  const [birthDate, setBirthDate] = useState('');
  const [ageMode, setAgeMode] = useState('exact'); // 'exact', 'approx', 'manual'
  const [saving, setSaving] = useState(false);

  useScrollLock(!!editing);

  const isToggleField = (f) => f === 'gender' || f === 'sterilized';

  const openEdit = (field, currentVal) => {
    setEditing(field);
    if (isToggleField(field)) {
      setToggleVal(currentVal ?? null);
    } else if (field === 'age') {
      const getNum = (str) => {
        if (!str) return '';
        const matchAños = str.match(/(\d+)\s*año/i);
        if (matchAños) return matchAños[1];
        if (/mes/.test(str)) return '0';
        return str.replace(/\D/g, '');
      };

      if (pet.birth_date) {
        setAgeMode(pet.birth_date_is_approximate ? 'approx' : 'exact');
        setBirthDate(pet.birth_date_is_approximate ? pet.birth_date.substring(0, 7) : pet.birth_date);
        setInputVal(getNum(pet.age || calculateAge(pet.birth_date)));
      } else {
        setAgeMode('exact');
        setBirthDate('');
        setInputVal(getNum(pet.age));
      }
    } else {
      setInputVal(field === 'microchip' ? formatMicrochip(currentVal) : (currentVal ?? ''));
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
    } else if (editing === 'age') {
      if (!ageMode || !birthDate) {
        if (!inputVal.trim()) { setSaving(false); return; }
        updates = {
          birth_date: null,
          birth_date_is_approximate: false,
          age: inputVal.trim()
        };
      } else {
        let finalDate = birthDate;
        if (ageMode === 'approx' && finalDate.length === 7) {
          finalDate = `${finalDate}-01`;
        }

        updates = { 
          birth_date: finalDate, 
          birth_date_is_approximate: (ageMode === 'approx'),
          age: inputVal.trim() || calculateAge(finalDate) // persist user text or calculate
        };
      }
    } else {
      if (!inputVal.trim() && editing !== 'bio') { setSaving(false); return; }
      let dbValue = inputVal.trim();
      if (editing === 'microchip') {
        dbValue = dbValue.replace(/\s/g, ''); // Guardar sin espacios en BD
      }
      updates = {
        [editing === 'weight' ? 'weight_kg' : editing]: dbValue || null,
      };
    }

    const { error } = await supabase.from('pets').update(updates).eq('id', pet.id);
    if (!error) onPetUpdated();
    setSaving(false);
    setEditing(null);
  };

  const handleCancel = () => { 
    setEditing(null); 
    setInputVal(''); 
    setToggleVal(null); 
    setBirthDate(''); 
    setAgeMode('exact'); 
  };


  const genderLabel = { male: 'Macho', female: 'Hembra' };

  return (
    <div className="pt-root">
      {/* Row: Edad + Peso */}
      <div className="pt-stats-row">
        {pet.birth_date || pet.age ? (
          <button className="pt-stat-card pt-stat-card-btn" onClick={() => openEdit('age', null)}>
            <span className="pt-stat-label">Edad</span>
            <span className="pt-stat-value">
              {pet.birth_date 
                ? calculateAge(pet.birth_date) 
                : (!isNaN(Number(pet.age)) && pet.age ? `${pet.age} años` : pet.age)}
            </span>
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

      {/* Row: Microchip */}
      <div className="pt-stats-row">
        {pet.microchip ? (
          <button className="pt-stat-card pt-stat-card-btn" style={{ gridColumn: '1 / -1' }} onClick={() => openEdit('microchip', pet.microchip)}>
            <span className="pt-stat-label">Microchip</span>
            <span className="pt-stat-value">{formatMicrochip(pet.microchip)}</span>
          </button>
        ) : (
          <button className="pt-stat-card pt-stat-card-add" style={{ gridColumn: '1 / -1' }} onClick={() => openEdit('microchip', '')}>
            <span className="pt-add-icon">+</span>
            <span className="pt-add-text">Añadir Microchip</span>
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

        {editing === 'age' && (
          <div style={{ marginBottom: '24px' }}>
            <label className="pt-sheet-hint" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1c1c1e', fontSize: '13px' }}>
              Edad actual
            </label>
            <input
              className="pt-sheet-input"
              type="tel"
              placeholder="Ej: 5"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </div>
        )}

        {editing === 'age' && (
          <div style={{ marginBottom: '16px' }}>
            <label className="pt-sheet-hint" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#1c1c1e', fontSize: '13px' }}>
              Cumpleaños (Opcional - ajustará la edad mes a mes)
            </label>
            <div className="pt-seg-control-lg">
              <button
                className={`pt-seg-btn-lg ${ageMode === 'exact' ? 'pt-seg-active' : ''}`}
                onClick={() => {
                  setAgeMode(ageMode === 'exact' ? null : 'exact');
                  if (ageMode !== 'exact' && birthDate && birthDate.length === 7) {
                    setBirthDate(`${birthDate}-01`);
                  }
                }}
              >
                Exacto
              </button>
              <button
                className={`pt-seg-btn-lg ${ageMode === 'approx' ? 'pt-seg-active' : ''}`}
                onClick={() => {
                   setAgeMode(ageMode === 'approx' ? null : 'approx');
                   if (ageMode !== 'approx' && birthDate && birthDate.length === 10) {
                     setBirthDate(birthDate.substring(0, 7));
                   }
                }}
              >
                Aproximado
              </button>
            </div>
            
            {ageMode && (
              <div style={{ marginTop: '12px' }}>
                {ageMode === 'approx' ? (
                  /* Approximate: year+month only — use two number selects */
                  <div className="pt-approx-row">
                    <select
                      className="pt-sheet-input"
                      value={birthDate ? birthDate.split('-')[1] : ''}
                      onChange={(e) => {
                        const [y] = birthDate ? birthDate.split('-') : [new Date().getFullYear()];
                        const newDate = `${y || new Date().getFullYear()}-${e.target.value}`;
                        setBirthDate(newDate);
                        const fullDate = `${newDate}-01`;
                        const calculated = calculateAge(fullDate);
                        if (calculated) {
                          const matchA = calculated.match(/(\d+)\s*año/i);
                          if (matchA) setInputVal(matchA[1]);
                          else if (/mes/.test(calculated)) setInputVal('0');
                        }
                      }}
                    >
                      <option value="">Mes</option>
                      {['01','02','03','04','05','06','07','08','09','10','11','12'].map((m, i) => (
                        <option key={m} value={m}>
                          {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][i]}
                        </option>
                      ))}
                    </select>
                    <select
                      className="pt-sheet-input"
                      value={birthDate ? birthDate.split('-')[0] : ''}
                      onChange={(e) => {
                        const [, m] = birthDate ? birthDate.split('-') : ['', '01'];
                        const newDate = `${e.target.value}-${m || '01'}`;
                        setBirthDate(newDate);
                        const fullDate = `${newDate}-01`;
                        const calculated = calculateAge(fullDate);
                        if (calculated) {
                          const matchA = calculated.match(/(\d+)\s*año/i);
                          if (matchA) setInputVal(matchA[1]);
                          else if (/mes/.test(calculated)) setInputVal('0');
                        }
                      }}
                    >
                      <option value="">Año</option>
                      {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  /* Exact: full date picker */
                  <DatePicker
                    value={birthDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(newDate) => {
                      setBirthDate(newDate);
                      if (newDate) {
                        const calculated = calculateAge(newDate);
                        if (calculated) {
                          const matchA = calculated.match(/(\d+)\s*año/i);
                          if (matchA) setInputVal(matchA[1]);
                          else if (/mes/.test(calculated)) setInputVal('0');
                        }
                      }
                    }}
                  />
                )}
                {ageMode === 'approx' && <p className="pt-sheet-hint">Selecciona el mes y año aproximado en el que nació.</p>}
              </div>
            )}
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

        {(editing === 'weight' || editing === 'microchip') && (
          <input
            className="pt-sheet-input"
            type={editing === 'weight' ? 'number' : 'tel'}
            placeholder={editing === 'microchip' ? 'Ej: 985 121 023 456 789' : 'Ej: 4.5'}
            value={inputVal}
            onChange={(e) => {
              if (editing === 'microchip') {
                setInputVal(formatMicrochip(e.target.value));
              } else {
                setInputVal(e.target.value);
              }
            }}
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
