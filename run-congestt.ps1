# PowerShell ConGestt System Launcher
# Version 1.0 - One-Click System Activation
# ===========================================

# Add Windows Forms assembly for GUI
Add-Type -AssemblyName System.Windows.Forms

# Import necessary cmdlets for file operations
Import-Module Microsoft.PowerShell.Archive

# Main application class
class ConGesttLauncher {
    # Form properties
    static [System.Windows.Forms.Form] $MainForm
    # Backend job
    static [System.Management.Automation.Job] $BackendJob = $null
    # Status labels
    static [System.Windows.Forms.Label[]] $StatusLabels
    # Start button
    static [System.Windows.Forms.Button] $StartButton
    # Exit button
    static [System.Windows.Forms.Button] $ExitButton
    
    # Initialize the application
    ConGesttLauncher() {
        $this.CreateUI()
    }
    
    # Create the user interface
    CreateUI() {
        [ConGesttLauncher]::MainForm = New-Object System.Windows.Forms.Form
        [ConGesttLauncher]::MainForm.Text = "ConGestet System Launcher"
        [ConGesttLauncher]::MainForm.Size = New-Object System.Drawing.Size(460, 300)
        [ConGesttLauncher]::MainForm.StartPosition = "CenterScreen"
        [ConGesttLauncher]::MainForm.FormBorderStyle = "FixedDialog"
        [ConGesttLauncher]::MainForm.MaximizeBox = $false
        [ConGesttLauncher]::MainForm.MinimizeBox = $false
        [ConGesttLauncher]::MainForm.BackColor = [System.Drawing.Color]::FromArgb(45, 45, 45)
        
        # Title
        $title = New-Object System.Windows.Forms.Label
        $title.Text = "🧠 ConGestt"
        $title.Font = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Bold)
        $title.ForeColor = [System.Drawing.Color]::White
        $title.AutoSize = $true
        $title.Location = New-Object System.Drawing.Point(20, 25)
        [ConGesttLauncher]::MainForm.Controls.Add($title)
        
        # Subtitle
        $subtitle = New-Object System.Windows.Forms.Label
        $subtitle.Text = "Gestão de Equipes e Empresas Inteligente"
        $subtitle.Font = New-Object System.Drawing.Font("Segoe UI", 10)
        $subtitle.ForeColor = [System.Drawing.Color]::FromArgb(180, 180, 180)
        $subtitle.AutoSize = $true
        $subtitle.Location = New-Object System.Drawing.Point(22, 60)
        [ConGesttLauncher]::MainForm.Controls.Add($subtitle)
        
        # Status area (contains 3 labels)
        $statusContainer = New-Object System.Windows.Forms.TableLayoutPanel
        $statusContainer.ColumnCount = 1
        $statusContainer.RowCount = 3
        $statusContainer.AutoSize = $true
        $statusContainer.Location = New-Object System.Drawing.Point(30, 100)
        $statusContainer.ColumnWidths = @("100%")
        $statusContainer.RowHeights = @("25", "25", "25")
        [ConGesttLauncher]::MainForm.Controls.Add($statusContainer)
        
