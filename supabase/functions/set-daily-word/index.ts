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
    const RENDER_API_URL = Deno.env.get("RENDER_API_URL")
    const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD")

    console.log(`Step 1: Reading secrets. RENDER_API_URL is set: ${!!RENDER_API_URL}, ADMIN_PASSWORD is set: ${!!ADMIN_PASSWORD}`);

    if (!RENDER_API_URL || !ADMIN_PASSWORD) {
      throw new Error("CRITICAL: RENDER_API_URL or ADMIN_PASSWORD secret is not set in Supabase Vault.");
    }
    
    const { date, word } = await req.json()
    console.log(`Step 2: Parsed request body. Date: ${date}, Word: ${word}`);
    if (!date || !word) {
      throw new Error("Date and word are required in the request body.")
    }

    // Build URL with query parameters as expected by Render server
    const targetUrl = `${RENDER_API_URL}/admin/set-daily-word?date=${encodeURIComponent(date)}&word=${encodeURIComponent(word)}`
    console.log(`Step 3: Built target URL with query parameters: ${targetUrl}`);

    // Headers without Content-Type since there's no body
    const headers = {
      'Authorization': `Basic ${btoa(`admin:${ADMIN_PASSWORD}`)}`
    }
    console.log("Step 4: Created Authorization header.");
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: headers
    })
    console.log(`Step 5: Fetch call to Render completed with status: ${response.status}`);
    
    if (!response.ok) {
        const errorBody = await response.text()
        console.error(`Step 6 (FAILURE): Render server returned a non-200 status. Body: ${errorBody}`);
        throw new Error(`Render server error: Status ${response.status} Body: ${errorBody}`)
    }
    
    const responseData = await response.json()
    console.log("Step 6 (SUCCESS): Successfully got JSON response from Render.");

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error) {
    // This will now catch ANY failure from the steps above.
    console.error("--- ERROR CATCH BLOCK TRIGGERED ---");
    console.error("The function failed at some point. The error was:", error.message);
    console.error("---------------------------------");
    
    return new Response(JSON.stringify({
      error: `Supabase function failed: ${error.message}`
    }), {
      status: 500, // IMPORTANT: We now correctly return a 500 error status.
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    })
  }
})