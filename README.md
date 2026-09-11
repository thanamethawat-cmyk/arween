# ARWEEN: Superior Operations Management Cycle

> เปลี่ยนความทุ่มเทที่มองไม่เห็น ให้เป็นความคืบหน้าโปรเจกต์และความดีความชอบที่ตรวจสอบได้

แพลตฟอร์ม **Outcome-Driven** สำหรับทีมโปรเจกต์ — ประเมินตามเป้าหมาย (Anchor Framework) ไม่นับจำนวนข้อความ

---

## สถาปัตยกรรมหลัก (MVP ที่ใช้จริง)

```
[ Next.js 14 + Tailwind ]
        │
        ├── Auth ──────> NextAuth (Google ผ่านลิงก์เชิญ + อีเมล/รหัสผ่านสำหรับแอดมิน)
        ├── Data ──────> PostgreSQL + Prisma (โปรเจกต์ทีมส่วนรวม)
        ├── AI ────────> Gemini Agent 1/2/3 (Impact Score, Contribution 100%, Anti-Gaming)
        └── Progress ──> คำนวณจากน้ำหนัก Objective / Milestone / KPI
```

เส้นทาง Firebase + Firestore ยังอยู่ใน repo เป็นต้นแบบสาธิตเก่า — **ไม่โหลดใน UX หลักแล้ว**

---

## ฟีเจอร์ที่ใช้ได้

1. Anchor Framework — Objectives / Milestones / KPIs + ความคืบหน้าจากน้ำหนัก
2. พื้นที่ทีม — สมาชิก + เชิญด้วย Google (ลิงก์ครั้งเดียว 7 วัน)
3. Agent 1 — Impact Score 0–10 ด้วย Gemini (ผูก Milestone/KPI)
4. Agent 2 — สัดส่วนผลงานรวม 100% เมื่อปิดรอบ (หัวหน้ายืนยัน)
5. Agent 3 — ตั้งธงปั่นคะแนน + Dispute
6. WorkItem + assignee + ลิงก์ Google Workspace (`/projects/[id]/hub`)
7. แชท AI บริบทโปรเจกต์ + Anchor/หลักฐาน (`/projects/[id]/chat`)
8. Merit export v1 — CSV สัดส่วนที่ยืนยันแล้ว + สถานะเคส DRAFT/APPROVED (ยังไม่จ่ายอัตโนมัติ)

---

## รันในเครื่อง (Postgres ผ่าน Docker)

```bash
npm install
cp .env.example .env
# ใส่ GEMINI_API_KEY และตรวจ GEMINI_MODEL=gemini-3.6-flash
docker compose up -d db
npm run db:setup
npm run dev
```

เปิด http://localhost:3000

รายละเอียด: [docs/deploy.md](docs/deploy.md) · Gemini: [docs/gemini-setup.md](docs/gemini-setup.md) · Pilot: [docs/pilot-checklist.md](docs/pilot-checklist.md)

### บัญชีสาธิต (หลัง seed)

| อีเมล | รหัสผ่าน | บทบาท |
|-------|----------|--------|
| `lead@arween.demo` | `demo1234` | หัวหน้า |
| `somying@arween.demo` | `demo1234` | สมาชิก |
| `somchai@arween.demo` | `demo1234` | สมาชิก |

โปรเจกต์สาธิต: `/projects/project-demo-001`

### Environment

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/arween?schema=public"
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## Flow ที่ควรลอง

1. เข้าสู่ระบบด้วย `lead@arween.demo`
2. เปิดโปรเจกต์สาธิต หรือสร้างใหม่
3. แท็บ **แผนเป้าหมาย** — ตั้ง Objective / Milestone / KPI
4. เชิญสมาชิก (ถ้าตั้ง Google OAuth แล้ว)
5. **บันทึกงานรายวัน** → ได้ Impact Score
6. แท็บ **ประเมิน** — ยืนยันคะแนน → ปิดรอบ → ได้สัดส่วน 100% → Export CSV
7. ทดลองข้อความสั้นๆ เช่น "รับทราบครับ" เพื่อดู Agent 3 ตั้งธง
8. สมาชิกยื่น **โต้แย้ง** ได้จากคะแนนของตน

---

## Author

Thanamethawat Sriphithak — System Architect & AI Solution Designer
