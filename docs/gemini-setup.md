# Gemini สำหรับ ARWEEN (Agent 1 + แชท AI)

## ตั้งค่า

```env
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.0-flash
```

## เมื่อเจอ 429 / โควตาหมด

1. เปิด [Google AI Studio](https://aistudio.google.com/apikey)
2. เติมเครดิตหรือสลับโปรเจกต์ที่มีโควตา
3. ตรวจว่า `.env` ใช้ `GEMINI_MODEL=gemini-2.0-flash`
4. รีสตาร์ท `npm run dev`

## ตรวจสถานะ

`GET /api/ai/health` — บอกว่ามีคีย์และรุ่นโมเดลอะไร (ไม่เรียก generateContent)
