@echo off
echo.
echo 🧹 LIMPANDO CACHE DO NEXT.JS
echo.

cd /d "D:\Cultura Builder\My Projects\cryptofantasy-league"

echo 📁 Removendo pasta .next...
if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ Pasta .next removida
) else (
    echo ⚠️  Pasta .next não encontrada
)

echo.
echo 📁 Removendo node_modules/.cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo ✅ Cache do node_modules removido
) else (
    echo ⚠️  Cache do node_modules não encontrado
)

echo.
echo ✅ Cache limpo com sucesso!
echo.
echo 💡 PRÓXIMOS PASSOS:
echo    1. Feche o navegador completamente
echo    2. Execute: npm run dev
echo    3. Abra o navegador em modo anônimo ou use Ctrl+Shift+R
echo.

pause
