@echo off
chcp 65001
cd /d "%~dp0"
call npm install
call npx prisma generate
call npx prisma db push
echo Setup complete!
pause
