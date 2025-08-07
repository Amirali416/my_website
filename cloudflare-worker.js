export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Get the API key from Cloudflare's environment variables
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response('API key not configured', { status: 500 });
    }

    // Get the original request's URL path to determine the model
    const url = new URL(request.url);
    const model = url.pathname.split('/').pop();

    if (!model) {
        return new Response('Model not specified in the URL path', { status: 400 });
    }

    // Construct the target Google Gemini API URL
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Read the body from the incoming request
    const requestBody = await request.json();

    // Create a new request to the Gemini API
    const geminiRequest = new Request(geminiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    try {
      // Fetch the response from the Gemini API
      const geminiResponse = await fetch(geminiRequest);

      // Return the original JSON response from Gemini
      const response = new Response(geminiResponse.body, {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Or specify your domain
        },
      });

      return response;

    } catch (error) {
      return new Response('Error forwarding request to Gemini API', { status: 500 });
    }
  },
};

function handleOptions(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*', // Or specify your domain
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  return new Response(null, { headers });
}
