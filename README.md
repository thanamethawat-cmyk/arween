# ARWEEN — AI Operations & Daily Tracking App
> **"Turn Daily Efforts into Tangible Project Success"**  
> *แพลตฟอร์มผู้ช่วยบริหารงานอัจฉริยะ บันทึกและติดตามการทำงานประจำวัน เชื่อมโยงความคืบหน้าตรงสู่ภาพรวมโครงการ พร้อมระบบประเมินคุณค่างานด้วย Gemini AI*

🚀 **Live Production URL:** [https://arween-app-619248313782.asia-southeast1.run.app](https://arween-app-619248313782.asia-southeast1.run.app)  
🏷️ **Hackathon Challenge:** `#AccelerateAIWithCloudRun`

---

## 🌟 ฟีเจอร์หลัก (Key Features)

1. **Daily Work Check-in & Progress Tracking (บันทึกงานประจำวัน):**
   - บันทึกกิจกรรมที่ทำสำเร็จ, รายละเอียดงาน, และปัญหา/อุปสรรค (Blockers)
   - ระบุเปอร์เซ็นต์ความคืบหน้าที่ต้องการเพิ่มให้โครงการ (+3%, +5%, +10%, +15%)
2. **Real-time Project Progress Rollup (เชื่อมโยงสู่ภาพรวมโครงการโดยตรง):**
   - ทุกบันทึกการทำงานรายวันจะถูกคำนวณและ Rollup ขึ้นเป็นเปอร์เซ็นต์ภาพรวมโครงการ (`Overall Project Progress %`) อัตโนมัติแบบเรียลไทม์
   - หน้าแดชบอร์ดสรุปสถานะความคืบหน้ารวม พร้อมแสดง Activity Timeline ย้อนหลัง
3. **ARWEEN Multi-turn AI Operations Copilot (Gemini 1.5 Flash):**
   - สนทนาโต้ตอบต่อเนื่องแบบ **Multi-turn interaction** เพื่อวิเคราะห์งาน แนะนำแนวทางแก้ปัญหา และวางแผนก้าวถัดไป
   - ระบบ **Merit-to-Earn Evaluation**: Gemini ช่วยวิเคราะห์ผลกระทบของงานและให้คะแนนความดี (Merit Score 1-10) พร้อมเหตุผลโปร่งใส
   - **AI Executive Summary**: สังเคราะห์บันทึกงานทั้งหมดเป็นรายงานสรุปสถานะโครงการสำหรับผู้บริหาร
4. **Enterprise Security & User Isolation:**
   - **Firebase Authentication**: ล็อกอินผ่าน Google Sign-In และ Email/Password
   - **User-isolated Cloud Firestore**: แยกจัดเก็บข้อมูลรายโครงการและบันทึกงานภายใต้ `users/{uid}` อย่างเคร่งครัด
   - **Google Cloud Secret Manager**: เก็บ `GEMINI_API_KEY` อย่างปลอดภัยระดับองค์กร

---

## 🏗️ สถาปัตยกรรมระบบ (Architecture)

```
[ Client: Next.js 14 + Tailwind CSS ]
         │
         ├── Authentication ──> [ Firebase Auth (Google & Email) ]
         │
         ├── Database Storage ──> [ Cloud Firestore (User-isolated: users/{uid}) ]
         │
         ├── AI Engine ─────────> [ Google Gemini 1.5 Flash API (Multi-turn) ]
         │
         └── Secrets ───────────> [ Google Cloud Secret Manager (GEMINI_API_KEY) ]
                                            │
                                  [ Google Cloud Run (Container) ]
```

---

## 💻 วิธีการรันบนเครื่อง Local (Local Development)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่าตัวแปรใน `.env`
คัดลอก `.env.example` ไปเป็น `.env` แล้วระบุค่าคอนฟิก:
```env
GEMINI_API_KEY="your-gemini-api-key"

NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### 3. เริ่มต้นรันโปรเจกต์
```bash
npm run dev
```
เปิดบราวเซอร์ไปที่ `http://localhost:3000`

---

## ☁️ การ Deploy ขึ้น Google Cloud Run

โปรเจกต์นี้มี `Dockerfile` (Multi-stage Node.js 20 Alpine Standalone Build) ที่ผ่านการทดสอบและรองรับ Cloud Run 100%:

```bash
gcloud run deploy arween-app \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --project gen-lang-client-0084061289
```

---

## 📄 ข้อมูลโครงการ
* **โครงการ:** ARWEEN: Superior Operations Management Cycle
* **ผู้พัฒนา:** ธณเมธาวัฒน์ ศรีพิทักษ์ (System Architect & AI Solution Designer)
* **การแข่งขัน:** Hack2Skill Ideation Prototype Challenge (`#AccelerateAIWithCloudRun`)
