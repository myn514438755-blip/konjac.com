param(
  [string]$BlastBin = "",
  [switch]$IncludeGenome,
  [string]$GenomeInput = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$BlastDbDir = Join-Path $ProjectRoot "blastdb"
$CdsInput = Join-Path $ProjectRoot "downloads\Amorphophallus_konjac.clean.cds"
$PepInput = Join-Path $ProjectRoot "downloads\Amorphophallus_konjac.clean.pep"
$CdsBlastInput = "downloads\Amorphophallus_konjac.clean.cds"
$PepBlastInput = "downloads\Amorphophallus_konjac.clean.pep"
$GenomeBlastInput = $null
if (-not $GenomeInput) {
  $GenomeInput = Join-Path $ProjectRoot "data\processed\jbrowse-app\assemblies\GCA_022559845.1_ASM2255984v1_genomic.fna.bgz"
  $GenomeBlastInput = "data\processed\jbrowse-app\assemblies\GCA_022559845.1_ASM2255984v1_genomic.fna.bgz"
} else {
  $GenomeInput = (Resolve-Path -LiteralPath $GenomeInput).Path
  $GenomeBlastInput = $GenomeInput
}

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

function Resolve-CommandTool {
  param([string[]]$ToolNames)
  foreach ($toolName in $ToolNames) {
    $command = Get-Command $toolName -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
  }
  return $null
}

function Expand-GzipWithNode {
  param(
    [string]$InputPath,
    [string]$OutputPath
  )
  $node = Resolve-CommandTool @("node.exe", "node")
  if (-not $node) {
    throw "Cannot find Node.js to decompress genome BGZF. Install Node.js or provide an uncompressed genome FASTA with -GenomeInput."
  }
  $nodeScript = @"
const fs = require('fs');
const zlib = require('zlib');
const { pipeline } = require('stream');
const input = process.argv[1];
const output = process.argv[2];
pipeline(
  fs.createReadStream(input),
  zlib.createGunzip(),
  fs.createWriteStream(output),
  (error) => {
    if (!error) return process.exit(0);
    console.error(error.message);
    process.exit(1);
  }
);
"@
  & $node -e $nodeScript $InputPath $OutputPath
  if ($LASTEXITCODE -ne 0) { throw "Genome decompression failed with exit code $LASTEXITCODE" }
}

$makeblastdb = Resolve-BlastTool "makeblastdb.exe"
$blastn = Resolve-BlastTool "blastn.exe"
$blastp = Resolve-BlastTool "blastp.exe"

if (-not (Test-Path -LiteralPath $CdsInput)) { throw "Missing CDS FASTA: $CdsInput" }
if (-not (Test-Path -LiteralPath $PepInput)) { throw "Missing protein FASTA: $PepInput" }
New-Item -ItemType Directory -Path $BlastDbDir -Force | Out-Null

$CdsPrefix = Join-Path $BlastDbDir "konjac_cds"
$PepPrefix = Join-Path $BlastDbDir "konjac_pep"
$GenomePrefix = Join-Path $BlastDbDir "konjac_genome"
$GenomeSource = Join-Path $BlastDbDir "konjac_genome_source.fna"
$CdsBlastPrefix = "blastdb\konjac_cds"
$PepBlastPrefix = "blastdb\konjac_pep"
$GenomeBlastPrefix = "blastdb\konjac_genome"

if ($IncludeGenome -and ($GenomeInput -match '\.(bgz|gz)$')) {
  $needsExpand = -not (Test-Path -LiteralPath $GenomeSource)
  if (-not $needsExpand) {
    $needsExpand = (Get-Item -LiteralPath $GenomeSource).LastWriteTimeUtc -lt (Get-Item -LiteralPath $GenomeInput).LastWriteTimeUtc
  }
  if ($needsExpand) {
    Write-Host "Decompressing genome BGZF to blastdb/konjac_genome_source.fna..."
    Expand-GzipWithNode -InputPath $GenomeInput -OutputPath $GenomeSource
  } else {
    Write-Host "Using existing blastdb/konjac_genome_source.fna"
  }
  $GenomeInput = $GenomeSource
  $GenomeBlastInput = "blastdb\konjac_genome_source.fna"
}

Push-Location $ProjectRoot
try {
  $CdsArgs = @('-in', $CdsBlastInput, '-dbtype', 'nucl', '-out', $CdsBlastPrefix, '-title', 'Amorphophallus konjac CDS')
  & $makeblastdb @CdsArgs
  if ($LASTEXITCODE -ne 0) { throw "makeblastdb failed for CDS with exit code $LASTEXITCODE" }

  $PepArgs = @('-in', $PepBlastInput, '-dbtype', 'prot', '-out', $PepBlastPrefix, '-title', 'Amorphophallus konjac protein')
  & $makeblastdb @PepArgs
  if ($LASTEXITCODE -ne 0) { throw "makeblastdb failed for protein with exit code $LASTEXITCODE" }

  if ($IncludeGenome) {
    if (-not (Test-Path -LiteralPath $GenomeInput)) { throw "Missing genome FASTA/BGZF input: $GenomeInput" }
    $GenomeArgs = @('-in', $GenomeBlastInput, '-dbtype', 'nucl', '-out', $GenomeBlastPrefix, '-title', 'Amorphophallus konjac genome')
    & $makeblastdb @GenomeArgs
    if ($LASTEXITCODE -ne 0) { throw "makeblastdb failed for genome with exit code $LASTEXITCODE" }
  }
} finally {
  Pop-Location
}

$blastVersion = (& $blastn -version | Select-Object -First 1)
$databases = @(
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
if ($IncludeGenome -or (Get-ChildItem -Path $BlastDbDir -Filter "konjac_genome.*" -ErrorAction SilentlyContinue)) {
  $databases += [ordered]@{
    id = "konjac_genome"
    label = "Konjac genome nucleotide database"
    dbtype = "nucl"
    prefix = "blastdb/konjac_genome"
    files = @(Get-ChildItem -Path $BlastDbDir -Filter "konjac_genome.*" | ForEach-Object { [ordered]@{ name = $_.Name; bytes = $_.Length } })
  }
}
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
    genome = "data/processed/jbrowse-app/assemblies/GCA_022559845.1_ASM2255984v1_genomic.fna.bgz"
  }
  databases = $databases
}
$manifestJson = $manifest | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText((Join-Path $BlastDbDir "manifest.json"), $manifestJson, [System.Text.UTF8Encoding]::new($false))
Write-Host "BLAST databases built in $BlastDbDir"
Write-Host "Manifest: blastdb/manifest.json"



