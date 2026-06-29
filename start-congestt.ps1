# PowerShell ConGestt System Launcher (Stable Version)
# ================================================

# Simple status function
function Write-Status {
    param($message, $color = "White")
    Write-Host $message -ForegroundColor $color
}

# Main launcher function
function Start-ConGesttSystem {
    # Display welcome
    Write-Status "🚀 Starting ConGestt System..." -ForegroundColor Green
    Write-Host ""
    
    # Step 1: Build frontend if needed
    Write-Status "📦 Building frontend..." -ForegroundColor Yellow
    $frontendPath = "C:\Users\Joaov\Downloads\congestt\frontend"
    $frontendDist = "$frontendPath\dist\index.html"
    
    if (-not (Test-Path $frontendDist)) {
        Write-Status "Building frontend for the first time..." -ForegroundColor Cyan
        Push-Location $frontendPath
        try {
            & npm run build > "$env:TEMP\frontend-build.log" 2>&1
            Write-Status "✅ Frontend built successfully!" -ForegroundColor Green
        }
        catch {
            Write-Status "❌ Frontend build failed: $($_.Exception.Message)" -ForegroundColor Red
            Read-Host "Press Enter to exit..."
            exit 1
        }
        Pop-Location
    } else {
        Write-Status "✅ Frontend already built" -ForegroundColor Green
    }
    
    # Step 2: Build backend if needed
    Write-Status "🏗️ Building backend..." -ForegroundColor Yellow
    $backendPath = "C:\Users\Joaov\Downloads\congestt\backend"
    $backendDist = "$backendPath\dist\index.js"
    
    if (-not (Test-Path $backendDist)) {
        Write-Status "Building backend for the first time..." -ForegroundColor Cyan
        Push-Location $backendPath
        try {
            & npm run build > "$env:TEMP\backend-build.log" 2>&status
            Write-Status "✅ Backend built successfully!" -ForegroundColor Green
        }
        catch {
            Write-Status "❌ Backend build failed: $($_.Exception.Message)" -ForegroundColor Red
            Read-Host "Press Enter to exit..."
            exit 1
        }
        Pop-Location
    } else {
        Write-Status "✅ Backend already built" -ForegroundColor Green
    }
    
    # Step 3: Start the server
    Write-Status "🚀 Starting backend server on port 3001..." -ForegroundColor Yellow
    
    # Create a log file for the server
    $logFile = "$env:USERPROFILE\Desktop\congestt-server.log"
    
    # Start the backend in background job
    $backendJob = Start-Job -ScriptBlock {
        Push-Location "C:\Users\Joaov\Downloads\congestt\backend"
        & npm start
    } -Name "ConGesttBackend"
    
    # Wait and check if it started successfully
    Start-Sleep -Seconds 3
    $jobOutput = Receive-Job -Name "ConGesttBackend" -Keep -ErrorAction SilentlyContinue
    
    if ($jobOutput) {
        Write-Status ""
        Write-Status "🎉 ConGestt System Started Successfully!" -ForegroundColor Green
        Write-Status "🌐 Access: http://localhost:3001" -ForegroundColor Cyan
        Write-Status "👤 Login: admin@congestt.com / 123" -ForegroundColor Cyan
        Write-Status ""
        Write-Status "The system is now running. Press Ctrl+C to stop." -ForegroundColor Gray
        
        # Keep the PowerShell window open
        Write-Host ""
        Read-Host "Press Enter to stop the server..." >> $logFile
    } else {
        Write-Status "❌ Failed to start backend server" -ForegroundColor Red
        $errorDetails = Receive-Job -Name "ConGesttBackend" -ErrorAction SilentlyContinue
        if ($errorDetails) {
            Write-Status "Error details: $($errorDetails.ToString())" -ForegroundColor Red
        }
    }
    
    # Cleanup
    Stop-Job -Name "ConGesttBackend" -Force -ErrorAction SilentlyContinue
    Remove-Job -Name "ConGesttBackend" -Force -ErrorAction SilentlyContinue
}

# Run the system
Start-ConGesttSystem