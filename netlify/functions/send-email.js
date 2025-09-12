// netlify/functions/send-email.js
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...cors },
  });
}

export default async (request, context) => {
  try {
    // Preflight CORS
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const text = await request.text();
    let payload = {};
    try {
      payload = JSON.parse(text || '{}');
    } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }

    const { to, subject, html } = payload;
    if (!to || !subject || !html) return json({ error: 'Missing fields: to, subject, html' }, 400);

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    if (!apiKey) return json({ error: 'Missing RESEND_API_KEY env var' }, 500);

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return json({ ok: false, status: resp.status, data }, 502);

    return json({ ok: true, data }, 200);
  } catch (e) {
    return json({ error: 'Server error', detail: String(e) }, 500);
  }
};