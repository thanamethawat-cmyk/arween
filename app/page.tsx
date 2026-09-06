"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getUserProjects, createProject, Project } from "@/lib/firestore-service";
import { translateFirebaseError } from "@/lib/firebase-errors";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";
import { PlusCircle, Sparkles, FolderGit2, Calendar, Award, ArrowRight } from "lucide-react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTargetDate, setNewTargetDate] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const loadProjects = async (opts?: { silent?: boolean }) => {
    if (!user) return;
    const silent = Boolean(opts?.silent);
    // #region agent log
    const payload = { sessionId: "be5c77", runId: "post-fix", hypothesisId: "C", location: "app/page.tsx:loadProjects:start", message: "loadProjects called", data: { silent, uidLen: user.uid.length }, timestamp: Date.now() };
    fetch("http://127.0.0.1:7581/ingest/9b7a220c-b9c3-4adb-9125-b7121b9f895c", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "be5c77" }, body: JSON.stringify(payload) }).catch(() => {});
    fetch("/api/debug-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => {});
    // #endregion
    if (!silent) setFetching(true);
    try {
      const data = await getUserProjects(user.uid);
      setProjects(data);
      // #region agent log
      const okPayload = { sessionId: "be5c77", runId: "post-fix", hypothesisId: "C", location: "app/page.tsx:loadProjects:ok", message: "loadProjects ok", data: { count: data.length, silent }, timestamp: Date.now() };
      fetch("http://127.0.0.1:7581/ingest/9b7a220c-b9c3-4adb-9125-b7121b9f895c", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "be5c77" }, body: JSON.stringify(okPayload) }).catch(() => {});
      fetch("/api/debug-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(okPayload) }).catch(() => {});
      // #endregion
    } catch (err) {
      console.error("Failed to load projects:", err);
      // #region agent log
      const errPayload = { sessionId: "be5c77", runId: "post-fix", hypothesisId: "D", location: "app/page.tsx:loadProjects:error", message: "loadProjects failed", data: { code: err && typeof err === "object" && "code" in err ? String((err as { code: unknown }).code) : "", msg: err instanceof Error ? err.message.slice(0, 160) : "unknown" }, timestamp: Date.now() };
      fetch("http://127.0.0.1:7581/ingest/9b7a220c-b9c3-4adb-9125-b7121b9f895c", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "be5c77" }, body: JSON.stringify(errPayload) }).catch(() => {});
      fetch("/api/debug-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(errPayload) }).catch(() => {});
      // #endregion
      setFeedback({
        type: "error",
        message: translateFirebaseError(
          err,
          "โหลดรายการโครงการไม่สำเร็จ กรุณาลองใหม่"
        ),
      });
    } finally {
      if (!silent) setFetching(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const dbg = (hypothesisId: string, location: string, message: string, data: Record<string, unknown>) => {
      // #region agent log
      const payload = { sessionId: "be5c77", runId: "post-fix", hypothesisId, location, message, data, timestamp: Date.now() };
      fetch("http://127.0.0.1:7581/ingest/9b7a220c-b9c3-4adb-9125-b7121b9f895c", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "be5c77" }, body: JSON.stringify(payload) }).catch(() => {});
      fetch("/api/debug-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => {});
      // #endregion
    };
    dbg("A", "app/page.tsx:handleCreateProject:entry", "create project submit", {
      hasUser: Boolean(user),
      uidLen: user?.uid?.length || 0,
      titleLen: newTitle.trim().length,
      creating,
      fetching,
    });
    if (!user) {
      dbg("A", "app/page.tsx:handleCreateProject:earlyReturn", "no user", {});
      setFeedback({
        type: "error",
        message: "ยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อนสร้างโครงการ",
      });
      return;
    }
    if (!newTitle.trim()) {
      dbg("A", "app/page.tsx:handleCreateProject:earlyReturn", "empty title", {
        titleLen: 0,
      });
      setFeedback({
        type: "error",
        message: "กรุณากรอกชื่อโครงการก่อนบันทึก",
      });
      return;
    }
    setCreating(true);
    setFeedback(null);
    try {
      dbg("B", "app/page.tsx:handleCreateProject:beforeCreate", "calling createProject", {
        titleLen: newTitle.trim().length,
      });
      const projectId = await createProject(user.uid, {
        title: newTitle,
        description: newDescription,
        targetDate: newTargetDate,
      });
      dbg("B", "app/page.tsx:handleCreateProject:afterCreate", "createProject succeeded", {
        projectIdLen: projectId?.length || 0,
      });
      setNewTitle("");
      setNewDescription("");
      setNewTargetDate("");
      setShowCreateModal(false);
      dbg("C", "app/page.tsx:handleCreateProject:beforeReload", "reload projects silently (no full-page spinner)", {});
      await loadProjects({ silent: true });
      dbg("C", "app/page.tsx:handleCreateProject:afterReload", "loadProjects finished", {});
      setFeedback({
        type: "success",
        message: "บันทึกโครงการแล้ว — กดการ์ดโครงการเพื่อเปิดทำงาน",
      });
    } catch (err) {
      dbg("D", "app/page.tsx:handleCreateProject:catch", "create project failed", {
        code:
          err && typeof err === "object" && "code" in err
            ? String((err as { code: unknown }).code)
            : "",
        name: err instanceof Error ? err.name : "",
        msg: err instanceof Error ? err.message.slice(0, 160) : "unknown",
      });
      console.error("Create project failed:", err);
      setFeedback({
        type: "error",
        message: translateFirebaseError(
          err,
          "สร้างโครงการไม่สำเร็จ กรุณาลองใหม่"
        ),
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">กำลังโหลด ARWEEN Operations...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalUserMerit = projects.reduce((acc, p) => acc + (p.totalMeritScore || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow-md shadow-blue-500/20">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-foreground">ARWEEN</h1>
                <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200">
                  Merit-to-Earn
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                Superior Operations Management Cycle
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                งานเบื้องหลังมีหลักฐาน — ประเมินโปร่งใสด้วย AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold">
              <Award className="h-3.5 w-3.5" />
              <span>{totalUserMerit} Merit Points</span>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-xs font-medium text-foreground">{user.displayName || user.email?.split("@")[0]}</p>
              <p className="text-[11px] text-muted-foreground">{user.email}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        {feedback && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              feedback.type === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-800 dark:text-green-300"
                : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Powered by Google Gemini 1.5 & Cloud Run
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              สวัสดีคุณ {user.displayName || "ผู้ใช้"}
            </h2>
            <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed">
              ติดตามงานในโปรเจกต์ส่วนรวม พร้อม Invisible AI Observer ที่ให้คะแนนแบบโปร่งใส (High Impact / Merit-to-Earn) เพื่อให้งานเบื้องหลังถูกมองเห็น
            </p>
          </div>
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">โครงการของคุณ ({projects.length})</h3>
            <p className="text-xs text-muted-foreground">เลือกโครงการเพื่อบันทึกงานประจำวันและดูภาพรวมความคืบหน้า</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-2 shadow"
          >
            <PlusCircle className="h-4 w-4" />
            สร้างโครงการใหม่
          </Button>
        </div>

        {/* Create Project Modal / Inline Form */}
        {showCreateModal && (
          <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-blue-950 dark:text-blue-200">
                เพิ่มโครงการใหม่
              </CardTitle>
              <CardDescription className="text-xs">
                กำหนดเป้าหมายโครงการเพื่อเริ่มติดตามความคืบหน้ารายวัน
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateProject} className="space-y-4">
                {feedback?.type === "error" && showCreateModal && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
                    {feedback.message}
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">ชื่อโครงการ *</label>
                    <Input
                      placeholder="เช่น ระบบ Payment Gateway V2"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold">เป้าหมายส่งมอบ (Target Date)</label>
                    <Input
                      type="date"
                      value={newTargetDate}
                      onChange={(e) => setNewTargetDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold">คำอธิบายและวัตถุประสงค์โครงการ</label>
                  <Textarea
                    placeholder="อธิบายสั้นๆ เกี่ยวกับเป้าหมายสำคัญของโครงการนี้..."
                    rows={2}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={creating}
                  >
                    {creating ? "กำลังสร้าง..." : "บันทึกโครงการ"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="border-dashed border-2 border-border/80 bg-background/50 text-center py-16">
            <CardContent className="space-y-4 max-w-sm mx-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <FolderGit2 className="h-7 w-7" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">ยังไม่มีโครงการ</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  เริ่มต้นด้วยการสร้างโครงการแรกของคุณ เพื่อเริ่มบันทึกงานประจำวันและให้ AI ช่วยวิเคราะห์
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                สร้างโครงการแรก
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const progress = project.overallProgress || 0;
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="h-full group hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between bg-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-bold group-hover:text-blue-600 transition-colors line-clamp-1">
                          {project.title}
                        </CardTitle>
                        <Badge
                          variant={project.status === "COMPLETED" ? "default" : "secondary"}
                          className={`text-[10px] shrink-0 ${
                            project.status === "COMPLETED"
                              ? "bg-green-600 text-white"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          }`}
                        >
                          {project.status === "COMPLETED" ? "เสร็จสิ้น" : "กำลังดำเนินการ"}
                        </Badge>
                      </div>

                      {project.description && (
                        <CardDescription className="text-xs line-clamp-2 mt-1">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4 pt-0">
                      {/* Overall Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-muted-foreground">ความคืบหน้าภาพรวม</span>
                          <span className="text-blue-600 dark:text-blue-400">{progress}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              progress >= 100
                                ? "bg-green-500"
                                : progress > 50
                                ? "bg-blue-600"
                                : "bg-amber-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* AI Summary Snippet */}
                      {project.aiSummary && (
                        <div className="rounded-lg bg-muted/50 p-2.5 text-[11px] text-muted-foreground flex items-start gap-2 border border-border/50">
                          <Sparkles className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <p className="line-clamp-2 leading-relaxed">{project.aiSummary}</p>
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Award className="h-3.5 w-3.5 text-amber-500" />
                          <span className="font-semibold text-foreground">{project.totalMeritScore || 0}</span> แต้ม
                        </div>

                        {project.targetDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{project.targetDate}</span>
                          </div>
                        ) : (
                          <span className="text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 font-medium">
                            เปิดดู <ArrowRight className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
