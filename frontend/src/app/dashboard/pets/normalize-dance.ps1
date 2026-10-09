param(
  [Parameter(Mandatory=$true)][string]$Source,
  [Parameter(Mandatory=$true)][string]$Destination,
  [int]$TargetHeight = 90
)

$ErrorActionPreference = 'Stop'
# Asset preparation only. No image processing runs on the Pi.
Add-Type -AssemblyName System.Drawing
if (-not ('DanceAtlas' -as [type])) {
  Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class DanceAtlas {
  public static int Normalize(string source, string destination, int targetHeight) {
    using (var image = new Bitmap(source)) {
      var bands = new List<Rectangle>();
      int start = -1, last = -1;
      for (int y = 0; y <= image.Height; y++) {
        int count = 0;
        if (y < image.Height)
          for (int x = 0; x < image.Width; x += 3)
            if (image.GetPixel(x, y).A >= 192) count++;
        if (count >= 12) {
          if (start < 0) start = y;
          last = y;
        } else if (start >= 0 && (y - last > 10 || y == image.Height)) {
          if (last - start > 40) bands.Add(new Rectangle(0, start, image.Width, last - start + 1));
          start = -1;
        }
      }
      if (bands.Count < 6 || bands.Count > 8)
        throw new Exception("Expected 6-8 rows of dance poses, found " + bands.Count);

      var frames = new List<Bitmap>();
      try {
        foreach (var band in bands) {
          for (int column = 0; column < 4; column++) {
            int x0 = column * image.Width / 4;
            int x1 = (column + 1) * image.Width / 4;
            int width = x1 - x0, height = band.Height;
            var visited = new bool[width * height];
            var biggest = new List<int>();
            for (int i = 0; i < visited.Length; i++) {
              if (visited[i] || image.GetPixel(x0 + i % width, band.Y + i / width).A < 32) continue;
              var component = new List<int>();
              var queue = new Queue<int>();
              visited[i] = true;
              queue.Enqueue(i);
              while (queue.Count > 0) {
                int pixel = queue.Dequeue();
                component.Add(pixel);
                int px = pixel % width, py = pixel / width;
                for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
                  int nx = px + dx, ny = py + dy;
                  if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                  int next = ny * width + nx;
                  if (visited[next]) continue;
                  visited[next] = true;
                  if (image.GetPixel(x0 + nx, band.Y + ny).A >= 32) queue.Enqueue(next);
                }
              }
              if (component.Count > biggest.Count) biggest = component;
            }
            if (biggest.Count < 500) throw new Exception("Empty dance pose");
            int left = width, right = 0, top = height, bottom = 0;
            foreach (int pixel in biggest) {
              int x = pixel % width, y = pixel / width;
              left = Math.Min(left, x); right = Math.Max(right, x);
              top = Math.Min(top, y); bottom = Math.Max(bottom, y);
            }
            int cropWidth = right - left + 1, cropHeight = bottom - top + 1;
            using (var crop = new Bitmap(cropWidth, cropHeight, PixelFormat.Format32bppArgb)) {
              double feetX = 0;
              int feetPixels = 0;
              foreach (int pixel in biggest) {
                int x = pixel % width, y = pixel / width;
                var color = image.GetPixel(x0 + x, band.Y + y);
                crop.SetPixel(x - left, y - top, color);
                if (y >= bottom - cropHeight * .12 && color.A >= 192) {
                  feetX += x - left; feetPixels++;
                }
              }
              double anchor = feetPixels > 0 ? feetX / feetPixels : cropWidth / 2.0;
              double scale = (double)targetHeight / cropHeight;
              int targetWidth = (int)Math.Round(cropWidth * scale);
              int targetLeft = 64 - (int)Math.Round(anchor * scale);
              if (targetLeft < 4 || targetLeft + targetWidth > 124)
                throw new Exception("Pose is too wide for a stable foot anchor");
              var frame = new Bitmap(128, 128, PixelFormat.Format32bppArgb);
              using (var graphics = Graphics.FromImage(frame)) {
                graphics.InterpolationMode = InterpolationMode.NearestNeighbor;
                graphics.PixelOffsetMode = PixelOffsetMode.Half;
                graphics.DrawImage(crop, new Rectangle(targetLeft, 116 - targetHeight, targetWidth, targetHeight),
                  new Rectangle(0, 0, cropWidth, cropHeight), GraphicsUnit.Pixel);
              }
              frames.Add(frame);
            }
          }
        }
        // Evenly spaced holds retain pose order when the generator supplies fewer than 32 poses.
        using (var atlas = new Bitmap(512, 1024, PixelFormat.Format32bppArgb))
        using (var graphics = Graphics.FromImage(atlas)) {
          graphics.CompositingMode = CompositingMode.SourceCopy;
          for (int i = 0; i < 32; i++)
            graphics.DrawImageUnscaled(frames[i * frames.Count / 32], (i % 4) * 128, (i / 4) * 128);
          atlas.Save(destination, ImageFormat.Png);
        }
        return frames.Count;
      } finally { foreach (var frame in frames) frame.Dispose(); }
    }
  }
}
'@
}
$sourceFrames = [DanceAtlas]::Normalize((Resolve-Path -LiteralPath $Source).Path, [IO.Path]::GetFullPath($Destination), $TargetHeight)
Write-Output "$Destination : $sourceFrames generated poses, 32 normalized frames"
