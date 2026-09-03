const YAHOO_ORIGIN = 'https://query1.finance.yahoo.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';

export async function onRequest(context) {
  if (context.request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET' },
    });
  }

  const pathSegments = context.params.path;
  const yahooPath = Array.isArray(pathSegments)
    ? pathSegments.join('/')
    : pathSegments;

  if (!yahooPath) {
    return new Response('Yahoo Finance path is required', { status: 400 });
  }

  const incomingUrl = new URL(context.request.url);
  const yahooUrl = new URL(`/${yahooPath}`, YAHOO_ORIGIN);
  yahooUrl.search = incomingUrl.search;

  try {
    const yahooResponse = await fetch(yahooUrl, {
      headers: {
        Accept: context.request.headers.get('Accept') || 'application/json',
        'User-Agent': USER_AGENT,
      },
    });

    return new Response(yahooResponse.body, {
      status: yahooResponse.status,
      statusText: yahooResponse.statusText,
      headers: yahooResponse.headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: 'Yahoo Finance request failed', detail: message },
      { status: 502 }
    );
  }
}
