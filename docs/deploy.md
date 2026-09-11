# Deploy นำร่อง — Postgres โลคอล (Docker)

เป้าหมายรอบนี้: รัน PostgreSQL บนเครื่อง → Prisma push/seed → ทดสอบ Invite + NextAuth เป็นทีม  
Cloud Run เก็บเป็นเป้าหมายถัดไป (มี `Dockerfile` พร้อมแล้ว)

## 0) ต้องมี Docker Desktop

เครื่องนี้ต้องติดตั้ง [Docker Desktop](https://www.docker.com/products/docker-desktop/) แล้วเปิดให้พร้อมก่อนรัน `docker compose`

## 1) เปิด Postgres

```bash
docker compose up -d db
```

ตรวจว่าพอร์ต `5432` ว่างและ healthy

## 2) ตั้ง `.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/arween?schema=public"
NEXTAUTH_SECRET=change-me-to-a-long-random-string
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.0-flash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## 3) Schema + seed

```bash
npm run db:setup
npm run dev
```

เปิด http://localhost:3000 — ล็อกอิน `lead@arween.demo` / `demo1234` แล้วลองเชิญสมาชิก

## 4) (ทางเลือก) รันแอปใน Docker ด้วย

```bash
docker compose --profile full up --build
```

แอปที่ http://localhost:8080

## ตัวแปรสำคัญ

| ตัวแปร | ความหมาย |
|--------|----------|
| `DATABASE_URL` | Postgres ของ compose |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | เซสชัน |
| `GEMINI_*` | Agent 1 / แชท |
| `GOOGLE_CLIENT_*` | เข้าด้วย Google ผ่านลิงก์เชิญ |

อย่า bake คีย์ลงใน image
