# Writes assets\siren.wav: a 1.6 s rising-and-falling wail (650 to 1300 Hz), mono, 16-bit, 16 kHz.
# The app loops it when nobody answers an alert and the person turned "Loud alarm" on. Generated, not downloaded,
# so there is no licence to worry about.
$sr = 16000
$seconds = 1.6
$n = [int]($sr * $seconds)
$out = Join-Path (Split-Path -Parent $PSScriptRoot) 'assets\siren.wav'
$ms = New-Object System.IO.MemoryStream
$w = New-Object System.IO.BinaryWriter($ms)
$dataBytes = $n * 2
$w.Write([Text.Encoding]::ASCII.GetBytes('RIFF')); $w.Write([int](36 + $dataBytes)); $w.Write([Text.Encoding]::ASCII.GetBytes('WAVE'))
$w.Write([Text.Encoding]::ASCII.GetBytes('fmt ')); $w.Write([int]16); $w.Write([int16]1); $w.Write([int16]1)
$w.Write([int]$sr); $w.Write([int]($sr * 2)); $w.Write([int16]2); $w.Write([int16]16)
$w.Write([Text.Encoding]::ASCII.GetBytes('data')); $w.Write([int]$dataBytes)
$phase = 0.0
for ($i = 0; $i -lt $n; $i++) {
  $t = $i / $sr
  $f = 975 + 325 * [Math]::Sin(2 * [Math]::PI * $t / $seconds - [Math]::PI / 2) # starts at 650, peaks at 1300 mid-way
  $phase += 2 * [Math]::PI * $f / $sr
  $w.Write([int16]([Math]::Sin($phase) * 0.85 * 32767))
}
$w.Flush()
[IO.File]::WriteAllBytes($out, $ms.ToArray())
"{0}: {1} KB" -f $out, [math]::Round($ms.Length / 1KB)