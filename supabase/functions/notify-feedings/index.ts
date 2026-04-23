import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno&no-check';

// ── Env vars ─────────────────────────────────────────────────────────────────
const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIREBASE_SERVICE_ACCOUNT  = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!; // JSON string

// ── FCM: generate OAuth2 access token from service account ───────────────────
async function getFCMAccessToken(sa: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss:   sa.client_email,
    sub:   sa.client_email,
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  const b64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signingInput = `${b64url(header)}.${b64url(payload)}`;

  // Import RSA private key
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\n/g, '');
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  const encodedSig = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signingInput}.${encodedSig}`;

  // Exchange JWT → access token
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion:  jwt,
    }),
  });
  const { access_token } = await res.json();
  return access_token;
}

// ── FCM: send one notification ────────────────────────────────────────────────
async function sendFCM(
  accessToken: string,
  projectId: string,
  deviceToken: string,
  title: string,
  body: string,
) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          notification: { title, body },
          android: { priority: 'high' },
        },
      }),
    },
  );
  return res.ok;
}

// ── Timezone check: is it 10am in the user's timezone? ───────────────────────
function isNotificationHour(timezone: string): boolean {
  try {
    const hour = parseInt(
      new Date().toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }),
      10,
    );
    return hour === 10; // 10am local time
  } catch {
    return false;
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────
Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
  const accessToken = await getFCMAccessToken(sa);
  const projectId   = sa.project_id;

  // ── N1: Mascotas sin registro de comida hoy ─────────────────────────────
  // Agrupado por usuario: una sola notificación con todos los nombres
  const { data: noFoodToday } = await supabase.rpc('get_pets_no_feeding_today');

  // ── N4: Mascotas sin registro en los últimos 3 días ──────────────────────
  const { data: inactive } = await supabase.rpc('get_pets_inactive_feeding');

  let sent = 0;

  // Agrupar por (user, token) para enviar 1 notificación por usuario
  const groupBy = (rows: Array<{ token: string; timezone: string; pet_names: string }>) => {
    const map: Record<string, { token: string; timezone: string; names: string[] }> = {};
    for (const row of rows ?? []) {
      if (!map[row.token]) map[row.token] = { token: row.token, timezone: row.timezone, names: [] };
      map[row.token].names.push(...row.pet_names.split(','));
    }
    return Object.values(map);
  };

  // Send N1
  for (const group of groupBy(noFoodToday ?? [])) {
    if (!isNotificationHour(group.timezone)) continue;
    const names = [...new Set(group.names)].join(', ');
    const body  = group.names.length === 1
      ? `¿Ya le diste de comer a ${names} hoy? 🍖`
      : `${names} aún no tienen registro de comida hoy 🍖`;

    const ok = await sendFCM(accessToken, projectId, group.token, 'KIMO 🐾', body);
    if (ok) sent++;
  }

  // Send N4
  for (const group of groupBy(inactive ?? [])) {
    if (!isNotificationHour(group.timezone)) continue;
    const names = [...new Set(group.names)].join(', ');
    const body  = group.names.length === 1
      ? `Llevas 3 días sin registrar la alimentación de ${names} 📋`
      : `${names} llevan 3 días sin registro de alimentación 📋`;

    const ok = await sendFCM(accessToken, projectId, group.token, 'KIMO 🐾', body);
    if (ok) sent++;
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
