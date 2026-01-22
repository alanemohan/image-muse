import { useCallback } from 'react';
import exifr from 'exifr';
import { ImageMetadata } from '@/types/gallery';

export const useImageMetadata = () => {
  const extractMetadata = useCallback(async (file: File): Promise<ImageMetadata> => {
    const metadata: ImageMetadata = {
      fileSize: formatFileSize(file.size),
      fileType: file.type,
    };

    try {
      // Get image dimensions
      const dimensions = await getImageDimensions(file);
      metadata.width = dimensions.width;
      metadata.height = dimensions.height;

      // Extract EXIF data
      const exifData = await exifr.parse(file, {
        pick: [
          'Make', 'Model', 'DateTimeOriginal', 'ExposureTime',
          'FNumber', 'ISO', 'FocalLength', 'GPSLatitude',
          'GPSLongitude', 'Orientation', 'ColorSpace'
        ]
      });

      if (exifData) {
        metadata.make = exifData.Make;
        metadata.model = exifData.Model;
        metadata.dateTime = exifData.DateTimeOriginal
          ? new Date(exifData.DateTimeOriginal).toLocaleDateString()
          : undefined;
        metadata.exposureTime = exifData.ExposureTime
          ? `1/${Math.round(1 / exifData.ExposureTime)}s`
          : undefined;
        metadata.fNumber = exifData.FNumber ? `f/${exifData.FNumber}` : undefined;
        metadata.iso = exifData.ISO;
        metadata.focalLength = exifData.FocalLength
          ? `${Math.round(exifData.FocalLength)}mm`
          : undefined;
        metadata.gpsLatitude = exifData.GPSLatitude;
        metadata.gpsLongitude = exifData.GPSLongitude;
        metadata.orientation = exifData.Orientation;
        metadata.colorSpace = exifData.ColorSpace === 1 ? 'sRGB' : exifData.ColorSpace?.toString();
      }
    } catch (error) {
      console.log('Could not extract EXIF data:', error);
    }

    return metadata;
  }, []);

  return { extractMetadata };
};

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
