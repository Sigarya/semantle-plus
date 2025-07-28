// supabase/functions/set-daily-word/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// These secrets are read securely from the Supabase Vault.
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

    // Securely create the Authorization header on the server.
    const encodedAuth = btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)
    const headers = { 'Authorization': `Basic ${encodedAuth}` }

    const targetUrl = `${RENDER_API_URL}/admin/set-daily-word?date=${date}&word=${word}`
    
    // Make the secure, server-to-server call.
    const response = await fetch(targetUrl, { method: 'POST', headers: headers })
    
    if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(`Render server error: ${response.status} ${errorBody}`)
    }
    
    const responseData = await response.json()

    // Send the success response back to the admin panel.
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error) {
    // Send any failure response back to the admin panel.
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    })
  }
})