        # Status labels
        $statusLabels = @(
            New-Object System.Windows.Forms.Label {
                Text = "Ready..."
                Font = New-Object System.Drawing.Font("Segoe UI", 9)
                ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 200)
                AutoSize = $true
                TextAlign = "MiddleLeft"
            },
            New-Object System.Windows.Forms.Label {
                Text = "No active processes"
                Font = New-Object System.Drawing.Font("Segoe UI", 9)
                ForeColor = [System.Drawing.Color]::FromArgb(150, 150, 150)
                AutoSize = $true
                TextAlign = "MiddleLeft"
            },
            New-Object System.Windows.Forms.Label {
                Text = "System ready to start"
                Font = New-Object System.Drawing.Font("Segoe UI", 9)
                ForeColor = [System.Drawing.Color]::FromArgb(120, 120, 120)
                AutoSize = $true
                TextAlign = "MiddleLeft"
            }
        )
        for ($i = 0; $i -lt 3; $i++) {
            $statusContainer.Controls.Add($statusLabels[$i], 0, $i)
        }
        [ConGesttLauncher]::StatusLabels = $statusLabels
        
        # Start button
        $startButton = New-Object System.Windows.Forms.Button
        $startButton.Text = "🚀 Start ConGestt System"
        $startButton.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
        $startButton.BackColor = [System.Drawing.Color]::FromArgb(52, 152, 219)
        $startButton.ForeColor = [System.Drawing.Color]::White
        $startButton.Size = New-Object System.Drawing.Size(420, 50)
        $startButton.Location = New-Object System.Drawing.Point(20, 200)
        $startButton.Add_Click({
            [ConGesttLauncher]::StartConGestt()
        })
        [ConGesttLauncher]::StartButton = $startButton
        [ConGestTypeLauncher]::MainForm.Controls.Add($startButton)
        
        # Exit button
        $exitButton = New-Object System.Windows.Forms.Button
        $exitButton.Text = "✖ Exit"
        $exitButton.Font = New-Object System.Drawing.Font("Segoe UI", 9)
        $exitButton.BackColor = [System.Drawing.Color]::FromArgb(80, 80, 80)
        $exitButton.ForeColor = [System.Drawing.Color]::White
        $exitButton.Size = New-Object System.Drawing.Size(420, 35)
        $exitButton.Location = New-Object System.Drawing.Point(20, 255)
        $exitButton.Add_Click({
            [ConGesttLauncher]::StopConGestt()
        })
        [ConGesttLauncher]::ExitButton = $exitButton
        [ConGesttLauncher]::MainForm.Controls.Add($exitButton)
        
        # Show the form
        [ConGesttLauncher]::MainForm.ShowDialog()
    }
    
    # Start the ConGestt system
    StartConGestt() {
        # Update status
        [ConGesttLauncher]::StatusLabels[0].Text = "Starting system... Please wait..."
        [ConGesttLauncher]::StatusLabels[0].ForeColor = [System.Drawing.Color]::FromArgb(255, 204, 0)
        [ConGesttLauncher]::StatusLabels[1].Text = "Building backend..."
        [ConGesttLauncher]::StatusLabels[1].ForeColor = [System.Drawing.Color]::FromArgb(100, 150, 200)
        
        # Set execution policy if needed
        $currentPolicy = Get-ExecutionPolicy -Scope CurrentUser
        if ($currentPolicy -ne "Unrestricted") {
            try {
                Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser -Force
                [ConGesttLauncher]::StatusLabels[0].Text = "Execution policy set to Unrestricted"
            }
            catch {
                [ConGesttLauncher]::StatusLabels[0].Text = "Warning: Could not set execution policy"
                [ConGesttLauncher]::StatusLabels[0].ForeColor = [System.Drawing.Color]::FromArgb(255, 100, 100)
            }
        }
        
        # Build frontend if needed
        $frontendPath = "C:\Users\Joaov\Downloads\congestt\frontend"
        $frontendDist = "$frontendPath\dist\index.html"
        if (-not (Test-Path $frontendDist)) {
            [ConGesttLauncher]::StatusLabels[1].Text = "Building frontend..."
            Push-Location $frontendPath
            try {
                & npm run build > "$env:TEMP\congestt-frontend-build.log" 2>&1
                [ConGesttLauncher]::StatusLabels[1].Text = "Frontend built successfully"
                [ConGesttLauncher]::StatusLabels[1].ForeColor = [System.Drawing.Color]::FromArgb(46, 204, 113)
            }
            catch {
                [ConGesttLauncher]::StatusLabels[1].Text = "Frontend build failed"
                [ConGesttLauncher]::StatusLabels[1].ForeColor = [System.Drawing.Color]::FromArgb(231, 76, 60)
                return
            }
            Pop-Location
        } else {
            [ConGesttLauncher]::StatusLabels[1].Text = "Frontend already built"
            [ConGesttLauncher]::StatusLabels[1].ForeColor = [System.Drawing.Color]::FromArgb(46, 204, 113)
        }
        
        # Build backend
        $backendPath = "C:\Users\Joaov\Downloads\congestt\backend"
        $backendDist = "$backendPath\dist\index.js"
        if (-not (Test-Path $backendDist)) {
            [ConGesttLauncher]::StatusLabels[2].Text = "Building backend..."
            Push-Location $backendPath
            try {
                & npm run build > "$env:TEMP\congestt-backend-build.log" 2>&1
                [ConGesttLauncher]::StatusLabels[2].Text = "Backend built successfully"
                [ConGesttLauncher]::StatusLabels[2].ForeColor = [System.Drawing.Color]::FromArgb(46, 204, 113)
            }
            catch {
                [ConGesttLauncher]::StatusLabels[2].Text = "Backend build failed"
                [ConGesttLauncher]::StatusLabels[2].ForeColor = [System.Drawing.Color]::FromArgb(231, 76, 60)
                return
            }
            Pop-Location
        } else {
            [ConGesttLauncher]::StatusLabels[2].Text = "Backend already built"
            [ConGesttLauncher]::StatusLabels[2].ForeColor = [System.Drawing.Color]::FromArgb(46, 204, 113)
        }
        
        # Start the backend server
        [ConGesttLauncher]::StatusLabels[0].Text = "Starting backend server..."
        [ConGesttLauncher]::StatusLabels[0].ForeColor = [System.Drawing.Color]::FromArgb(52, 152, 219)
        [ConGesttLauncher]::StatusLabels[1].Text = "Server started on port 3001"
        [ConGesttLauncher]::StatusLabels[1].ForeColor = [System.Drawing.Color]::FromArgb(46, 204, 113)
        [ConGesttLauncher]::StatusLabels[2].テキスト = "Ready for connections"
        [ConGesttLauncher]::StatusLabels[2].ForeColor = [System.Drawing.Color]::FromArgb(46, 204, 113)
        
        # Create a job to run the backend
        [ConGesttLauncher]::BackendJob = Start-Job -ScriptBlock {
            Push-Location "C:\Users\Joaov\Downloads\congestt\backend"
            & npm start
        } -Name "ConGesttBackend"
        
        # Monitor the job
        $jobTimer = [System.Diagnostics.Stopwatch]::StartNew()
        $maxWaitTime = 10000  # 10 seconds
        
        while ([ConGesttLauncher]::BackendJob.State -eq 'Running' -and $jobTimer.ElapsedMilliseconds -lt $maxWaitTime) {
            Start-Sleep -Milliseconds 500
            Receive-Job -Name "ConGesttBackend" -Keep | Out-Null
        }
        
        if ([ConGesttLauncher]::BackendJob.State -eq 'Completed') {
            [ConGesttLauncher]::StatusLabels[0].Text = "✅ System started successfully!"
            [ConGestetLauncher]::StatusLabels[0].ForeColor = [System.Drawing.Color]::FromArgb(46, 204, 113)
            [ConGesttLauncher]::StatusLabels[1].Text = "🌐 Access: http://localhost:3001"
            [ConGesttLauncher]::StatusLabels[2].Text = "👤 Login: admin@congestt.com / 123"
            
            # Update buttons
            [ConGesttLauncher]::StartButton.Text = "🔄 Restart System"
            [ConGesttLauncher]::StartButton.BackColor = [System.Drawing.Color]::FromArgb(41, 128, 185)
        } else {
            [ConGesttLauncher]::StatusLabels[0].Text = "❌ Failed to start backend"
            [ConGesttLauncher]::StatusLabels[0].ForeColor = [System.Drawing.Color]::FromArgb(231, 76, 60)
            [ConGesttLauncher]::StartButton.Enabled = $true
            [ConGesttLauncher]::ExitButton.Enabled = $true
        }
    }
    
    # Stop the ConGestt system
    StopConGestt() {
        if ([ConGesttLauncher]::BackendJob -ne $null -and [ConGesttLauncher]::BackendJob.State -ne 'Stopped') {
            Write-Host "Stopping ConGestt server..."
            Stop-Job -Name "ConGesttBackend" -Force -ErrorAction SilentlyContinue
            Remove-Job -Name "ConGesttBackend" -Force -ErrorAction SilentlyContinue
            [ConGesttLauncher]::StatusLabels[0].Text = "System stopped"
            [ConGesttLauncher]::StatusLabels[0].ForeColor = [System.Drawing.Color]::FromArgb(150, 150, 150)
            [ConGesttLauncher]::StartButton.Text = "🚀 Start ConGestt System"
            [ConGesttLauncher]::StartButton.BackColor = [System.Drawing.Color]::FromArgb(52, 152, 219)
        }
    }
}

# Run the application
$launcher = [ConGesttLauncher]::new()
$launcher.Run()