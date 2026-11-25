@echo off
rem Weekly TripAvail listing refresh (registered in Windows Task Scheduler as
rem "TripAvail weekly listing refresh"). Re-checks operator sites, re-reads their newest
rem tour pages, posts updates through the Create Tour flow, archives removed pages and
rem pings search engines. Output is appended to out\refresh.log.
cd /d "%~dp0"
set PYTHONIOENCODING=utf-8
echo ===== %date% %time% ===== >> out\refresh.log
".venv\Scripts\python.exe" -u -m growth refresh >> out\refresh.log 2>&1
