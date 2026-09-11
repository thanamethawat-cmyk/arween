#!/usr/bin/env bash
set -euo pipefail

echo "==============================================================="
echo "  ARWEEN Platform - Cloud Staging Deployment (Cloud Run + Cloud SQL)"
echo "==============================================================="

PROJECT_ID="gen-lang-client-0084061289"
REGION="asia-southeast1"
SERVICE_NAME="arween-staging"
DB_INSTANCE="arween-db-staging"
DB_NAME="arween"
DB_USER="arween_user"
DB_PASS="${DB_PASS:-ChangeMeInProd1234!}"

echo "[1/5] ตั้งค่าโปรเจกต์ Google Cloud: ${PROJECT_ID} (Region: ${REGION})"
gcloud config set project "${PROJECT_ID}"

echo "[2/5] เปิดใช้งาน Service APIs ที่จำเป็น..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com

echo "[3/5] ตรวจสอบ Cloud SQL PostgreSQL Instance (${DB_INSTANCE})..."
if ! gcloud sql instances describe "${DB_INSTANCE}" >/dev/null 2>&1; then
  echo "    ยังไม่พบอินสแตนซ์ ${DB_INSTANCE} — กำลังสร้าง PostgreSQL 16..."
  gcloud sql instances create "${DB_INSTANCE}" \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --region="${REGION}" \
    --root-password="${DB_PASS}"

  echo "    สร้างฐานข้อมูล: ${DB_NAME}..."
  gcloud sql databases create "${DB_NAME}" --instance="${DB_INSTANCE}"

  echo "    สร้างผู้ใช้: ${DB_USER}..."
  gcloud sql users create "${DB_USER}" --instance="${DB_INSTANCE}" --password="${DB_PASS}"
else
  echo "    พบ Cloud SQL Instance ${DB_INSTANCE} พร้อมใช้งานแล้ว"
fi

CONNECTION_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
echo "    Connection Name: ${CONNECTION_NAME}"

echo "[4/5] ส่งโค้ดขึ้น Google Cloud Build เพื่อคอมไพล์ Docker Container..."
gcloud builds submit --tag "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" .

echo "[5/5] Deploy ไปยัง Cloud Run (${SERVICE_NAME})..."
if [[ -z "${GEMINI_API_KEY:-}" ]]; then
  echo "ERROR: ตั้งค่า GEMINI_API_KEY ใน environment ก่อนรันสคริปต์นี้" >&2
  exit 1
fi
NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-arween-staging-change-me-32chars!!}"
gcloud run deploy "${SERVICE_NAME}" \
  --image "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --add-cloudsql-instances "${CONNECTION_NAME}" \
  --set-env-vars DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}" \
  --set-env-vars NEXTAUTH_URL="https://${SERVICE_NAME}-${PROJECT_ID}.${REGION}.run.app" \
  --set-env-vars NEXTAUTH_SECRET="${NEXTAUTH_SECRET}" \
  --set-env-vars GEMINI_API_KEY="${GEMINI_API_KEY}" \
  --set-env-vars GEMINI_MODEL="gemini-3.6-flash"

echo "==============================================================="
echo "  Cloud Staging Deployment เสร็จสมบูรณ์!"
echo "==============================================================="
