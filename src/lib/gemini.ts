// Calls Gemini 2.0 Flash directly from the client.
// For production: restrict your API key by HTTP referrer in Google Cloud Console.

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface FeedbackAnalysis {
  translation: string;
  sentiment: "Urgent" | "Frustrated" | "Positive" | "Normal";
  summary: string;
}

export async function analyzeFeedback(originalText: string): Promise<FeedbackAnalysis> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GEMINI_API_KEY");

  const prompt = `You are an assistant for an Indian agriculture grievance system.
Given the farmer's feedback (which may be in Hindi, Marathi, or English), respond ONLY with valid JSON in this exact shape:
{"translation": "<English translation>", "sentiment": "Urgent" | "Frustrated" | "Positive" | "Normal", "summary": "<one sentence summary>"}

Feedback: """${originalText}"""`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  const parsed = JSON.parse(text);
  return {
    translation: parsed.translation ?? originalText,
    sentiment: parsed.sentiment ?? "Normal",
    summary: parsed.summary ?? originalText.slice(0, 120),
  };
}
