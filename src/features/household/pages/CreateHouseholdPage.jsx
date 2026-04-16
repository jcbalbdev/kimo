import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHousehold } from '../hooks/useHousehold';
import Button from '../../../shared/components/Button/Button';
import Input from '../../../shared/components/Input/Input';
import './HouseholdPages.css';

export default function CreateHouseholdPage() {
  const navigate = useNavigate();
  const { createHousehold } = useHousehold();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');

    const { data, error: err } = await createHousehold(name.trim());
    if (err) {
      setError(err);
      setLoading(false);
    } else {
      navigate('/onboarding/especie');
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-content">
        <div className="auth-logo">
          <span className="auth-logo-emoji">🏠</span>
        </div>
        <h1 className="auth-title">Tu hogar</h1>
        <p className="auth-subtitle">
          Dale un nombre a tu hogar. Podrás invitar a otros cuidadores después.
        </p>

        <form className="auth-form" onSubmit={handleCreate}>
          <Input
            label="Nombre del hogar"
            placeholder="Ej: Casa de Luna, Mi hogar..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          {error && <p className="auth-error">{error}</p>}

          <Button type="submit" loading={loading} disabled={!name.trim()}>
            Crear hogar
          </Button>
        </form>
      </div>
    </div>
  );
}
