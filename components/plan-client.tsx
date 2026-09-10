"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createObjective,
  createMilestone,
  createKpi,
  setMilestoneStatus,
  setKpiStatus,
} from "@/server/anchor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ANCHOR_STATUS_LABELS } from "@/types/schemas";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  milestones: {
    id: string;
    name: string;
    successCriteria: string;
    weight: number;
    status: string;
    kpis: {
      id: string;
      name: string;
      unit: string;
      targetValue: number;
      currentValue: number;
      weight: number;
      status: string;
    }[];
  }[];
}[];

const STATUSES = ["NOT_STARTED", "IN_PROGRESS", "ACHIEVED", "AT_RISK"] as const;

export function PlanClient({
  projectId,
  isLead,
  objectives,
  progressPercent,
}: {
  projectId: string;
  isLead: boolean;
  objectives: Plan;
  progressPercent: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function run(fn: () => Promise<unknown>) {
    setLoading(true);
    setError("");
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ดำเนินการไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>แผนเป้าหมาย (Anchor Framework)</CardTitle>
          <CardDescription>
            กำหนดวัตถุประสงค์ → งานส่งมอบ → ตัวชี้วัด พร้อมค่าน้ำหนัก
            (ระบบจัดสัดส่วนพี่น้องให้รวม 100 อัตโนมัติ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span>ความคืบหน้าจากแผนงาน</span>
            <span className="text-blue-600">{progressPercent}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-blue-600"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isLead && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">เพิ่มวัตถุประสงค์</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                run(() =>
                  createObjective({
                    projectId,
                    name: String(form.get("name")),
                    description: String(form.get("description") || ""),
                  })
                );
                e.currentTarget.reset();
              }}
            >
              <Input name="name" placeholder="ชื่อวัตถุประสงค์" required />
              <Textarea name="description" placeholder="คำอธิบาย" rows={2} />
              <Button type="submit" disabled={loading} className="bg-blue-600 text-white">
                เพิ่มวัตถุประสงค์
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {objectives.map((obj) => (
        <Card key={obj.id}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {obj.name}
              <Badge variant="outline">น้ำหนัก {obj.weight}</Badge>
            </CardTitle>
            {obj.description && (
              <CardDescription>{obj.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {obj.milestones.map((ms) => (
              <div key={ms.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">
                      {ms.name}{" "}
                      <span className="text-muted-foreground">
                        (น้ำหนัก {ms.weight})
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      เงื่อนไขสำเร็จ: {ms.successCriteria}
                    </p>
                  </div>
                  {isLead ? (
                    <select
                      className="text-xs border rounded px-2 py-1"
                      value={ms.status}
                      disabled={loading}
                      onChange={(e) =>
                        run(() =>
                          setMilestoneStatus(
                            ms.id,
                            e.target.value as (typeof STATUSES)[number]
                          )
                        )
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {ANCHOR_STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge>{ANCHOR_STATUS_LABELS[ms.status]}</Badge>
                  )}
                </div>

                {ms.kpis.map((kpi) => (
                  <div
                    key={kpi.id}
                    className="ml-3 flex flex-wrap items-center justify-between gap-2 text-xs border-l pl-3"
                  >
                    <p>
                      KPI: {kpi.name} — เป้า {kpi.targetValue} {kpi.unit}{" "}
                      (ปัจจุบัน {kpi.currentValue}) — น้ำหนัก {kpi.weight}
                    </p>
                    {isLead ? (
                      <select
                        className="border rounded px-2 py-1"
                        value={kpi.status}
                        disabled={loading}
                        onChange={(e) =>
                          run(() =>
                            setKpiStatus(
                              kpi.id,
                              e.target.value as (typeof STATUSES)[number]
                            )
                          )
                        }
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {ANCHOR_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="outline">
                        {ANCHOR_STATUS_LABELS[kpi.status]}
                      </Badge>
                    )}
                  </div>
                ))}

                {isLead && (
                  <form
                    className="grid gap-2 sm:grid-cols-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = new FormData(e.currentTarget);
                      run(() =>
                        createKpi({
                          milestoneId: ms.id,
                          name: String(form.get("name")),
                          unit: String(form.get("unit")),
                          targetValue: Number(form.get("target")),
                          weight: 1,
                        })
                      );
                      e.currentTarget.reset();
                    }}
                  >
                    <Input name="name" placeholder="ชื่อ KPI" required />
                    <Input name="unit" placeholder="หน่วย" required />
                    <Input name="target" type="number" step="any" placeholder="ค่าเป้า" required />
                    <Button type="submit" size="sm" disabled={loading} variant="outline">
                      เพิ่ม KPI
                    </Button>
                  </form>
                )}
              </div>
            ))}

            {isLead && (
              <form
                className="space-y-2 border-t pt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  run(() =>
                    createMilestone({
                      objectiveId: obj.id,
                      name: String(form.get("name")),
                      successCriteria: String(form.get("criteria")),
                      weight: 1,
                    })
                  );
                  e.currentTarget.reset();
                }}
              >
                <p className="text-xs font-semibold">เพิ่มงานส่งมอบ (Milestone)</p>
                <Input name="name" placeholder="ชื่องานส่งมอบ" required />
                <Textarea name="criteria" placeholder="เงื่อนไขสำเร็จ" required rows={2} />
                <Button type="submit" size="sm" disabled={loading} className="bg-blue-600 text-white">
                  เพิ่ม Milestone
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
