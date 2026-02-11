import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FASHN_BASE = "https://api.fashn.ai/v1";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const fashnKey = Deno.env.get("FASHN_API_KEY");

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "status") {
      const { predictionId } = await req.json();
      if (!predictionId) {
        return jsonResponse({ error: "predictionId is required" }, 400);
      }

      if (!fashnKey) {
        return jsonResponse(simulateStatusComplete(predictionId), 200);
      }

      const statusRes = await fetch(`${FASHN_BASE}/status/${predictionId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${fashnKey}` },
      });

      if (!statusRes.ok) {
        const errText = await statusRes.text();
        console.error("Fashn status error:", errText);
        return jsonResponse(
          { id: predictionId, status: "failed", error: errText, output: null },
          200
        );
      }

      const statusData = await statusRes.json();
      return jsonResponse(
        {
          id: statusData.id,
          status: statusData.status,
          output: statusData.output || null,
          error: statusData.error || null,
        },
        200
      );
    }

    const body = await req.json();
    const { modelImage, garmentImage, category } = body;

    if (!modelImage || !garmentImage) {
      return jsonResponse(
        { error: "modelImage and garmentImage are required" },
        400
      );
    }

    if (!fashnKey) {
      console.log("FASHN_API_KEY not set - returning demo result");
      return jsonResponse(
        {
          id: `demo-${Date.now()}`,
          status: "completed",
          output: [modelImage],
          demo: true,
          message:
            "FASHN_API_KEY not configured. Set it as a Supabase secret to enable real AI try-on.",
        },
        200
      );
    }

    const fashnBody: Record<string, unknown> = {
      model_name: "tryon-v1.6",
      model_image: modelImage,
      garment_image: garmentImage,
      category: mapCategory(category),
      mode: "quality",
      num_samples: 1,
      output_format: "png",
    };

    const runRes = await fetch(`${FASHN_BASE}/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${fashnKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fashnBody),
    });

    if (!runRes.ok) {
      const errText = await runRes.text();
      console.error("Fashn run error:", errText);
      return jsonResponse({ error: `Fashn API error: ${errText}` }, 502);
    }

    const runData = await runRes.json();
    return jsonResponse(
      { id: runData.id, status: "submitted", error: null },
      200
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Edge function error:", message);
    return jsonResponse({ error: message }, 500);
  }
});

function mapCategory(
  cat?: string
): "auto" | "tops" | "bottoms" | "one-pieces" {
  if (!cat) return "auto";
  const lower = cat.toLowerCase();
  if (
    [
      "shirt",
      "t-shirt",
      "blouse",
      "top",
      "sweater",
      "hoodie",
      "jacket",
      "blazer",
      "coat",
      "cardigan",
    ].includes(lower)
  )
    return "tops";
  if (
    ["pants", "jeans", "trousers", "shorts", "skirt", "leggings"].includes(
      lower
    )
  )
    return "bottoms";
  if (["dress", "jumpsuit", "romper", "overalls"].includes(lower))
    return "one-pieces";
  return "auto";
}

function simulateStatusComplete(id: string) {
  return {
    id,
    status: "completed",
    output: null,
    error: null,
    demo: true,
  };
}

function jsonResponse(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
