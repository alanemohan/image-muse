import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, type = "analyze" } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured in Supabase secrets");
      return new Response(
        JSON.stringify({ 
          error: "GEMINI_API_KEY is not configured. Please add it to your Supabase secrets to enable AI analysis.",
          fallback: true 
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing image analysis request, type: ${type}`);

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "analyze") {
      systemPrompt = `You are an expert image analyst. Analyze the provided image and return a JSON object with these fields:
- title: A short, catchy title for the image (max 8 words)
- description: A detailed description of what's in the image (2-3 sentences)
- caption: A creative caption suitable for social media (1 sentence)
- tags: An array of 3-5 relevant tags describing the content

Return ONLY valid JSON, no markdown formatting.`;
      userPrompt = "Analyze this image and provide the title, description, caption, and tags.";
    } else if (type === "regenerate_caption") {
      systemPrompt = `You are a creative caption writer. Generate a fresh, engaging caption for social media based on the image. Return ONLY the caption text, nothing else.`;
      userPrompt = "Generate a new creative caption for this image.";
    }

    // Use Google Gemini API directly
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: {
              text: systemPrompt
            }
          },
          contents: {
            parts: [
              { text: userPrompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: imageBase64.includes(",") 
                    ? imageBase64.split(",")[1]
                    : imageBase64,
                }
              }
            ]
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: "Rate limit exceeded. Please try again in a moment.",
            statusCode: 429 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: "AI credits exhausted. Please add credits to continue.",
            statusCode: 402 
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: `AI service error: ${response.status}. Please try again later.`,
          statusCode: response.status 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("No response content from AI");
      return new Response(
        JSON.stringify({ error: "No response from AI service" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response received:", content.substring(0, 200));

    let result;
    if (type === "analyze") {
      try {
        // Clean the response - remove markdown code blocks if present
        let cleanedContent = content.trim();
        if (cleanedContent.startsWith("```json")) {
          cleanedContent = cleanedContent.slice(7);
        } else if (cleanedContent.startsWith("```")) {
          cleanedContent = cleanedContent.slice(3);
        }
        if (cleanedContent.endsWith("```")) {
          cleanedContent = cleanedContent.slice(0, -3);
        }
        result = JSON.parse(cleanedContent.trim());
      } catch (parseError) {
        console.error("Failed to parse AI response as JSON:", parseError);
        // Fallback: create structured response from plain text
        result = {
          title: "Image Analysis",
          description: content,
          caption: content.split('.')[0] + '.',
          tags: ["photo", "image"]
        };
      }
    } else {
      result = { caption: content.trim() };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-image function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "An unexpected error occurred during analysis"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
