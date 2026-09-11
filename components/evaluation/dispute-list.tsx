"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { resolveDispute, rejectDispute } from "@/server/evaluate";

export type DisputeItem = {
  id: string;
  reason: string;
  status: string;
  scoreId: string | null;
  user: { name: string; email?: string };
  score?: {
    id: string;
    value: number;
    reason: string;
    flagged: boolean;
    flagReason: string | null;
    confirmed: boolean;
    evidence?: { action: string } | null;
    evidenceEvent?: { action: string } | null;
  } | null;
};

interface DisputeListProps {
  projectId: string;
  isLead: boolean;
  disputes: DisputeItem[];
  loading: boolean;
  onAction: (action: () => Promise<unknown>) => Promise<void>;
}

export function DisputeList({
  projectId,
  isLead,
  disputes,
  loading,
  onAction,
}: DisputeListProps) {
  // Resolution dialog state
  const [resolvingDispute, setResolvingDispute] = useState<DisputeItem | null>(
    null
  );
  const [newScoreValue, setNewScoreValue] = useState<string>("");
  const [resolutionNote, setResolutionNote] = useState<string>("");

  // Rejection dialog state
  const [rejectingDispute, setRejectingDispute] = useState<DisputeItem | null>(
    null
  );
  const [rejectionNote, setRejectionNote] = useState<string>("");

  function startResolve(dispute: DisputeItem) {
    setResolvingDispute(dispute);
    if (dispute.score) {
      setNewScoreValue(String(dispute.score.value));
    } else {
      setNewScoreValue("");
    }
    setResolutionNote("พิจารณาหลักฐานเพิ่มเติมแล้ว รับข้อโต้แย้งและปรับคะแนน");
  }

  function startReject(dispute: DisputeItem) {
    setRejectingDispute(dispute);
    setRejectionNote("หลักฐานยังไม่เพียงพอต่อการปรับคะแนน");
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                ข้อโต้แย้งคะแนน (Dispute Resolution Flow)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                สมาชิกสามารถยื่นข้อโต้แย้งคะแนนได้ และหัวหน้าทีมสามารถพิจารณาปรับคะแนนหรือปลดธงได้อย่างโปร่งใส
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {disputes.length} ข้อโต้แย้ง
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {disputes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              ไม่มีข้อโต้แย้งในโปรเจกต์นี้
            </p>
          ) : (
            disputes.map((d) => {
              const evidenceAction =
                d.score?.evidence?.action || d.score?.evidenceEvent?.action;

              return (
                <div
                  key={d.id}
                  className="rounded-lg border bg-card p-3.5 space-y-3 transition-colors hover:border-border/80"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {d.user.name}
                      </span>
                      {d.user.email && (
                        <span className="text-xs text-muted-foreground">
                          ({d.user.email})
                        </span>
                      )}
                      <Badge
                        variant={
                          d.status === "RESOLVED"
                            ? "default"
                            : d.status === "PENDING"
                            ? "outline"
                            : "secondary"
                        }
                        className={
                          d.status === "RESOLVED"
                            ? "bg-emerald-600 text-white"
                            : d.status === "PENDING"
                            ? "border-amber-400 text-amber-800 bg-amber-50"
                            : "text-muted-foreground"
                        }
                      >
                        {d.status === "RESOLVED"
                          ? "✓ ยอมรับ/แก้ไขแล้ว"
                          : d.status === "PENDING"
                          ? "⏳ รอดำเนินการ"
                          : "✕ ปฏิเสธ"}
                      </Badge>
                    </div>

                    {isLead && d.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={loading}
                          onClick={() => startResolve(d)}
                        >
                          พิจารณารับเรื่อง / ปรับคะแนน
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs text-red-700 border-red-200 hover:bg-red-50"
                          disabled={loading}
                          onClick={() => startReject(d)}
                        >
                          ไม่รับข้อโต้แย้ง
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* ข้อความเหตุผลที่สมาชิกยื่น */}
                  <div className="rounded bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-950">
                    <span className="font-semibold text-amber-900">
                      เหตุผลข้อโต้แย้ง:
                    </span>{" "}
                    {d.reason}
                  </div>

                  {/* รายละเอียดคะแนนและหลักฐานที่ถูกโต้แย้ง */}
                  {d.score ? (
                    <div className="rounded-md border bg-muted/20 p-3 space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-semibold text-foreground/80">
                          ข้อมูลคะแนนที่ถูกโต้แย้ง:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[11px]">
                            คะแนน: {d.score.value}/10
                          </Badge>
                          {d.score.flagged && (
                            <Badge variant="destructive" className="text-[10px]">
                              ติดธง
                            </Badge>
                          )}
                          {d.score.confirmed ? (
                            <Badge variant="secondary" className="text-[10px]">
                              ยืนยันแล้ว
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-amber-700">
                              ยังไม่ยืนยัน
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        <span className="font-medium">เหตุผลเดิม:</span>{" "}
                        {d.score.reason}
                      </p>
                      {d.score.flagReason && (
                        <p className="text-amber-800">
                          <span className="font-medium">เหตุผลที่ติดธง:</span>{" "}
                          {d.score.flagReason}
                        </p>
                      )}
                      {evidenceAction && (
                        <div className="pt-1 border-t mt-1 text-muted-foreground">
                          <span className="font-medium text-foreground/70">
                            หลักฐานงานที่ผูกไว้:
                          </span>{" "}
                          {evidenceAction}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      ไม่ได้ผูกกับคะแนนเฉพาะเจาะจง
                    </p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Modal: Dispute Resolution Dialog */}
      {resolvingDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-5 shadow-xl border space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-base font-semibold text-emerald-800">
                พิจารณารับข้อโต้แย้ง ({resolvingDispute.user.name})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                สามารถระบุคะแนนใหม่เพื่อปรับปรุงคะแนน ปลดธง และยืนยันคะแนนทันที
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded bg-muted/40 p-2.5 space-y-1">
                <p>
                  <span className="font-medium">เหตุผลข้อโต้แย้ง:</span>{" "}
                  {resolvingDispute.reason}
                </p>
                {resolvingDispute.score && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">คะแนนปัจจุบัน:</span>{" "}
                    {resolvingDispute.score.value}/10
                  </p>
                )}
              </div>

              {resolvingDispute.score && (
                <div>
                  <label className="font-medium text-foreground">
                    คะแนนใหม่หลังพิจารณา (0 - 10):
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    value={newScoreValue}
                    onChange={(e) => setNewScoreValue(e.target.value)}
                    placeholder="เช่น 8"
                    className="mt-1 h-8 text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    * เมื่อระบุคะแนนใหม่ ระบบจะอัปเดต Score, ปลดธง Anti-Gaming และตั้งสถานะยืนยัน (Confirmed) อัตโนมัติ
                  </p>
                </div>
              )}

              <div>
                <label className="font-medium text-foreground">
                  หมายเหตุการพิจารณา (Resolution Note):
                </label>
                <Textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="ระบุเหตุผลการตัดสิน เช่น ตรวจสอบหลักฐานเพิ่มเติมแล้ว งานมีมูลค่าจริง..."
                  rows={3}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={loading}
                onClick={() => setResolvingDispute(null)}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={
                  loading ||
                  (newScoreValue !== "" &&
                    (isNaN(Number(newScoreValue)) ||
                      Number(newScoreValue) < 0 ||
                      Number(newScoreValue) > 10))
                }
                onClick={() => {
                  const scoreVal =
                    newScoreValue !== ""
                      ? Math.round(Number(newScoreValue))
                      : undefined;

                  onAction(async () => {
                    await resolveDispute(
                      resolvingDispute.id,
                      projectId,
                      scoreVal,
                      resolutionNote.trim()
                    );
                    setResolvingDispute(null);
                  });
                }}
              >
                บันทึกผลการพิจารณา
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Dispute Rejection Dialog */}
      {rejectingDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-5 shadow-xl border space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-base font-semibold text-red-800">
                ปฏิเสธข้อโต้แย้ง ({rejectingDispute.user.name})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                ข้อโต้แย้งจะเปลี่ยนสถานะเป็น REJECTED และคะแนนเดิมจะไม่เปลี่ยนแปลง
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded bg-muted/40 p-2.5 space-y-1">
                <p>
                  <span className="font-medium">เหตุผลข้อโต้แย้ง:</span>{" "}
                  {rejectingDispute.reason}
                </p>
              </div>

              <div>
                <label className="font-medium text-foreground">
                  เหตุผลในการปฏิเสธ:
                </label>
                <Textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="ระบุเหตุผลในการปฏิเสธข้อโต้แย้ง..."
                  rows={3}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={loading}
                onClick={() => setRejectingDispute(null)}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
                disabled={loading}
                onClick={() => {
                  onAction(async () => {
                    await rejectDispute(
                      rejectingDispute.id,
                      projectId,
                      rejectionNote.trim()
                    );
                    setRejectingDispute(null);
                  });
                }}
              >
                ยืนยันการปฏิเสธ
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
