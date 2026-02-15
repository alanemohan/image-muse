import { useCallback } from "react";
import exifr from "exifr";
import { ImageMetadata } from "@/types/gallery";

export const useImageMetadata = () => {
  const extractMetadata = useCallback(
    async (file: File): Promise<ImageMetadata> => {
      const metadata: ImageMetadata = {
        fileSize: formatFileSize(file.size),
        fileType: file.type,
      };

      try {
        // Image dimensions
        const { width, height } = await getImageDimensions(file);
        metadata.width = width;
        metadata.height = height;

        // EXIF data
        const exifData = await exifr.parse(file, {
          pick: [
            "Make",
            "Model",
            "DateTimeOriginal",
            "ExposureTime",
            "FNumber",
            "ISO",
            "FocalLength",
            "GPSLatitude",
            "GPSLongitude",
            "Orientation",
            "ColorSpace",
          ],
        });

        if (!exifData) return metadata;

        metadata.make = safeString(exifData.Make);
        metadata.model = safeString(exifData.Model);

        if (exifData.DateTimeOriginal) {
          metadata.dateTime = new Date(
            exifData.DateTimeOriginal
          ).toLocaleString();
        }

        metadata.exposureTime = formatExposureTime(
          exifData.ExposureTime
        );

        metadata.fNumber =
          typeof exifData.FNumber === "number"
            ? `f/${exifData.FNumber}`
            : undefined;

        metadata.iso =
          typeof exifData.ISO === "number"
            ? exifData.ISO
            : undefined;

        metadata.focalLength =
          typeof exifData.FocalLength === "number"
            ? `${Math.round(exifData.FocalLength)}mm`
            : undefined;

        metadata.gpsLatitude = parseGps(exifData.GPSLatitude);
        metadata.gpsLongitude = parseGps(exifData.GPSLongitude);

        metadata.orientation = exifData.Orientation;
        metadata.colorSpace =
          exifData.ColorSpace === 1
            ? "sRGB"
            : exifData.ColorSpace?.toString();
      } catch {
        // Silently ignore — many images have no EXIF data
      }

      return metadata;
    },
    []
  );

  return { extractMetadata };
};

/* ----------------------------- */
/* Helpers                       */
/* ----------------------------- */

const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
};

const formatFileSize = (bytes: number): string => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const formatExposureTime = (
  exposure?: number
): string | undefined => {
  if (typeof exposure !== "number") return undefined;

  if (exposure >= 1) {
    return `${exposure}s`;
  }

  const reciprocal = Math.round(1 / exposure);
  return `1/${reciprocal}s`;
};

const parseGps = (
  value?: number | number[]
): number | undefined => {
  if (typeof value === "number") return value;

  if (Array.isArray(value) && value.length === 3) {
    const [deg, min, sec] = value;
    return deg + min / 60 + sec / 3600;
  }

  return undefined;
};

const safeString = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
};
