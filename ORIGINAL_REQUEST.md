# Original User Request

## Initial Request — 2026-09-11T11:34:58Z

# ARWEEN: Superior Operations Management Cycle — Full-Cycle Completion & Verification

ARWEEN เป็นแพลตฟอร์มบริหารงานรายวันและประเมินผลงานด้วย AI (Outcome-Driven & Merit Evaluation Platform) ที่เชื่อมโยงความทุ่มเทและหลักฐานการทำงานจริง (Evidence) เข้ากับเป้าหมายโครงการ (Anchor Framework: Objectives / Milestones / KPIs) พร้อมระบบ AI Agents (Agent 1: Impact Score, Agent 2: Contribution 100% Normalization, Agent 3: Anti-Gaming & Dispute) และเตรียมความพร้อมสำหรับทีมนำร่องจริง (Pilot Teams) บน Next.js 14, Tailwind, Prisma, NextAuth และ Google Gemini API

Working directory: c:\Users\Thana\OneDrive\Desktop\ARWEEN\โครงการ ARWEEN Superior Operations Management Cycle (เอ อาร์ วีน วงจรการบริหารงานที่เหนือกว่า)\ARWEEN Superior Operations Management Cycle
Integrity mode: development

Reference material:
- README.md
- docs/pilot-checklist.md
- docs/สถานะแพลตฟอร์ม.md
- docs/cloud-staging-deploy.md
- # แผนการดำเนินการสร้าง ARWEEN AI Op.txt

## Requirements

### R1. พัฒนาและปิดจุดคั่งค้างของระบบหลัก (Core Platform & Evaluation Engine)
- ตรวจสอบและทำให้ฟังก์ชันการประเมินผลงาน (`/projects/[id]/evaluation`) ทำงานได้อย่างสมบูรณ์แบบ
- รองรับการปิดรอบประเมิน (Period Closing), การยืนยันคะแนนโดยหัวหน้าทีม (Lead Confirmation), และการกระจายสัดส่วนผลงานแบบผลรวม 100.00% พอดี
- รองรับการคำนวณงบประมาณและส่วนแบ่งผลตอบแทน Merit-to-Earn (Bonus Pool Payout) พร้อมการส่งออกข้อมูลเป็น CSV เพื่อการตรวจสอบ
- ปรับปรุงระบบจัดการข้อโต้แย้ง (Dispute Resolution Flow) และระบบแจ้งเตือน (Notifications) ให้ผู้ใช้สามารถโต้แย้งและหัวหน้าสามารถพิจารณาได้อย่างโปร่งใส

### R2. ปรับแต่งและตรวจสอบความเสถียรของ Gemini AI Agents (AI Reliability & Calibration)
- ปรับปรุงการทำงานของ Agent 1 (Impact Scoring 0–10 ผูกบริบท Milestone/KPI), Agent 2 (Contribution Normalization 100%), และ Agent 3 (Anti-Gaming & Spam Detection)
- กำหนดค่าโมเดล Gemini (`GEMINI_MODEL`) ให้รองรับโมเดลที่เสถียรและใช้งานได้จริง (เช่น `gemini-2.0-flash` หรือ `gemini-1.5-flash`)
- พัฒนาระบบ Fallback Heuristic ที่มีประสิทธิภาพ เพื่อให้ระบบทำงานต่อได้อย่างต่อเนื่องและไม่ขัดข้องแม้ในกรณีที่ API Key ไม่พร้อมหรือโควตาหมด
- พัฒนาและรันชุดทดสอบความแม่นยำ AI (`scripts/calibrate-ai-prompts.ts`) ให้สามารถประเมินและแยกแยะงาน High-Impact ออกจากงาน Routine/Spam ได้ถูกต้อง

### R3. จำลองและทดสอบวงจรการทำงานของทีมนำร่องจริง 2 ทีม (Pilot Teams End-to-End Simulation)
- รองรับและทดสอบข้อมูลของ 2 ทีมนำร่องตามข้อกำหนด:
  1. ทีมวิศวกรรมแพลตฟอร์ม (`pilot-team-eng`): งานด้าน Core Architecture, Connection Pooling, สิทธิ์สมาชิก และ Cloud Run CI/CD
  2. ทีมปฏิบัติการและการเติบโต (`pilot-team-ops`): งานด้านการออนบอร์ดลูกค้าองค์กร, ยกระดับ SLA และจัดทำ Playbook
- รันและทดสอบสคริปต์จำลองการทำงานทั้งระบบ (`scripts/run-pilot-simulation.ts`) ให้ครอบคลุมทุกขั้นตอน: การบันทึกหลักฐานงาน -> AI ให้คะแนน -> หัวหน้ายืนยัน -> ปิดรอบคำนวณสัดส่วน 100% -> คำนวณ Merit Payout

