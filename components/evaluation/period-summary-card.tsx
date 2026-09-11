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
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import {
  closeEvaluationPeriod,
  confirmAllPeriodScores,
  confirmContributionShares,
  approveMeritCase,
  setPeriodBonusPool,
} from "@/server/periods";

export type PeriodShareItem = {
  id: string;
  ratioPercent: number;
  impactSum: number;
  confirmed: boolean;
  payoutAmount?: number | null;
  payoutStatus?: string;
  user: { id: string; name: string };
};

export type EvaluationPeriodItem = {
  id: string;
  periodStart: Date | string;
  periodEnd: Date | string;
  status: string;
  meritStatus: string;
  meritApprovedAt: Date | string | null;
  poolAmount?: number | null;
  currency?: string;
  shares: PeriodShareItem[];
};

interface PeriodSummaryCardProps {
  projectId: string;
  isLead: boolean;
  openPeriod?: EvaluationPeriodItem;
  closedPeriods: EvaluationPeriodItem[];
  loading: boolean;
  onAction: (action: () => Promise<unknown>) => Promise<void>;
}

export function PeriodSummaryCard({
  projectId,
  isLead,
  openPeriod,
  closedPeriods,
  loading,
  onAction,
}: PeriodSummaryCardProps) {
  const [bonusInputs, setBonusInputs] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      {/* รอบประเมินปัจจุบัน (เปิดอยู่) */}
      {openPeriod ? (
        <Card className="border-blue-200 bg-blue-50/20 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base text-blue-900">
                  รอบประเมินปัจจุบัน (เปิดอยู่)
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  ช่วงเวลา: {formatDate(openPeriod.periodStart)} –{" "}
                  {formatDate(openPeriod.periodEnd)}
                </p>
              </div>
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">
                กำลังเปิดรับหลักฐาน & ประเมิน
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLead && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  disabled={loading}
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onAction(() => confirmAllPeriodScores(openPeriod.id))
                  }
                >
                  ยืนยันคะแนนทั้งหมดในรอบ (ที่ไม่ถูกธง)
                </Button>
                <Button
                  disabled={loading}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() =>
                    onAction(() => closeEvaluationPeriod(openPeriod.id))
                  }
                >
                  ปิดรอบและคำนวณสัดส่วน 100%
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              * ข้อกำหนด: ต้องยืนยันคะแนนก่อนปิดรอบ — คะแนนที่ติดธง Anti-Gaming จะไม่ถูกนับเข้าสู่การกระจายสัดส่วน 100.00%
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            ยังไม่มีรอบประเมินที่เปิดอยู่ขณะนี้ ระบบจะสร้างรอบสัปดาห์ใหม่โดยอัตโนมัติเมื่อมีการบันทึกหลักฐานหรือคะแนนแรก
          </CardContent>
        </Card>
      )}

      {/* สัดส่วนผลงานและงบประมาณรอบที่ปิดแล้ว */}
      {closedPeriods.map((period) => {
        const totalRatio = period.shares
          .reduce((sum, s) => sum + s.ratioPercent, 0)
          .toFixed(2);

        return (
          <Card key={period.id} className="shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">
                    สัดส่วนผลงานรอบที่ปิด — {formatDate(period.periodStart)} ถึง{" "}
                    {formatDate(period.periodEnd)}
                  </CardTitle>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>สถานะเคสผลตอบแทน:</span>
                    <Badge
                      variant={
                        period.meritStatus === "APPROVED"
                          ? "default"
                          : "outline"
                      }
                      className={
                        period.meritStatus === "APPROVED"
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : ""
                      }
                    >
                      {period.meritStatus === "APPROVED"
                        ? "อนุมัติแล้ว (APPROVED)"
                        : period.meritStatus}
                    </Badge>
                    {period.meritApprovedAt && (
                      <span>
                        · อนุมัติเมื่อ {formatDate(period.meritApprovedAt)}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  ปิดรอบแล้ว (CLOSED)
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Merit-to-Earn: Bonus Pool Budgeting */}
              <div className="rounded-lg border bg-muted/30 p-3.5 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      งบประมาณ Merit Bonus Pool
                    </span>
                    <p className="text-base font-bold text-foreground mt-0.5">
                      {period.poolAmount !== null && period.poolAmount !== undefined
                        ? `฿${period.poolAmount.toLocaleString()} ${
                            period.currency || "THB"
                          }`
                        : "ยังไม่ได้ระบุงบประมาณ"}
                    </p>
                  </div>
                  {period.poolAmount !== null && period.poolAmount !== undefined && (
                    <Badge
                      variant="secondary"
                      className="text-emerald-700 bg-emerald-50 border-emerald-200 text-xs font-medium"
                    >
                      คำนวณยอดเงินรายบุคคลตามสัดส่วน 100% แล้ว
                    </Badge>
                  )}
                </div>

                {isLead && (
                  <div className="pt-2 border-t flex flex-wrap items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="ใส่งบประมาณโบนัส (เช่น 50000)"
                      className="max-w-[220px] h-8 text-xs bg-background"
                      value={
                        bonusInputs[period.id] !== undefined
                          ? bonusInputs[period.id]
                          : period.poolAmount !== null && period.poolAmount !== undefined
                          ? String(period.poolAmount)
                          : ""
                      }
                      onChange={(e) =>
                        setBonusInputs((prev) => ({
                          ...prev,
                          [period.id]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs font-medium"
                      disabled={loading || !bonusInputs[period.id]}
                      onClick={() => {
                        const val = parseFloat(bonusInputs[period.id] || "0");
                        if (val >= 0) {
                          onAction(() =>
                            setPeriodBonusPool(
                              period.id,
                              val,
                              period.currency || "THB"
                            )
                          );
                        }
                      }}
                    >
                      ตั้งค่างบและคำนวณยอดเงิน
                    </Button>
                  </div>
                )}
              </div>

              {/* Normalized Shares List */}
              {period.shares.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  ไม่มีคะแนนที่ยืนยันแล้วในรอบนี้ — ยังคำนวณสัดส่วนไม่ได้
                </p>
              ) : (
                <>
                  <ul className="space-y-2">
                    {period.shares.map((share) => (
                      <li
                        key={share.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm border rounded-md px-3.5 py-2.5 bg-background hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{share.user.name}</span>
                          {share.payoutAmount !== null &&
                            share.payoutAmount !== undefined && (
                              <Badge
                                variant="outline"
                                className="text-emerald-700 border-emerald-300 bg-emerald-50 text-xs font-medium"
                              >
                                ฿{share.payoutAmount.toLocaleString()}{" "}
                                {period.currency || "THB"}
                                {share.payoutStatus === "APPROVED"
                                  ? " · อนุมัติแล้ว"
                                  : " · รอจ่าย"}
                              </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-blue-700">
                            {share.ratioPercent.toFixed(2)}%
                          </span>
                          <span className="text-xs text-muted-foreground font-normal">
                            (Impact รวม {share.impactSum})
                          </span>
                          {share.confirmed ? (
                            <Badge variant="secondary" className="text-[11px]">
                              ยืนยันแล้ว
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] text-amber-600 border-amber-300">
                              รอยืนยัน
                            </Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>
                      ผลรวมสัดส่วน Contribution (Agent 2 Largest Remainder):{" "}
                      <strong className="text-foreground">{totalRatio}%</strong>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {period.shares.length} สมาชิก
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    {isLead && period.shares.some((s) => !s.confirmed) && (
                      <Button
                        size="sm"
                        disabled={loading}
                        onClick={() =>
                          onAction(() =>
                            confirmContributionShares(period.id)
                          )
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      >
                        ยืนยันสัดส่วนรอบนี้
                      </Button>
                    )}
                    {period.shares.some((s) => s.confirmed) && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        className="text-xs"
                        onClick={() => {
                          window.location.href = `/api/projects/${projectId}/periods/${period.id}/export`;
                        }}
                      >
                        Export CSV (Merit)
                      </Button>
                    )}
                    {isLead &&
                      period.shares.every((s) => s.confirmed) &&
                      period.meritStatus !== "APPROVED" && (
                        <Button
                          size="sm"
                          disabled={loading}
                          variant="outline"
                          className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={() =>
                            onAction(() => approveMeritCase(period.id))
                          }
                        >
                          อนุมัติเคสผลตอบแทน (Approve Merit Case)
                        </Button>
                      )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
