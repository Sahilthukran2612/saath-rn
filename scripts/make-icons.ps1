# Draws the Saath app icon, adaptive-icon layers, themed (monochrome) icon and splash image into assets\,
# from the same geometry as the in-app SaathMark (src/components/art.js): two arcs held together and a dot.
# Generated with System.Drawing, so there is nothing to download and no licence to worry about.
Add-Type -AssemblyName System.Drawing
$assets = Join-Path (Split-Path -Parent $PSScriptRoot) 'assets'
$indigo = [System.Drawing.ColorTranslator]::FromHtml('#26306B')
$haldi = [System.Drawing.ColorTranslator]::FromHtml('#F2B134')
$white = [System.Drawing.Color]::White

function New-Canvas($size) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::Transparent)
  return @($bmp, $g)
}

# The mark, in a 40-unit box. (cx, cy) is where the unit-box point (20, 22) lands, unit is pixels per unit.
function Draw-Mark($g, $cx, $cy, $unit, $arc1, $arc2, $dot) {
  $r = 8 * $unit
  $centerX = $cx + 0 * $unit
  $centerY = $cy + (24 - 22) * $unit
  $rect = New-Object System.Drawing.RectangleF ([single]($centerX - $r)), ([single]($centerY - $r)), ([single](2 * $r)), ([single](2 * $r))
  foreach ($pair in @(@($arc1, 180, 180), @($arc2, 180, -90))) {
    $pen = New-Object System.Drawing.Pen $pair[0], ([single](3 * $unit))
    $pen.StartCap = 'Round'; $pen.EndCap = 'Round'
    $g.DrawArc($pen, $rect, [single]$pair[1], [single]$pair[2])
    $pen.Dispose()
  }
  $brush = New-Object System.Drawing.SolidBrush $dot
  $dr = 3.2 * $unit
  $g.FillEllipse($brush, [single]($cx - $dr), [single]($cy + (14 - 22) * $unit - $dr), [single](2 * $dr), [single](2 * $dr))
  $brush.Dispose()
}

function Save($bmp, $name) { $bmp.Save((Join-Path $assets $name), [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose() }

# 1. Full icon (1024): indigo square, mark in the middle
$bmp, $g = New-Canvas 1024
$g.Clear($indigo)
Draw-Mark $g 512 512 30 $white $haldi $haldi
$g.Dispose(); Save $bmp 'icon.png'

# 2. Adaptive icon: plain indigo background layer, mark inside the safe zone on a transparent layer
$bmp, $g = New-Canvas 512
$g.Clear($indigo)
$g.Dispose(); Save $bmp 'android-icon-background.png'

$bmp, $g = New-Canvas 512
Draw-Mark $g 256 256 13.5 $white $haldi $haldi
$g.Dispose(); Save $bmp 'android-icon-foreground.png'

# 3. Themed (monochrome) icon: the mark in one colour on transparent
$bmp, $g = New-Canvas 432
$black = [System.Drawing.Color]::Black
Draw-Mark $g 216 216 11.5 $black $black $black
$g.Dispose(); Save $bmp 'android-icon-monochrome.png'

# 4. Splash: the same rounded indigo mark as in the app header, centred on a transparent canvas
$bmp, $g = New-Canvas 1024
$side = 440
$left = (1024 - $side) / 2
$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$rad = $side * 12 / 40
$d = 2 * $rad
$path.AddArc([single]$left, [single]$left, [single]$d, [single]$d, 180, 90)
$path.AddArc([single]($left + $side - $d), [single]$left, [single]$d, [single]$d, 270, 90)
$path.AddArc([single]($left + $side - $d), [single]($left + $side - $d), [single]$d, [single]$d, 0, 90)
$path.AddArc([single]$left, [single]($left + $side - $d), [single]$d, [single]$d, 90, 90)
$path.CloseFigure()
$g.FillPath((New-Object System.Drawing.SolidBrush $indigo), $path)
Draw-Mark $g 512 (512 + 2 * ($side / 40)) ($side / 40) $white $haldi $haldi
$g.Dispose(); Save $bmp 'splash-icon.png'
"icons written to $assets"