### R4. ตรวจสอบความถูกต้องของสคริปต์และการ Build เพื่อเตรียมความพร้อมสำหรับการ Deploy (Build & Deploy Readiness)
- ตรวจสอบให้สคริปต์ `verify:cycle` และ `pilot:simulate` ผ่านการทำงานแบบ 100% ปราศจาก Error
- ตรวจสอบให้คำสั่ง `npm run build` สามารถคอมไพล์ Next.js ในโหมด Standalone ได้อย่างถูกต้องสมบูรณ์
- ตรวจสอบความถูกต้องของสคริปต์และคอนฟิกสำหรับการขึ้นระบบ Cloud Staging (Google Cloud Run + Cloud SQL PostgreSQL) เช่น `cloudbuild.yaml`, `Dockerfile`, และสคริปต์ deploy

## Acceptance Criteria

### ความสมบูรณ์ของระบบฐานข้อมูลและ Flow งาน (Core System & Database)
- [ ] สคริปต์ `npm run verify:cycle` ดำเนินการผ่านครบทุกขั้นตอน (1. Database/Demo Project, 2. Anchor Framework, 3. WorkItem Hub, 4. Agent 2 Normalization, 5. Merit-to-Earn Period & Payout, 6. Audit Trail) โดยไม่มี runtime error
- [ ] ผลรวมสัดส่วน Contribution Share จาก Agent 2 ต้องเท่ากับ 100.00% พอดีเสมอ
- [ ] ยอดรวมของ Merit Payout Amount ที่คำนวณได้ตรงตามงบประมาณ Bonus Pool ที่กำหนดไว้

### การจำลองทีมนำร่อง (Pilot Teams Simulation)
- [ ] สคริปต์ `npm run pilot:simulate` ดำเนินการจำลองครบทั้ง 2 ทีม (`pilot-team-eng` และ `pilot-team-ops`) สำเร็จอย่างสมบูรณ์
- [ ] มีการบันทึก EvidenceEvent, Score, EvaluationPeriod, ContributionShare และ AuditLog ครบถ้วนในฐานข้อมูล

### ระบบ AI Agents และการตรวจจับความผิดปกติ (AI System & Anti-Gaming)
- [ ] สคริปต์ `npm run ai:calibrate` รันผ่านเกณฑ์ Benchmark ทุกกรณีทดสอบ โดยข้อความตอบรับสั้นหรือสแปม (เช่น "รับทราบครับ", "โอเค") ต้องได้คะแนนต่ำ (0–2) และงานเชิงสถาปัตยกรรม/งานแก้ปัญหาวิกฤตต้องได้คะแนนสูง (7–10)
- [ ] โค้ดของ Agent 1, Agent 2, และ Agent 3 จัดการกรณีไม่มี GEMINI_API_KEY หรือเกิด API Error ได้อย่างปลอดภัยโดยใช้ Fallback ที่สอดคล้องกับเกณฑ์มาตรฐาน

### ความพร้อมสำหรับการ Build และ Deploy (Build Verification)
- [ ] คำสั่ง `npm run build` สำเร็จเรียบร้อย สร้าง `.next/standalone` และ static assets ได้โดยไม่มีข้อผิดพลาดด้าน TypeScript หรือ Linting
- [ ] ไฟล์คอนฟิกสำหรับการ Deploy (`Dockerfile`, `cloudbuild.yaml`, `scripts/sync-prisma-provider.js`) ถูกต้องพร้อมใช้งาน

## Follow-up — 2026-09-11T11:39:21Z

[User Update / Clarification for Deploy & GCP Configuration]
The user provided the following key configuration details:
- Google Cloud Project ID: `gen-lang-client-0084061289` (matches .env and original build_log; make sure deploy-cloud-staging.bat and any configs are corrected from the old `gen-lang-client-0740402744`).
- GCP Credentials URL: https://console.cloud.google.com/apis/credentials?project=gen-lang-client-0084061289&folder=&organizationId=
- Command to setup Application Default Credentials (ADC):
  bash <(curl -sSL https://storage.googleapis.com/cloud-samples-data/adc/setup_adc.sh)

Please incorporate this into the Deploy / GCP Configuration track (R4) and ensure all scripts, environment templates, and docs reflect the correct Project ID `gen-lang-client-0084061289`.

## Follow-up — 2026-09-11T11:42:02Z

[User Update / Repository & AI Studio Information]
The user provided the following URLs:
- GitHub Remote Repository URL: https://github.com/thanamethawat-cmyk/arween.git
- AI Studio Applet URL: https://ai.studio/apps/1bdf71c7-3126-41cd-b982-db6c1361ae64?fullscreenApplet=true

Please record these into the project documentation/summary and use for CI/CD, Git remote, and Cloud Staging references.

## Follow-up — 2026-09-11T11:53:47Z

[User Priority Directive: /goal Full Authorization]
The user issued:
"/goal ฉันอนุญาติการเข้าถึงทั้งหมด"
Full authorization granted. Proceed autonomously, thoroughly, and decisively through all execution and verification steps (M1-M4, Acceptance Criteria, E2E validation, and build checks) to 100% completion without pausing for confirmation.



