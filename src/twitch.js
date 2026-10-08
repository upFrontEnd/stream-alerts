const WS_URL = 'wss://eventsub.wss.twitch.tv/ws';
const HELIX   = 'https://api.twitch.tv/helix';

export function initTwitch(push) {
  const params   = new URLSearchParams(location.search);
  const urlToken = params.get('token');

  if (urlToken) {
    try { localStorage.setItem('twitch_token', urlToken); } catch (_) {}
  }

  const token = urlToken || (() => {
    try { return localStorage.getItem('twitch_token'); } catch (_) { return null; }
  })();

  if (!token) return;
  _connect(token, push);
}

async function _connect(token, push) {
  let clientId, userId;
  try {
    const r = await fetch('https://id.twitch.tv/oauth2/validate', {
      headers: { Authorization: 'OAuth ' + token }
    });
    if (!r.ok) {
      console.warn('[Twitch] Token invalide ou expiré.');
      try { localStorage.removeItem('twitch_token'); } catch (_) {}
      return;
    }
    ({ client_id: clientId, user_id: userId } = await r.json());
    console.info('[Twitch] Connecté — user_id:', userId);
  } catch (e) {
    console.warn('[Twitch] Validation échouée :', e);
    return;
  }
  _openWs(token, clientId, userId, push);
}

function _openWs(token, clientId, userId, push, wsUrl) {
  const ws = new WebSocket(wsUrl || WS_URL);
  let reconnecting = false;

  ws.onmessage = async ({ data }) => {
    const msg   = JSON.parse(data);
    const mtype = msg.metadata?.message_type;

    if (mtype === 'session_welcome') {
      const sid = msg.payload.session.id;
      await Promise.allSettled([
        _sub(token, clientId, sid, 'channel.follow',               '2', { broadcaster_user_id: userId, moderator_user_id: userId }),
        _sub(token, clientId, sid, 'channel.subscribe',            '1', { broadcaster_user_id: userId }),
        _sub(token, clientId, sid, 'channel.subscription.message', '1', { broadcaster_user_id: userId }),
        _sub(token, clientId, sid, 'channel.subscription.gift',    '1', { broadcaster_user_id: userId }),
        _sub(token, clientId, sid, 'channel.cheer',                '1', { broadcaster_user_id: userId }),
        _sub(token, clientId, sid, 'channel.raid',                 '1', { to_broadcaster_user_id: userId }),
      ]);
    }

    if (mtype === 'notification') {
      _dispatch(msg.metadata.subscription_type, msg.payload.event, push);
    }

    if (mtype === 'session_reconnect' && !reconnecting) {
      reconnecting = true;
      _openWs(token, clientId, userId, push, msg.payload.session.reconnect_url);
    }
  };

  ws.onclose = () => {
    if (!reconnecting) {
      console.info('[Twitch] WebSocket fermé — reconnexion dans 5s…');
      setTimeout(() => _openWs(token, clientId, userId, push), 5000);
    }
  };
}

async function _sub(token, clientId, sessionId, type, version, condition) {
  const r = await fetch(HELIX + '/eventsub/subscriptions', {
    method: 'POST',
    headers: {
      Authorization:  'Bearer ' + token,
      'Client-Id':    clientId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type, version, condition,
      transport: { method: 'websocket', session_id: sessionId },
    }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    console.warn('[Twitch] Subscription échouée :', type, '—', err.message || JSON.stringify(err));
  }
}

function _dispatch(type, ev, push) {
  switch (type) {
    case 'channel.follow':
      push({ type: 'follow', user: ev.user_name });
      break;

    case 'channel.subscribe':
      if (!ev.is_gift) {
        push({ type: 'sub', user: ev.user_name, tier: _tier(ev.tier) });
      }
      break;

    case 'channel.subscription.message':
      push({
        type: 'sub',
        user: ev.user_name,
        tier: _tier(ev.tier),
        months: ev.cumulative_months,
        message: ev.message?.text || '',
      });
      break;

    case 'channel.subscription.gift':
      push({
        type: 'gift',
        user: ev.is_anonymous ? 'Anonyme' : ev.user_name,
        count: ev.total,
        tier: _tier(ev.tier),
      });
      break;

    case 'channel.cheer':
      push({
        type: 'bits',
        user: ev.is_anonymous ? 'Anonyme' : ev.user_name,
        amount: ev.bits,
      });
      break;

    case 'channel.raid':
      push({ type: 'raid', user: ev.from_broadcaster_user_name, viewers: ev.viewers });
      break;
  }
}

function _tier(raw) {
  return Math.round(Number(raw) / 1000) || 1;
}
