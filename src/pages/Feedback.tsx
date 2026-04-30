import { useRef, useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Square, Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { analyzeFeedback, FeedbackAnalysis } from "@/lib/gemini";

const Feedback = () => {
  const { user } = useAuth();
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<FeedbackAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recogRef = useRef<any>(null);

  const start = async () => {
    setTranscript("");
    setAnalysis(null);
    setAudioUrl(null);

    // Web Speech API for transcript
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      const recog = new SR();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = "hi-IN"; // accepts Hindi/Marathi/English mixed reasonably
      recog.onresult = (ev: any) => {
        let txt = "";
        for (let i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript + " ";
        setTranscript(txt.trim());
      };
      recog.onerror = () => {};
      recog.start();
      recogRef.current = recog;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch (e: any) {
      toast.error("Microphone access denied");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    recogRef.current?.stop?.();
    setRecording(false);
  };

  const analyze = async () => {
    if (!transcript.trim()) {
      toast.error("No transcript captured. You can also type your feedback below.");
      return;
    }
    setAnalyzing(true);
    try {
      const a = await analyzeFeedback(transcript);
      setAnalysis(a);
      toast.success("Analysis complete");
    } catch (e: any) {
      toast.error(e?.message ?? "Gemini analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async () => {
    if (!user || !analysis) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        farmerId: user.uid,
        phone: user.phoneNumber ?? null,
        originalText: transcript,
        translation: analysis.translation,
        sentiment: analysis.sentiment,
        summary: analysis.summary,
        status: "Pending",
        createdAt: new Date().toISOString(),
      });
      toast.success("Feedback submitted to officers");
      setTranscript("");
      setAnalysis(null);
      setAudioUrl(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container max-w-3xl py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Voice Your Concern</h1>
          <p className="text-muted-foreground">
            Speak in Hindi, Marathi, or English. We'll translate and route it to the right officer.
          </p>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" /> Record feedback
            </CardTitle>
            <CardDescription>Tap the mic to start, tap stop when done.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-8">
              {!recording ? (
                <Button size="lg" onClick={start} className="h-20 w-20 rounded-full">
                  <Mic className="h-8 w-8" />
                </Button>
              ) : (
                <Button size="lg" variant="destructive" onClick={stop} className="h-20 w-20 rounded-full">
                  <Square className="h-7 w-7" />
                </Button>
              )}
              <div className="text-sm text-muted-foreground">
                {recording ? "Recording… speak now" : "Tap to record"}
              </div>
              {audioUrl && <audio src={audioUrl} controls className="w-full" />}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Transcript (editable)</label>
              <Textarea
                rows={4}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Your transcript will appear here. You can also type directly."
              />
            </div>

            <Button onClick={analyze} disabled={analyzing || !transcript.trim()} className="w-full" size="lg">
              {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze with AI
            </Button>

            {analysis && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Sentiment</div>
                  <div className="text-base font-semibold">{analysis.sentiment}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">English translation</div>
                  <div>{analysis.translation}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground">Summary</div>
                  <div>{analysis.summary}</div>
                </div>
                <Button onClick={submit} disabled={submitting} className="w-full" size="lg">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit to officers
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Feedback;
