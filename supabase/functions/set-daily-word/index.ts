// supabase/functions/set-daily-word/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RENDER_API_URL = Deno.env.get("RENDER_API_URL")
const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD")
const ADMIN_USERNAME = "admin"

serve(async (req) => {
  // Standard CORS preflight check
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }

  try {
    const { date, word } = await req.json()
    if (!date || !word) throw new Error("Date and word are required.")

    // This is the correct Basic authentication header.
    const encodedAuth = btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)
    const headers = { 'Authorization': `Basic ${encodedAuth}` }

    const targetUrl = `${RENDER_API_URL}/admin/set-daily-word?date=${date}&word=${word}`
    
    console.log(`Forwarding request to: ${targetUrl}`); // Log the exact URL being called

    const response = await fetch(targetUrl, { method: 'POST', headers: headers })
    
    // ===================================================================
    // === THIS IS THE NEW, CRITICAL DEBUGGING LOGIC =====================
    // ===================================================================
    // If the response from the Render server is NOT successful...
    if (!response.ok) {
        // ...read the exact error message text from the response body...
        const errorBody = await response.text()
        console.error(`Render server returned an error: Status ${response.status}`, errorBody);
        
        // ...and throw a new, much more detailed error.
        throw new Error(`The Render server responded with a non-2xx status code. Status: ${response.status}. Body: ${errorBody}`)
    }
    // ===================================================================
    
    const responseData = await response.json()

    // Send the success response back to the admin panel.
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error) {
    // The catch block will now receive our new, detailed error message.
    console.error("Error in Supabase function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, // Keep the status 500, but the message will be more useful.
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    })
  }
})