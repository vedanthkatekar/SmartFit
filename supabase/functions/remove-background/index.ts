import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { imageData } = await req.json();

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: "image/png" });
    formData.append("image_file", blob, "image.png");
    formData.append("size", "auto");

    const removeApiKey = Deno.env.get("REMOVE_BG_API_KEY");
    
    if (!removeApiKey) {
      console.log("REMOVE_BG_API_KEY not configured, returning original image");
      return new Response(
        JSON.stringify({ 
          processedImage: imageData,
          note: "Background removal not configured. Using original image."
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": removeApiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Remove.bg API error:", errorText);
      
      return new Response(
        JSON.stringify({ 
          processedImage: imageData,
          note: "Background removal failed. Using original image."
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resultBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(resultBuffer);

    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }

    const base64Result = btoa(binary);
    const processedImage = `data:image/png;base64,${base64Result}`;

    return new Response(
      JSON.stringify({ processedImage }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing image:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to process image",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});