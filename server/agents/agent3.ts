export type Agent3Result = {
  flagged: boolean;
  flagReason: string | null;
  forcedScore: number | null;
};

const ACK_PATTERNS = [
  /^รับทราบ/,
  /^ขอบคุณ/,
  /^โอเค$/,
  /^ok$/i,
  /^ครับ$/,
  /^ค่ะ$/,
];

/** Agent 3: ตรวจสัญญาณปั่นคะแนน / Activity Bias */
export function runAgent3(input: {
  action: string;
  recentSameDayActions: string[];
}): Agent3Result {
  const trimmed = input.action.trim();
  const lower = trimmed.toLowerCase();

  const ackCount =
    1 +
    input.recentSameDayActions.filter((a) =>
      ACK_PATTERNS.some((p) => p.test(a.trim()) || p.test(a.trim().toLowerCase()))
    ).length;

  const isAck = ACK_PATTERNS.some(
    (p) => p.test(trimmed) || p.test(lower)
  );

  if (isAck && ackCount >= 3) {
    return {
      flagged: true,
      flagReason: `พบข้อความตอบรับซ้ำ ${ackCount} ครั้งในวันเดียว — สงสัยปั่นคะแนน (Anti-Gaming)`,
      forcedScore: 0,
    };
  }

  if (isAck || trimmed.length < 8) {
    return {
      flagged: trimmed.length < 4,
      flagReason:
        trimmed.length < 4
          ? "ข้อความสั้นเกินไปและไม่มีผลต่อ KPI"
          : null,
      forcedScore: isAck ? 1 : null,
    };
  }

  const repeatCount = input.recentSameDayActions.filter(
    (a) => a.trim() === trimmed
  ).length;
  if (repeatCount >= 2) {
    return {
      flagged: true,
      flagReason: "พบข้อความซ้ำกันหลายครั้งในวันเดียวโดยไม่มีผลต่อเป้าหมาย",
      forcedScore: 0,
    };
  }

  return { flagged: false, flagReason: null, forcedScore: null };
}
