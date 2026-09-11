# Pilot checklist — นำร่องกับ 1–2 ทีมจริง

ใช้หลังตั้ง Postgres โลคอล + seed แล้ว (ดู [deploy.md](./deploy.md))

## เตรียมระบบ

- [ ] `docker compose up -d db`
- [ ] `.env` ชี้ `DATABASE_URL` ไป Postgres + `GEMINI_MODEL=gemini-2.0-flash`
- [ ] `npm run db:setup` และ `npm run dev`
- [ ] เปิด http://localhost:3000 ล็อกอิน `lead@arween.demo` / `demo1234`
- [ ] (ถ้ามี) ตั้ง `GOOGLE_CLIENT_ID` / `SECRET` แล้วลองปุ่ม Google บน login

## Flow ทีม (หัวหน้า)

- [ ] สร้างโปรเจกต์ใหม่หรือใช้ `project-demo-001`
- [ ] แท็บ **แผนเป้าหมาย** — ตั้ง Objective / Milestone / KPI
- [ ] เชิญสมาชิกด้วยอีเมล Google (ลิงก์ 7 วัน)
- [ ] แท็บ **งานและเอกสาร** — สร้าง WorkItem มอบหมายผู้รับผิดชอบ + ใส่ลิงก์ Docs
- [ ] บันทึกงานรายวันบนภาพรวม → ได้ Impact Score (Gemini)
- [ ] แท็บ **ประเมิน** — ยืนยันคะแนน → ปิดรอบ → ยืนยันสัดส่วน 100%
- [ ] Export CSV (Merit) และ/หรืออนุมัติเคสผลตอบแทน
- [ ] สร้างสรุปทีมด้วย Gemini

## Flow สมาชิก

- [ ] รับลิงก์เชิญ → เข้าด้วย Google
- [ ] เห็นโปรเจกต์ในรายการ / บันทึกงาน / เปลี่ยนสถานะงาน
- [ ] ยื่น **โต้แย้ง** จากคะแนนของตนได้
- [ ] ถามแชท AI บริบทโปรเจกต์ได้

## เก็บ feedback

- [ ] จุดที่ติด / ข้อความภาษาไทยไม่ชัด
- [ ] Google OAuth / invite ใช้ได้จริงหรือไม่
- [ ] คะแนน Agent 1 สมเหตุสมผลหรือไม่
- [ ] ตัดสินใจว่าพร้อมเปิด Merit export กับทีมถัดไปหรือยัง

## ลิงก์ตรวจเร็ว

- http://localhost:3000/
- http://localhost:3000/projects/project-demo-001
- http://localhost:3000/projects/project-demo-001/hub
- http://localhost:3000/projects/project-demo-001/chat
- http://localhost:3000/projects/project-demo-001/evaluation
- http://localhost:3000/api/ai/health
