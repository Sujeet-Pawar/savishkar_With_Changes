@echo off
copy "D:\Savishkar Final web\savishkar_With_Changes\server\public\sponsors\aquavalves.webp" "D:\Savishkar Final web\savishkar_With_Changes\client\public\sponsors\aquavalves.webp"
if exist "D:\Savishkar Final web\savishkar_With_Changes\client\public\sponsors\aquavalves.webp" (
    echo File copied successfully!
) else (
    echo File copy failed!
)
pause
