import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  LightbulbIcon,
  AlertCircleIcon,
  HeartIcon,
  MessageCircleIcon,
} from '../../../shared/components/Icons';
import kimoIcon from '../../../assets/icono.png';
import './FeedbackModal.css';

const CATEGORIES = [
  { key: 'sugerencia',  label: 'Sugerencia',        Icon: LightbulbIcon,    color: '#f59e0b' },
  { key: 'bug',         label: 'Algo no funciona',   Icon: AlertCircleIcon,  color: '#ef4444' },
  { key: 'me_encanta',  label: 'Me encanta algo',    Icon: HeartIcon,        color: '#ec4899' },
  { key: 'otro',        label: 'Otro',               Icon: MessageCircleIcon,color: '#6b7280' },
];

const APP_VERSION = 'v1.0.2';

export default function FeedbackModal({ userId, onClose }) {
  const [rating,   setRating]   = useState(0);
  const [hovered,  setHovered]  = useState(0);
  const [category, setCategory] = useState('');
  const [comment,  setComment]  = useState('');
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState('');

  const canSend = comment.trim().length >= 5;

  const handleSend = async () => {
    if (!canSend) return;
    setSending(true);
    setError('');

    const { error: err } = await supabase.from('app_feedback').insert({
      user_id:     userId || null,
      rating:      rating || null,
      category:    category || null,
      comment:     comment.trim(),
      app_version: APP_VERSION,
    });

    setSending(false);
    if (err) {
      setError('No se pudo enviar. Intenta de nuevo.');
    } else {
      setSent(true);
      setTimeout(onClose, 2200);
    }
  };

  return (
    <div className="fb-overlay" onClick={onClose}>
      <div className="fb-modal" onClick={(e) => e.stopPropagation()}>

        {sent ? (
          /* ── Success state ── */
          <div className="fb-success">
            <img src={kimoIcon} alt="KIMO" className="fb-success-logo" />
            <p className="fb-success-title">¡Gracias por tu opinión!</p>
            <p className="fb-success-sub">Tu comentario hace KIMO mejor para todos.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="fb-header">
              <p className="fb-title">¿Cómo va KIMO?</p>
              <button className="fb-close-btn" onClick={onClose} aria-label="Cerrar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <p className="fb-sub">Tu opinión nos ayuda a mejorar</p>

            {/* Star rating */}
            <div className="fb-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`fb-star ${(hovered || rating) >= star ? 'fb-star--active' : ''}`}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(rating === star ? 0 : star)}
                  aria-label={`${star} estrella${star !== 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Category pills */}
            <div className="fb-categories">
              {CATEGORIES.map(({ key, label, Icon, color }) => {
                const isActive = category === key;
                return (
                  <button
                    key={key}
                    className={`fb-category-pill ${isActive ? 'fb-category-pill--active' : ''}`}
                    onClick={() => setCategory(isActive ? '' : key)}
                    style={isActive ? { borderColor: color, color } : {}}
                  >
                    <Icon size={14} color={isActive ? color : '#8e8e93'} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Comment */}
            <textarea
              className="fb-textarea"
              placeholder="Cuéntanos qué pasó, qué mejorarías o qué te encanta…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
            />
            <p className="fb-char-count">{comment.length}/500</p>

            {error && <p className="fb-error">{error}</p>}

            {/* Send button */}
            <button
              className="fb-send-btn"
              onClick={handleSend}
              disabled={!canSend || sending}
            >
              {sending ? 'Enviando…' : 'Enviar comentario'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
