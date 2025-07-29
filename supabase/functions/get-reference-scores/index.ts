import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log(`Received request: ${req.method}`)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request")
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { date } = await req.json()
    console.log(`Request body: ${JSON.stringify({ date })}`)
    
    if (!date) {
      throw new Error("Date is required")
    }

    // Format date for the ranking API (DD/MM/YYYY)
    const formattedDate = new Date(date).toLocaleDateString('en-GB')
    console.log(`Formatted date for API: ${formattedDate}`)

    // Get reference scores for ranks 1, 990, and 999
    const ranks = [1, 990, 999]
    const results: { [key: string]: number } = {}

    for (const rank of ranks) {
      try {
        // Call the ranking API to get word by rank
        const rankingUrl = `https://hebrew-w2v.onrender.com/closest?date=${encodeURIComponent(formattedDate)}&rank=${rank}`
        console.log(`Calling ranking API for rank ${rank}: ${rankingUrl}`)
        
        const rankingResponse = await fetch(rankingUrl)
        console.log(`Ranking API response status for rank ${rank}: ${rankingResponse.status}`)
        
        if (!rankingResponse.ok) {
          console.error(`Ranking API failed for rank ${rank} with status: ${rankingResponse.status}`)
          continue
        }

        const rankingData = await rankingResponse.json()
        console.log(`Ranking API response data for rank ${rank}: ${JSON.stringify(rankingData)}`)
        
        if (rankingData.similarity !== undefined) {
          results[`rank${rank}`] = rankingData.similarity
        }
        
      } catch (error) {
        console.error(`Error fetching rank ${rank}:`, error)
        continue
      }
    }

    console.log(`Final results: ${JSON.stringify(results)}`)

    return new Response(
      JSON.stringify(results),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )

  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )
  }
})