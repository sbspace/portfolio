const STATE_ID = 'main';

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function isAppState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  return (
    'beomseokAssets' in value &&
    'seyeonAssets' in value &&
    'targetWeights' in value &&
    'snapshots' in value &&
    'settings' in value
  );
}

export async function onRequest(context) {
  if (!context.env.DB) {
    return jsonResponse({ error: 'D1 binding DB is not configured' }, 503);
  }

  try {
    if (context.request.method === 'GET') {
      const row = await context.env.DB.prepare(
        'SELECT state_json FROM portfolio_state WHERE id = ?1 LIMIT 1'
      )
        .bind(STATE_ID)
        .first();

      if (!row) {
        return jsonResponse({ error: 'Portfolio state not found' }, 404);
      }

      try {
        return jsonResponse(JSON.parse(row.state_json));
      } catch {
        return jsonResponse({ error: 'Stored portfolio state is invalid' }, 500);
      }
    }

    if (context.request.method === 'PUT') {
      let state;
      try {
        state = await context.request.json();
      } catch {
        return jsonResponse({ error: 'Request body must be valid JSON' }, 400);
      }

      if (!isAppState(state)) {
        return jsonResponse({ error: 'Request body is not a valid AppState' }, 400);
      }

      const updatedAt = new Date().toISOString();
      await context.env.DB.prepare(
        `INSERT INTO portfolio_state (id, state_json, updated_at)
         VALUES (?1, ?2, ?3)
         ON CONFLICT(id) DO UPDATE SET
           state_json = excluded.state_json,
           updated_at = excluded.updated_at`
      )
        .bind(STATE_ID, JSON.stringify(state), updatedAt)
        .run();

      return jsonResponse({ ok: true, updatedAt });
    }

    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, PUT' },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: 'Portfolio state request failed', detail }, 500);
  }
}
