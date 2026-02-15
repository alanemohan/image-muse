import { ImageMetadata } from "@/types/gallery";
import {
  Camera,
  Calendar,
  Aperture,
  Zap,
  Focus,
  MapPin,
  Image as ImageIcon,
  FileType,
} from "lucide-react";

interface MetadataDisplayProps {
  metadata: ImageMetadata;
}

export const MetadataDisplay = ({ metadata }: MetadataDisplayProps) => {
  const formatGPS = (lat?: number, lon?: number) => {
    if (lat == null || lon == null) return null;

    const latDir = lat >= 0 ? "N" : "S";
    const lonDir = lon >= 0 ? "E" : "W";

    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(
      4,
    )}° ${lonDir}`;
  };

  const items = [
    {
      key: "dimensions",
      icon: ImageIcon,
      label: "Dimensions",
      value:
        metadata.width && metadata.height
          ? `${metadata.width} × ${metadata.height}`
          : null,
    },
    {
      key: "size",
      icon: FileType,
      label: "File Size",
      value: metadata.fileSize,
    },
    {
      key: "camera",
      icon: Camera,
      label: "Camera",
      value:
        metadata.make && metadata.model
          ? `${metadata.make} ${metadata.model}`
          : metadata.model || metadata.make || null,
    },
    {
      key: "date",
      icon: Calendar,
      label: "Date",
      value: metadata.dateTime,
    },
    {
      key: "focal",
      icon: Focus,
      label: "Focal Length",
      value: metadata.focalLength,
    },
    {
      key: "aperture",
      icon: Aperture,
      label: "Aperture",
      value: metadata.fNumber,
    },
    {
      key: "iso",
      icon: Zap,
      label: "ISO",
      value:
        metadata.iso !== undefined && metadata.iso !== null
          ? metadata.iso.toString()
          : null,
    },
    {
      key: "gps",
      icon: MapPin,
      label: "Location",
      value: formatGPS(metadata.gpsLatitude, metadata.gpsLongitude),
    },
  ].filter(
    (item) =>
      item.value !== null &&
      item.value !== undefined &&
      item.value !== "",
  );

  if (items.length === 0) {
    return (
      <div className="text-sm italic text-muted-foreground">
        No metadata available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ key, icon: Icon, label, value }) => (
        <div
          key={key}
          className="flex items-center gap-2 text-xs"
          title={`${label}: ${value}`}
        >
          <Icon
            className="h-3.5 w-3.5 shrink-0 text-primary"
            aria-hidden
          />
          <span className="truncate text-muted-foreground">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
};
