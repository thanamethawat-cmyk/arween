@echo off
setlocal enabledelayedexpansion

echo ===============================================================
echo   ARWEEN Platform - Cloud Staging Deployment (Cloud Run + Cloud SQL)
echo ===============================================================
echo.

set PROJECT_ID=gen-lang-client-0084061289
set REGION=asia-southeast1
set SERVICE_NAME=arween-staging
set DB_INSTANCE=arween-db-staging
set DB_NAME=arween
set DB_USER=arween_user

echo [1/5] ตั้งค่าโปรเจกต์ Google Cloud: %PROJECT_ID% (Region: %REGION%)
call gcloud config set project %PROJECT_ID%

echo.
echo [2/5] เปิดใช้งาน Service APIs ที่จำเป็น...
call gcloud services enable run.googleapis.com sqladmin.googleapis.com cloudbuild.googleapis.com containerregistry.googleapis.com

echo.
echo [3/5] ตรวจสอบ Cloud SQL PostgreSQL Instance (%DB_INSTANCE%)...
call gcloud sql instances describe %DB_INSTANCE% >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo     ยังไม่พบอินสแตนซ์ %DB_INSTANCE%
    echo     กำลังสร้าง Cloud SQL PostgreSQL 16 (db-f1-micro) ใน %REGION%...
    echo     (กระบวนการนี้อาจใช้เวลาประมาณ 3-5 นาที)
    call gcloud sql instances create %DB_INSTANCE% --database-version=POSTGRES_16 --tier=db-f1-micro --region=%REGION% --root-password=ChangeMeInProd1234!
    echo     กำลังสร้าง Database: %DB_NAME%...
    call gcloud sql databases create %DB_NAME% --instance=%DB_INSTANCE%
    echo     กำลังสร้าง User: %DB_USER%...
    call gcloud sql users create %DB_USER% --instance=%DB_INSTANCE% --password=ChangeMeInProd1234!
) else (
    echo     พบ Cloud SQL Instance %DB_INSTANCE% พร้อมใช้งานแล้ว
)

set CONNECTION_NAME=%PROJECT_ID%:%REGION%:%DB_INSTANCE%
echo     Connection Name: %CONNECTION_NAME%

echo.
echo [4/5] ส่งโค้ดขึ้น Google Cloud Build เพื่อคอมไพล์ Docker Container...
call gcloud builds submit --tag gcr.io/%PROJECT_ID%/%SERVICE_NAME%:latest .

echo.
echo [5/5] Deploy ไปยัง Cloud Run (%SERVICE_NAME%)...
if "%GEMINI_API_KEY%"=="" (
    echo ERROR: ตั้งค่า GEMINI_API_KEY ใน environment ก่อนรันสคริปต์นี้
    exit /b 1
)
if "%NEXTAUTH_SECRET%"=="" (
    set NEXTAUTH_SECRET=arween-staging-change-me-32chars!!
)
if "%DB_PASS%"=="" (
    set DB_PASS=ChangeMeInProd1234!
)
call gcloud run deploy %SERVICE_NAME% ^
    --image gcr.io/%PROJECT_ID%/%SERVICE_NAME%:latest ^
    --region %REGION% ^
    --platform managed ^
    --allow-unauthenticated ^
    --port 8080 ^
    --add-cloudsql-instances %CONNECTION_NAME% ^
    --set-env-vars DATABASE_URL="postgresql://%DB_USER%:%DB_PASS%@/%DB_NAME%?host=/cloudsql/%CONNECTION_NAME%" ^
    --set-env-vars NEXTAUTH_URL="https://%SERVICE_NAME%-%PROJECT_ID%.%REGION%.run.app" ^
    --set-env-vars NEXTAUTH_SECRET="%NEXTAUTH_SECRET%" ^
    --set-env-vars GEMINI_API_KEY="%GEMINI_API_KEY%" ^
    --set-env-vars GEMINI_MODEL="gemini-3.6-flash"

echo.
echo ===============================================================
echo   Cloud Staging Deployment เสร็จสมบูรณ์!
echo ===============================================================
pause
