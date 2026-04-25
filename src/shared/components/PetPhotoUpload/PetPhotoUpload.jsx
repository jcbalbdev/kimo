import { useRef, useState } from 'react';
import { compressImage } from '../../utils/imageUtils';
import './PetPhotoUpload.css';

/**
 * PetPhotoUpload
 * Tap-to-select pet photo with in-browser compression (400×400 WebP).
 * Displays a circular preview matching the avatar bubbles in the app.
 *
 * Props:
 *  onFileReady(blob, previewUrl)  — called after compression with the WebP blob
 *  previewUrl                     — current preview URL (controlled)
 *  disabled                       — bool
 */
export default function PetPhotoUpload({ onFileReady, previewUrl, disabled }) {
  const inputRef = useRef(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Selecciona una imagen válida (JPG, PNG, HEIC…)');
      return;
    }

    setError('');
    setCompressing(true);
    try {
      // Square crop target — will be displayed circular via CSS
      const blob    = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.85 });
      const preview = URL.createObjectURL(blob);
      onFileReady(blob, preview);
    } catch {
      setError('No se pudo procesar la imagen. Intenta con otra.');
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  return (
    <div className="ppu-wrap">
      <button
        type="button"
        className={`ppu-btn ${previewUrl ? 'ppu-btn--has-img' : ''}`}
        onClick={() => !disabled && inputRef.current?.click()}
        disabled={disabled || compressing}
        aria-label="Subir foto de tu mascota"
      >
        {compressing ? (
          <div className="ppu-compressing">
            <div className="ppu-spinner" />
          </div>
        ) : previewUrl ? (
          <>
            <img src={previewUrl} alt="Foto de mascota" className="ppu-preview" />
          </>
        ) : (
          <div className="ppu-placeholder">
            <span className="ppu-icon">📷</span>
            <span className="ppu-label">Mi foto</span>
          </div>
        )}
      </button>

      {error && <p className="ppu-error">{error}</p>}

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
