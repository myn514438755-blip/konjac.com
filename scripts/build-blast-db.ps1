param(
  [string]$BlastBin = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BlastDbDir = Join-Path $ProjectRoot "blastdb"
$CdsInput = Join-Path $ProjectRoot "downloads\Amorphophallus_konjac.clean.cds"
$PepInput = Join-Path $ProjectRoot "downloads\Amorphophallus_konjac.clean.pep"

function Resolve-BlastTool {
  param([string]$ToolName)
  $candidates = @()
  if ($BlastBin) { $candidates += (Join-Path $BlastBin $ToolName) }
  $command = Get-Command $ToolName -ErrorAction SilentlyContinue
  if ($command) { $candidates += $command.Source }
  $candidates += @(
    "C:\Program Files\NCBI\blast-2.9.0+\bin\$ToolName",
    "C:\Program Files\NCBI\blast-2.16.0+\bin\$ToolName",
    "C:\Program Files\NCBI\blast-2.15.0+\bin\$ToolName"
  )
  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) { return (Resolve-Path -LiteralPath $candidate).Path }
  }
  throw "Cannot find $ToolName. Install NCBI BLAST+ or pass -BlastBin <path-to-bin>."
}

$makeblastdb = Resolve-BlastTool "makeblastdb.exe"
$blastn = Resolve-BlastTool "blastn.exe"
$blastp = Resolve-BlastTool "blastp.exe"

if (-not (Test-Path -LiteralPath $CdsInput)) { throw "Missing CDS FASTA: $CdsInput" }
if (-not (Test-Path -LiteralPath $PepInput)) { throw "Missing protein FASTA: $PepInput" }
New-Item -ItemType Directory -Path $BlastDbDir -Force | Out-Null

$CdsPrefix = Join-Path $BlastDbDir "konjac_cds"
$PepPrefix = Join-Path $BlastDbDir "konjac_pep"

$CdsArgs = @('-in', $CdsInput, '-dbtype', 'nucl', '-out', $CdsPrefix, '-title', 'Amorphophallus konjac CDS')
& $makeblastdb @CdsArgs
if ($LASTEXITCODE -ne 0) { throw "makeblastdb failed for CDS with exit code $LASTEXITCODE" }

$PepArgs = @('-in', $PepInput, '-dbtype', 'prot', '-out', $PepPrefix, '-title', 'Amorphophallus konjac protein')
& $makeblastdb @PepArgs
if ($LASTEXITCODE -ne 0) { throw "makeblastdb failed for protein with exit code $LASTEXITCODE" }

$blastVersion = (& $blastn -version | Select-Object -First 1)
$manifest = [ordered]@{
  schema = "konjac.blast_manifest.v1"
  built_at = (Get-Date).ToUniversalTime().ToString("o")
  blast_version = $blastVersion
  tools = [ordered]@{
    makeblastdb = $makeblastdb
    blastn = $blastn
    blastp = $blastp
  }
  inputs = [ordered]@{
    cds = "downloads/Amorphophallus_konjac.clean.cds"
    protein = "downloads/Amorphophallus_konjac.clean.pep"
  }
  databases = @(
    [ordered]@{
      id = "konjac_cds"
      label = "Konjac CDS nucleotide database"
      dbtype = "nucl"
      prefix = "blastdb/konjac_cds"
      files = @(Get-ChildItem -Path $BlastDbDir -Filter "konjac_cds.*" | ForEach-Object { [ordered]@{ name = $_.Name; bytes = $_.Length } })
    },
    [ordered]@{
      id = "konjac_pep"
      label = "Konjac protein database"
      dbtype = "prot"
      prefix = "blastdb/konjac_pep"
      files = @(Get-ChildItem -Path $BlastDbDir -Filter "konjac_pep.*" | ForEach-Object { [ordered]@{ name = $_.Name; bytes = $_.Length } })
    }
  )
}
$manifestJson = $manifest | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText((Join-Path $BlastDbDir "manifest.json"), $manifestJson, [System.Text.UTF8Encoding]::new($false))
Write-Host "BLAST databases built in $BlastDbDir"
Write-Host "Manifest: blastdb/manifest.json"



