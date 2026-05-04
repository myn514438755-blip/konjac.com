param(
  [switch]$Once,
  [int]$PollSeconds = 10,
  [string]$SupabaseUrl = $env:SUPABASE_URL,
  [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY,
  [string]$BlastBin = "C:\Program Files\NCBI\blast-2.9.0+\bin"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BlastDbRoot = Join-Path $ProjectRoot "blastdb"
$WorkRoot = Join-Path $ProjectRoot "blast_results\supabase-worker"
$Outfmt = "6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore"
$WorkerId = "$env:COMPUTERNAME-$PID"

if (-not $SupabaseUrl) { throw "Set SUPABASE_URL before running this worker." }
if (-not $ServiceRoleKey) { throw "Set SUPABASE_SERVICE_ROLE_KEY before running this worker." }
if (-not (Test-Path $BlastBin)) { throw "BLAST+ bin directory not found: $BlastBin" }

New-Item -ItemType Directory -Force -Path $WorkRoot | Out-Null

Write-Host "Konjac BLAST worker started."
Write-Host "Supabase: $SupabaseUrl"
Write-Host "Worker ID: $WorkerId"
Write-Host "Polling every $PollSeconds seconds. Press Ctrl+C to stop."

function New-SupabaseHeaders {
  param([string]$Prefer)
  $headers = @{
    "apikey" = $ServiceRoleKey
    "User-Agent" = "KonjacGeneExplorerBlastWorker/1.0"
  }
  if ($ServiceRoleKey -notlike "sb_secret_*") {
    $headers["Authorization"] = "Bearer $ServiceRoleKey"
  }
  if ($Prefer) { $headers["Prefer"] = $Prefer }
  return $headers
}

function Invoke-SupabaseRest {
  param(
    [string]$Method,
    [string]$Path,
    $Body = $null,
    [string]$Prefer = $null
  )
  $uri = "$SupabaseUrl/rest/v1/$Path"
  $headers = New-SupabaseHeaders -Prefer $Prefer
  if ($null -eq $Body) {
    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
  }
  $json = $Body | ConvertTo-Json -Depth 8
  return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body $json -ContentType "application/json"
}

function Get-NextQueuedJob {
  $jobs = Invoke-SupabaseRest -Method "Get" -Path "blast_jobs?select=*&status=eq.queued&order=created_at.asc&limit=1"
  if ($jobs.Count -eq 0) { return $null }
  return $jobs[0]
}

function Update-Job {
  param([string]$JobId, $Patch)
  return Invoke-SupabaseRest -Method "Patch" -Path "blast_jobs?id=eq.$JobId" -Body $Patch -Prefer "return=representation"
}

function Claim-Job {
  param($Job)
  $patch = @{
    status = "running"
    worker_id = $WorkerId
    started_at = (Get-Date).ToUniversalTime().ToString("o")
  }
  $claimed = Invoke-SupabaseRest -Method "Patch" -Path "blast_jobs?id=eq.$($Job.id)&status=eq.queued" -Body $patch -Prefer "return=representation"
  if ($claimed.Count -eq 0) { return $null }
  return $claimed[0]
}

function Parse-BlastTsv {
  param([string]$Path, [string]$JobId)
  $rows = @()
  if (-not (Test-Path $Path)) { return $rows }
  $rank = 1
  foreach ($line in Get-Content -LiteralPath $Path) {
    if (-not $line.Trim()) { continue }
    $cols = $line -split "`t"
    if ($cols.Count -lt 12) { continue }
    $rows += [ordered]@{
      job_id = $JobId
      rank = $rank
      qseqid = $cols[0]
      sseqid = $cols[1]
      pident = [decimal]$cols[2]
      alignment_length = [int]$cols[3]
      mismatch = [int]$cols[4]
      gapopen = [int]$cols[5]
      qstart = [int]$cols[6]
      qend = [int]$cols[7]
      sstart = [int]$cols[8]
      send = [int]$cols[9]
      evalue = [double]$cols[10]
      bitscore = [decimal]$cols[11]
    }
    $rank++
  }
  return $rows
}

function Run-Job {
  param($Job)
  $claimed = Claim-Job -Job $Job
  if ($null -eq $claimed) { return }

  $jobId = $claimed.id
  $queryPath = Join-Path $WorkRoot "$jobId.query.fa"
  $outPath = Join-Path $WorkRoot "$jobId.tsv"

  try {
    [System.IO.File]::WriteAllText($queryPath, [string]$claimed.query_fasta, [System.Text.Encoding]::ASCII)

    if ($claimed.program -eq "blastn") {
      $exe = Join-Path $BlastBin "blastn.exe"
      $db = "blastdb\konjac_cds"
    } elseif ($claimed.program -eq "blastp") {
      $exe = Join-Path $BlastBin "blastp.exe"
      $db = "blastdb\konjac_pep"
    } else {
      throw "Unsupported program: $($claimed.program)"
    }

    if (-not (Test-Path $exe)) { throw "BLAST executable not found: $exe" }
    if (-not (Test-Path (Join-Path $ProjectRoot "$db.nhr")) -and -not (Test-Path (Join-Path $ProjectRoot "$db.phr"))) {
      throw "BLAST database files not found for $db"
    }

    Push-Location $ProjectRoot
    try {
      & $exe -query $queryPath -db $db -out $outPath -outfmt $Outfmt -max_target_seqs ([int]$claimed.max_target_seqs)
      if ($LASTEXITCODE -ne 0) { throw "BLAST exited with code $LASTEXITCODE" }
    } finally {
      Pop-Location
    }

    $hits = Parse-BlastTsv -Path $outPath -JobId $jobId
    if ($hits.Count -gt 0) {
      Invoke-SupabaseRest -Method "Post" -Path "blast_hits" -Body $hits -Prefer "return=minimal" | Out-Null
    }

    Update-Job -JobId $jobId -Patch @{
      status = "succeeded"
      finished_at = (Get-Date).ToUniversalTime().ToString("o")
      error_message = $null
    } | Out-Null

    Write-Host "Completed BLAST job $jobId with $($hits.Count) hits."
  } catch {
    Update-Job -JobId $jobId -Patch @{
      status = "failed"
      finished_at = (Get-Date).ToUniversalTime().ToString("o")
      error_message = $_.Exception.Message
    } | Out-Null
    Write-Warning "BLAST job $jobId failed: $($_.Exception.Message)"
  }
}

do {
  $job = Get-NextQueuedJob
  if ($null -ne $job) {
    Write-Host "Claiming BLAST job $($job.id) ($($job.program), $($job.database))..."
    Run-Job -Job $job
  } elseif ($Once) {
    Write-Host "No queued BLAST jobs."
  } else {
    Write-Host "$(Get-Date -Format 'HH:mm:ss') No queued BLAST jobs. Waiting..."
    Start-Sleep -Seconds $PollSeconds
  }
} while (-not $Once)
