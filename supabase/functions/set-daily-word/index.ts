import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface RequestBody {
  date: string;  // Format: DD/MM/YYYY
  word: string;
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
    // Parse request body
    let body: RequestBody;
    
    try {
      body = await req.json();
      console.log("Request body:", JSON.stringify(body));
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "בקשה לא תקינה, לא ניתן לנתח את ה-JSON"
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
    
    const { date, word } = body;

    if (!date || !word) {
      console.error("Missing required parameters");
      return new Response(
        JSON.stringify({ error: "חסרים פרמטרים נדרשים: date, word" }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }

    // Get admin password from environment
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    if (!adminPassword) {
      console.error("Admin password not configured");
      return new Response(
        JSON.stringify({ error: "הגדרת שרת לא תקינה - סיסמת מנהל חסרה" }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
    }

    // Construct API URL for setting daily word
    const apiUrl = `https://hebrew-w2v-api.onrender.com/admin/set-daily-word?date=${encodeURIComponent(date)}&word=${encodeURIComponent(word)}`;
    
    console.log(`Calling external API: ${apiUrl}`);
    
    // Call the external API to set daily word
    let apiResponse;
    
    try {
      apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${btoa(`admin:${adminPassword}`)}`  // Using Basic auth instead of Bearer
        }
      });
      
      console.log("API response status:", apiResponse.status);
      
      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error("External API error:", errorText);
        
        if (apiResponse.status === 401) {
          return new Response(
            JSON.stringify({ error: "שגיאת אימות - סיסמת מנהל לא תקינה" }),
            { 
              status: 401, 
              headers: { 
                "Content-Type": "application/json",
                ...corsHeaders
              } 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ error: `שגיאה בשרת החיצוני: ${apiResponse.status}` }),
          { 
            status: apiResponse.status, 
            headers: { 
              "Content-Type": "application/json",
              ...corsHeaders
            } 
          }
        );
      }
      
      const responseText = await apiResponse.text();
      console.log("API response:", responseText);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `המילה "${word}" נקבעה בהצלחה לתאריך ${date}`
        }),
        { 
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          } 
        }
      );
      
    } catch (fetchError) {
      console.error("Error calling external API:", fetchError);
      return new Response(
        JSON.stringify({ 
          error: "שגיאה בקשת השרת החיצוני - יתכן שהשרת אינו זמין"
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
    
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "שגיאה בעיבוד הבקשה"
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
});