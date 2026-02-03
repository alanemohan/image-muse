import { useCallback } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GalleryImage } from '@/types/gallery';
import { toast } from '@/hooks/use-toast';
import { useSettings } from '@/context/SettingsContext';

interface WatermarkDownloadProps {
  image: GalleryImage;
}

export const WatermarkDownload = ({ image }: WatermarkDownloadProps) => {
  const { settings } = useSettings();

  const downloadWithWatermark = useCallback(async () => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = image.url;
      });

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Configure watermark style
      const padding = 30;
      const maxWidth = canvas.width - (padding * 2);
      
      // Calculate font size based on image dimensions
      const baseFontSize = Math.max(16, Math.min(canvas.width / 30, 48));
      
      // Draw semi-transparent gradient overlay at bottom
      const gradientHeight = Math.min(200, canvas.height * 0.25);
      const gradient = ctx.createLinearGradient(0, canvas.height - gradientHeight, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - gradientHeight, canvas.width, gradientHeight);

      // Draw title
      ctx.font = `bold ${baseFontSize * 1.2}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      
      let yPosition = canvas.height - padding;
      
      // Draw caption (at bottom)
      if (image.caption) {
        ctx.font = `${baseFontSize * 0.8}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const captionLines = wrapText(ctx, image.caption, maxWidth);
        for (let i = captionLines.length - 1; i >= 0; i--) {
          ctx.fillText(captionLines[i], padding, yPosition);
          yPosition -= baseFontSize;
        }
        yPosition -= 10;
      }

      // Draw title (above caption)
      if (image.title) {
        ctx.font = `bold ${baseFontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = 'white';
        const titleLines = wrapText(ctx, image.title, maxWidth);
        for (let i = titleLines.length - 1; i >= 0; i--) {
          ctx.fillText(titleLines[i], padding, yPosition);
          yPosition -= baseFontSize * 1.3;
        }
      }

      // Draw custom watermark text (bottom-right)
      if (settings.watermarkText) {
        ctx.font = `${baseFontSize * 0.7}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(settings.watermarkText, canvas.width - padding, canvas.height - padding);
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image blob');
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${image.title || 'image'}-watermarked.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download complete",
          description: "Image with watermark has been downloaded",
        });
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Failed to create watermarked image:', error);
      toast({
        title: "Download failed",
        description: "Could not create watermarked image",
        variant: "destructive",
      });
    }
  }, [image, settings.watermarkText]);

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={downloadWithWatermark}
      className="gradient-glass border border-border/50 text-foreground h-8"
    >
      <Download className="w-3.5 h-3.5 mr-1.5" />
      Download
    </Button>
  );
};

// Helper function to wrap text
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}
