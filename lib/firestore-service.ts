import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface GoogleToolLink {
  id: string;
  title: string;
  url: string;
  type: "docs" | "sheets" | "drive" | "slides" | "meet" | "other";
  createdAt?: any;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: "PLANNING" | "IN_PROGRESS" | "COMPLETED";
  overallProgress: number; // 0 - 100
  totalMeritScore: number;
  aiSummary?: string;
  keyBlockers?: string[];
  targetDate?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  title: string;
  completedTasks: string;
  blockers: string;
  progressContribution: number; // percentage increment e.g. 5, 10
  meritScore: number; // 1 - 10
  aiRationale?: string;
  createdAt?: any;
}

/**
 * Fetch all projects belonging exclusively to this user (User-isolated Firestore)
 */
export async function getUserProjects(uid: string): Promise<Project[]> {
  const projectsRef = collection(db, "users", uid, "projects");
  const q = query(projectsRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Project, "id">),
  }));
}

/**
 * Get a single project
 */
export async function getProject(uid: string, projectId: string): Promise<Project | null> {
  const ref = doc(db, "users", uid, "projects", projectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Project, "id">) };
}

/**
 * Create a new project for this user
 */
export async function createProject(
  uid: string,
  data: { title: string; description: string; targetDate?: string }
): Promise<string> {
  const dbg = (hypothesisId: string, location: string, message: string, dataPayload: Record<string, unknown>) => {
    // #region agent log
    const payload = { sessionId: "be5c77", runId: "pre-fix", hypothesisId, location, message, data: dataPayload, timestamp: Date.now() };
    fetch("http://127.0.0.1:7581/ingest/9b7a220c-b9c3-4adb-9125-b7121b9f895c", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "be5c77" }, body: JSON.stringify(payload) }).catch(() => {});
    fetch("/api/debug-log", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).catch(() => {});
    // #endregion
  };
  dbg("B", "lib/firestore-service.ts:createProject:start", "firestore addDoc start", {
    uidLen: uid.length,
    titleLen: data.title.trim().length,
  });
  try {
    const projectsRef = collection(db, "users", uid, "projects");
    const docRef = await addDoc(projectsRef, {
      title: data.title,
      description: data.description,
      targetDate: data.targetDate || "",
      status: "IN_PROGRESS",
      overallProgress: 0,
      totalMeritScore: 0,
      aiSummary: "โครงการเพิ่งเริ่มต้น บันทึกการทำงานประจำวันเพื่อให้ AI สรุปภาพรวมความคืบหน้า",
      keyBlockers: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    dbg("B", "lib/firestore-service.ts:createProject:ok", "firestore addDoc ok", {
      idLen: docRef.id.length,
    });
    return docRef.id;
  } catch (err) {
    dbg("D", "lib/firestore-service.ts:createProject:error", "firestore addDoc failed", {
      code:
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "",
      msg: err instanceof Error ? err.message.slice(0, 160) : "unknown",
    });
    throw err;
  }
}

/**
 * Fetch all daily logs for a specific project
 */
export async function getDailyLogs(uid: string, projectId: string): Promise<DailyLog[]> {
  const logsRef = collection(db, "users", uid, "projects", projectId, "daily_logs");
  const q = query(logsRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    projectId,
    ...(d.data() as Omit<DailyLog, "id" | "projectId">),
  }));
}

/**
 * Add a daily log entry and directly update the project's overall progress & merit points (Rollup)
 */
export async function addDailyLog(
  uid: string,
  projectId: string,
  logData: {
    date: string;
    title: string;
    completedTasks: string;
    blockers: string;
    progressContribution: number;
    meritScore: number;
    aiRationale?: string;
  }
): Promise<string> {
  const logsRef = collection(db, "users", uid, "projects", projectId, "daily_logs");
  
  // 1. Save log document
  const logDoc = await addDoc(logsRef, {
    ...logData,
    createdAt: serverTimestamp(),
  });

  // 2. Rollup to parent Project: compute new overall progress and total score
  const projectRef = doc(db, "users", uid, "projects", projectId);
  const projSnap = await getDoc(projectRef);
  if (projSnap.exists()) {
    const currentProg = projSnap.data().overallProgress || 0;
    const newProgress = Math.min(100, Math.max(0, currentProg + logData.progressContribution));
    const newStatus = newProgress >= 100 ? "COMPLETED" : "IN_PROGRESS";

    await updateDoc(projectRef, {
      overallProgress: newProgress,
      status: newStatus,
      totalMeritScore: increment(logData.meritScore || 0),
      updatedAt: serverTimestamp(),
    });
  }

  // 3. Increment global user merit score in users/{uid}
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    totalMeritScore: increment(logData.meritScore || 0),
    updatedAt: serverTimestamp(),
  }).catch(() => {});

  return logDoc.id;
}

/**
 * Update project executive summary generated by AI
 */
export async function updateProjectAIOverview(
  uid: string,
  projectId: string,
  aiSummary: string,
  keyBlockers: string[]
) {
  const projectRef = doc(db, "users", uid, "projects", projectId);
  await updateDoc(projectRef, {
    aiSummary,
    keyBlockers,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Fetch connected Google tools (Docs, Sheets, Drive, Meet, etc.)
 */
export async function getGoogleTools(uid: string, projectId: string): Promise<GoogleToolLink[]> {
  const toolsRef = collection(db, "users", uid, "projects", projectId, "google_tools");
  const q = query(toolsRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<GoogleToolLink, "id">),
  }));
}

/**
 * Connect a new Google tool/resource to the project
 */
export async function addGoogleTool(
  uid: string,
  projectId: string,
  tool: { title: string; url: string; type: GoogleToolLink["type"] }
): Promise<string> {
  const toolsRef = collection(db, "users", uid, "projects", projectId, "google_tools");
  const docRef = await addDoc(toolsRef, {
    ...tool,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Remove a connected Google tool
 */
export async function deleteGoogleTool(uid: string, projectId: string, toolId: string) {
  const toolRef = doc(db, "users", uid, "projects", projectId, "google_tools", toolId);
  await deleteDoc(toolRef);
}

