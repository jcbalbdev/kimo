import { useState, useEffect } from 'react';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, footer }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 250);
  };

  if (!isOpen && !closing) return null;

  return (
    <>
      <div
        className={`modal-backdrop ${closing ? 'modal-backdrop-closing' : ''}`}
        onClick={handleClose}
      />
      <div className={`modal-sheet ${closing ? 'modal-sheet-closing' : ''}`}>
        <div className="modal-handle">
          <div className="modal-handle-bar" />
        </div>
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button className="modal-close" onClick={handleClose} aria-label="Cerrar">
              ✕
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </>
  );
}
