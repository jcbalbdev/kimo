import { useEffect } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { supabase } from '../../lib/supabase';

/**
 * Registers the device for native push notifications (Android via FCM).
 * Only runs inside the Capacitor APK — is a no-op in the browser/PWA.
 * Saves the FCM token to Supabase so the backend can target this device.
 */
export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    registerPushNotifications(user.id);
  }, [user?.id]);
}

async function registerPushNotifications(userId) {
  try {
    // Dynamically import so the PWA (browser) never tries to load Capacitor
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return; // PWA → salir silenciosamente

    const { PushNotifications } = await import('@capacitor/push-notifications');

    // 1. Pedir permiso al usuario
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') {
      console.warn('[Push] Permiso denegado por el usuario.');
      return;
    }

    // 2. Registrar con FCM
    await PushNotifications.register();

    // 3. Guardar el token FCM en Supabase (con timezone del dispositivo)
    await PushNotifications.addListener('registration', async ({ value: token }) => {
      console.log('[Push] Token FCM recibido:', token);
      if (!supabase || !token) return;

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City';

      const { error } = await supabase.from('device_tokens').upsert(
        {
          user_id: userId,
          token,
          platform: 'android',
          timezone,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );

      if (error) console.warn('[Push] Error guardando token:', error.message);
    });

    // 4. Notificación recibida con la app abierta (foreground)
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Push] Notificación en foreground:', notification.title);
      // TODO: mostrar un toast o banner in-app
    });

    // 5. Usuario tocó la notificación
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[Push] Acción:', action.actionId, action.notification?.data);
      // TODO: navegar a la pantalla correcta según action.notification.data
    });

  } catch (err) {
    // En el navegador, @capacitor/push-notifications no está disponible — ignorar
    console.warn('[Push] Push notifications no disponibles:', err.message);
  }
}
