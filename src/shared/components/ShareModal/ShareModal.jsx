import { useState } from 'react';
import './ShareModal.css';

/**
 * ShareModal
 * Shows the pet's public profile URL with a copy button.
 *
 * Props:
 *  petName   string
 *  url       string   full public URL
 *  onClose   fn
 */
export default function ShareModal({ petName, url, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `🐾 Perfil de ${petName} en KIMO`,
        url,
      });
    } catch (_) { /* cancelled */ }
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-panel" onClick={(e) => e.stopPropagation()}>
        {/* Handle */}
        <div className="share-handle" />

        {/* Title */}
        <p className="share-title">Compartir perfil de <strong>{petName}</strong></p>
        <p className="share-subtitle">
          Cualquier persona con este enlace podrá ver la información de {petName}.
        </p>

        {/* URL box */}
        <div className="share-url-box">
          <span className="share-url-text">{url}</span>
        </div>

        {/* Actions */}
        <div className="share-actions">
          <button
            className={`share-copy-btn ${copied ? 'share-copy-done' : ''}`}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                ¡Copiado!
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copiar enlace
              </>
            )}
          </button>

          {navigator.share && (
            <button className="share-native-btn" onClick={handleNativeShare}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Compartir
            </button>
          )}
        </div>

        <button className="share-close-btn" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}
