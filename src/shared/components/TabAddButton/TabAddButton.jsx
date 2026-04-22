/**
 * TabAddButton
 * Gradient pill-button that lives at the bottom of every home tab.
 *
 * Props:
 *  - label    string    Button label (e.g. "+ Agregar medicamento")
 *  - onClick  fn        Click handler
 *  - id       string?   Optional id for E2E / accessibility
 */
export default function TabAddButton({ label, onClick, id }) {
  return (
    <button className="tab-add-card" onClick={onClick} id={id}>
      <span className="tab-add-text">{label}</span>
    </button>
  );
}
