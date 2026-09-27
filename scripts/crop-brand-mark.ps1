<#
.SYNOPSIS
  Crops the transparent margin off a brand mark so it can drop straight into
  the navbar/footer at a known height.

.DESCRIPTION
  The supplied ELVA wordmark carries built-in padding (about 10% top and 6%
  bottom). Because the nav/footer size the logo with a fixed CSS height, that
  empty margin would render the visible mark roughly 16% smaller than before.
  Cropping to the visible pixels makes the new art a drop-in replacement and
  keeps the layout untouched.

  The artwork itself is never altered - only empty transparent space is
  removed, using a low alpha threshold so soft anti-aliased edges survive.
#>
param(
  [Parameter(Mandatory)]
  [string]$Source,

  [Parameter(Mandatory)]
  [string]$Destination
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Image]::FromFile($Source)
$w = $src.Width
$h = $src.Height
$bmp = New-Object System.Drawing.Bitmap $src

# Pass 1 - coarse scan, every 2px, to locate the mark quickly.
$t = 2
$coarseMinX = $w; $coarseMaxX = -1; $coarseMinY = $h; $coarseMaxY = -1
for ($y = 0; $y -lt $h; $y += 2) {
  for ($x = 0; $x -lt $w; $x += 2) {
    if ($bmp.GetPixel($x, $y).A -gt $t) {
      if ($x -lt $coarseMinX) { $coarseMinX = $x }
      if ($x -gt $coarseMaxX) { $coarseMaxX = $x }
      if ($y -lt $coarseMinY) { $coarseMinY = $y }
      if ($y -gt $coarseMaxY) { $coarseMaxY = $y }
    }
  }
}
if ($coarseMaxX -lt 0) { throw "No visible pixels found in $Source - is the image blank?" }

# Pass 2 - refine to single-pixel accuracy inside a 4px window around the
# coarse edges, so anti-aliased pixels are not clipped.
$minX = $coarseMinX; $minY = $coarseMinY
$maxX = $coarseMaxX; $maxY = $coarseMaxY
$refine = 4
for ($y = [Math]::Max(0, $coarseMinY - $refine); $y -le [Math]::Min($h - 1, $coarseMinY + $refine); $y++) {
  for ($x = 0; $x -lt $w; $x++) {
    if ($bmp.GetPixel($x, $y).A -gt $t) {
      if ($x -lt $minX) { $minX = $x }
      if ($y -lt $minY) { $minY = $y }
      break
    }
  }
}
for ($y = [Math]::Max(0, $coarseMaxY - $refine); $y -le [Math]::Min($h - 1, $coarseMaxY + $refine); $y++) {
  for ($x = $w - 1; $x -ge 0; $x--) {
    if ($bmp.GetPixel($x, $y).A -gt $t) {
      if ($x -gt $maxX) { $maxX = $x }
      if ($y -gt $maxY) { $maxY = $y }
      break
    }
  }
}

# Tighten the vertical edges too, since the side passes only fixed y.
for ($x = [Math]::Max(0, $coarseMinX - $refine); $x -le [Math]::Min($w - 1, $coarseMinX + $refine); $x++) {
  for ($y = 0; $y -lt $h; $y++) {
    if ($bmp.GetPixel($x, $y).A -gt $t) { if ($y -lt $minY) { $minY = $y }; break }
  }
  for ($y = $h - 1; $y -ge 0; $y--) {
    if ($bmp.GetPixel($x, $y).A -gt $t) { if ($y -gt $maxY) { $maxY = $y }; break }
  }
}
for ($x = [Math]::Max(0, $coarseMaxX - $refine); $x -le [Math]::Min($w - 1, $coarseMaxX + $refine); $x++) {
  for ($y = 0; $y -lt $h; $y++) {
    if ($bmp.GetPixel($x, $y).A -gt $t) { if ($y -lt $minY) { $minY = $y }; break }
  }
  for ($y = $h - 1; $y -ge 0; $y--) {
    if ($bmp.GetPixel($x, $y).A -gt $t) { if ($y -gt $maxY) { $maxY = $y }; break }
  }
}

$bw = $maxX - $minX + 1
$bh = $maxY - $minY + 1

Write-Output ("  source  {0}x{1}  {2:N0} bytes" -f $w, $h, (Get-Item $Source).Length)
Write-Output ("  removed L={0} T={1} R={2} B={3}" -f $minX, $minY, ($w - 1 - $maxX), ($h - 1 - $maxY))
Write-Output ("  cropped {0}x{1}  (aspect {2:N4})" -f $bw, $bh, ($bw / $bh))

$out = New-Object System.Drawing.Bitmap -ArgumentList @($bw, $bh)
$g = [System.Drawing.Graphics]::FromImage($out)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($bmp,
  (New-Object System.Drawing.Rectangle -ArgumentList @(0, 0, $bw, $bh)),
  (New-Object System.Drawing.Rectangle -ArgumentList @($minX, $minY, $bw, $bh)),
  [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$out.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
$out.Dispose()
$bmp.Dispose()
$src.Dispose()

Write-Output ("  wrote   {0}  {1:N0} bytes" -f (Split-Path -Leaf $Destination), (Get-Item $Destination).Length)
