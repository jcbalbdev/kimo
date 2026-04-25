/**
 * HogarCreateSheet
 * Bottom sheet / form para crear un nuevo hogar (personal u organización).
 * Extraído de HogaresPage para aislar el formulario de creación.
 */

import OrgCoverUpload from '../../../shared/components/OrgCoverUpload/OrgCoverUpload';
import '../../../shared/components/OrgCoverUpload/OrgCoverUpload.css';
import {
  HomeIcon, BuildingIcon,
} from '../../../shared/components/Icons';
import COUNTRIES from '../../../shared/constants/countries';

export default function HogarCreateSheet({
  // Type
  newType, onTypeChange, typeLocked,
  // Basic
  newName, onNameChange,
  // Org-specific
  newCountry, onCountryChange,
  newCity, onCityChange,
  newDescription, onDescriptionChange,
  newInstagram, onInstagramChange,
  newWhatsapp, onWhatsappChange,
  newFacebook, onFacebookChange,
  newTiktok, onTiktokChange,
  newWebsite, onWebsiteChange,
  newMaps, onMapsChange,
  // Cover
  newCoverPreview, onCoverReady,
  // Submit
  creating, createErr,
  onSubmit, onCancel,
}) {
  return (
    <div className="hogares-sheet-overlay" onClick={onCancel}>
      <form
        className="hogares-sheet"
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
      >
        {/* Top bar */}
        <div className="hogares-sheet-topbar">
          <button
            type="button"
            className="hogares-sheet-back-btn"
            onClick={onCancel}
            aria-label="Volver"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <span className="hogares-sheet-topbar-title">Nuevo hogar</span>
        </div>

        {/* Type selector */}
        {typeLocked ? (
          <div className="hogares-type-locked">
            {newType === 'personal'
              ? <><HomeIcon size={16} color="#2a8a6a" /> <span>Hogar Personal</span></>
              : <><BuildingIcon size={16} /> <span>Organización</span></>}
          </div>
        ) : (
          <div className="hogares-type-selector">
            <button
              type="button"
              className={`hogares-type-btn ${newType === 'personal' ? 'hogares-type-btn-active' : ''}`}
              onClick={() => onTypeChange('personal')}
            >
              <div className="hogares-type-icon"><HomeIcon size={20} color="#1c1c1e" /></div>
              <span className="hogares-type-label">Personal</span>
              <span className="hogares-type-desc">Familias, parejas, roomies</span>
            </button>
            <button
              type="button"
              className={`hogares-type-btn ${newType === 'organization' ? 'hogares-type-btn-active' : ''}`}
              onClick={() => onTypeChange('organization')}
            >
              <div className="hogares-type-icon"><BuildingIcon size={20} /></div>
              <span className="hogares-type-label">Organización</span>
              <span className="hogares-type-desc">Albergues, refugios, criadores</span>
            </button>
          </div>
        )}

        {/* Name input */}
        <input
          className="hogares-sheet-input"
          placeholder={newType === 'organization' ? 'Nombre de la organización' : 'Nombre del hogar (ej: Casa Pérez)'}
          value={newName}
          onChange={(e) => onNameChange(e.target.value)}
          autoFocus maxLength={40}
        />

        {/* Organization-only fields */}
        {newType === 'organization' && (
          <div className="hogares-org-fields">
            <OrgCoverUpload
              previewUrl={newCoverPreview}
              onFileReady={(blob, preview) => onCoverReady(blob, preview)}
              disabled={creating}
            />

            <div className="hogares-country-select-wrap">
              <select
                className="hogares-sheet-input hogares-country-select"
                value={newCountry}
                onChange={(e) => onCountryChange(e.target.value)}
              >
                <option value="">País</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <input
              className="hogares-sheet-input"
              placeholder="Ciudad"
              value={newCity}
              onChange={(e) => onCityChange(e.target.value)}
              maxLength={60}
            />

            <textarea
              className="hogares-sheet-input hogares-org-textarea"
              placeholder="Descripción breve de tu organización…"
              value={newDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              maxLength={200}
              rows={3}
            />

            <p className="hogares-org-section-label">Redes sociales (opcional)</p>

            {[
              { label: 'Instagram',  val: newInstagram,  onChange: onInstagramChange,  ph: '@usuario',                 max: 60,  type: 'text' },
              { label: 'WhatsApp',   val: newWhatsapp,   onChange: onWhatsappChange,   ph: '+51 999 999 999',          max: 30,  type: 'tel'  },
              { label: 'Facebook',   val: newFacebook,   onChange: onFacebookChange,   ph: 'nombre-página',            max: 60,  type: 'text' },
              { label: 'TikTok',     val: newTiktok,     onChange: onTiktokChange,     ph: '@usuario',                 max: 60,  type: 'text' },
            ].map(({ label, val, onChange, ph, max, type }) => (
              <div key={label} className="hogares-org-social-row">
                <span className="hogares-org-social-label">{label}</span>
                <input
                  className="hogares-sheet-input hogares-org-social-input"
                  placeholder={ph}
                  value={val}
                  onChange={(e) => onChange(e.target.value)}
                  maxLength={max}
                  type={type}
                />
              </div>
            ))}

            <p className="hogares-org-section-label" style={{ marginTop: '12px' }}>
              Contacto y ubicación <span style={{ fontWeight: 400, color: '#8e8e93' }}>(opcional)</span>
            </p>

            {[
              { label: 'Sitio web',     val: newWebsite, onChange: onWebsiteChange, ph: 'https://mialbergue.com',     max: 200 },
              { label: 'Google Maps',   val: newMaps,    onChange: onMapsChange,    ph: 'Pega el enlace de Google Maps', max: 400 },
            ].map(({ label, val, onChange, ph, max }) => (
              <div key={label} className="hogares-org-social-row">
                <span className="hogares-org-social-label">{label}</span>
                <input
                  className="hogares-sheet-input hogares-org-social-input"
                  placeholder={ph}
                  value={val}
                  onChange={(e) => onChange(e.target.value)}
                  maxLength={max}
                  type="url"
                />
              </div>
            ))}
          </div>
        )}

        {createErr && <p className="hogares-sheet-error">{createErr}</p>}
        <div className="hogares-sheet-actions">
          <button type="button" className="hogares-sheet-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="hogares-sheet-save" disabled={!newName.trim() || creating}>
            {creating ? 'Creando…' : 'Crear'}
          </button>
        </div>
      </form>
    </div>
  );
}
