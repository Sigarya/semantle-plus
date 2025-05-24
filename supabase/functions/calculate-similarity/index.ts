// Follow this setup guide to integrate the Deno runtime into your project:
// https://deno.com/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"

const SIMILARITY_API_URL = "https://heb-w2v-api.onrender.com/similarity";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Define CORS headers for preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface RequestBody {
  guess: string;
  date?: string; // Optional date parameter for historical games
}

interface ApiResponse {
  word1: string;
  word2: string;
  similarity: number;
}

// Get today's date in UTC timezone
function getTodayInIsrael(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

serve(async (req) => {
  console.log("Received request:", req.method);
  
  // Handle OPTIONS request for CORS preflight
  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Parse request body - expecting 'guess' and optional 'date'
    let body: RequestBody;
    
    try {
      body = await req.json();
      console.log("Request body:", JSON.stringify(body));
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "בקשה לא תקינה, לא ניתן לנתח את ה-JSON",
          similarity: 0,
          isCorrect: false 
        }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }
    
    const { guess, date } = body;

    if (!guess) {
      console.error("Missing guess parameter");
      return new Response(
        JSON.stringify({ error: "Missing required parameter: guess" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }

    // Get the target date - use provided date for historical games, or today's date in UTC timezone
    const targetDate = date ? date : getTodayInIsrael();
    console.log("Target date for word lookup:", targetDate);
    
    // Query Supabase for the word matching the target date
    console.log("Fetching word for date:", targetDate);
    
    const { data: wordData, error: wordError } = await supabase
      .from('daily_words')
      .select('word')
      .eq('date', targetDate)
      .eq('is_active', true)
      .single();
    
    if (wordError) {
      console.error("Error fetching word for date:", targetDate, wordError);
      return new Response(
        JSON.stringify({ 
          error: `לא הוגדרה מילת יום לתאריך ${targetDate}`,
          similarity: 0,
          isCorrect: false
        }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }
    
    if (!wordData || !wordData.word) {
      console.error("No word found for date:", targetDate);
      return new Response(
        JSON.stringify({ 
          error: `לא הוגדרה מילת יום לתאריך ${targetDate}`,
          similarity: 0,
          isCorrect: false
        }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }
    
    const target = wordData.word;
    console.log(`Found word for date ${targetDate}:`, target);
    
    // Construct API URL with query parameters
    const queryParams = new URLSearchParams({
      word1: target.trim(),
      word2: guess.trim()
    });
    
    const apiUrl = `${SIMILARITY_API_URL}?${queryParams.toString()}`;
    
    console.log(`Calling external API: ${apiUrl}`);
    
    // Call the external similarity API
    let apiResponse;
    let apiData;
    
    try {
      apiResponse = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });
      
      console.log("API response status:", apiResponse.status);
      const responseText = await apiResponse.text();
      console.log("API raw response:", responseText);
      
      try {
        apiData = JSON.parse(responseText);
        console.log("API response data:", JSON.stringify(apiData));
      } catch (jsonError) {
        console.error("Failed to parse API response as JSON:", jsonError);
        throw new Error(`Invalid JSON response from API: ${responseText}`);
      }
    } catch (fetchError) {
      console.error("Error fetching from similarity API:", fetchError);
      return new Response(
        JSON.stringify({ 
          error: "שגיאה בחישוב הדמיון - בעיה בגישה ל-API",
          similarity: 0,
          isCorrect: false
        }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }
    
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
          { 
            status: 200, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders
            } 
          }
        );
      }
      
      // Other API errors
      return new Response(
        JSON.stringify({ 
          error: apiData.error || "שגיאה בחישוב הדמיון",
          similarity: 0,
          isCorrect: false
        }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
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
        isCorrect,
        date: targetDate // Return the date used for this guess
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "שגיאה בעיבוד הבקשה", 
        similarity: 0, 
        isCorrect: false,
        details: error.message
      }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  }
})
