
/**
 * ═══════════════════════════════════════════════════════════════════
 * PROXY CORS PARA DATOS.GOB.AR — Cloudflare Worker
 * ═══════════════════════════════════════════════════════════════════
 * 
 * INSTRUCCIONES DE DEPLOY (5 minutos, gratis):
 * 
 * 1. Andá a https://workers.cloudflare.com y creá una cuenta gratis
 * 2. Hacé click en "Create a Worker"
 * 3. Borrá el código de ejemplo y pegá TODO este archivo
 * 4. Click en "Save and Deploy"
 * 5. Te va a dar una URL tipo: https://tu-worker.tu-usuario.workers.dev
 * 6. Copiá esa URL y pegala en utils/api.ts en CUSTOM_PROXY_URL
 * 
 * PLAN GRATUITO: 100,000 requests/día — más que suficiente
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

const ALLOWED_ORIGIN_API = 'https://datos.gob.ar';

// Orígenes permitidos (agregá tu dominio de producción)
const ALLOWED_ORIGINS = [
'http://localhost:3000',
'http://localhost:5173',
'http://localhost:4173',
'https://*.magicpatterns.com'
// Agregá tu dominio de producción acá:
// 'https://tu-app.vercel.app',
// 'https://tu-dominio.com',
];

function isOriginAllowed(origin) {
  if (!origin) return true; // Allow server-to-server
  return ALLOWED_ORIGINS.some((allowed) => {
    if (allowed.includes('*')) {
      const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$');
      return regex.test(origin);
    }
    return allowed === origin;
  });
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400'
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin)
      });
    }

    // Only allow GET
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Solo se permite GET' }), {
        status: 405,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }

    // Health check endpoint
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'combustible-argentina-proxy',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
      });
    }

    // Main proxy endpoint: /api/combustibles?...params
    if (url.pathname === '/api/combustibles') {
      try {
        // Build the datos.gob.ar URL
        const targetParams = new URLSearchParams();

        // Pass through all query params
        for (const [key, value] of url.searchParams) {
          targetParams.append(key, value);
        }

        // Ensure resource_id is always present
        if (!targetParams.has('resource_id')) {
          targetParams.set('resource_id', 'energia_80ac25de-a44a-4445-9215-090cf55cfda5');
        }

        const targetUrl = `${ALLOWED_ORIGIN_API}/api/3/action/datastore_search?${targetParams.toString()}`;

        console.log(`[Proxy] Fetching: ${targetUrl}`);

        const apiResponse = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'CombustibleArgentina-Proxy/1.0',
            'Accept': 'application/json'
          }
        });

        if (!apiResponse.ok) {
          throw new Error(`API responded with ${apiResponse.status}`);
        }

        const data = await apiResponse.json();

        return new Response(JSON.stringify(data), {
          status: 200,
          headers: {
            ...corsHeaders(origin),
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300', // Cache 5 min en CDN
            'X-Proxy-Source': 'cloudflare-worker'
          }
        });

      } catch (err) {
        console.error('[Proxy] Error:', err.message);
        return new Response(JSON.stringify({
          success: false,
          error: { message: err.message },
          proxy: true
        }), {
          status: 502,
          headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
        });
      }
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({
      error: 'Ruta no encontrada',
      rutas_disponibles: ['/health', '/api/combustibles?resource_id=...&limit=100']
    }), {
      status: 404,
      headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
    });
  }
};