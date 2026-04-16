import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useHousehold } from '../features/household/hooks/useHousehold';
import { usePets } from '../features/pets/hooks/usePets';
import kimoIcon from '../assets/icono.png';

import LoginPage from '../features/auth/pages/LoginPage';
import HogaresPage from '../features/household/pages/HogaresPage';
import CreateHouseholdPage from '../features/household/pages/CreateHouseholdPage';
import JoinHouseholdPage from '../features/household/pages/JoinHouseholdPage';
import HouseholdPage from '../features/household/pages/HouseholdPage';
import WelcomePage from '../features/onboarding/pages/WelcomePage';
import SpeciesSelectPage from '../features/onboarding/pages/SpeciesSelectPage';
import PetNamePage from '../features/onboarding/pages/PetNamePage';
import HomePage from '../features/home/pages/HomePage';
import MedicationsPage from '../features/medications/pages/MedicationsPage';
import FeedingsPage from '../features/feedings/pages/FeedingsPage';
import HealthPage from '../features/health/pages/HealthPage';
import PetProfilePage from '../features/pets/pages/PetProfilePage';

// Auth guard — must be logged in
function RequireAuth() {
  const { isAuthenticated, loading, isConfigured } = useAuth();

  if (!isConfigured) {
    return (
      <div className="auth-page">
        <div className="auth-content">
          <div className="auth-logo"><span className="auth-logo-emoji">⚙️</span></div>
          <h1 className="auth-title">Configuración</h1>
          <p className="auth-subtitle">
            Agrega tus credenciales de Supabase en el archivo <strong>.env</strong> del proyecto y reinicia el servidor.
          </p>
          <div style={{ 
            background: 'var(--bg-input)', 
            borderRadius: 'var(--border-radius-md)', 
            padding: 'var(--space-md)',
            fontSize: 'var(--font-size-caption)',
            fontFamily: 'monospace',
            textAlign: 'left',
            width: '100%',
            marginTop: 'var(--space-md)',
            wordBreak: 'break-all'
          }}>
            VITE_SUPABASE_URL=https://xxx.supabase.co<br/>
            VITE_SUPABASE_ANON_KEY=eyJhbG...
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-content">
          <div className="auth-logo">
            <img src={kimoIcon} alt="KIMO" className="auth-logo-img" />
          </div>
          <p className="auth-subtitle">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Household guard — must have a household selected
function RequireHousehold() {
  const { currentHousehold, loading } = useHousehold();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-content">
          <div className="auth-logo">
            <img src={kimoIcon} alt="KIMO" className="auth-logo-img" />
          </div>
          <p className="auth-subtitle">Cargando hogar...</p>
        </div>
      </div>
    );
  }

  if (!currentHousehold) return <Navigate to="/hogares" replace />;
  return <Outlet />;
}

// Pet guard — must have at least one pet
function RequirePets() {
  const { hasPets, loading } = usePets();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-content">
          <div className="auth-logo">
            <img src={kimoIcon} alt="KIMO" className="auth-logo-img" />
          </div>
          <p className="auth-subtitle">Cargando mascotas...</p>
        </div>
      </div>
    );
  }

  if (!hasPets) return <Navigate to="/onboarding/especie" replace />;
  return <Outlet />;
}

// Main app layout — no bottom nav, navigation is inside HomePage tabs
function AppLayout() {
  return <Outlet />;
}

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unirse/:code" element={<JoinHouseholdPage />} />
        <Route path="/unirse" element={<JoinHouseholdPage />} />

        {/* Auth required */}
        <Route element={<RequireAuth />}>
          {/* Household selection — shown right after login */}
          <Route path="/hogares" element={<HogaresPage />} />
          <Route path="/crear-hogar" element={<CreateHouseholdPage />} />

          {/* Household required */}
          <Route element={<RequireHousehold />}>
            {/* Onboarding */}
            <Route path="/onboarding" element={<WelcomePage />} />
            <Route path="/onboarding/especie" element={<SpeciesSelectPage />} />
            <Route path="/onboarding/nombre" element={<PetNamePage />} />

            {/* Household management */}
            <Route path="/hogar" element={<HouseholdPage />} />

            {/* Main app — requires at least 1 pet */}
            <Route element={<RequirePets />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/medicamentos" element={<MedicationsPage />} />
                <Route path="/alimentacion" element={<FeedingsPage />} />
                <Route path="/salud" element={<HealthPage />} />
                <Route path="/perfil" element={<PetProfilePage />} />
              </Route>
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/hogares" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
