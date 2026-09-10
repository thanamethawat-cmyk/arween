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

เส้นทาง Firebase + Firestore ยังอยู่ใน repo เป็นต้นแบบสาธิตเก่า — **ไม่ใช่ UX หลักแล้ว**

---

## ฟีเจอร์ MVP ที่ใช้ได้ (ก + ข)

1. Anchor Framework — Objectives / Milestones / KPIs + ความคืบหน้าจากน้ำหนัก
2. พื้นที่ทีม — สมาชิก + เชิญด้วย Google (ลิงก์ครั้งเดียว 7 วัน)
3. Agent 1 — Impact Score 0–10 ด้วย Gemini (ผูก Milestone/KPI)
4. Agent 2 — สัดส่วนผลงานรวม 100% เมื่อปิดรอบ (หัวหน้ายืนยัน)
5. Agent 3 — ตั้งธงปั่นคะแนน + Dispute
6. WorkItem + ลิงก์ Google Workspace (`/projects/[id]/hub`)
7. แชท AI บริบทโปรเจกต์ (`/projects/[id]/chat`)

ยังไม่รวมรอบนี้: Merit-to-Earn / จ่ายโบนัสอัตโนมัติ

---

## รันในเครื่อง

```bash
npm install
cp .env.example .env
# ค่าเริ่มต้นใช้ SQLite (file:./dev.db) — ไม่ต้องติดตั้ง Postgres
# ถ้ามี Postgres/Docker ให้เปลี่ยน DATABASE_URL เป็น postgresql://...
npm run db:setup
npm run dev
```

เปิด http://localhost:3000

### บัญชีสาธิต (หลัง seed)

| อีเมล | รหัสผ่าน | บทบาท |
|-------|----------|--------|
| `lead@arween.demo` | `demo1234` | หัวหน้า |
| `somying@arween.demo` | `demo1234` | สมาชิก |
| `somchai@arween.demo` | `demo1234` | สมาชิก |

โปรเจกต์สาธิต: `/projects/project-demo-001`  
ลิงก์เชิญตัวอย่าง: `/invite/demo-invite-token-arween-001`

### Environment

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.0-flash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

ถ้าไม่มี `GEMINI_API_KEY` ระบบจะใช้ heuristic ในเครื่องสำหรับ Agent 1

---

## Flow ที่ควรลอง

1. เข้าสู่ระบบด้วย `lead@arween.demo`
2. เปิดโปรเจกต์สาธิต หรือสร้างใหม่
3. แท็บ **แผนเป้าหมาย** — ตั้ง Objective / Milestone / KPI
4. เชิญสมาชิก (ถ้าตั้ง Google OAuth แล้ว)
5. **บันทึกงานรายวัน** → ได้ Impact Score
6. แท็บ **ประเมิน** — ยืนยันคะแนน → ปิดรอบ → ได้สัดส่วน 100%
7. ทดลองข้อความสั้นๆ เช่น "รับทราบครับ" เพื่อดู Agent 3 ตั้งธง
8. สมาชิกยื่น **โต้แย้ง** ได้จากคะแนนของตน

---

## เอกสารผลิตภัณฑ์

- [ARWEEN-Complete-Document.md](ARWEEN-Complete-Document.md)
- [docs/](docs/)

---

## Author

Thanamethawat Sriphithak — System Architect & AI Solution Designer
