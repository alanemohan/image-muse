export interface ImageMetadata {
  width?: number;
  height?: number;
  make?: string;
  model?: string;
  dateTime?: string;
  exposureTime?: string;
  fNumber?: string;
  iso?: number;
  focalLength?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  orientation?: number;
  colorSpace?: string;
  fileSize?: string;
  fileType?: string;
}

export interface GalleryImage {
  id: string;
  file: File | null;
  url: string;
  name: string;
  title: string;
  description: string;
  caption: string;
  metadata: ImageMetadata;
  createdAt: Date;
  tags: string[];
  isAnalyzing?: boolean;
  isPersisted?: boolean;
}

export interface AIAnalysisResult {
  title?: string;
  description?: string;
  caption?: string;
  tags?: string[];
  metadata?: {
    iso?: string | number;
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
