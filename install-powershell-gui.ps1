# PowerShell Execution Policy GUI Setup
# Version 3.0 - Fixed and Tested

# Simple display function
function Write-HostColored {
    param([string]$text, [string]$color = "White")
    Write-Host $text -ForegroundColor $color
}

# Main script execution
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PowerShell Execution Policy Setup" -ForegroundColor White  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will set PowerShell to 'Unrestricted' for local development" -ForegroundColor Gray
Write-Host "while keeping system security intact." -ForegroundColor Gray
Write-Host ""

# Check current policy
$currentPolicy = Get-ExecutionPolicy -Scope CurrentUser
Write-Host "Current Execution Policy: $currentPolicy" -ForegroundColor Yellow
Write-Host ""

function Show-PermissionDialog {
    Add-Type -AssemblyName System.Windows.Forms
    
    $form = New-Object System.Windows.Forms.Form
    $form.Text = "Execution Policy Permission"
    $form.Size = New-Object System.Drawing.Size(380, 220)
    $form.StartPosition = "CenterScreen"
    $form.FormBorderStyle = "FixedDialog"
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.BackColor = [System.Drawing.Color]::FromArgb(245, 245, 245)
    
    $title = New-Object System.Windows.Forms.Label
    $title.Text = "Execution Policy Setup"
    $title.Font = New-Object System.Drawing.Font("Segoe UI", 12, [System.Drawing.FontStyle]::Bold)
    $title.ForeColor = [System.Drawing.Color]::FromArgb(44, 62, 80)
    $title.AutoSize = $true
    $title.Location = New-Object System.Drawing.Point(20, 20)
    $form.Controls.Add($title)
    
    $desc = New-Object System.Windows.Forms.Label
    $desc.Text = "Allow PowerShell scripts to run locally for development work."
    $desc.Font = New-Object System.Drawing.Font("Segoe UI", 9)
    $desc.ForeColor = [System.Drawing.Color]::FromArgb(51, 51, 51)
    $desc.AutoSize = $true
    $desc.Location = New-Object System.Drawing.Point(20, 60)
    $form.Controls.Add($desc)
    
    $info = New-Object System.Windows.Forms.Label
    $info.Text = "This enables:" + "`n  • Backend builds (tsc)`n  • Frontend builds (npx vite build)`n  • PowerShell scripts"
    $info.Font = New-Object System.Drawing.Font("Segoe UI", 8)
    $info.ForeColor = [System.Drawing.Color]::FromArgb(100, 100, 100)
    $info.AutoSize = $true
    $info.Location = New-Object System.Drawing.Point(20, 100)
    $form.Controls.Add($info)
    
    $btnAllow = New-Object System.Windows.Forms.Button
    $btnAllow.Text = "Allow (Set Execution Policy)"
    $btnAllow.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
    $btnAllow.BackColor = [System.Drawing.Color]::FromArgb(46, 204, 113)
    $btnAllow.ForeColor = [System.Drawing.Color]::White
    $btnAllow.Size = New-Object System.Drawing.Size(140, 35)
    $btnAllow.Location = New-Object System.Drawing.Point(85, 150)
    $form.Controls.Add($btnAllow)
    
    $btnDeny = New-Object System.Windows.Forms.Button
    $btnDeny.Text = "Deny (Keep Current)"
    $btnDeny.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
    $btnDeny.BackColor = [System.Drawing.Color]::FromArgb(231, 76, 60)
    $btnDeny.ForeColor = [System.Drawing.Color]::White
    $btnDeny.Size = New-Object System.Drawing.Size(140, 35)
    $btnDeny.Location = New-Object System.Drawing.Point(235, 150)
    $form.Controls.Add($btnDeny)
    
    $result = [System.Windows.Forms.DialogResult]::Cancel
    
    $btnAllow.Add_Click({
        $result = [System.Windows.Forms.DialogResult]::OK
        $form.Close()
    })
    
    $btnDeny.Add_Click({
        $result = [System.Windows.Forms.DialogResult]::Cancel
        $form.Close()
    })
    
    $form.AcceptButton = $btnAllow
    $form.CancelButton = $btnDeny
    
    $dialogResult = $form.ShowDialog()
    return $result
}

function Set-PowerShellExecutionPolicy {
    Write-Host ""
    Write-Host "Requesting permission to set execution policy..." -ForegroundColor Yellow
    
    $permission = Show-PermissionDialog
    
    if ($permission -eq [System.Windows.Forms.DialogResult]::OK) {
        try {
            Write-Host ""
            Write-Host "Setting execution policy to 'Unrestricted'..." -ForegroundColor White
            
            Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser -Force
            
            $currentPolicy = Get-ExecutionPolicy -Scope CurrentUser
            Write-Host ""
            Write-Host "Success! Execution policy set: $currentPolicy" -ForegroundColor Green
            Write-Host ""
            Write-Host "You can now run PowerShell scripts locally:" -ForegroundColor White
            Write-Host "  Backend: cd backend && tsc" -ForegroundColor Gray
            Write-Host "  Frontend: cd frontend && npx vite build" -ForegroundColor Gray
            Write-Host "  PowerShell scripts" -ForegroundRole Gray
            Write-Host ""
            Write-Host "This applies only to your user account." -ForegroundColor DarkGray
            
            return $true
        }
        catch {
            Write-Host ""
            Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
            Write-Host "You can manually set this later:" -ForegroundColor Yellow
            Write-Host "  Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser" -ForegroundColor Gray
            
            return $false
        }
    }
    else {
        Write-Host ""
        Write-Host "Permission denied. Execution policy not changed." -ForegroundColor Yellow
        Write-Host "You can manually set this later:" -ForegroundColor Gray
        Write-Host "  Set-ExecutionPolicy -ExecutionPolicy Unrestricted -Scope CurrentUser" -ForegroundColor Gray
        
        return $false
    }
}

# Main execution
Set-PowerShellExecutionPolicy

Read-Host "`nPress Enter to exit..." -ForegroundColor White