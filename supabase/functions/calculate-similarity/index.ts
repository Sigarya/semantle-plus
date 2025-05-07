// Follow this setup guide to integrate the Deno runtime into your project:
// https://deno.com/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const SIMILARITY_API_URL = "https://heb-w2v-api.onrender.com/similarity";

interface RequestBody {
  guess: string;
  target: string;
}

interface ApiResponse {
  word1: string;
  word2: string;
  similarity: number;
}

serve(async (req) => {
  try {
    // Parse request body
    const body: RequestBody = await req.json();
    const { guess, target } = body;

    if (!guess || !target) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters: guess and target" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Construct API URL with query parameters
    const queryParams = new URLSearchParams({
      word1: target.trim(),
      word2: guess.trim()
    });
    
    const apiUrl = `${SIMILARITY_API_URL}?${queryParams.toString()}`;
    
    console.log(`Calling external API: ${apiUrl}`);
    
    // Call the external similarity API
    const apiResponse = await fetch(apiUrl);
    const apiData = await apiResponse.json();
    
    if (!apiResponse.ok) {
      console.error("External API error:", apiData);
      
      // Check if word not in vocabulary
      if (apiResponse.status === 400 && apiData.error?.includes("Word not found in vocabulary")) {
        const wordNotFound = apiData.error.includes(target) ? target : guess;
        return new Response(
          JSON.stringify({ 
            error: `המילה "${wordNotFound}" אינה במילון שלנו`,
            similarity: 0,
            isCorrect: false
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Other API errors
      return new Response(
        JSON.stringify({ 
          error: apiData.error || "שגיאה בחישוב הדמיון",
          similarity: 0,
          isCorrect: false
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Process successful response
    const similarity = apiData.similarity;
    
    // Determine if this is the correct word (exact match or very high similarity)
    const isCorrect = guess === target || similarity > 0.99;
    
    // Calculate rank (this is a placeholder - you may want to implement a more sophisticated ranking)
    let rank = null;
    if (similarity >= 0.7) rank = 10;
    else if (similarity >= 0.5) rank = 100;
    else if (similarity >= 0.3) rank = 1000;
    else if (similarity >= 0.1) rank = 5000;
    
    return new Response(
      JSON.stringify({
        word: guess,
        similarity,
        rank,
        isCorrect
      }),
      { headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: "שגיאה בעיבוד הבקשה", similarity: 0, isCorrect: false }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
})
