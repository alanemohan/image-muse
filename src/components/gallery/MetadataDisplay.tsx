import { ImageMetadata } from '@/types/gallery';
import { 
  Camera, 
  Calendar, 
  Aperture, 
  Zap, 
  Focus, 
  MapPin,
  Image as ImageIcon,
  FileType
} from 'lucide-react';

interface MetadataDisplayProps {
  metadata: ImageMetadata;
}

export const MetadataDisplay = ({ metadata }: MetadataDisplayProps) => {
  const items = [
    { 
      icon: ImageIcon, 
      label: 'Dimensions', 
      value: metadata.width && metadata.height 
        ? `${metadata.width} × ${metadata.height}` 
        : null 
    },
    { 
      icon: FileType, 
      label: 'Size', 
      value: metadata.fileSize 
    },
    { 
      icon: Camera, 
      label: 'Camera', 
      value: metadata.make && metadata.model 
        ? `${metadata.make} ${metadata.model}` 
        : metadata.model || metadata.make 
    },
    { 
      icon: Calendar, 
      label: 'Date', 
      value: metadata.dateTime 
    },
    { 
      icon: Focus, 
      label: 'Focal Length', 
      value: metadata.focalLength 
    },
    { 
      icon: Aperture, 
      label: 'Aperture', 
      value: metadata.fNumber 
    },
    { 
      icon: Zap, 
      label: 'ISO', 
      value: metadata.iso?.toString() 
    },
    { 
      icon: MapPin, 
      label: 'GPS', 
      value: metadata.gpsLatitude && metadata.gpsLongitude 
        ? `${metadata.gpsLatitude.toFixed(4)}, ${metadata.gpsLongitude.toFixed(4)}` 
        : null 
    },
  ].filter(item => item.value);

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No metadata available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map(({ icon: Icon, label, value }) => (
        <div 
          key={label}
          className="flex items-center gap-2 text-xs"
        >
          <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground truncate" title={`${label}: ${value}`}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
};
