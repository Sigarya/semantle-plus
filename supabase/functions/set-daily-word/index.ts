// supabase/functions/set-daily-word/index.ts
// --- ENHANCED DIAGNOSTIC VERSION ---

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Always handle CORS first
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  console.log("--- Supabase Function Invoked ---");

  try {
    console.log("--- Function Invoked ---");
    
    // Step 1: Securely get secrets
    const RENDER_API_URL = Deno.env.get("RENDER_API_URL");
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD");
    if (!RENDER_API_URL || !ADMIN_PASSWORD) {
      throw new Error("Missing required secrets: RENDER_API_URL or ADMIN_PASSWORD");
    }

    // Step 2: Get data from the incoming request
    const { date, word } = await req.json();
    if (!date || !word) {
      throw new Error("Request body must contain 'date' and 'word'.");
    }
    console.log(`Received data: date=${date}, word=${word}`);

    // Step 3: Explicitly construct the URL with URLSearchParams
    // This is the most robust way to handle encoding of special characters.
    const url = new URL(`${RENDER_API_URL}/admin/set-daily-word`);
    url.searchParams.append("date", date);
    url.searchParams.append("word", word);
    console.log(`Constructed final URL: ${url.toString()}`);

    // Step 4: Create the Basic Authentication header
    const encodedAuth = btoa(`admin:${ADMIN_PASSWORD}`);
    
    // Step 5: Create a new Headers object. This is the most reliable method.
    const headers = new Headers();
    headers.append("Authorization", `Basic ${encodedAuth}`);
    
    console.log("Sending POST request to Render server...");

    // Step 6: Make the fetch call. The body is explicitly null.
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: headers,
      body: null // Explicitly no body
    });

    console.log(`Received response from Render server with status: ${response.status}`);

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Render server error. Status: ${response.status}, Body: ${errorBody}`);
    }
    
    const responseData = await response.json();

    // Step 7: Return the successful response
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    });

} catch (error) {
    console.error("--- A CRITICAL ERROR OCCURRED ---");
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    });
}
})