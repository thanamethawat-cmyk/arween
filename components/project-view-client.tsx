"use client";

/**
 * @deprecated LEGACY Firebase project UI — ไม่ถูกผูก route ใน App Router แล้ว
 * ใช้ `/projects/[id]` (Prisma) แทน
 */
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  getProject,
  getDailyLogs,
  addDailyLog,
  updateProjectAIOverview,
  getGoogleTools,
  addGoogleTool,
  deleteGoogleTool,
  Project,
  DailyLog,
  GoogleToolLink,
} from "@/lib/firestore-service";
import { translateFirebaseError } from "@/lib/firebase-errors";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Award,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  TrendingUp,
  Bot,
  User as UserIcon,
  FileText,
  Sheet,
  HardDrive,
  Video,
  Presentation,
  Link2,
  Trash2,
  ExternalLink,
  Plus,
} from "lucide-react";

type Feedback = { type: "success" | "error"; message: string } | null;

export function ProjectViewClient({ projectId }: { projectId: string }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [googleTools, setGoogleTools] = useState<GoogleToolLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [showAddTool, setShowAddTool] = useState(false);
  const [toolTitle, setToolTitle] = useState("");
  const [toolUrl, setToolUrl] = useState("");
  const [toolType, setToolType] = useState<GoogleToolLink["type"]>("docs");
  const [addingTool, setAddingTool] = useState(false);
  const [toolFeedback, setToolFeedback] = useState<Feedback>(null);

  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [logTitle, setLogTitle] = useState("");
  const [logDetails, setLogDetails] = useState("");
  const [logBlockers, setLogBlockers] = useState("");
  const [progressIncrement, setProgressIncrement] = useState(5);
  const [evaluatingWithAI, setEvaluatingWithAI] = useState(true);
  const [submittingLog, setSubmittingLog] = useState(false);
  const [logFeedback, setLogFeedback] = useState<Feedback>(null);

  const [summarizing, setSummarizing] = useState(false);
  const [summaryFeedback, setSummaryFeedback] = useState<Feedback>(null);

  const [messages, setMessages] = useState<
    Array<{ role: "user" | "model"; text: string }>
  >([
    {
      role: "model",
      text: "สวัสดีครับ ผมคือ Invisible AI Observer ของ ARWEEN ช่วยบันทึกงานในโปรเจกต์ส่วนรวม ประเมินแบบเป็นกลางด้วยหลัก High Impact และสรุปผลทีมให้นำไปใช้ประกอบ Merit-to-Earn ได้ ถามได้เฉพาะงานในโปรเจกต์นี้ครับ",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    setPageError("");
    try {
      const [projData, logsData, toolsData] = await Promise.all([
        getProject(user.uid, projectId),
        getDailyLogs(user.uid, projectId),
        getGoogleTools(user.uid, projectId),
      ]);
      setProject(projData);
      setDailyLogs(logsData);
      setGoogleTools(toolsData);
    } catch (err) {
      console.error("Failed to load project details:", err);
      setPageError(
        translateFirebaseError(err, "โหลดข้อมูลโครงการไม่สำเร็จ กรุณาลองใหม่")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && projectId) {
      loadData();
    }
  }, [user, projectId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !project || !logTitle.trim()) return;

    setSubmittingLog(true);
    setLogFeedback(null);
    try {
      let meritScore = 5;
      let aiRationale = "บันทึกการทำงานตามปกติ (ไม่ได้ใช้ AI ประเมิน)";
      let actualIncrement = progressIncrement;

      if (evaluatingWithAI) {
        const fullContent = `งานที่ทำ: ${logTitle}\nรายละเอียด: ${logDetails}\nอุปสรรค: ${logBlockers || "ไม่มี"}`;
        const evalRes = await fetch("/api/ai/evaluate-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectTitle: project.title,
            logContent: fullContent,
          }),
        });

        const evalBody = await evalRes.json().catch(() => ({}));

        if (!evalRes.ok) {
          setLogFeedback({
            type: "error",
            message:
              (evalBody as { error?: string }).error ||
              "AI ประเมินไม่สำเร็จ — ยังไม่บันทึกงาน กรุณาลองใหม่",
          });
          return;
        }

        const evalData = evalBody as {
          meritScore?: number;
          rationale?: string;
          progressIncrement?: number;
        };
        meritScore = Number(evalData.meritScore) || 5;
        aiRationale = evalData.rationale || "บันทึกการทำงานตามมาตรฐาน";
        if (evalData.progressIncrement != null) {
          actualIncrement = Number(evalData.progressIncrement) || actualIncrement;
        }
      }

      await addDailyLog(user.uid, projectId, {
        date: logDate,
        title: logTitle,
        completedTasks: logDetails,
        blockers: logBlockers,
        progressContribution: actualIncrement,
        meritScore,
        aiRationale,
      });

      setLogTitle("");
      setLogDetails("");
      setLogBlockers("");
      setLogFeedback({
        type: "success",
        message: evaluatingWithAI
          ? `บันทึกงานแล้ว — คะแนน ${meritScore}/10`
          : "บันทึกงานแล้ว (ไม่ได้ใช้ AI ประเมิน)",
      });
      await loadData();
    } catch (err) {
      console.error("Failed to submit daily log:", err);
      setLogFeedback({
        type: "error",
        message: translateFirebaseError(
          err,
          "บันทึกงานไม่สำเร็จ กรุณาลองใหม่"
        ),
      });
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleSummarizeProject = async () => {
    if (!user || !project || dailyLogs.length === 0) return;
    setSummarizing(true);
    setSummaryFeedback(null);
    try {
      const res = await fetch("/api/ai/summarize-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectTitle: project.title,
          projectDescription: project.description,
          dailyLogs: dailyLogs.map((l) => ({
            date: l.date,
            summary: `${l.title}: ${l.completedTasks}`,
            meritScore: l.meritScore,
            blockers: l.blockers,
          })),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSummaryFeedback({
          type: "error",
          message:
            (data as { error?: string }).error ||
            "อัปเดตบทวิเคราะห์ไม่สำเร็จ — สรุปเดิมยังคงอยู่",
        });
        return;
      }

      await updateProjectAIOverview(
        user.uid,
        projectId,
        (data as { executiveSummary: string }).executiveSummary,
        (data as { recommendations?: string[] }).recommendations || []
      );
      await loadData();
      setSummaryFeedback({
        type: "success",
        message: "อัปเดตบทวิเคราะห์ AI แล้ว",
      });
    } catch (err) {
      console.error("Failed to generate project summary:", err);
      setSummaryFeedback({
        type: "error",
        message: "อัปเดตบทวิเคราะห์ไม่สำเร็จ — สรุปเดิมยังคงอยู่",
      });
    } finally {
      setSummarizing(false);
    }
  };

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !toolTitle.trim() || !toolUrl.trim()) return;

    const url = toolUrl.trim();
    if (!url.startsWith("https://")) {
      setToolFeedback({
        type: "error",
        message: "ลิงก์ต้องขึ้นต้นด้วย https://",
      });
      return;
    }

    setAddingTool(true);
    setToolFeedback(null);
    try {
      await addGoogleTool(user.uid, projectId, {
        title: toolTitle.trim(),
        url,
        type: toolType,
      });
      setToolTitle("");
      setToolUrl("");
      setShowAddTool(false);
      const updated = await getGoogleTools(user.uid, projectId);
      setGoogleTools(updated);
      setToolFeedback({
        type: "success",
        message: "เชื่อมต่อเครื่องมือแล้ว — กดชื่อเพื่อเปิดในแท็บใหม่",
      });
    } catch (err) {
      console.error("Failed to add Google tool:", err);
      setToolFeedback({
        type: "error",
        message: translateFirebaseError(
          err,
          "เชื่อมต่อเครื่องมือไม่สำเร็จ กรุณาลองใหม่"
        ),
      });
    } finally {
      setAddingTool(false);
    }
  };

  const handleDeleteTool = async (toolId: string) => {
    if (!user) return;
    setToolFeedback(null);
    try {
      await deleteGoogleTool(user.uid, projectId, toolId);
      setGoogleTools((prev) => prev.filter((t) => t.id !== toolId));
      setToolFeedback({
        type: "success",
        message: "ลบการเชื่อมต่อแล้ว (ไฟล์บน Google ยังอยู่)",
      });
    } catch (err) {
      console.error("Failed to delete Google tool:", err);
      setToolFeedback({
        type: "error",
        message: translateFirebaseError(
          err,
          "ลบการเชื่อมต่อไม่สำเร็จ กรุณาลองใหม่"
        ),
      });
    }
  };

  const getToolIcon = (type: GoogleToolLink["type"]) => {
    switch (type) {
      case "docs":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "sheets":
        return <Sheet className="h-4 w-4 text-emerald-500" />;
      case "drive":
        return <HardDrive className="h-4 w-4 text-amber-500" />;
      case "slides":
        return <Presentation className="h-4 w-4 text-orange-500" />;
      case "meet":
        return <Video className="h-4 w-4 text-red-500" />;
      default:
        return <Link2 className="h-4 w-4 text-indigo-500" />;
    }
  };

  const handleSendChat = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const textToSend = customMsg || chatInput;
    if (!textToSend.trim() || sendingChat) return;

    const newMessages = [
      ...messages,
      { role: "user" as const, text: textToSend },
    ];
    setMessages(newMessages);
    setChatInput("");
    setSendingChat(true);

    try {
      const historyPayload = newMessages.slice(0, -1).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }] as [{ text: string }],
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: historyPayload,
          message: textToSend,
          projectContext: {
            title: project?.title || "Project",
            description: project?.description,
            currentProgress: project?.overallProgress || 0,
            connectedGoogleTools: googleTools.map(
              (t) => `${t.type.toUpperCase()}: ${t.title} (${t.url})`
            ),
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "model", text: (data as { reply: string }).reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            text:
              (data as { error?: string }).error ||
              "เชื่อมต่อกับ AI ไม่สำเร็จ กรุณาลองใหม่",
          },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "ไม่สามารถส่งข้อความได้ในขณะนี้ กรุณาตรวจสอบเครือข่ายแล้วลองใหม่",
        },
      ]);
    } finally {
      setSendingChat(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">กำลังโหลดข้อมูลโครงการ...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground mb-4">
          {pageError || "ไม่พบข้อมูลโครงการนี้"}
        </p>
        <Link href="/">
          <Button variant="outline">กลับสู่หน้าหลัก</Button>
        </Link>
      </div>
    );
  }

  const progress = project.overallProgress || 0;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 pb-12">
      {/* Top Navigation */}
      <div className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าโครงการทั้งหมด
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              {project.status === "COMPLETED" ? "โครงการสำเร็จแล้ว" : "กำลังดำเนินการ"}
            </Badge>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Project Overview Header Card */}
        <Card className="border-border/80 shadow-sm bg-card overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {project.title}
                  </h1>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                )}
                {project.targetDate && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium pt-1">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" />
                    <span>กำหนดส่งมอบ: {project.targetDate}</span>
                  </div>
                )}
              </div>

              {/* Merit Points & Stats Pill */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 p-3 sm:p-0 rounded-xl bg-muted/40 sm:bg-transparent">
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-amber-700 dark:text-amber-300 font-bold text-sm">
                  <Award className="h-5 w-5 text-amber-500" />
                  <span>{project.totalMeritScore || 0} Merit Points</span>
                </div>
                <span className="text-xs text-muted-foreground">บันทึกงานแล้ว {dailyLogs.length} วัน</span>
              </div>
            </div>

            {/* Direct Project Progress Rollup Bar */}
            <div className="rounded-xl border border-blue-100 dark:border-blue-950 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-2">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-blue-950 dark:text-blue-200 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  ความคืบหน้าภาพรวมโครงการ (Progress Rollup)
                </span>
                <span className="text-lg text-blue-600 dark:text-blue-400 font-black">{progress}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-blue-200/60 dark:bg-blue-900/60 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    progress >= 100
                      ? "bg-green-500"
                      : progress > 50
                      ? "bg-blue-600"
                      : "bg-amber-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                * ข้อมูลความคืบหน้านี้คำนวณและอัปเดตแบบเรียลไทม์จากบันทึกงานประจำวัน (Daily Logs) ที่คุณส่งเข้ามา
              </p>
            </div>

            {/* AI Executive Summary Box */}
            <div className="rounded-xl border border-border/80 bg-background p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                  <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                  ภาพรวมโครงการ (สรุปผลทีมโดย AI)
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-normal">
                    Audit Trail
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSummarizeProject}
                  disabled={summarizing || dailyLogs.length === 0}
                  className="h-7 text-xs gap-1.5"
                >
                  <RefreshCw className={`h-3 w-3 ${summarizing ? "animate-spin" : ""}`} />
                  {summarizing ? "กำลังวิเคราะห์..." : "อัปเดตบทวิเคราะห์ AI"}
                </Button>
              </div>
              {summaryFeedback && (
                <p
                  className={`text-xs ${
                    summaryFeedback.type === "success"
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {summaryFeedback.message}
                </p>
              )}
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {project.aiSummary || "ยังไม่มีบทวิเคราะห์ภาพรวม บันทึกการทำงานประจำวันแล้วกดปุ่มอัปเดตบทวิเคราะห์ AI"}
              </p>
              {project.keyBlockers && project.keyBlockers.length > 0 && (
                <div className="pt-2 border-t border-border/60">
                  <span className="text-xs font-semibold text-foreground">จุดติดขัดหรือคำแนะนำจาก AI:</span>
                  <ul className="mt-1 list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                    {project.keyBlockers.map((blocker, idx) => (
                      <li key={idx}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2-Column Working Area */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Daily Work Tracker & Activity Timeline (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Connected Google Tools Card */}
            <Card className="border-border/80 shadow-sm bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        เครื่องมือ Google ที่เชื่อมโยง ({googleTools.length})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        เชื่อมต่อ Google Docs, Sheets, Drive, Meet เพื่ออ้างอิงในการทำงานร่วมกับ AI
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddTool(!showAddTool)}
                    className="text-xs gap-1 h-7"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {showAddTool ? "ปิดฟอร์ม" : "เชื่อมต่อเครื่องมือ"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {toolFeedback && (
                  <div
                    className={`rounded-lg border p-2.5 text-xs ${
                      toolFeedback.type === "success"
                        ? "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-300"
                        : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {toolFeedback.message}
                  </div>
                )}
                {showAddTool && (
                  <form onSubmit={handleAddTool} className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-3 animate-in fade-in duration-150">
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">ประเภทเครื่องมือ</label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium focus:outline-none"
                          value={toolType}
                          onChange={(e) => setToolType(e.target.value as any)}
                        >
                          <option value="docs">📄 Google Docs</option>
                          <option value="sheets">📊 Google Sheets</option>
                          <option value="drive">📁 Google Drive</option>
                          <option value="slides">📽️ Google Slides</option>
                          <option value="meet">📹 Google Meet</option>
                          <option value="other">🔗 อื่นๆ (URL)</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-semibold">ชื่อเอกสารหรือเครื่องมือ *</label>
                        <Input
                          placeholder="เช่น PRD สเปกระบบ หรือ ชีตคำนวณต้นทุน"
                          value={toolTitle}
                          onChange={(e) => setToolTitle(e.target.value)}
                          required
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">ลิงก์ URL (เช่น https://docs.google.com/...) *</label>
                      <Input
                        type="url"
                        placeholder="https://..."
                        value={toolUrl}
                        onChange={(e) => setToolUrl(e.target.value)}
                        required
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddTool(false)}
                        className="h-7 text-xs"
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={addingTool}
                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {addingTool ? "กำลังบันทึก..." : "ยืนยันการเชื่อมต่อ"}
                      </Button>
                    </div>
                  </form>
                )}

                {googleTools.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/80 p-3 text-center text-xs text-muted-foreground">
                    ยังไม่มีเครื่องมือ Google ที่เชื่อมโยง — กด &quot;เชื่อมต่อเครื่องมือ&quot; เพื่อผูก Google Docs หรือ Sheets เข้ากับโปรเจกต์นี้
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {googleTools.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border/70 bg-background hover:border-blue-300 transition-colors text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getToolIcon(t.type)}
                          <div className="min-w-0">
                            <a
                              href={t.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-foreground hover:text-blue-600 hover:underline flex items-center gap-1 truncate"
                            >
                              <span className="truncate">{t.title}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                            </a>
                            <span className="text-[10px] text-muted-foreground uppercase">{t.type}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTool(t.id)}
                          className="text-muted-foreground hover:text-red-600 p-1 rounded transition-colors"
                          title="ลบการเชื่อมต่อ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Check-in Form Card */}
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  บันทึกการทำงานประจำวัน (Daily Check-in)
                </CardTitle>
                <CardDescription className="text-xs">
                  บันทึกความคืบหน้ารายวัน ข้อมูลจะถูกเชื่อมโยงและคำนวณเข้าสู่เปอร์เซ็นต์โครงการโดยตรง
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitLog} className="space-y-4">
                  {logFeedback && (
                    <div
                      className={`rounded-lg border p-2.5 text-xs ${
                        logFeedback.type === "success"
                          ? "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-300"
                          : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {logFeedback.message}
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">วันที่บันทึก *</label>
                      <Input
                        type="date"
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-semibold">หัวข้องานสำคัญวันนี้ *</label>
                      <Input
                        placeholder="เช่น รีแฟกเตอร์ระบบ Auth และเชื่อม Firestore"
                        value={logTitle}
                        onChange={(e) => setLogTitle(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold">รายละเอียดงานและสิ่งที่ทำสำเร็จ</label>
                    <Textarea
                      placeholder="อธิบายสิ่งที่คุณได้ส่งมอบ, การแก้บั๊ก, หรือการช่วยเหลือทีม..."
                      rows={3}
                      value={logDetails}
                      onChange={(e) => setLogDetails(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      อุปสรรคหรือปัญหาที่ติดขัด (Blockers - ถ้ามี)
                    </label>
                    <Input
                      placeholder="เช่น รอ API Credential จากลูกค้า หรือติดปัญหา memory leak"
                      value={logBlockers}
                      onChange={(e) => setLogBlockers(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 pt-1 items-center">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold">
                        ความคืบหน้าที่เพิ่มให้โครงการ (+%)
                      </label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
                        value={progressIncrement}
                        onChange={(e) => setProgressIncrement(Number(e.target.value))}
                      >
                        <option value={3}>+3% (งานทั่วไป / อัปเดตย่อย)</option>
                        <option value={5}>+5% (ส่งมอบงานตามแผน)</option>
                        <option value={10}>+10% (งานสำคัญ / แก้ไขจุดวิกฤต)</option>
                        <option value={15}>+15% (ส่งมอบ Milestone ใหญ่)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-4 sm:pt-0">
                      <input
                        type="checkbox"
                        id="evalAI"
                        checked={evaluatingWithAI}
                        onChange={(e) => setEvaluatingWithAI(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="evalAI" className="text-xs text-muted-foreground cursor-pointer">
                        ให้ <strong>Invisible AI Observer</strong> ประเมิน High Impact / Merit Score พร้อมเหตุผล
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow"
                    disabled={submittingLog}
                  >
                    {submittingLog ? "กำลังบันทึกและให้ AI ประเมิน..." : "บันทึกและเชื่อมโยงสู่ภาพรวมโครงการ"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Daily Activity Feed */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-foreground flex items-center justify-between">
                <span>ประวัติการทำงานประจำวัน ({dailyLogs.length})</span>
                <span className="text-xs font-normal text-muted-foreground">เรียงตามวันที่ล่าสุด</span>
              </h3>

              {dailyLogs.length === 0 ? (
                <Card className="border-dashed p-8 text-center text-muted-foreground">
                  ยังไม่มีบันทึกการทำงานประจำวัน เริ่มต้นบันทึกงานแรกของคุณด้านบน
                </Card>
              ) : (
                <div className="space-y-3">
                  {dailyLogs.map((log) => (
                    <Card key={log.id} className="border-border/80 hover:border-blue-300 transition-colors">
                      <CardContent className="p-4 sm:p-5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-bold text-foreground">
                              {log.date}
                            </span>
                            <h4 className="text-sm font-bold text-foreground">{log.title}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[11px] bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200">
                              +{log.progressContribution}% ความคืบหน้า
                            </Badge>
                            <Badge className="bg-amber-500 text-white text-[11px] flex items-center gap-1 font-bold">
                              <Award className="h-3 w-3" />
                              {log.meritScore}/10 แต้ม
                            </Badge>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                          {log.completedTasks}
                        </p>

                        {log.blockers && log.blockers !== "ไม่มี" && log.blockers !== "None" && (
                          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-700 dark:text-red-400 flex items-start gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-semibold">อุปสรรค: </strong>
                              <span>{log.blockers}</span>
                            </div>
                          </div>
                        )}

                        {log.aiRationale && (
                          <div className="rounded-md bg-blue-50/60 dark:bg-blue-950/30 p-2 text-[11px] text-blue-900 dark:text-blue-200 flex items-start gap-1.5 border border-blue-100 dark:border-blue-900">
                            <Sparkles className="h-3 w-3 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-semibold">เหตุผลการประเมินจาก AI: </strong>
                              <span>{log.aiRationale}</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: ARWEEN Multi-turn AI Operations Copilot (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="border-border/80 shadow-md sticky top-20 flex flex-col h-[680px]">
              <CardHeader className="pb-3 border-b border-border/80 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground flex flex-wrap items-center gap-2">
                        <span>Invisible AI Observer</span>
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-normal">
                          ประเมินแบบเป็นกลาง
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-[11px]">
                        High Impact Action · Audit Trail · Gemini
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                    Online
                  </Badge>
                </div>
              </CardHeader>

              {/* Chat Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {m.role === "model" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-[10px] mt-0.5">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] leading-relaxed ${
                        m.role === "user"
                          ? "bg-blue-600 text-white rounded-tr-none font-medium"
                          : "bg-muted/70 text-foreground border border-border/60 rounded-tl-none"
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>
                    </div>
                    {m.role === "user" && (
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-800 text-foreground text-[10px] mt-0.5">
                        <UserIcon className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>
                ))}
                {sendingChat && (
                  <div className="flex items-center gap-2 text-muted-foreground text-xs pl-8">
                    <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce delay-100" />
                    <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce delay-200" />
                    <span className="text-[11px]">Gemini กำลังคิดคำตอบ...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Quick Prompts */}
              <div className="px-3 py-1.5 border-t border-border/50 bg-background/50 flex gap-1.5 overflow-x-auto text-[10px]">
                <button
                  type="button"
                  onClick={() => handleSendChat(undefined, "ช่วยวิเคราะห์จุดติดขัด (Blockers) และแนะนำวิธีแก้ไขให้หน่อย")}
                  className="shrink-0 rounded-full border border-border bg-muted/40 px-2.5 py-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  🔍 วิเคราะห์จุดติดขัด
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat(undefined, "ช่วยวางแผนงานขั้นตอนถัดไปสำหรับโปรเจกต์นี้")}
                  className="shrink-0 rounded-full border border-border bg-muted/40 px-2.5 py-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  📋 แผนงานถัดไป
                </button>
                <button
                  type="button"
                  onClick={() => handleSendChat(undefined, "สรุปภาพรวมความคืบหน้าของโครงการนี้ให้หน่อย")}
                  className="shrink-0 rounded-full border border-border bg-muted/40 px-2.5 py-1 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  📊 สรุปความคืบหน้า
                </button>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-border/80 bg-background flex gap-2">
                <Input
                  placeholder="พิมพ์ข้อความปรึกษา AI..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={sendingChat}
                  className="text-xs h-9"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={sendingChat || !chatInput.trim()}
                  className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
