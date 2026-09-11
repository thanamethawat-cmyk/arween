"use client";

import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type ChatMessage = {
  role: "user" | "model";
  text: string;
};

export function ProjectAiChatClient({
  projectId,
  projectName,
  description,
  progressPercent,
  documentTitles,
  objectives = [],
  recentEvidence = [],
}: {
  projectId: string;
  projectName: string;
  description: string | null;
  progressPercent: number;
  documentTitles: string[];
  objectives?: string[];
  recentEvidence?: string[];
}) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    setLoading(true);
    setError("");
    setInput("");
    const nextHistory = [...history, { role: "user" as const, text: message }];
    setHistory(nextHistory);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message,
          history: nextHistory.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          })),
          projectContext: {
            title: projectName,
            description: description || undefined,
            currentProgress: progressPercent,
            connectedGoogleTools: documentTitles,
            objectives,
            recentEvidence,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "แชท AI ไม่สำเร็จ");
      }
      setHistory((prev) => [
        ...prev,
        { role: "model", text: String(data.reply || "") },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "แชท AI ไม่สำเร็จ");
      setHistory((prev) => prev.slice(0, -1));
      setInput(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          แชท AI ในโปรเจกต์
          <Badge variant="outline">Gemini</Badge>
        </CardTitle>
        <CardDescription>
          ถาม-ตอบเฉพาะบริบทโปรเจกต์นี้ (เป้าหมาย, ความคืบหน้า, เอกสารที่ผูกไว้)
          — ไม่ใช่ช่องจ่ายโบนัสอัตโนมัติ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-72 overflow-y-auto rounded-lg border bg-muted/30 p-3 space-y-3">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground">
              ตัวอย่าง: &quot;สรุปสถานะโปรเจกต์ตอนนี้&quot; หรือ
              &quot;Milestone ไหนเสี่ยงบ้าง&quot;
            </p>
          )}
          {history.map((m, i) => (
            <div
              key={`${m.role}-${i}`}
              className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-blue-600 text-white ml-8"
                  : "bg-background border mr-8"
              }`}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <p className="text-xs text-muted-foreground">AI กำลังตอบ...</p>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <form onSubmit={sendMessage} className="space-y-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="พิมพ์คำถามเกี่ยวกับโปรเจกต์นี้..."
            rows={3}
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white"
          >
            {loading ? "กำลังส่ง..." : "ส่งข้อความ"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
