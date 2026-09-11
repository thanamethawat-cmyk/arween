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
import { confirmScore, updateScore, dismissScoreFlag, createDispute } from "@/server/evaluate";

export type ScoreItem = {
  id: string;
  value: number;
  reason: string;
  confirmed: boolean;
  flagged: boolean;
  flagReason: string | null;
  user: { id: string; name: string };
  evidenceEvent: { action: string } | null;
  milestone: { id: string; name: string } | null;
  kpi: { id: string; name: string } | null;
  evaluationPeriodId: string | null;
};

interface ScoreTableProps {
  projectId: string;
  currentUserId: string;
  isLead: boolean;
  scores: ScoreItem[];
  loading: boolean;
  onAction: (action: () => Promise<unknown>) => Promise<void>;
}

export function ScoreTable({
  projectId,
  currentUserId,
  isLead,
  scores,
  loading,
  onAction,
}: ScoreTableProps) {
  // Score editing modal state
  const [editingScore, setEditingScore] = useState<ScoreItem | null>(null);
  const [editValue, setEditValue] = useState<string>("5");
  const [editReason, setEditReason] = useState<string>("");

  // Unflag modal state
  const [unflaggingScore, setUnflaggingScore] = useState<ScoreItem | null>(null);
  const [unflagNote, setUnflagNote] = useState<string>("");

  // Dispute form toggle per score
  const [openDisputeScoreId, setOpenDisputeScoreId] = useState<string | null>(null);

  function startEditScore(score: ScoreItem) {
    setEditingScore(score);
    setEditValue(String(score.value));
    setEditReason(score.reason);
  }

  function startUnflagScore(score: ScoreItem) {
    setUnflaggingScore(score);
    setUnflagNote("ตรวจสอบแล้ว เป็นผลงานจริงที่ไม่มีพฤติกรรมสแปม");
  }

  return (
    <>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold">
                Impact Score & Audit Trail
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                คะแนนจาก AI เป็นข้อเสนอแนะ — หัวหน้าทีมสามารถแก้ไข ปลดธง หรือยืนยันคะแนนเพื่อความโปร่งใส
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {scores.length} รายการคะแนน
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3.5">
          {scores.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              ยังไม่มีคะแนนในโปรเจกต์นี้
            </p>
          ) : (
            scores.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border bg-card p-3.5 space-y-2.5 transition-colors hover:border-border/80"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm">{s.user.name}</span>
                    <Badge
                      className={
                        s.value >= 7
                          ? "bg-emerald-600 text-white"
                          : s.value >= 4
                          ? "bg-blue-600 text-white"
                          : "bg-amber-500 text-white"
                      }
                    >
                      {s.value}/10
                    </Badge>
                    {s.flagged && (
                      <Badge variant="destructive" className="text-[11px]">
                        🚩 ตั้งธง Anti-Gaming
                      </Badge>
                    )}
                    {s.confirmed ? (
                      <Badge variant="secondary" className="text-[11px]">
                        ✓ ยืนยันแล้ว
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[11px] text-amber-700 border-amber-300">
                        รอยืนยัน
                      </Badge>
                    )}
                  </div>

                  {/* Lead Action Buttons */}
                  {isLead && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {!s.confirmed && !s.flagged && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-blue-700 border-blue-200 hover:bg-blue-50"
                          disabled={loading}
                          onClick={() =>
                            onAction(() => confirmScore(s.id, projectId))
                          }
                        >
                          หัวหน้ายืนยัน
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2.5 text-xs font-medium"
                        disabled={loading}
                        onClick={() => startEditScore(s)}
                      >
                        แก้ไขคะแนน
                      </Button>
                      {s.flagged && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                          disabled={loading}
                          onClick={() => startUnflagScore(s)}
                        >
                          ปลดธง (Unflag)
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-foreground/90">
                  {s.reason}
                </p>

                {s.milestone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="font-medium text-foreground/70">Anchor:</span>
                    <span>{s.milestone.name}</span>
                    {s.kpi && <span>/ {s.kpi.name}</span>}
                  </p>
                )}

                {s.flagReason && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 text-xs text-amber-800">
                    <span className="font-medium">เหตุผลการตั้งธง:</span> {s.flagReason}
                  </div>
                )}

                {s.evidenceEvent && (
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2.5 py-1.5">
                    <span className="font-medium text-foreground/70">หลักฐานงาน:</span>{" "}
                    {s.evidenceEvent.action}
                  </div>
                )}

                {/* Member Dispute Action */}
                {s.user.id === currentUserId && (
                  <div className="border-t pt-2 mt-2">
                    {openDisputeScoreId === s.id ? (
                      <form
                        className="space-y-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const form = new FormData(e.currentTarget);
                          const reason = String(form.get("reason") || "").trim();
                          if (!reason) return;
                          onAction(async () => {
                            await createDispute({
                              projectId,
                              userId: currentUserId,
                              reason,
                              scoreId: s.id,
                            });
                            setOpenDisputeScoreId(null);
                          });
                        }}
                      >
                        <Textarea
                          name="reason"
                          placeholder="อธิบายเหตุผลที่ไม่เห็นด้วยกับคะแนนนี้ เช่น ความยากของงาน หรือหลักฐานเพิ่มเติม..."
                          required
                          rows={2}
                          className="text-xs"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                            disabled={loading}
                          >
                            ส่งข้อโต้แย้ง
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setOpenDisputeScoreId(null)}
                          >
                            ยกเลิก
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenDisputeScoreId(s.id)}
                        className="text-xs text-muted-foreground hover:text-amber-700 underline"
                      >
                        ยื่นข้อโต้แย้งคะแนนนี้
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Modal: Score Editing */}
      {editingScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-5 shadow-xl border space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-base font-semibold">
                แก้ไขคะแนน Impact ({editingScore.user.name})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                การแก้ไขคะแนนจะถูกบันทึกลง Audit Trail เพื่อความโปร่งใส
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-foreground">
                  คะแนน Impact ใหม่ (0 - 10):
                </label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="mt-1 h-8 text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-foreground">
                  เหตุผลในการปรับคะแนน:
                </label>
                <Textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="ระบุเหตุผลการปรับคะแนน เช่น งานมีความซับซ้อนสูง หรือผลกระทบต่อ KPI ชัดเจน..."
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
                onClick={() => setEditingScore(null)}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                disabled={
                  loading ||
                  !editReason.trim() ||
                  isNaN(Number(editValue)) ||
                  Number(editValue) < 0 ||
                  Number(editValue) > 10
                }
                onClick={() => {
                  const val = Math.round(Number(editValue));
                  onAction(async () => {
                    await updateScore(
                      editingScore.id,
                      projectId,
                      val,
                      editReason.trim()
                    );
                    setEditingScore(null);
                  });
                }}
              >
                บันทึกการแก้ไข
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Unflagging */}
      {unflaggingScore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-background p-5 shadow-xl border space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-base font-semibold text-emerald-800">
                ปลดธง Anti-Gaming ({unflaggingScore.user.name})
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                การปลดธงจะทำให้คะแนนนี้สามารถนำไปคำนวณสัดส่วนในรอบประเมินได้
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded bg-amber-50 border border-amber-200 p-2.5 text-amber-900">
                <span className="font-semibold">เหตุผลเดิมที่ติดธง:</span>{" "}
                {unflaggingScore.flagReason || "ไม่มีเหตุผลระบุ"}
              </div>

              <div>
                <label className="font-medium text-foreground">
                  หมายเหตุการปลดธง:
                </label>
                <Textarea
                  value={unflagNote}
                  onChange={(e) => setUnflagNote(e.target.value)}
                  placeholder="ระบุเหตุผลการปลดธง เช่น ตรวจสอบความถูกต้องของโค้ดหรือเอกสารแล้ว..."
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
                onClick={() => setUnflaggingScore(null)}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={loading}
                onClick={() => {
                  onAction(async () => {
                    await dismissScoreFlag(
                      unflaggingScore.id,
                      projectId,
                      unflagNote.trim()
                    );
                    setUnflaggingScore(null);
                  });
                }}
              >
                ยืนยันการปลดธง
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
