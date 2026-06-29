Add-Type -AssemblyName System.Windows.Forms

function RequestExecutionPolicyPermission {
    $form = New-Object System.Windows.Forms.Form
    $form.Text = "Permission Required"
    $form.Size = New-Object System.Drawing.Size(400, 250)
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "FixedDialog"
    $form.MaximizeBox = `$false
    $form.MinimizeBox = `$false
    $form.BackColor = [System.Drawing.Color]::FromArgb(240, 240, 240)
    
    $label = New-Object System.Windows.Forms.Label
    $label.Text = "ConGestt needs to modify PowerShell execution policy to allow script execution."
    $label.Location = New-Object System.Drawing.Point(20, 20)
    $label.Size = New-Object System.Drawing.Size(360, 60)
    $label.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Regular)
    $label.TextAlign = "MiddleCenter"
    
    $infoLabel = New-Object System.Windows.Forms.Label
    $infoLabel.Text = "This will set: Windows PowerShell â†’ CurrentUser â†’ Unrestricted`nThis allows running development scripts locally (no network changes)."
    $infoLabel.Location = New-Object System.Drawing.Point(20, 80)
    $infoLabel.Size = New-Object System.Drawing.Size(360, 60)
    $infoLabel.Font = New-Object System.Drawing.Font("Segoe UI", 8, [System.Drawing.FontStyle]::Regular)
    $infoLabel.ForeColor = [System.Drawing.Color]::FromArgb(100, 100, 100)
    
    $btnYes = New-Object System.Windows.Forms.Button
    $btnYes.Text = "Allow"
    $btnYes.Location = New-Object System.Drawing.Point(120, 160)
    $btnYes.Size = New-Object System.Drawing.Size(80, 35)
    $btnYes.BackColor = [System.Drawing.Color]::FromArgb(76, 175, 80)
    $btnYes.ForeColor = [System.Drawing.Color]::White
    $btnYes.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
    $btnYes.FlatStyle = "Flat"
    
    $btnNo = New-Object System.Windows.Forms.Button
    $btnNo.Text = "Deny"
    $btnNo.Location = New-Object System.Drawing.Point(220, 160)
    $btnNo.Size = New-Object System.Drawing.Size(80, 35)
    $btnNo.BackColor = [System.Drawing.Color]::FromArgb(244, 67, 54)
    $btnNo.ForeColor = [System.Drawing.Color]::White
    $btnNo.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
    $btnNo.FlatStyle = "Flat"
    
    $form.Controls.AddRange(@($label, $infoLabel, $btnYes, $btnNo))
    
    `$result = [System.Windows.Forms.DialogResult]::Cancel
    `$btnYes.Add_Click({
        `$result = [System.Windows.Forms.DialogResult]::OK
        `$form.Close()
    })
    
    `$btnNo.Add_Click({
        `$result = [System.Windows.Forms.DialogResult]::Cancel
        `$form.Close()
    })
    
    `$form.AcceptButton = `$btnYes
    `$form.CancelButton = `$btnNo
    
    `$dialogResult = `$form.ShowDialog()
    
    if (`$dialogResult -eq [System.Windows.Forms.DialogResult]::OK) {
        return `$true
    } else {
        return `$false
    }
}

function SetDevelopmentExecutionPolicy {
    Write-Host "Requesting permission to modify PowerShell execution policy..." -ForegroundColor Yellow
    
    `$permissionGranted = RequestExecutionPolicyPermission
    
    if (`$permissionGranted) {
        try {
            # Set to Unrestricted for current user
            Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser -Force
            
            Write-Host "`nâœ“ PowerShell execution policy set to 'Unrestricted' for CurrentUser" -ForegroundColor Green
            Write-Host "You can now run PowerShell scripts locally for development." -ForegroundColor Green
            
            # Verify the change
            `$currentPolicy = Get-ExecutionPolicy -Scope CurrentUser
            Write-Host "`nCurrent policy: `$currentPolicy" -ForegroundColor Cyan
            
            # Show what this enables
            Write-Host "`nThis allows:" -ForegroundColor Gray
            Write-Host "  - Running backend build scripts (\`tsc\`)" -ForegroundColor Gray
            Write-Host "  - Running frontend build scripts (\`npx vite build\`)" -ForegroundColor Gray
            Write-Host "  - Using PowerShell scripting for automation" -ForegroundColor Gray
            
            Read-Host "`nPress Enter to continue..."
            return `$true
        }
        catch {
            Write-Host "`nâœ— Failed to set execution policy: $($_.Exception.Message)" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            return `$false
        }
    } else {
        Write-Host "`nPermission denied. Execution policy not changed." -ForegroundColor Yellow
        Write-Host "You can manually change it later using:`n  Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser" -ForegroundColor Gray
        Read-Host "Press Enter to exit"
        return `$false
    }
}

# Main execution
Write-Host "=== PowerShell Execution Policy Setup ===" -ForegroundColor Cyan
Write-Host "This will configure PowerShell to allow script execution for ConGestt development" -ForegroundColor White
Write-Host ""

SetDevelopmentExecutionPolicy
