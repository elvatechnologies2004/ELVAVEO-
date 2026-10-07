<#
.SYNOPSIS
  Rebuilds the web brand assets from the ELVAVEO master artwork.

.DESCRIPTION
  Favicons are generated from the master brand mark (a 1254x1254 rounded
  square with a transparent margin) - NOT from the wide wordmark, which is the
  wrong shape for a favicon.

  The 1.1 MB master is intentionally not committed; point -Favicon at it:

    powershell -ExecutionPolicy Bypass -File scripts\generate-brand-assets.ps1 `
      -Favicon "C:\path\to\favicon elvaveo.png"
#>
param(
  [Parameter()]
  [string]$Favicon,

  [Parameter()]
  [string]$Wordmark
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

# $PSScriptRoot is empty while param defaults are bound, so resolve paths here.
$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$root = Split-Path -Parent $scriptDir
$outDir = Join-Path $root "public"
if (-not $Favicon)  { $Favicon  = "C:\Users\syedh\Downloads\ELVA\favicon elvaveo.png" }
if (-not $Wordmark) { $Wordmark = Join-Path $root "public\brand\elvaveo-logo.png" }

# ---------------------------------------------------------------- helpers

# Progressive halving keeps edges clean when downscaling by 7x or more;
# a single bicubic pass at that ratio visibly softens the mark.
function Get-ScaledImage([System.Drawing.Image]$src, [int]$w, [int]$h) {
  $cur = New-Object System.Drawing.Bitmap -ArgumentList @($src.Width, $src.Height)
  $g = [System.Drawing.Graphics]::FromImage($cur)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($src, 0, 0, $cur.Width, $cur.Height)
  $g.Dispose()

  $cw = $cur.Width; $ch = $cur.Height
  while ($cw -gt $w * 2 -and $ch -gt $h * 2) {
    $nw = [int][Math]::Max($w, $cw / 2)
    $nh = [int][Math]::Max($h, $ch / 2)
    $next = New-Object System.Drawing.Bitmap -ArgumentList @($nw, $nh)
    $g2 = [System.Drawing.Graphics]::FromImage($next)
    $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g2.DrawImage($cur, 0, 0, $nw, $nh)
    $g2.Dispose(); $cur.Dispose()
    $cur = $next; $cw = $nw; $ch = $nh
  }

  $final = New-Object System.Drawing.Bitmap -ArgumentList @($w, $h)
  $g3 = [System.Drawing.Graphics]::FromImage($final)
  $g3.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g3.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g3.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g3.DrawImage($cur, 0, 0, $w, $h)
  $g3.Dispose(); $cur.Dispose()
  return $final
}

# Bounding box of visible pixels, using early exit so the scan stays cheap.
# Threshold is deliberately low so soft anti-aliased edges survive the crop.
function Get-VisibleBounds([System.Drawing.Bitmap]$bmp) {
  $w = $bmp.Width; $h = $bmp.Height
  $t = 4

  $minX = $w; $maxX = -1; $minY = $h; $maxY = -1

  for ($y = 0; $y -lt $h -and $minY -eq $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      if ($bmp.GetPixel($x, $y).A -gt $t) { $minY = $y; break }
    }
  }
  for ($y = $h - 1; $y -ge 0 -and $maxY -lt 0; $y--) {
    for ($x = 0; $x -lt $w; $x++) {
      if ($bmp.GetPixel($x, $y).A -gt $t) { $maxY = $y; break }
    }
  }
  for ($x = 0; $x -lt $w -and $minX -eq $w; $x++) {
    for ($y = 0; $y -lt $h; $y++) {
      if ($bmp.GetPixel($x, $y).A -gt $t) { $minX = $x; break }
    }
  }
  for ($x = $w - 1; $x -ge 0 -and $maxX -lt 0; $x--) {
    for ($y = 0; $y -lt $h; $y++) {
      if ($bmp.GetPixel($x, $y).A -gt $t) { $maxX = $x; break }
    }
  }

  return New-Object System.Drawing.Rectangle -ArgumentList @(
    $minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)
  )
}

function Save-Png([System.Drawing.Bitmap]$bmp, [string]$path) {
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output ("  {0,-18} {1,7:N0} bytes" -f (Split-Path -Leaf $path), (Get-Item $path).Length)
}

# ---------------------------------------------------------------- favicons

if (-not (Test-Path $Favicon)) {
  throw "Brand favicon not found: $Favicon`nPass the master PNG with -Favicon <path>."
}

Write-Output "Favicons (from supplied brand mark):"
$master = [System.Drawing.Image]::FromFile($Favicon)
$masterBmp = New-Object System.Drawing.Bitmap $master
$bounds = Get-VisibleBounds $masterBmp

