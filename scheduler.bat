@echo off
REM Runs every 60s. Reminder times use REMINDER_TIMEZONE in config/db.php (default Asia/Kolkata).
REM Keep this window open, or use Task Scheduler to run reminder_cron.php every minute.
:loop
echo [%date% %time%] Running Med-Alert-Plus Reminder Cron...
C:\xampp\php\php.exe c:\xampp\htdocs\Med-Alert-Plus\cron\reminder_cron.php
echo.
timeout /t 60 /nobreak
goto loop
