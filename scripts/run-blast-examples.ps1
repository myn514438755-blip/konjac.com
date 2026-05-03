param(
  [string]$BlastBin = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BlastDbDir = Join-Path $ProjectRoot "blastdb"
$ExamplesDir = Join-Path $ProjectRoot "examples\blast"
$ResultsDir = Join-Path $ProjectRoot "blast_results"

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

$blastn = Resolve-BlastTool "blastn.exe"
$blastp = Resolve-BlastTool "blastp.exe"
$CdsDb = Join-Path $BlastDbDir "konjac_cds"
$PepDb = Join-Path $BlastDbDir "konjac_pep"
$CdsQuery = Join-Path $ExamplesDir "query_cds.fa"
$PepQuery = Join-Path $ExamplesDir "query_protein.fa"

if (-not (Get-ChildItem -Path $BlastDbDir -Filter "konjac_cds.*" -ErrorAction SilentlyContinue)) { throw "Missing CDS BLAST database. Run scripts\build-blast-db.ps1 first." }
if (-not (Get-ChildItem -Path $BlastDbDir -Filter "konjac_pep.*" -ErrorAction SilentlyContinue)) { throw "Missing protein BLAST database. Run scripts\build-blast-db.ps1 first." }
if (-not (Test-Path -LiteralPath $CdsQuery)) { throw "Missing query: $CdsQuery" }
if (-not (Test-Path -LiteralPath $PepQuery)) { throw "Missing query: $PepQuery" }
New-Item -ItemType Directory -Path $ResultsDir -Force | Out-Null

$CdsOut = Join-Path $ResultsDir "example_cds.tsv"
$PepOut = Join-Path $ResultsDir "example_pep.tsv"
$Outfmt = "6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore"

& $blastn -query $CdsQuery -db $CdsDb -out $CdsOut -outfmt $Outfmt -max_target_seqs 50
& $blastp -query $PepQuery -db $PepDb -out $PepOut -outfmt $Outfmt -max_target_seqs 50

$manifest = [ordered]@{
  schema = "konjac.blast_results_manifest.v1"
  built_at = (Get-Date).ToUniversalTime().ToString("o")
  outputs = @(
    [ordered]@{ path = "blast_results/example_cds.tsv"; bytes = (Get-Item -LiteralPath $CdsOut).Length },
    [ordered]@{ path = "blast_results/example_pep.tsv"; bytes = (Get-Item -LiteralPath $PepOut).Length }
  )
  outfmt = $Outfmt
}
$manifestJson = $manifest | ConvertTo-Json -Depth 4
[System.IO.File]::WriteAllText((Join-Path $ResultsDir "manifest.json"), $manifestJson, [System.Text.UTF8Encoding]::new($false))
Write-Host "Example BLAST results written to blast_results/"

