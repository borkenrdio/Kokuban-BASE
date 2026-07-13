Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$AssetDir = Join-Path $Root "assets"
$Width = 1200
$Height = 630

function ColorFromHex([string]$hex, [int]$alpha = 255) {
  $value = $hex.TrimStart("#")
  return [System.Drawing.Color]::FromArgb(
    $alpha,
    [Convert]::ToInt32($value.Substring(0, 2), 16),
    [Convert]::ToInt32($value.Substring(2, 2), 16),
    [Convert]::ToInt32($value.Substring(4, 2), 16)
  )
}

function New-Font([float]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
  return New-Object System.Drawing.Font("Meiryo UI", $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function New-PathRoundedRect([System.Drawing.RectangleF]$rect, [float]$radius) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $radius * 2
  $arc = [System.Drawing.RectangleF]::new($rect.X, $rect.Y, $diameter, $diameter)
  $path.AddArc($arc, 180, 90)
  $arc.X = $rect.Right - $diameter
  $path.AddArc($arc, 270, 90)
  $arc.Y = $rect.Bottom - $diameter
  $path.AddArc($arc, 0, 90)
  $arc.X = $rect.X
  $path.AddArc($arc, 90, 90)
  $path.CloseFigure()
  return $path
}

function Fill-RoundedRect($g, [System.Drawing.RectangleF]$rect, [float]$radius, [System.Drawing.Brush]$brush) {
  $path = New-PathRoundedRect $rect $radius
  $g.FillPath($brush, $path)
  $path.Dispose()
}

function Draw-CoverImage($g, [string]$relativePath, [System.Drawing.RectangleF]$dest, [float]$radius = 0, [int]$alpha = 255) {
  $path = Join-Path $AssetDir $relativePath
  if (-not (Test-Path $path)) { return }

  $img = [System.Drawing.Image]::FromFile($path)
  $srcRatio = $img.Width / $img.Height
  $destRatio = $dest.Width / $dest.Height
  if ($srcRatio -gt $destRatio) {
    $srcH = $img.Height
    $srcW = [int]($img.Height * $destRatio)
    $srcX = [int](($img.Width - $srcW) / 2)
    $srcY = 0
  } else {
    $srcW = $img.Width
    $srcH = [int]($img.Width / $destRatio)
    $srcX = 0
    $srcY = [int](($img.Height - $srcH) / 2)
  }

  $state = $g.Save()
  if ($radius -gt 0) {
    $clip = New-PathRoundedRect $dest $radius
    $g.SetClip($clip)
  }

  if ($alpha -lt 255) {
    $matrix = New-Object System.Drawing.Imaging.ColorMatrix
    $matrix.Matrix33 = $alpha / 255
    $attrs = New-Object System.Drawing.Imaging.ImageAttributes
    $attrs.SetColorMatrix($matrix)
    $g.DrawImage(
      $img,
      [System.Drawing.Rectangle]::new([int]$dest.X, [int]$dest.Y, [int]$dest.Width, [int]$dest.Height),
      $srcX,
      $srcY,
      $srcW,
      $srcH,
      [System.Drawing.GraphicsUnit]::Pixel,
      $attrs
    )
    $attrs.Dispose()
  } else {
    $g.DrawImage(
      $img,
      [System.Drawing.RectangleF]::new($dest.X, $dest.Y, $dest.Width, $dest.Height),
      [System.Drawing.RectangleF]::new($srcX, $srcY, $srcW, $srcH),
      [System.Drawing.GraphicsUnit]::Pixel
    )
  }

  $g.Restore($state)
  if ($clip) { $clip.Dispose() }
  $img.Dispose()
}

function Draw-ContainImage($g, [string]$relativePath, [System.Drawing.RectangleF]$box, [int]$alpha = 255) {
  $path = Join-Path $AssetDir $relativePath
  if (-not (Test-Path $path)) { return }

  $img = [System.Drawing.Image]::FromFile($path)
  $ratio = [Math]::Min($box.Width / $img.Width, $box.Height / $img.Height)
  $w = $img.Width * $ratio
  $h = $img.Height * $ratio
  $x = $box.X + (($box.Width - $w) / 2)
  $y = $box.Y + (($box.Height - $h) / 2)
  $dest = [System.Drawing.Rectangle]::new([int]$x, [int]$y, [int]$w, [int]$h)

  if ($alpha -lt 255) {
    $matrix = New-Object System.Drawing.Imaging.ColorMatrix
    $matrix.Matrix33 = $alpha / 255
    $attrs = New-Object System.Drawing.Imaging.ImageAttributes
    $attrs.SetColorMatrix($matrix)
    $g.DrawImage($img, $dest, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
    $attrs.Dispose()
  } else {
    $g.DrawImage($img, $dest)
  }
  $img.Dispose()
}

function Split-Lines($g, [string]$text, [System.Drawing.Font]$font, [float]$maxWidth) {
  $lines = New-Object System.Collections.Generic.List[string]
  foreach ($raw in ($text -split "`n")) {
    $line = ""
    foreach ($char in $raw.ToCharArray()) {
      $candidate = $line + $char
      if ($g.MeasureString($candidate, $font).Width -le $maxWidth -or $line.Length -eq 0) {
        $line = $candidate
      } else {
        $lines.Add($line)
        $line = [string]$char
      }
    }
    if ($line.Length -gt 0) { $lines.Add($line) }
  }
  return $lines
}

function Draw-TextBlock($g, [string]$text, [System.Drawing.Font]$font, [System.Drawing.Brush]$brush, [float]$x, [float]$y, [float]$maxWidth, [int]$maxLines, [float]$lineHeight) {
  $lines = Split-Lines $g $text $font $maxWidth
  $count = [Math]::Min($lines.Count, $maxLines)
  for ($i = 0; $i -lt $count; $i++) {
    $line = $lines[$i]
    if ($i -eq $maxLines - 1 -and $lines.Count -gt $maxLines) {
      while ($g.MeasureString($line + "...", $font).Width -gt $maxWidth -and $line.Length -gt 1) {
        $line = $line.Substring(0, $line.Length - 1)
      }
      $line = $line + "..."
    }
    $g.DrawString($line, $font, $brush, $x, $y + ($i * $lineHeight))
  }
}

function Draw-Base($g, [string]$bg, [string]$accent, [bool]$dark) {
  $rect = [System.Drawing.Rectangle]::new(0, 0, $Width, $Height)
  $bg1 = ColorFromHex $bg
  $bg2 = ColorFromHex $accent
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    $rect,
    $bg1,
    [System.Drawing.Color]::FromArgb(245, $bg2.R, $bg2.G, $bg2.B),
    [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
  )
  $g.FillRectangle($brush, $rect)
  $brush.Dispose()

  $soft = New-Object System.Drawing.SolidBrush (ColorFromHex "#ffffff" $(if ($dark) { 22 } else { 75 }))
  $g.FillEllipse($soft, 760, -150, 560, 560)
  $g.FillEllipse($soft, -160, 430, 520, 320)
  $soft.Dispose()
}

function Draw-Ogp($item) {
  $bmp = New-Object System.Drawing.Bitmap($Width, $Height)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $dark = $item.Mode -eq "dark"
  Draw-Base $g $item.Bg $item.Accent $dark

  if ($item.Layout -eq "photo") {
    Draw-CoverImage $g $item.Image ([System.Drawing.RectangleF]::new(625, 70, 500, 490)) 28 255
    $shade = New-Object System.Drawing.SolidBrush (ColorFromHex "#001a45" 55)
    Fill-RoundedRect $g ([System.Drawing.RectangleF]::new(625, 70, 500, 490)) 28 $shade
    $shade.Dispose()
  } elseif ($item.Layout -eq "product") {
    $panelBrush = New-Object System.Drawing.SolidBrush (ColorFromHex "#ffffff" 226)
    Fill-RoundedRect $g ([System.Drawing.RectangleF]::new(650, 95, 440, 390)) 28 $panelBrush
    $panelBrush.Dispose()
    Draw-ContainImage $g $item.Image ([System.Drawing.RectangleF]::new(665, 105, 410, 360)) 255
  } else {
    Draw-ContainImage $g $item.Image ([System.Drawing.RectangleF]::new(660, 80, 430, 420)) 255
  }

  $brandFont = New-Font 30 ([System.Drawing.FontStyle]::Bold)
  $labelFont = New-Font 28 ([System.Drawing.FontStyle]::Bold)
  $titleFont = New-Font 62 ([System.Drawing.FontStyle]::Bold)
  $subtitleFont = New-Font 31 ([System.Drawing.FontStyle]::Regular)
  $smallFont = New-Font 25 ([System.Drawing.FontStyle]::Bold)

  $white = New-Object System.Drawing.SolidBrush (ColorFromHex "#ffffff")
  $ink = New-Object System.Drawing.SolidBrush (ColorFromHex "#061833")
  $muted = New-Object System.Drawing.SolidBrush (ColorFromHex $(if ($dark) { "#dbe8ff" } else { "#31415f" }))
  $accentBrush = New-Object System.Drawing.SolidBrush (ColorFromHex $item.Accent)
  $labelTextBrush = $(if ($dark) { $white } else { New-Object System.Drawing.SolidBrush (ColorFromHex "#ffffff") })

  $textBrush = $(if ($dark) { $white } else { $ink })
  $tagRect = [System.Drawing.RectangleF]::new(78, 78, 0, 0)
  $tagSize = $g.MeasureString($item.Label, $labelFont)
  $tagRect.Width = $tagSize.Width + 42
  $tagRect.Height = 50
  Fill-RoundedRect $g $tagRect 25 $accentBrush
  $g.DrawString($item.Label, $labelFont, $labelTextBrush, 99, 84)

  $g.DrawString("Kokuban BASE", $brandFont, $(if ($dark) { $white } else { $ink }), 78, 148)
  Draw-TextBlock $g $item.Title $titleFont $textBrush 78 206 548 3 76
  Draw-TextBlock $g $item.Subtitle $subtitleFont $(if ($dark) { $muted } else { $muted }) 82 454 540 2 43

  $barBrush = New-Object System.Drawing.SolidBrush (ColorFromHex $item.Accent 235)
  $g.FillRectangle($barBrush, 0, 606, 1200, 24)
  $barBrush.Dispose()

  if ($item.Footer) {
    $g.DrawString($item.Footer, $smallFont, $(if ($dark) { $white } else { $ink }), 78, 548)
  }

  $out = Join-Path $AssetDir $item.File
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)

  $brandFont.Dispose()
  $labelFont.Dispose()
  $titleFont.Dispose()
  $subtitleFont.Dispose()
  $smallFont.Dispose()
  $white.Dispose()
  $ink.Dispose()
  $muted.Dispose()
  $accentBrush.Dispose()
  if ($labelTextBrush -is [System.IDisposable]) { $labelTextBrush.Dispose() }
  $g.Dispose()
  $bmp.Dispose()
  Write-Host "Generated assets/$($item.File)"
}

$items = @(
  @{ File="ogp-home.png"; Label="総合相談"; Title="電子黒板選びの`n総合相談窓口"; Subtitle="比較・見積もり・リース・実機体験まで、学校と学習塾の導入を支援。"; Image="hero-board.png"; Bg="#0d47a1"; Accent="#00a6ff"; Mode="dark"; Layout="product"; Footer="kokuban-base.com" },
  @{ File="ogp-denshikokuban.png"; Label="入門ガイド"; Title="電子黒板とは？"; Subtitle="仕組み・できること・選び方・価格をわかりやすく解説。"; Image="denshikokuban-hero.jpg"; Bg="#eef5ff"; Accent="#0b5bd3"; Mode="light"; Layout="photo"; Footer="Guide" },
  @{ File="ogp-lineup.png"; Label="比較"; Title="主要5ブランドを`nまとめて比較"; Subtitle="BenQ Board、MIRAI TOUCH、SHARP BIG PAD などを用途別に検討。"; Image="compare-board.png"; Bg="#f5f8ff"; Accent="#174ea6"; Mode="light"; Layout="product"; Footer="Lineup" },
  @{ File="ogp-lease.png"; Label="リース"; Title="月額定額で`n電子黒板を導入"; Subtitle="初期費用を抑えて、1教室から無理なくICT環境を整える。"; Image="lease-benq-board-65.png"; Bg="#eef8f5"; Accent="#009b7a"; Mode="light"; Layout="product"; Footer="Lease" },
  @{ File="ogp-demo-rental.png"; Label="無料レンタル"; Title="デモ機を教室で`nじっくり試す"; Subtitle="導入前に実際の授業環境で操作感・サイズ感を確認できます。"; Image="demo-rental-classroom.png"; Bg="#f1f6ff"; Accent="#1868d8"; Mode="light"; Layout="photo"; Footer="Demo rental" },
  @{ File="ogp-experience.png"; Label="実機体験"; Title="電子黒板を`n実際に触って比較"; Subtitle="京都・関西・首都圏・オンラインデモで導入前の不安を解消。"; Image="support-hands-on-demo.jpg"; Bg="#101f3d"; Accent="#2bb7ff"; Mode="dark"; Layout="photo"; Footer="Hands-on demo" },
  @{ File="ogp-consultation.png"; Label="無料相談"; Title="電子黒板の相談を`nまとめて受付"; Subtitle="メーカー比較、見積もり、体験、購入・リースまで無料で相談。"; Image="contact-consultation.png"; Bg="#f7f9fd"; Accent="#2364d2"; Mode="light"; Layout="product"; Footer="Contact" },
  @{ File="ogp-check.png"; Label="30秒診断"; Title="教室に合う電子黒板を`n無料チェック"; Subtitle="5つの質問でブランド・サイズ・リース目安を整理。"; Image="support-brand-comparison.png"; Bg="#fff7ed"; Accent="#f97316"; Mode="light"; Layout="product"; Footer="Quick check" },
  @{ File="ogp-school.png"; Label="学校向け"; Title="学校の電子黒板導入を`n比較から支援"; Subtitle="全校導入、教室数、設置環境、研修までまとめて相談できます。"; Image="service-support-school.png"; Bg="#edf7ff"; Accent="#0b72d9"; Mode="light"; Layout="photo"; Footer="For schools" },
  @{ File="ogp-juku.png"; Label="学習塾向け"; Title="1教室から始める`n電子黒板導入"; Subtitle="月額定額リースと活用支援で、塾の授業DXを進める。"; Image="elio-classroom-1f.jpg"; Bg="#171b2a"; Accent="#22c55e"; Mode="dark"; Layout="photo"; Footer="For juku" },
  @{ File="ogp-service.png"; Label="できること"; Title="比較・体験・導入後まで`n一気通貫で支援"; Subtitle="電子黒板選びに必要な情報と実機確認をまとめてサポート。"; Image="top-feature-consult.png"; Bg="#f6f8ff"; Accent="#3156d4"; Mode="light"; Layout="product"; Footer="Service" },
  @{ File="ogp-support.png"; Label="ご利用ガイド"; Title="相談から導入・活用まで`n流れがわかる"; Subtitle="初回相談、実機体験、見積もり、設置、研修まで整理。"; Image="service-support-teacher.png"; Bg="#f3f8f7"; Accent="#0f9f8f"; Mode="light"; Layout="photo"; Footer="Support guide" },
  @{ File="ogp-voices.png"; Label="体験談"; Title="先生の声から見る`n電子黒板の活用"; Subtitle="実機体験や授業活用で見えた、導入前に知っておきたいポイント。"; Image="support-info-teachers.jpg"; Bg="#111827"; Accent="#a78bfa"; Mode="dark"; Layout="photo"; Footer="Voices" },
  @{ File="ogp-article.png"; Label="コラム"; Title="電子黒板の選び方と`n教育ICTコラム"; Subtitle="活用事例、ブランド比較、授業アイデアをカテゴリから探せます。"; Image="guide-about-kokuban-base.jpg"; Bg="#f8fafc"; Accent="#2563eb"; Mode="light"; Layout="photo"; Footer="Articles" },
  @{ File="ogp-information.png"; Label="ニュース"; Title="Kokuban BASEの`nお知らせ"; Subtitle="取り扱い製品、サービス更新、導入支援に関する最新情報。"; Image="mirai-touch-p-series.png"; Bg="#f5f9ff"; Accent="#0284c7"; Mode="light"; Layout="product"; Footer="Information" },
  @{ File="ogp-company.png"; Label="運営情報"; Title="Kokuban BASEの`n運営・編集体制"; Subtitle="運営会社、編集部、ポリシー、各種規約をご確認いただけます。"; Image="team-yamada-masaki.jpg"; Bg="#f7f8fb"; Accent="#334155"; Mode="light"; Layout="photo"; Footer="Corporate" },
  @{ File="ogp-benqboard.png"; Label="BenQ Board"; Title="BenQ Boardの`n特徴とスペック"; Subtitle="高性能・管理性・教室配慮を備えた電子黒板を比較検討。"; Image="benq-board-rp6504-stand.png"; Logo="brand-benq.png"; Bg="#f5f7ff"; Accent="#6d5dfc"; Mode="light"; Layout="product"; Footer="Brand lineup" },
  @{ File="ogp-miraitouch.png"; Label="MIRAI TOUCH"; Title="MIRAI TOUCHの`n特徴とスペック"; Subtitle="教育現場で使いやすい電子黒板を、サイズ・機能から確認。"; Image="mirai-touch-p-series.png"; Logo="brand-mirai-touch.png"; Bg="#f1fbff"; Accent="#0891b2"; Mode="light"; Layout="product"; Footer="Brand lineup" },
  @{ File="ogp-promethean.png"; Label="Promethean"; Title="Prometheanの`n特徴とスペック"; Subtitle="授業に合わせた操作性と活用しやすさを比較検討。"; Image="lease-promethean-65.jpg"; Logo="brand-promethean.png"; Bg="#fff7ed"; Accent="#ea580c"; Mode="light"; Layout="product"; Footer="Brand lineup" },
  @{ File="ogp-sharp-bigpad.png"; Label="SHARP BIG PAD"; Title="SHARP BIG PADの`n特徴とスペック"; Subtitle="国内実績のある電子黒板を、機能・サイズ・導入面から確認。"; Image="sharp-sapphire3-65-front.png"; Logo="brand-sharp.png"; Bg="#f8fafc"; Accent="#dc2626"; Mode="light"; Layout="product"; Footer="Brand lineup" },
  @{ File="ogp-starboard.png"; Label="StarBoard"; Title="StarBoardの`n特徴とスペック"; Subtitle="授業や会議で使える電子黒板を、導入条件から比較。"; Image="lease-starboard-65.png"; Logo="brand-starboard.png"; Bg="#f2fbf7"; Accent="#16a34a"; Mode="light"; Layout="product"; Footer="Brand lineup" },
  @{ File="ogp-column-lease-guide.png"; Label="リース解説"; Title="電子黒板リースが`n選ばれる理由"; Subtitle="月額と5年契約の仕組みを、学習塾向けにわかりやすく整理。"; Image="lease-benefits.png"; Bg="#eef8f5"; Accent="#009b7a"; Mode="light"; Layout="product"; Footer="Column" },
  @{ File="ogp-column-install-work.png"; Label="設置・工事"; Title="電子黒板の設置と`n工事の進め方"; Subtitle="スタンド・壁掛けの費用と注意点を導入前に確認。"; Image="service-support-setup.png"; Bg="#f4f7fb"; Accent="#475569"; Mode="light"; Layout="photo"; Footer="Column" },
  @{ File="ogp-column-warranty.png"; Label="延長保証"; Title="電子黒板の延長保証は`n必要？"; Subtitle="導入7年目の塾が、メリットと費用を本音で解説。"; Image="lease-feature-warranty.png"; Bg="#fffaf0"; Accent="#d97706"; Mode="light"; Layout="product"; Footer="Column" },
  @{ File="ogp-column-taiyo-nensu.png"; Label="耐用年数"; Title="電子黒板の耐用年数は`n何年？"; Subtitle="導入して7年目の実体験から、長く使うための視点を公開。"; Image="service-support-training.png"; Bg="#f6f5ff"; Accent="#7c3aed"; Mode="light"; Layout="photo"; Footer="Column" }
)

foreach ($item in $items) {
  Draw-Ogp $item
}
