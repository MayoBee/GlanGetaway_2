@echo off
echo 🔄 Exporting entire local database...
mongodump --db hotel-booking --out ./full-backup

echo 📤 Importing to Atlas...
mongorestore "mongodb+srv://glangetaway-admin:jojgOfwCODul855G@cluster0.koifai3.mongodb.net/hotel-booking" ./full-backup/hotel-booking

echo ✅ Migration complete!
pause
