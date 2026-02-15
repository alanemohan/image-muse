// --------------------
// Image metadata (EXIF + derived)
// --------------------
export interface ImageMetadata {
  width?: number;
  height?: number;

  make?: string;
  model?: string;
  dateTime?: string; // ISO or EXIF date string

  exposureTime?: string; // e.g. "1/125"
  fNumber?: number; // numeric f-stop (e.g. 2.8)
  iso?: number;
  focalLength?: number; // in mm

  gpsLatitude?: number;
  gpsLongitude?: number;

  orientation?: number;
  colorSpace?: string;

  fileSize?: string; // human-readable (e.g. "2.4 MB")
  fileType?: string; // e.g. "image/jpeg"
}

// --------------------
// Upload vs stored image state
// --------------------
export type ImageSource =
  | { type: "local"; file: File }
  | { type: "remote"; file: null };

// --------------------
// Gallery image
// --------------------
export interface GalleryImage {
  id: string;

  source?: ImageSource;
  file?: File | null;
  url: string;

  name: string;
  title: string;
  description: string;
  caption: string;

  metadata: ImageMetadata;

  createdAt: Date | string;
  tags: string[];

  isAnalyzing?: boolean;
}

// --------------------
// AI analysis result
// --------------------
export interface AIAnalysisResult {
  title: string;
  description: string;
  caption: string;
  tags: string[];
  metadata?: {
    iso?: string;
    fNumber?: string;
    shutterSpeed?: string;
    camera?: string;
    lens?: string;
    dimensions?: string;
    dateTime?: string;
  };
  analysis?: {
    composition?: string;
    sentiment?: string;
  };
}
