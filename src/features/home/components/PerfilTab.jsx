import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export const ADOPTION_STATUSES = [
  { key: 'disponible',     label: 'Disponible',          color: '#22c55e', bg: '#dcfce7' },
  { key: 'urgente',        label: 'Urgente',             color: '#ef4444', bg: '#fee2e2' },
  { key: 'en_cuarentena',  label: 'En cuarentena',       color: '#3b82f6', bg: '#dbeafe' },
  { key: 'en_tratamiento', label: 'En tratamiento',      color: '#f59e0b', bg: '#fef3c7' },
  { key: 'en_transito',    label: 'En familia de tránsito', color: '#8b5cf6', bg: '#ede9fe' },
  { key: 'reservado',      label: 'Reservado',           color: '#f97316', bg: '#ffedd5' },
];

const formatMicrochip = (value) => {
  if (!value) return '';
  const cleaned = value.toString().replace(/\D/g, '').slice(0, 15);
  const match = cleaned.match(/.{1,3}/g);
  return match ? match.join(' ') : cleaned;
};

export const calculateAge = (birthDate) => {
  if (!birthDate) return '';
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
    const yStr = years === 1 ? '1 año' : `${years} años`;
    const mStr = months === 1 ? '1 mes' : `${months} meses`;
    return `${yStr}, ${mStr}`;
  }
  if (months > 0) return months === 1 ? '1 mes' : `${months} meses`;
  return 'Menos de 1 mes';
};

// Parse years from age string (e.g. "2 años, 3 meses" → 2, "6" → 6)
const parseYears = (str) => {
  if (!str) return '';
  const m = str.match(/(\d+)\s*año/i);
  if (m) return m[1];
  if (/mes/i.test(str)) return '0';
  return str.replace(/\D/g, '') || '0';
};

// Parse months from age string
const parseMonths = (str) => {
  if (!str) return 0;
  const m = str.match(/(\d+)\s*mes/i);
  return m ? parseInt(m[1], 10) : 0;
};

// Build a human-readable age string from years + months
export const buildAgeStr = (y, m) => {
  const years = parseInt(y, 10) || 0;
  const months = parseInt(m, 10) || 0;
  if (years === 0 && months === 0) return null;
  if (years === 0) return months === 1 ? '1 mes' : `${months} meses`;
  if (months === 0) return years === 1 ? '1 año' : `${years} años`;
  return `${years === 1 ? '1 año' : `${years} años`}, ${months === 1 ? '1 mes' : `${months} meses`}`;
};

export default function PerfilTab({ pet, onPetUpdated, isOrgHousehold = false }) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null);
  const [inputVal, setInputVal] = useState('');   // years (age) or value for weight/bio/microchip
  const [monthsVal, setMonthsVal] = useState(0); // months for age field
  const [toggleVal, setToggleVal] = useState(null);
  const [birthDate, setBirthDate] = useState('');
  const [ageMode, setAgeMode] = useState('exact'); // 'exact', 'approx', or null (manual)
  const [saving, setSaving] = useState(false);
  // Optimistic state para adopción — cambia al instante sin esperar a Supabase
  const [localAdoptionStatus, setLocalAdoptionStatus] = useState(pet?.adoption_status ?? null);


  useScrollLock(!!editing);

  const isToggleField = (f) => f === 'gender' || f === 'sterilized';

  const openEdit = (field, currentVal) => {
    setEditing(field);
    if (isToggleField(field)) {
      setToggleVal(currentVal ?? null);
    } else if (field === 'age') {
      if (pet.birth_date) {
        const mode = pet.birth_date_is_approximate ? 'approx' : 'exact';
        setAgeMode(mode);
        setBirthDate(pet.birth_date_is_approximate ? pet.birth_date.substring(0, 7) : pet.birth_date);
        const src = pet.age || calculateAge(pet.birth_date);
        setInputVal(parseYears(src));
        setMonthsVal(parseMonths(src));
      } else {
        setAgeMode('exact');
        setBirthDate('');
        setInputVal(parseYears(pet.age));
        setMonthsVal(parseMonths(pet.age));
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
        // Manual entry: build string from years + months
        const ageStr = buildAgeStr(inputVal, monthsVal);
        if (!ageStr) { setSaving(false); return; }
        updates = {
          birth_date: null,
          birth_date_is_approximate: false,
          age: ageStr,
        };
      } else {
        let finalDate = birthDate;
        if (ageMode === 'approx' && finalDate.length === 7) finalDate = `${finalDate}-01`;
        updates = {
          birth_date: finalDate,
          birth_date_is_approximate: (ageMode === 'approx'),
          age: calculateAge(finalDate),
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
    setMonthsVal(0);
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
                : (!isNaN(Number(pet.age)) && pet.age
                    ? buildAgeStr(pet.age, 0)
                    : pet.age)}
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

      {/* ── Adoption Status (only for organization households) ── */}
      {isOrgHousehold && (
        <div className="pt-adoption-block">
          <p className="pt-adoption-label">Estado de adopción</p>
          <div className="pt-adoption-pills">
            {ADOPTION_STATUSES.map(({ key, label, color, bg }) => {
              const isActive = localAdoptionStatus === key;
              return (
                <button
                  key={key}
                  className={`pt-adoption-pill ${isActive ? 'pt-adoption-pill--active' : ''}`}
                  style={isActive ? { background: bg, color, borderColor: color } : {}}
                  onClick={() => {
                    const newStatus = isActive ? null : key;
                    const prev = localAdoptionStatus;
                    // 1. Cambio instantáneo en la UI
                    setLocalAdoptionStatus(newStatus);
                    // 2. Persist en Supabase en segundo plano
                    supabase
                      .from('pets')
                      .update({ adoption_status: newStatus })
                      .eq('id', pet.id)
                      .then(({ error }) => {
                        if (error) {
                          // Revertir si falla
                          setLocalAdoptionStatus(prev);
                        } else {
                          onPetUpdated();
                        }
                      });
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {!localAdoptionStatus && (
            <p className="pt-adoption-hint">Selecciona el estado actual de {pet.name}</p>
          )}
        </div>
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
            <label className="pt-sheet-hint" style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: '#1c1c1e', fontSize: '13px' }}>
              Edad actual
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <input
                  className="pt-sheet-input"
                  type="tel"
                  placeholder="0"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  style={{ textAlign: 'center' }}
                />
                <p className="pt-sheet-hint" style={{ textAlign: 'center', marginTop: '5px', marginBottom: 0 }}>años</p>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  className="pt-sheet-input"
                  type="tel"
                  placeholder="0"
                  value={monthsVal === 0 ? '' : monthsVal}
                  onChange={(e) => {
                    const v = parseInt(e.target.value.replace(/\D/g, ''), 10);
                    setMonthsVal(isNaN(v) ? 0 : Math.min(11, v));
                  }}
                  style={{ textAlign: 'center' }}
                />
                <p className="pt-sheet-hint" style={{ textAlign: 'center', marginTop: '5px', marginBottom: 0 }}>meses (0–11)</p>
              </div>
            </div>
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
                          setInputVal(parseYears(calculated));
                          setMonthsVal(parseMonths(calculated));
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
                          setInputVal(parseYears(calculated));
                          setMonthsVal(parseMonths(calculated));
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
                          setInputVal(parseYears(calculated));
                          setMonthsVal(parseMonths(calculated));
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