# Crop the transparent margin once, so every size below is the mark itself.
$mark = New-Object System.Drawing.Bitmap -ArgumentList @($bounds.Width, $bounds.Height)
$mg0 = [System.Drawing.Graphics]::FromImage($mark)
$mg0.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$mg0.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$mg0.DrawImage($masterBmp,
  (New-Object System.Drawing.Rectangle -ArgumentList @(0, 0, $bounds.Width, $bounds.Height)),
  $bounds, [System.Drawing.GraphicsUnit]::Pixel)
$mg0.Dispose()

# Browser favicons keep their alpha so the rounded tile floats on any tab
# background. 32px is what tabs actually request, so it is listed first and
# browsers pick the smallest entry that fits instead of always fetching 256.
Save-Png (Get-ScaledImage $master 32 32)  (Join-Path $outDir "icon-32.png")
Save-Png (Get-ScaledImage $master 256 256) (Join-Path $outDir "icon.png")

# Apple touch icon: iOS composites transparent PNGs onto BLACK, which would
# frame the rounded tile in black. So use the cropped mark edge-to-edge on
# white - iOS applies its own mask, so no alpha is needed here.
$apple = New-Object System.Drawing.Bitmap -ArgumentList @(180, 180)
$ag = [System.Drawing.Graphics]::FromImage($apple)
$ag.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$ag.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$ag.Clear([System.Drawing.Color]::White)
$ag.DrawImage((Get-ScaledImage $mark 180 180), 0, 0, 180, 180)
$ag.Dispose()

Save-Png $apple (Join-Path $outDir "apple-icon.png")

$mark.Dispose(); $masterBmp.Dispose(); $master.Dispose()

# ---------------------------------------------------------------- og image

# Brand palette (mirrors app/globals.css tokens)
$ice   = [System.Drawing.Color]::FromArgb(244, 247, 253)
$navy  = [System.Drawing.Color]::FromArgb(8, 27, 61)
$muted = [System.Drawing.Color]::FromArgb(97, 112, 143)
$blue  = [System.Drawing.Color]::FromArgb(37, 99, 255)
$gradA = [System.Drawing.Color]::FromArgb(19, 184, 255)
$gradB = [System.Drawing.Color]::FromArgb(53, 109, 255)
$gradC = [System.Drawing.Color]::FromArgb(138, 43, 226)

function New-Gfx([System.Drawing.Bitmap]$bmp) {
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  return $g
}

# The site gradient is 3-stop (#13b8ff -> #356dff -> #8a2be2) but GDI+ only
# supports 2 stops, so the ramp is interpolated and painted in thin strips.
function Get-RampColor([double]$t) {
  if ($t -lt 0) { $t = 0 }
  if ($t -gt 1) { $t = 1 }
  if ($t -le 0.5) { $k = $t / 0.5; $a = $gradA; $b = $gradB }
  else           { $k = ($t - 0.5) / 0.5; $a = $gradB; $b = $gradC }
  return [System.Drawing.Color]::FromArgb(
    [int][Math]::Round($a.R + ($b.R - $a.R) * $k),
    [int][Math]::Round($a.G + ($b.G - $a.G) * $k),
    [int][Math]::Round($a.B + ($b.B - $a.B) * $k))
}

function Fill-Ramp([System.Drawing.Graphics]$g, [double]$x, [double]$y, [double]$w, [double]$h, [bool]$vertical) {
  $span = if ($vertical) { $h } else { $w }
  $steps = [int][Math]::Ceiling($span)
  if ($steps -lt 1) { $steps = 1 }
  for ($i = 0; $i -lt $steps; $i++) {
    $br = New-Object System.Drawing.SolidBrush -ArgumentList @((Get-RampColor ($i / [double]($steps - 1))))
    if ($vertical) { $g.FillRectangle($br, [single]$x, [single]($y + $i), [single]$w, [single]1.6) }
    else           { $g.FillRectangle($br, [single]($x + $i), [single]$y, [single]1.6, [single]$h) }
    $br.Dispose()
  }
}

function Fill-Glow([System.Drawing.Graphics]$g, [double]$x, [double]$y, [double]$w, [double]$h, [System.Drawing.Color]$tint) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddEllipse([single]$x, [single]$y, [single]$w, [single]$h)
  $pbr = New-Object System.Drawing.Drawing2D.PathGradientBrush -ArgumentList @($path)
  $pbr.CenterColor = $tint
  $pbr.SurroundColors = @([System.Drawing.Color]::FromArgb(0, $tint.R, $tint.G, $tint.B))
  $pbr.FocusScales = New-Object System.Drawing.PointF -ArgumentList @([single]0, [single]0)
  $g.FillEllipse($pbr, [single]$x, [single]$y, [single]$w, [single]$h)
  $pbr.Dispose(); $path.Dispose()
}

