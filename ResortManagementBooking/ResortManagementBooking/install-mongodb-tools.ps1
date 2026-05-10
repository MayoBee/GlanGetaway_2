# Install MongoDB Database Tools
Write-Host "📦 Installing MongoDB Database Tools..."

# Download MongoDB tools
$url = "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-100.9.5-windows-x86_64.msi"
$output = "$env:TEMP\mongodb-tools.msi"

Write-Host "📥 Downloading MongoDB tools..."
Invoke-WebRequest -Uri $url -OutFile $output

Write-Host "🔧 Installing MongoDB tools..."
Start-Process msiexec -ArgumentList "/i $output /quiet" -Wait

Write-Host "✅ MongoDB tools installed!"
Write-Host "🚀 You can now run: mongodump --db hotel-booking --out ./backup"
