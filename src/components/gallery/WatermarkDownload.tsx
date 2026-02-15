import { useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryImage } from "@/types/gallery";
import { toast } from "@/hooks/use-toast";

interface WatermarkDownloadProps {
  image: GalleryImage;
}

export const WatermarkDownload = ({ image }: WatermarkDownloadProps) => {
  const downloadWithWatermark = useCallback(async () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Image failed to load"));
        img.src = image.url;
      });

      /* ---------------------- Retina-safe canvas ---------------------- */
      const dpr = window.devicePixelRatio || 1;
      canvas.width = img.width * dpr;
      canvas.height = img.height * dpr;
      canvas.style.width = `${img.width}px`;
      canvas.style.height = `${img.height}px`;
      ctx.scale(dpr, dpr);

      ctx.drawImage(img, 0, 0);

      /* ---------------------- Watermark styling ---------------------- */
      const padding = 30;
      const maxWidth = img.width - padding * 2;
      const baseFontSize = Math.max(16, Math.min(img.width / 30, 48));

      /* ---------------- Gradient overlay ---------------- */
      const gradientHeight = Math.min(200, img.height * 0.25);
      const gradient = ctx.createLinearGradient(
        0,
        img.height - gradientHeight,
        0,
        img.height,
      );
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, img.height - gradientHeight, img.width, gradientHeight);

      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";

      let y = img.height - padding;

      /* ---------------- Caption ---------------- */
      if (image.caption) {
        ctx.font = `${baseFontSize * 0.8}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        const captionLines = wrapText(ctx, image.caption, maxWidth);

        for (let i = captionLines.length - 1; i >= 0 && y > padding; i--) {
          ctx.fillText(captionLines[i], padding, y);
          y -= baseFontSize;
        }

        y -= 10;
      }

      /* ---------------- Title ---------------- */
      if (image.title && y > padding) {
        ctx.font = `bold ${baseFontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = "#fff";
        const titleLines = wrapText(ctx, image.title, maxWidth);

        for (let i = titleLines.length - 1; i >= 0 && y > padding; i--) {
          ctx.fillText(titleLines[i], padding, y);
          y -= baseFontSize * 1.3;
        }
      }

      /* ---------------- Download ---------------- */
      await new Promise<void>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to generate image"));
              return;
            }

            const safeName = sanitizeFilename(
              image.title || image.name || "image",
            );

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${safeName}-watermarked.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            resolve();
          },
          "image/jpeg",
          0.95,
        );
      });

      toast({
        title: "Download complete",
        description: "Image with watermark has been downloaded",
      });
    } catch (error) {
      console.error("Watermark failed:", error);

      toast({
        title: "Download failed",
        description:
          "Could not create watermarked image. The image source may not allow downloads.",
        variant: "destructive",
      });
    }
  }, [image]);

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={downloadWithWatermark}
      className="gradient-glass h-8 border border-border/50 text-foreground"
    >
      <Download className="mr-1.5 h-3.5 w-3.5" />
      Download
    </Button>
  );
};

/* ---------------- Helpers ---------------- */

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function sanitizeFilename(name: string): string {
  const withoutIllegalChars = Array.from(name)
    .filter((char) => {
      const code = char.charCodeAt(0);
      if (code >= 0 && code <= 31) return false;
      return !/[<>:"/\\|?*]/.test(char);
    })
    .join("");

  return withoutIllegalChars
    .replace(/\s+/g, "-")
    .slice(0, 60)
    .toLowerCase();
}