if (Test-Path $Wordmark) {
  Write-Output "Open Graph image:"

  $w = 1200; $h = 630
  $bmp = New-Object System.Drawing.Bitmap -ArgumentList @($w, $h)
  $g = New-Gfx $bmp
  $g.Clear($ice)

  Fill-Glow $g -220 -230 720 720 ([System.Drawing.Color]::FromArgb(70, 19, 184, 255))
  Fill-Glow $g 800 210 700 700 ([System.Drawing.Color]::FromArgb(55, 138, 43, 226))
  Fill-Ramp $g 0 0 $w 12 $false

  $center = New-Object System.Drawing.StringFormat -ArgumentList ([System.Drawing.StringAlignment]::Center, [System.Drawing.StringAlignment]::Center)

  $eyebrowFont = New-Object System.Drawing.Font -ArgumentList @("Segoe UI", 17, [System.Drawing.FontStyle]::Bold)
  $eyebrowBrush = New-Object System.Drawing.SolidBrush -ArgumentList @($blue)
  $g.DrawString("S O F T W A R E   /   S A A S   /   D I G I T A L   S O L U T I O N S",
    $eyebrowFont, $eyebrowBrush,
    (New-Object System.Drawing.RectangleF -ArgumentList @([single]0, [single]74, [single]$w, [single]40)), $center)

  $logo = [System.Drawing.Image]::FromFile($Wordmark)
  $ratio = [double]$logo.Width / [double]$logo.Height
  $lw = [single]560
  $lh = [single]($lw / $ratio)
  $g.DrawImage($logo, [single](($w - $lw) / 2), [single]140, $lw, $lh)

  $tagY = [single](140 + $lh + 34)
  $tagFont = New-Object System.Drawing.Font -ArgumentList @("Segoe UI", 34, [System.Drawing.FontStyle]::Bold)
  $navyBrush = New-Object System.Drawing.SolidBrush -ArgumentList @($navy)
  $g.DrawString("Software, SaaS & Digital Solutions", $tagFont, $navyBrush,
    (New-Object System.Drawing.RectangleF -ArgumentList @([single]60, $tagY, [single]1080, [single]48)), $center)

  $descFont = New-Object System.Drawing.Font -ArgumentList @("Segoe UI", 22, [System.Drawing.FontStyle]::Regular)
  $descBrush = New-Object System.Drawing.SolidBrush -ArgumentList @($muted)
  $g.DrawString("We design, build and scale software that creates real impact - including Finlo and FinloCRM.",
    $descFont, $descBrush,
    (New-Object System.Drawing.RectangleF -ArgumentList @([single]60, [single]($tagY + 54), [single]1080, [single]40)), $center)

  $pillW = 700; $pillH = 84
  $pillX = [single](($w - $pillW) / 2); $pillY = [single]430
  $g.FillRectangle((New-Object System.Drawing.SolidBrush -ArgumentList @([System.Drawing.Color]::FromArgb(220, 255, 255, 255))), $pillX, $pillY, [single]$pillW, [single]$pillH)
  $g.DrawRectangle((New-Object System.Drawing.Pen -ArgumentList @([System.Drawing.Color]::FromArgb(70, 130, 160, 220), [single]1.5)), $pillX, $pillY, [single]$pillW, [single]$pillH)

  $pillFont = New-Object System.Drawing.Font -ArgumentList @("Segoe UI", 24, [System.Drawing.FontStyle]::Bold)
  $g.DrawString("elvaveo.com", $pillFont, $navyBrush,
    (New-Object System.Drawing.RectangleF -ArgumentList @($pillX, [single]($pillY + 12), [single]$pillW, [single]36)), $center)

  $pillFontSm = New-Object System.Drawing.Font -ArgumentList @("Segoe UI", 18, [System.Drawing.FontStyle]::Regular)
  $g.DrawString("Finlo   /   FinloCRM", $pillFontSm, $descBrush,
    (New-Object System.Drawing.RectangleF -ArgumentList @($pillX, [single]($pillY + 48), [single]$pillW, [single]28)), $center)

  Fill-Ramp $g 0 ($h - 8) $w 8 $false
  $g.Dispose()
  $logo.Dispose()

  Save-Png $bmp (Join-Path $outDir "og-image.png")
} else {
  Write-Output "Wordmark not found, skipping og-image.png: $Wordmark"
}

Write-Output "Done."
