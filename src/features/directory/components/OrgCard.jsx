/**
 * OrgCard
 * Card de organización para la pestaña "Comunidad".
 * Extraído de HogaresPage para mantenerlo aislado y reutilizable.
 */

import SocialLinks from '../../../shared/components/SocialLinks/SocialLinks';
import './OrgCard.css';

export default function OrgCard({ org, onClick }) {
  return (
    <div
      className="orgcard"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Cover image / placeholder */}
      {org.directory_cover_url ? (
        <img src={org.directory_cover_url} alt={org.name} className="orgcard-cover" />
      ) : (
        <div className="orgcard-cover-placeholder">
          <span>🏠</span>
        </div>
      )}

      <div className="orgcard-body">
        {/* Name + location chips */}
        <div className="orgcard-header">
          <p className="orgcard-name">{org.name}</p>
          <div className="orgcard-location-chips">
            {org.city    && <span className="orgcard-chip orgcard-chip--accent">{org.city}</span>}
            {org.country && <span className="orgcard-chip orgcard-chip--accent">{org.country}</span>}
          </div>
        </div>

        {/* Description */}
        {org.description && (
          <p className="orgcard-desc">{org.description}</p>
        )}

        {/* Social pills */}
        <SocialLinks
          ig={org.instagram}
          wa={org.whatsapp}
          waPublic={org.directory_whatsapp_public}
          fb={org.facebook}
          tt={org.tiktok}
          website={org.directory_website}
          maps={org.directory_maps}
          size="sm"
          className="orgcard-socials"
        />
      </div>
    </div>
  );
}
