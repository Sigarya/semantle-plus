import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get date from request body
    const { date } = await req.json();
    
    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Date parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Fetching sample ranks for date: ${date}`);

    // Convert YYYY-MM-DD to DD/MM/YYYY format for external API
    const dateParts = date.split('-');
    const formattedDateForApi = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    console.log(`Formatted date for external API: ${formattedDateForApi}`);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('daily_sample_ranks')
      .select('*')
      .eq('word_date', date)
      .single();

    if (cachedData) {
      console.log('Found cached data');
      const result = {
        samples: {
          '1': cachedData.rank_1_score,
          '990': cachedData.rank_990_score,
          '999': cachedData.rank_999_score
        }
      };
      
      return new Response(
        JSON.stringify(result),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('No cached data found, fetching from external API');

    // Fetch from external API using the formatted date
    const externalResponse = await fetch(`https://combined-he-w2v-api.onrender.com/sample-ranks?date=${encodeURIComponent(formattedDateForApi)}`);
    
    if (!externalResponse.ok) {
      throw new Error(`External API failed with status: ${externalResponse.status}`);
    }

    const externalData = await externalResponse.json();
    console.log('Successfully fetched from external API:', externalData);

    // Cache the result
    const { error: insertError } = await supabase
      .from('daily_sample_ranks')
      .insert({
        word_date: date,
        rank_1_score: externalData.samples['1'],
        rank_990_score: externalData.samples['990'],
        rank_999_score: externalData.samples['999'],
      });

    if (insertError) {
      console.error('Failed to cache data:', insertError);
      // Continue anyway, don't fail the request
    } else {
      console.log('Successfully cached data');
    }

    return new Response(
      JSON.stringify(externalData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in get-sample-ranks function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch sample ranks',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});