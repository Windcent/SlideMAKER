@echo off
echo Starting SlideMAKER Presentation Studio...
start "" "http://localhost:8000"
python -m http.server 8000
pause
