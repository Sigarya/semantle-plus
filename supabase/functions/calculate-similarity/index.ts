// Follow this setup guide to integrate the Deno runtime into your project:
// https://deno.com/manual/getting_started/setup_your_environment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"

const SIMILARITY_API_URL = "https://combined-he-w2v-api.onrender.com";
const RANKING_API_URL = "https://combined-he-w2v-api.onrender.com/rank";
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

interface SimilarityResponse {
  word1: string;
  word2: string;
  similarity: number;
}

interface RankingResponse {
  date: string;
  word: string;
  daily_word: string;
  rank: number;
  similarity: number;
}

// Cache for word lookup to reduce database queries
const wordCache = new Map<string, string>();

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
    
    // Check cache first for better performance
    let target = wordCache.get(targetDate);
    
    if (!target) {
      console.log("Fetching word for date from database:", targetDate);
      
      // Use optimized function for better performance
      const { data: wordData, error: wordError } = await supabase
        .rpc('get_active_word_for_date', { target_date: targetDate });
      
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
      
      if (!wordData || wordData.length === 0) {
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
      
      target = wordData[0].word;
      // Cache the word for 1 hour (you could make this longer for historical dates)
      wordCache.set(targetDate, target);
      
      // Clear cache after 1 hour to prevent memory leaks
      setTimeout(() => {
        wordCache.delete(targetDate);
      }, 3600000); // 1 hour
    }
    
    console.log(`Found word for date ${targetDate}:`, target);
    
    try {
      // First, get the similarity score using the similarity API
      const similarityUrl = `${SIMILARITY_API_URL}/similarity?word1=${encodeURIComponent(guess)}&word2=${encodeURIComponent(target)}`;
      console.log(`Calling similarity API: ${similarityUrl}`);
      
      const similarityResponse = await fetch(similarityUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });
      
      console.log("Similarity API response status:", similarityResponse.status);
      
      if (!similarityResponse.ok) {
        throw new Error(`Similarity API responded with status ${similarityResponse.status}`);
      }

      const similarityText = await similarityResponse.text();
      console.log("Similarity API raw response:", similarityText);
      
      let similarityData: SimilarityResponse;
      try {
        similarityData = JSON.parse(similarityText);
        console.log("Similarity API response data:", JSON.stringify(similarityData));
      } catch (parseError) {
        console.error("Error parsing similarity API response:", parseError);
        throw new Error("Invalid JSON response from similarity API");
      }

      // Then, get the ranking using the ranking API
      const [year, month, day] = targetDate.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      
      const rankingUrl = `${RANKING_API_URL}?word=${encodeURIComponent(guess)}&date=${encodeURIComponent(formattedDate)}`;
      console.log(`Calling ranking API: ${rankingUrl}`);
      
      const rankingResponse = await fetch(rankingUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json"
        }
      });
      
      console.log("Ranking API response status:", rankingResponse.status);
      
      let rankingData: RankingResponse | null = null;
      
      if (rankingResponse.ok) {
        const rankingText = await rankingResponse.text();
        console.log("Ranking API raw response:", rankingText);
        
        try {
          rankingData = JSON.parse(rankingText);
          console.log("Ranking API response data:", JSON.stringify(rankingData));
        } catch (parseError) {
          console.error("Error parsing ranking API response:", parseError);
          // Don't throw here - we can still return similarity without rank
        }
      } else {
        console.log("Ranking API failed, continuing without rank data");
      }

      // Use similarity from similarity API and rank from ranking API (if available)
      const similarity = similarityData.similarity;
      const rank = rankingData && rankingData.rank > 0 ? rankingData.rank : undefined;
    
      // Determine if this is the correct word (exact match or very high similarity)
      const isCorrect = guess === target || similarity > 0.99;
      
      // Get reference scores for ranks 1, 990, and 999
      let referenceScores = null;
      try {
        const referenceResults = await Promise.all([
          fetch(`${RANKING_API_URL}?rank=1&date=${encodeURIComponent(formattedDate)}`),
          fetch(`${RANKING_API_URL}?rank=990&date=${encodeURIComponent(formattedDate)}`),
          fetch(`${RANKING_API_URL}?rank=999&date=${encodeURIComponent(formattedDate)}`)
        ]);
        
        const [rank1Response, rank990Response, rank999Response] = referenceResults;
        
        if (rank1Response.ok && rank990Response.ok && rank999Response.ok) {
          const [rank1Data, rank990Data, rank999Data] = await Promise.all([
            rank1Response.json(),
            rank990Response.json(), 
            rank999Response.json()
          ]);
          
          referenceScores = {
            rank1: rank1Data.similarity || null,
            rank990: rank990Data.similarity || null, 
            rank999: rank999Data.similarity || null
          };
        }
      } catch (error) {
        console.error("Error fetching reference scores:", error);
        // Continue without reference scores if there's an error
      }
      
      return new Response(
        JSON.stringify({
          word: guess,
          similarity,
          rank, // Only include rank if > 0 from ranking API
          isCorrect,
          date: targetDate, // Return the date used for this guess
          referenceScores // Include reference scores if available
        }),
        { 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
      
    } catch (error) {
      console.error("Error calling external APIs:", error);
      return new Response(
        JSON.stringify({ 
          error: "אני לא מכיר את המילה {guess}",
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
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    // Sanitize error response for security - don't expose internal details
    return new Response(
      JSON.stringify({ 
        error: "שגיאה בעיבוד הבקשה", 
        similarity: 0, 
        isCorrect: false
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
