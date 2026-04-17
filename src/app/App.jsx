import { AuthProvider } from '../features/auth/hooks/useAuth';
import { HouseholdProvider } from '../features/household/hooks/useHousehold';
import { ToastProvider } from '../shared/hooks/useToast';
import ToastContainer from '../shared/components/Toast/ToastContainer';
import { useKeyboardHeight } from '../shared/hooks/useKeyboardHeight';
import Router from './Router';

function AppInner() {
  // Tracks the iOS virtual keyboard and exposes --keyboard-h CSS variable
  // globally so all bottom sheets can shift up when the keyboard appears.
  useKeyboardHeight();
  return (
    <>
      <Router />
      <ToastContainer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <ToastProvider>
          <AppInner />
        </ToastProvider>
      </HouseholdProvider>
    </AuthProvider>
  );
}
