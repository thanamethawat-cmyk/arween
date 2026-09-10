"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProject } from "@/server/projects";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "@/components/sign-out-button";
import { PlusCircle, FolderGit2, Users, ArrowRight } from "lucide-react";

type ProjectCard = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progressPercent: number;
  memberCount: number;
  myRole: string;
};

export function HomeClient({
  userName,
  userEmail,
  projects,
}: {
  userName: string;
  userEmail: string;
  projects: ProjectCard[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const project = await createProject({ name, description });
      setShowCreate(false);
      setName("");
      setDescription("");
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "สร้างโปรเจกต์ไม่สำเร็จ");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow-md shadow-blue-500/20">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">ARWEEN</h1>
                <Badge variant="outline" className="text-[10px]">
                  Outcome-Driven
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Superior Operations Management Cycle
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <p className="text-xs font-medium">{userName}</p>
              <p className="text-[11px] text-muted-foreground">{userEmail}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 text-white shadow-xl">
          <h2 className="text-2xl font-bold">สวัสดีคุณ {userName}</h2>
          <p className="text-sm text-blue-100 mt-2 max-w-2xl">
            ตั้งเป้าหมายโปรเจกต์ ทำงานเป็นทีม ให้ AI ประเมินตามผลลัพธ์
            และคำนวณสัดส่วนผลงานรวม 100% อย่างโปร่งใส
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">โปรเจกต์ของฉัน ({projects.length})</h3>
            <p className="text-xs text-muted-foreground">
              เลือกโปรเจกต์เพื่อตั้งแผนเป้าหมาย บันทึกงาน และประเมินทีม
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            สร้างโปรเจกต์ใหม่
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {showCreate && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">สร้างโปรเจกต์ใหม่</CardTitle>
              <CardDescription>
                คุณจะเป็นหัวหน้าโปรเจกต์ และเชิญสมาชิกได้หลังตั้งเป้าหมาย
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
                <Input
                  placeholder="ชื่อโปรเจกต์"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Textarea
                  placeholder="คำอธิบายสั้นๆ"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit" disabled={creating} className="bg-blue-600 text-white">
                    {creating ? "กำลังสร้าง..." : "บันทึก"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {projects.length === 0 ? (
          <Card className="border-dashed border-2 text-center py-16">
            <CardContent className="space-y-4 max-w-sm mx-auto">
              <FolderGit2 className="h-10 w-10 mx-auto text-muted-foreground" />
              <h4 className="font-semibold">ยังไม่มีโปรเจกต์</h4>
              <p className="text-xs text-muted-foreground">
                สร้างโปรเจกต์แรก หรือรอรับลิงก์เชิญจากหัวหน้าทีม
              </p>
              <Button onClick={() => setShowCreate(true)} className="bg-blue-600 text-white">
                สร้างโปรเจกต์แรก
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full hover:border-blue-400 hover:shadow-lg transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base line-clamp-1">{project.name}</CardTitle>
                      <Badge variant="secondary" className="text-[10px]">
                        {project.myRole === "lead" ? "หัวหน้า" : "สมาชิก"}
                      </Badge>
                    </div>
                    {project.description && (
                      <CardDescription className="text-xs line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-muted-foreground">ความคืบหน้าจากแผนงาน</span>
                        <span className="text-blue-600">{project.progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{ width: `${Math.min(100, project.progressPercent)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-2">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {project.memberCount} คน
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-blue-600 font-medium">
                        เปิดดู <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
