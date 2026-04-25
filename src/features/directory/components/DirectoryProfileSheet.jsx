import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import COUNTRIES from '../../../shared/constants/countries';
import OrgCoverUpload from '../../../shared/components/OrgCoverUpload/OrgCoverUpload';
import '../../../shared/components/OrgCoverUpload/OrgCoverUpload.css';
import './DirectoryProfileSheet.css';

// WhatsApp excluded — handled separately with its own visibility toggle
const NETWORK_FIELDS = [
  { key: 'directory_instagram', label: 'Instagram', placeholder: '@nombre_del_albergue' },
  { key: 'directory_facebook',  label: 'Facebook',  placeholder: 'facebook.com/albergue' },
  { key: 'directory_tiktok',    label: 'TikTok',    placeholder: '@albergue' },
];

export default function DirectoryProfileSheet({ household, onClose, onSaved }) {
  const [form, setForm] = useState({
    directory_visible:         household.directory_visible         ?? false,
    directory_description:     household.directory_description     || household.description || '',
    directory_city:            household.directory_city            || household.city        || '',
    country:                   household.country                                            || '',
    directory_instagram:       household.directory_instagram       || household.instagram   || '',
    directory_whatsapp:        household.directory_whatsapp        || household.whatsapp    || '',
    directory_whatsapp_public: household.directory_whatsapp_public ?? false,
    directory_facebook:        household.directory_facebook        || household.facebook    || '',
    directory_tiktok:          household.directory_tiktok          || household.tiktok      || '',
    directory_website:         household.directory_website         || '',
    directory_maps:            household.directory_maps            || '',
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');
  // Cover photo
  const [coverBlob,    setCoverBlob]    = useState(null);
  const [coverPreview, setCoverPreview] = useState(household.directory_cover_url || '');

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setErr('');

    // Upload new cover if selected
    let updatedForm = { ...form };
    if (coverBlob) {
      const path = `${household.id}/cover.webp`;
      const { error: upErr } = await supabase.storage
        .from('org-covers')
        .upload(path, coverBlob, { contentType: 'image/webp', upsert: true });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from('org-covers').getPublicUrl(path);
        // Cache-buster so the browser fetches the updated image
        updatedForm.directory_cover_url = `${urlData.publicUrl}?v=${Date.now()}`;
      }
    }

    const { error } = await supabase
      .from('households')
      .update(updatedForm)
      .eq('id', household.id);
    setSaving(false);
    if (error) { setErr('No se pudo guardar. Intenta de nuevo.'); return; }
    onSaved?.();
    onClose();
  };

  return (
    <div className="dir-sheet-overlay">
      <div className="dir-sheet">

        {/* ── Sticky top bar ── */}
        <div className="dir-sheet-topbar">
          <button
            className="dir-sheet-close-btn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
          <p className="dir-sheet-topbar-title">Perfil de vitrina</p>
          {/* Spacer to center title */}
          <div style={{ width: 34 }} />
        </div>

        {/* ── Scrollable body ── */}
        <div className="dir-sheet-body">
          <p className="dir-sheet-sub" style={{ textAlign: 'center', margin: '0 0 4px' }}>
            Así aparecerá tu organización en KIMO
          </p>

          {/* Toggle visible */}
          <div className="dir-toggle-row">
            <div>
              <p className="dir-toggle-label">Mostrar en la vitrina</p>
              <p className="dir-toggle-desc">
                {form.directory_visible
                  ? 'Tu organización es visible para todos los usuarios'
                  : 'Solo tú puedes ver este perfil'}
              </p>
            </div>
            <button
              type="button"
              className={`dir-toggle-btn ${form.directory_visible ? 'dir-toggle-btn--on' : ''}`}
              onClick={() => set('directory_visible', !form.directory_visible)}
            >
              <span className="dir-toggle-thumb" />
            </button>
          </div>

          {/* Divider */}
          <div className="dir-divider" />

          {/* Cover photo */}
          <label className="dir-label">Foto de portada <span className="dir-optional">(opcional)</span></label>
          <OrgCoverUpload
            previewUrl={coverPreview}
            onFileReady={(blob, preview) => { setCoverBlob(blob); setCoverPreview(preview); }}
            disabled={saving}
          />

          {/* Description */}
          <label className="dir-label">Descripción <span className="dir-optional">(opcional)</span></label>
          <textarea
            className="dir-textarea"
            placeholder="Cuéntanos sobre tu organización, qué hacen y cómo ayudan..."
            maxLength={200}
            value={form.directory_description}
            onChange={(e) => set('directory_description', e.target.value)}
          />
          <p className="dir-char-count">{form.directory_description.length}/200</p>

          {/* País */}
          <label className="dir-label">País <span className="dir-optional">(opcional)</span></label>
          <select
            className="dir-input dir-select"
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
          >
            <option value="">Selecciona un país</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </select>

          {/* City */}
          <label className="dir-label">Ciudad <span className="dir-optional">(opcional)</span></label>
          <input
            className="dir-input"
            placeholder="ej: Lima"
            value={form.directory_city}
            onChange={(e) => set('directory_city', e.target.value)}
            maxLength={60}
          />

          {/* Social networks (Instagram, Facebook, TikTok) */}
          <p className="dir-section-label">Redes sociales <span className="dir-optional">(opcional)</span></p>
          {NETWORK_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key} className="dir-network-row">
              <span className="dir-network-label">{label}</span>
              <input
                className="dir-input dir-input--network"
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => set(key, e.target.value)}
                maxLength={120}
              />
            </div>
          ))}

          {/* WhatsApp — with its own visibility toggle */}
          <div className="dir-wa-block">
            <div className="dir-wa-header">
              <span className="dir-section-label" style={{ margin: 0 }}>WhatsApp <span className="dir-optional">(opcional)</span></span>
              <div className="dir-wa-switch-row">
                <span className="dir-wa-switch-label">
                  {form.directory_whatsapp_public ? 'Visible en el directorio' : 'Oculto al público'}
                </span>
                <button
                  type="button"
                  className={`dir-toggle-btn dir-toggle-btn--sm ${form.directory_whatsapp_public ? 'dir-toggle-btn--on' : ''}`}
                  onClick={() => set('directory_whatsapp_public', !form.directory_whatsapp_public)}
                  disabled={!form.directory_whatsapp}
                  title={!form.directory_whatsapp ? 'Ingresa un número primero' : ''}
                >
                  <span className="dir-toggle-thumb" />
                </button>
              </div>
            </div>
            <div className="dir-network-row" style={{ marginTop: 8 }}>
              <span className="dir-network-label">Número</span>
              <input
                className="dir-input dir-input--network"
                placeholder="+51 999 000 111"
                value={form.directory_whatsapp}
                onChange={(e) => {
                  set('directory_whatsapp', e.target.value);
                  // If number cleared, also hide it
                  if (!e.target.value) set('directory_whatsapp_public', false);
                }}
                maxLength={20}
                type="tel"
              />
            </div>
          </div>

          {/* Web + Maps */}
          <p className="dir-section-label" style={{ marginTop: '16px' }}>Contacto y ubicación <span className="dir-optional">(opcional)</span></p>
          <div className="dir-network-row">
            <span className="dir-network-label">Sitio web</span>
            <input
              className="dir-input dir-input--network"
              placeholder="https://mialbergue.com"
              type="url"
              value={form.directory_website}
              onChange={(e) => set('directory_website', e.target.value)}
              maxLength={200}
            />
          </div>
          <div className="dir-network-row">
            <span className="dir-network-label">Google Maps</span>
            <input
              className="dir-input dir-input--network"
              placeholder="Pega aquí el enlace de Google Maps"
              type="url"
              value={form.directory_maps}
              onChange={(e) => set('directory_maps', e.target.value)}
              maxLength={400}
            />
          </div>

          {err && <p className="dir-err">{err}</p>}

          {/* Actions */}
          <div className="dir-actions">
            <button className="dir-btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button className="dir-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
