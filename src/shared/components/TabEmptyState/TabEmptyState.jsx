/**
 * TabEmptyState
 * Shared empty-state card used by MedsTab, AlimentosTab, CitasTab,
 * VacunasTab, SaludTab (and any future tabs).
 *
 * Props:
 *  - icon     ReactElement  Lucide (or any) icon component, size/color handled here
 *  - title    string        Bold heading ("Sin vacunas aún.")
 *  - subtitle string        Soft hint below the title
 */
export default function TabEmptyState({ icon, title, subtitle }) {
  return (
    <div className="tab-empty-state">
      {icon && (
        <div className="tab-empty-icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <p>{title}</p>
      {subtitle && <span>{subtitle}</span>}
    </div>
  );
}
