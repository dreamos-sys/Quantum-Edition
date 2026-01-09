@echo off
echo 🚀 DEPLOYING DREAM OS HYBRID v13.0...
echo.

echo 📦 Adding files to Git...
git add .
git commit -m "🚀 DREAM OS v13.0 - Complete PWA for Samsung A12"
echo.

echo 🌐 Pushing to GitHub Pages...
git push origin main
echo.

echo ✅ DEPLOYMENT SUCCESSFUL!
echo 📱 Access: https://[username].github.io/dream-os-hybrid/
echo 💡 Install: Chrome Menu → "Install DREAM OS"
echo.

pause
