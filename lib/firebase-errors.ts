/** แปลรหัส/ข้อความจาก Firebase และข้อผิดพลาดทั่วไปเป็นภาษาไทย */

const AUTH_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
  "auth/user-disabled": "บัญชีนี้ถูกระงับการใช้งาน",
  "auth/user-not-found": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "auth/wrong-password": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  "auth/email-already-in-use": "อีเมลนี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ",
  "auth/weak-password": "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร",
  "auth/popup-closed-by-user": "ปิดหน้าต่างเข้าสู่ระบบก่อนเสร็จสิ้น กรุณาลองใหม่",
  "auth/popup-blocked": "เบราว์เซอร์บล็อกหน้าต่างเข้าสู่ระบบ กรุณาอนุญาต popup แล้วลองใหม่",
  "auth/cancelled-popup-request": "การเข้าสู่ระบบถูกยกเลิก กรุณาลองใหม่",
  "auth/network-request-failed": "เชื่อมต่อเครือข่ายไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต",
  "auth/too-many-requests": "พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่",
  "auth/operation-not-allowed": "วิธีเข้าสู่ระบบนี้ยังไม่ได้เปิดใช้งานในระบบ",
  "auth/requires-recent-login": "กรุณาเข้าสู่ระบบอีกครั้งเพื่อดำเนินการต่อ",
  "auth/account-exists-with-different-credential":
    "อีเมลนี้ผูกกับวิธีเข้าสู่ระบบอื่นแล้ว",
};

const FIRESTORE_MESSAGES: Record<string, string> = {
  "permission-denied": "ไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
  unavailable: "บริการฐานข้อมูลไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่",
  "failed-precondition": "ไม่สามารถดำเนินการได้ในขณะนี้ กรุณาลองใหม่",
  "not-found": "ไม่พบข้อมูลที่ต้องการ",
  "already-exists": "ข้อมูลนี้มีอยู่แล้ว",
  "resource-exhausted": "ใช้งานเกินโควตา กรุณารอสักครู่แล้วลองใหม่",
  unauthenticated: "กรุณาเข้าสู่ระบบก่อนดำเนินการ",
};

export function getErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return "";
}

export function translateFirebaseError(
  error: unknown,
  fallback = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
): string {
  const code = getErrorCode(error);

  if (code.startsWith("auth/") && AUTH_MESSAGES[code]) {
    return AUTH_MESSAGES[code];
  }

  const shortCode = code.includes("/") ? code.split("/").pop() || code : code;
  if (FIRESTORE_MESSAGES[shortCode]) {
    return FIRESTORE_MESSAGES[shortCode];
  }
  if (FIRESTORE_MESSAGES[code]) {
    return FIRESTORE_MESSAGES[code];
  }

  if (error instanceof Error && error.message) {
    if (
      error.message.includes("Firebase ยังไม่ได้ตั้งค่า") ||
      error.message.includes("GEMINI")
    ) {
      return error.message;
    }
  }

  return fallback;
}
