import { AuthProvider } from '../features/auth/hooks/useAuth';
import { HouseholdProvider } from '../features/household/hooks/useHousehold';
import { ToastProvider } from '../shared/hooks/useToast';
import ToastContainer from '../shared/components/Toast/ToastContainer';
import Router from './Router';

export default function App() {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <ToastProvider>
          <Router />
          <ToastContainer />
        </ToastProvider>
      </HouseholdProvider>
    </AuthProvider>
  );
}
