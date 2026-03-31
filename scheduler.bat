@echo off
:loop
echo [%date% %time%] Running Med-Alert-Plus Reminder Cron...
C:\xampp\php\php.exe c:\xampp\htdocs\Med-Alert-Plus\cron\reminder_cron.php
echo.
timeout /t 60 /nobreak
goto loop
