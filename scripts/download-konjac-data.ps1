param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

function Ensure-Dir {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function Write-Info([string]$Message) {
  Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Warn([string]$Message) {
  Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-ErrorLine([string]$Message) {
  Write-Host "[ERR ] $Message" -ForegroundColor Red
}

function Download-IfMissing {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][string]$Destination,
    [string]$Label = ''
  )

  if (Test-Path -LiteralPath $Destination) {
    Write-Info "Skip existing: $Label -> $Destination"
    return
  }

  $parent = Split-Path -Parent $Destination
  Ensure-Dir -Path $parent

  try {
    Write-Info "Download: $Label"
    Invoke-WebRequest -Uri $Url -OutFile $Destination
    Write-Info "Done: $Destination"
  } catch {
    Write-ErrorLine "Failed: $Label"
    Write-ErrorLine "  URL: $Url"
    Write-ErrorLine "  Dest: $Destination"
    Write-ErrorLine "  Reason: $($_.Exception.Message)"
  }
}

function Reserve-Download {
  param(
    [Parameter(Mandatory = $true)][string]$Destination,
    [Parameter(Mandatory = $true)][string]$Label,
    [string]$Note = 'Reserved: add a real URL later.'
  )

  if (Test-Path -LiteralPath $Destination) {
    Write-Info "Skip existing: $Label -> $Destination"
    return
  }

  $parent = Split-Path -Parent $Destination
  Ensure-Dir -Path $parent

  Write-Warn "Reserved: $Label -> $Destination"
  Write-Warn "  $Note"
}

Ensure-Dir -Path (Join-Path $Root 'data\raw\ncbi')
Ensure-Dir -Path (Join-Path $Root 'data\raw\plantgarden')
Ensure-Dir -Path (Join-Path $Root 'data\raw\figshare')
Ensure-Dir -Path (Join-Path $Root 'data\processed')

$ncbiBase = $env:KONJAC_NCBI_FTP_BASE
if (-not $ncbiBase) {
  $ncbiBase = 'https://ftp.ncbi.nlm.nih.gov/genomes/all/GCA/022/559/845/GCA_022559845.1_ASM2255984v1/'
}
if (-not $ncbiBase.EndsWith('/')) { $ncbiBase += '/' }

$plantgardenBase = $env:KONJAC_PLANTGARDEN_BASE_URL
if (-not $plantgardenBase) {
  $plantgardenBase = 'https://plantgarden.jp/en/download/Amorphophallus_konjac/t78372.G001/'
}
if ($plantgardenBase -and -not $plantgardenBase.EndsWith('/')) { $plantgardenBase += '/' }

$downloads = @(
  @{
    Label = 'NCBI genomic FASTA'
    Destination = Join-Path $Root 'data\raw\ncbi\GCA_022559845.1_ASM2255984v1_genomic.fna.gz'
    Url = ($ncbiBase + 'GCA_022559845.1_ASM2255984v1_genomic.fna.gz')
  },
  @{
    Label = 'NCBI sequence_report.jsonl'
    Destination = Join-Path $Root 'data\raw\ncbi\sequence_report.jsonl'
    Url = $null
    Note = 'Reserved until the exact NCBI Datasets URL is confirmed.'
  },
  @{
    Label = 'NCBI assembly_data_report.jsonl'
    Destination = Join-Path $Root 'data\raw\ncbi\assembly_data_report.jsonl'
    Url = $null
    Note = 'Reserved until the exact NCBI Datasets URL is confirmed.'
  },
  @{
    Label = 'PlantGARDEN Amorphophallus_konjac.clean.gff.gz'
    Destination = Join-Path $Root 'data\raw\plantgarden\Amorphophallus_konjac.clean.gff.gz'
    Url = ($plantgardenBase + 'Amorphophallus_konjac.clean.gff.gz')
    Note = 'PlantGARDEN direct file.'
  },
  @{
    Label = 'PlantGARDEN Amorphophallus_konjac.clean.cds.gz'
    Destination = Join-Path $Root 'data\raw\plantgarden\Amorphophallus_konjac.clean.cds.gz'
    Url = ($plantgardenBase + 'Amorphophallus_konjac.clean.cds.gz')
    Note = 'PlantGARDEN direct file.'
  },
  @{
    Label = 'PlantGARDEN Amorphophallus_konjac.clean.pep.gz'
    Destination = Join-Path $Root 'data\raw\plantgarden\Amorphophallus_konjac.clean.pep.gz'
    Url = ($plantgardenBase + 'Amorphophallus_konjac.clean.pep.gz')
    Note = 'PlantGARDEN direct file.'
  },
  @{
    Label = 'PlantGARDEN Amorphophallus_konjac_t78372.G001_zen_v2.0.tar.gz'
    Destination = Join-Path $Root 'data\raw\plantgarden\Amorphophallus_konjac_t78372.G001_zen_v2.0.tar.gz'
    Url = ($plantgardenBase + 'Amorphophallus_konjac_t78372.G001_zen_v2.0.tar.gz')
    Note = 'PlantGARDEN direct file.'
  },
  @{
    Label = 'PlantGARDEN GCA_022559845.1_ASM2255984v1_genomic.fna.gz'
    Destination = Join-Path $Root 'data\raw\plantgarden\GCA_022559845.1_ASM2255984v1_genomic.fna.gz'
    Url = ($plantgardenBase + 'GCA_022559845.1_ASM2255984v1_genomic.fna.gz')
    Note = 'PlantGARDEN direct file.'
  },
  @{
    Label = 'PlantGARDEN GCA_022559845.1_ASM2255984v1_assembly_report.txt'
    Destination = Join-Path $Root 'data\raw\plantgarden\GCA_022559845.1_ASM2255984v1_assembly_report.txt'
    Url = ($plantgardenBase + 'GCA_022559845.1_ASM2255984v1_assembly_report.txt')
    Note = 'PlantGARDEN direct file.'
  },
  @{
    Label = 'PlantGARDEN README.txt'
    Destination = Join-Path $Root 'data\raw\plantgarden\README.txt'
    Url = ($plantgardenBase + 'README.txt')
    Note = 'PlantGARDEN direct file.'
  }
)

foreach ($item in $downloads) {
  if ($item.Url) {
    Download-IfMissing -Url $item.Url -Destination $item.Destination -Label $item.Label
  } else {
    Reserve-Download -Destination $item.Destination -Label $item.Label -Note $item.Note
  }
}

Write-Host ''
Write-Info 'Script finished. Large files were not decompressed automatically.'
