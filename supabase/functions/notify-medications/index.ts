import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno&no-check';

// ── Env vars ──────────────────────────────────────────────────────────────────
const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FIREBASE_SERVICE_ACCOUNT  = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!;

// ── FCM helpers (same as notify-feedings) ─────────────────────────────────────
async function getFCMAccessToken(sa: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email, sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  const b64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signingInput = `${b64url(header)}.${b64url(payload)}`;
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\n/g, '');
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', binaryDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput));
  const encodedSig = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = `${signingInput}.${encodedSig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const { access_token } = await res.json();
  return access_token;
}

async function sendFCM(
  accessToken: string, projectId: string, deviceToken: string, title: string, body: string,
) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: { token: deviceToken, notification: { title, body }, android: { priority: 'high' } },
      }),
    },
  );
  return res.ok;
}

// ── Main ──────────────────────────────────────────────────────────────────────
Deno.serve(async () => {
  const supabase     = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const sa           = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
  const accessToken  = await getFCMAccessToken(sa);
  const projectId    = sa.project_id;

  // Doses due this hour (±30 min, not yet marked)
  const { data: doses } = await supabase.rpc('get_medication_doses_due');

  let sent = 0;

  for (const row of doses ?? []) {
    const title = 'KIMO 🐾';
    const body  = `Hora de darle ${row.med_name} a ${row.pet_name} 💊${row.dose ? ` — ${row.dose}` : ''}`;
    const ok    = await sendFCM(accessToken, projectId, row.token, title, body);
    if (ok) sent++;
  }

  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } });
});
