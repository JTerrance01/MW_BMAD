# Script to revert Competition ID 28 back to Round 1 Voting (VotingRound1Open)
# Based on CompetitionStatus enum: VotingRound1Open = 11

$baseUrl = "https://localhost:7001"
$competitionId = 28
$newStatus = 11  # VotingRound1Open

# Admin credentials
$loginRequest = @{
    Email = "admin@mixwarz.com"
    Password = "Admin123!"
}

# Disable certificate validation for localhost
add-type @"
using System.Net;
using System.Security.Cryptography.X509Certificates;
public class TrustAllCertsPolicy : ICertificatePolicy {
    public bool CheckValidationResult(
        ServicePoint srvPoint, X509Certificate certificate,
        WebRequest request, int certificateProblem) {
        return true;
    }
}
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

# For PowerShell Core, also disable certificate validation
if ($PSVersionTable.PSVersion.Major -ge 6) {
    $PSDefaultParameterValues['Invoke-RestMethod:SkipCertificateCheck'] = $true
    $PSDefaultParameterValues['Invoke-WebRequest:SkipCertificateCheck'] = $true
}

try {
    Write-Host "Authenticating as admin..." -ForegroundColor Yellow
    Write-Host "Login URL: $baseUrl/api/auth/login" -ForegroundColor Gray
    
    # Login to get JWT token
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body ($loginRequest | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "Login response received:" -ForegroundColor Gray
    Write-Host ($loginResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    
    if (-not $loginResponse.success) {
        throw "Authentication failed: $($loginResponse.message)"
    }
    
    $token = $loginResponse.token
    Write-Host "Authentication successful!" -ForegroundColor Green
    Write-Host "Token received: $($token.Substring(0, 20))..." -ForegroundColor Gray
    
    # Prepare headers with Bearer token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Prepare the update request
    $updateRequest = @{
        CompetitionId = $competitionId
        NewStatus = $newStatus
    }
    
    Write-Host "Updating competition $competitionId to Round 1 Voting (status: $newStatus)..." -ForegroundColor Yellow
    Write-Host "Update URL: $baseUrl/api/v1/admin/competitions/$competitionId/status" -ForegroundColor Gray
    Write-Host "Update payload:" -ForegroundColor Gray
    Write-Host ($updateRequest | ConvertTo-Json) -ForegroundColor Gray
    
    # Update competition status
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/competitions/$competitionId/status" -Method PUT -Body ($updateRequest | ConvertTo-Json) -Headers $headers
    
    Write-Host "Update response received:" -ForegroundColor Gray
    Write-Host ($updateResponse | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    
    if ($updateResponse.success) {
        Write-Host "Competition $competitionId successfully reverted to Round 1 Voting!" -ForegroundColor Green
        Write-Host "New status: $($updateResponse.newStatus)" -ForegroundColor Cyan
        Write-Host "Message: $($updateResponse.message)" -ForegroundColor Cyan
    } else {
        Write-Host "Failed to update competition status" -ForegroundColor Red
        Write-Host "Error: $($updateResponse.message)" -ForegroundColor Red
        if ($updateResponse.errors) {
            Write-Host "Errors: $($updateResponse.errors -join ', ')" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response body: $responseBody" -ForegroundColor Red
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Red
        }
    }
    
    Write-Host "Full error details:" -ForegroundColor Red
    Write-Host $_.Exception.ToString() -ForegroundColor Red
}

Write-Host "Script completed." -ForegroundColor Yellow 