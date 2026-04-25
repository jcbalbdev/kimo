import { useRef, useState } from 'react';
import { compressImage } from '../../utils/imageUtils';
import './OrgCoverUpload.css';

/**
 * OrgCoverUpload
 * Tap-to-select cover photo with in-browser compression preview.
 *
 * Props:
 *  onFileReady(blob, previewUrl)  — called after compression with the WebP blob
 *  previewUrl                     — current preview URL (controlled)
 *  disabled                       — bool
 */
export default function OrgCoverUpload({ onFileReady, previewUrl, disabled }) {
  const inputRef = useRef(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic type guard
    if (!file.type.startsWith('image/')) {
      setError('Selecciona una imagen válida (JPG, PNG, HEIC…)');
      return;
    }

    setError('');
    setCompressing(true);
    try {
      const blob    = await compressImage(file, { maxWidth: 800, maxHeight: 400, quality: 0.82 });
      const preview = URL.createObjectURL(blob);
      onFileReady(blob, preview);
    } catch {
      setError('No se pudo procesar la imagen. Intenta con otra.');
    } finally {
      setCompressing(false);
      // Reset input so same file can be re-selected
      e.target.value = '';
    }
  };

  return (
    <div className="ocu-wrap">
      <button
        type="button"
        className={`ocu-btn ${previewUrl ? 'ocu-btn--has-img' : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
        disabled={disabled || compressing}
        aria-label="Subir foto de portada"
      >
        {compressing ? (
          <div className="ocu-compressing">
            <div className="ocu-spinner" />
            <span>Optimizando…</span>
          </div>
        ) : previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" className="ocu-preview" />
            <div className="ocu-overlay">
              <span>✏️ Cambiar foto</span>
            </div>
          </>
        ) : (
          <div className="ocu-placeholder">
            <span className="ocu-icon">📷</span>
            <span className="ocu-label">Foto de portada</span>
            <span className="ocu-hint">JPG, PNG · se comprime automáticamente</span>
          </div>
        )}
      </button>

      {error && <p className="ocu-error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  );
}
