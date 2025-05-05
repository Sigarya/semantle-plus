
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define static word similarities for now
// This should be replaced with actual Heberw Word2Vec integration in production
const hebrewWordMap: Record<string, Record<string, number>> = {
  "בית": {
    "דירה": 0.42,
    "מגורים": 0.55,
    "דיור": 0.68,
    "מעון": 0.82,
    "מעונות": 0.91,
    "בניין": 0.76,
    "מבנה": 0.62,
    "חדר": 0.54,
    "מרחב": 0.37,
    "מקום": 0.32,
    "אדריכלות": 0.45,
  },
  "מחשב": {
    "לפטופ": 0.88,
    "נייד": 0.75,
    "מקלדת": 0.81,
    "עכבר": 0.77,
    "מסך": 0.79,
    "אינטרנט": 0.68,
    "קובץ": 0.71,
    "תוכנה": 0.85,
    "חומרה": 0.89,
    "שבב": 0.72,
  },
  "שמש": {
    "ירח": 0.76,
    "כוכב": 0.82,
    "אור": 0.85,
    "חמה": 0.95,
    "קרינה": 0.88,
    "חם": 0.76,
    "קיץ": 0.72,
    "צהוב": 0.68,
    "יום": 0.75,
    "אנרגיה": 0.65,
  },
  "ספר": {
    "סופר": 0.87,
    "דפים": 0.85,
    "כריכה": 0.82,
    "קריאה": 0.91,
    "סיפור": 0.88,
    "פרק": 0.76,
    "מילים": 0.79,
    "ספרות": 0.92,
    "ספרייה": 0.85,
    "מדף": 0.72,
  },
  "תפוח": {
    "פרי": 0.89,
    "עץ": 0.78,
    "מזון": 0.72,
    "אגס": 0.85,
    "בננה": 0.76,
    "אדום": 0.65,
    "ירוק": 0.62,
    "מתוק": 0.68,
    "גרעין": 0.75,
    "קליפה": 0.72,
  },
  "אוניברסיטה": {
    "לימודים": 0.85,
    "תואר": 0.88,
    "סטודנט": 0.92,
    "הרצאה": 0.87,
    "פרופסור": 0.89,
    "קמפוס": 0.94,
    "מכללה": 0.86,
    "מחקר": 0.83,
    "חינוך": 0.79,
    "אקדמיה": 0.95,
  },
  "מדינה": {
    "ארץ": 0.92,
    "ממשלה": 0.88,
    "אזרח": 0.85,
    "מולדת": 0.82,
    "גבול": 0.78,
    "דגל": 0.72,
    "עם": 0.75,
    "המנון": 0.65,
    "ריבונות": 0.89,
    "פוליטיקה": 0.83,
  },
  "חלום": {
    "לילה": 0.76,
    "שינה": 0.85,
    "דמיון": 0.82,
    "פנטזיה": 0.79,
    "סיוט": 0.88,
    "מציאות": 0.65,
    "תקווה": 0.72,
    "הזיה": 0.81,
    "תת-מודע": 0.84,
    "הרדמות": 0.75,
  },
  "אהבה": {
    "רגש": 0.82,
    "זוגיות": 0.88,
    "רומנטיקה": 0.91,
    "יחסים": 0.85,
    "חיבה": 0.89,
    "לב": 0.78,
    "קשר": 0.75,
    "חיבוק": 0.81,
    "תשוקה": 0.87,
    "נישואין": 0.83,
  },
};

// Function to check if a word is valid Hebrew
function isValidHebrewWord(word: string): boolean {
  // In production, we would check against a proper Hebrew dictionary
  const hebrewPattern = /^[\u0590-\u05FF\s]+$/;
  return hebrewPattern.test(word) && word.trim().length > 0;
}

// Function to calculate similarity between two words
function calculateSimilarity(word1: string, word2: string): number {
  // If words are identical, similarity is 1
  if (word1 === word2) return 1;
  
  // Check if we have pre-defined similarity
  if (hebrewWordMap[word2] && word1 in hebrewWordMap[word2]) {
    return hebrewWordMap[word2][word1];
  }
  
  // Check the reverse direction
  if (hebrewWordMap[word1] && word2 in hebrewWordMap[word1]) {
    return hebrewWordMap[word1][word2];
  }
  
  // Fall back to a random but consistent similarity for demo purposes
  // This should be replaced with the actual Hebrew Word2Vec model
  const combinedString = word1 + word2;
  let hashCode = 0;
  for (let i = 0; i < combinedString.length; i++) {
    hashCode = combinedString.charCodeAt(i) + ((hashCode << 5) - hashCode);
  }
  // Generate a random number between 0 and 0.3
  return Math.abs((hashCode % 1000) / 1000) * 0.3;
}

// Main handler for the edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { guess, target } = await req.json();
    
    // Validate input
    if (!guess || !target) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate that both are Hebrew words
    if (!isValidHebrewWord(guess) || !isValidHebrewWord(target)) {
      return new Response(
        JSON.stringify({ error: "Invalid Hebrew word" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate similarity
    const similarity = calculateSimilarity(guess, target);
    
    // Calculate rank (in real implementation would be based on a pre-calculated ranking)
    let rank = null;
    if (similarity > 0.3) {
      rank = Math.floor((1 - similarity) * 1000) + 1;
    }

    // Return result
    return new Response(
      JSON.stringify({ 
        word: guess, 
        similarity, 
        rank,
        isCorrect: guess === target 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in calculate-similarity function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
