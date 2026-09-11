import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface EvaluationHeaderProps {
  projectId: string;
  projectName: string;
  isLead?: boolean;
}

export function EvaluationHeader({
  projectId,
  projectName,
  isLead,
}: EvaluationHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Link href="/" className="text-sm text-primary hover:underline">
              ← กลับรายการโปรเจกต์
            </Link>
            <div className="mt-2 flex items-center gap-2">
              <h1 className="text-xl font-bold">{projectName}</h1>
              {isLead && (
                <Badge variant="secondary" className="text-xs">
                  หัวหน้าโปรเจกต์ (Lead)
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              ระบบประเมินผลงานแบบเป็นกลาง — AI Multi-Agent (Impact, Normalization 100%, Anti-Gaming) + ยืนยันโดยหัวหน้า
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${projectId}/notifications`}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              การแจ้งเตือน
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
