@echo off
echo ===========================================
echo      MISE A JOUR DEPUIS GITHUB
echo ===========================================
echo.
echo Sauvegarde des modifications locales...
git add .
git commit -m "Sauvegarde auto avant mise a jour"

echo.
echo Recuperation des modifications en ligne...
git pull --rebase
echo.
echo ===========================================
echo      TERMINE !
echo      (Si des conflits apparaissent, appelez l'assistance)
echo ===========================================
pause
