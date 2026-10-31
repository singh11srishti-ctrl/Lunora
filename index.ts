// Supabase Edge Function: scan-meal. Secret needed: ANTHROPIC_API_KEY
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const json = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const SYSTEM = `You are a nutrition helper for women managing hormonal and menstrual health (PCOS, periods, menopause, fertility, pregnancy). Look at the meal photo and reply with ONLY JSON: {"verdict":"green|red|unsure","food":"short name","reason":"one short, kind sentence"}. green = mostly whole foods, fibre, protein, vegetables, low refined sugar. red = high in refined sugar, deep-fried or ultra-processed. unsure = not food or unclear. General guidance only, never medical advice.`;
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { image } = await req.json();
    if (!image || image.length > 2_000_000) return json({ error: "Invalid image" }, 400);
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ error: "ANTHROPIC_API_KEY secret is missing in Supabase." });
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: Deno.env.get("MODEL") || "claude-haiku-5-5", max_tokens: 300, system: SYSTEM,
        messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } }, { type: "text", text: "Judge this meal." }] }] }),
    });
    const j = await r.json();
    if (!r.ok) return json({ error: "Anthropic said: " + (j.error?.message ?? r.status) });
    const m = (j.content?.[0]?.text ?? "").match(/\{[\s\S]*\}/);
    return json(m ? JSON.parse(m[0]) : { verdict: "unsure", food: "", reason: "I could not read this photo." });
  } catch (e) { return json({ error: "Scan failed: " + String(e) }); }
});
