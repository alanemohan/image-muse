import { useState } from 'react';
import { Edit2, Save, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageMetadata } from '@/types/gallery';
import { cn } from '@/lib/utils';

interface MetadataEditorProps {
  metadata: ImageMetadata;
  onUpdate?: (metadata: ImageMetadata) => void;
  confidence?: number;
}

export const MetadataEditor = ({
  metadata,
  onUpdate,
  confidence = 85
}: MetadataEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(metadata);

  const handleSave = () => {
    onUpdate?.(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(metadata);
    setIsEditing(false);
  };

  const handleReset = () => {
    setEditData(metadata);
  };

  // Confidence color based on value
  const getConfidenceColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-4">
      {/* Header with Confidence */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Metadata</h3>
        <div className="flex items-center gap-2">
          <div className="confidence-bar w-20">
            <div
              className="confidence-fill"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className={cn('text-xs font-bold', getConfidenceColor(confidence))}>
            {confidence}%
          </span>
        </div>
      </div>

      {!isEditing ? (
        <>
          {/* Display Mode */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {metadata.width && metadata.height && (
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Dimensions</p>
                <p className="font-semibold text-foreground">
                  {metadata.width} × {metadata.height}
                </p>
              </div>
            )}

            {metadata.fileSize && (
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">File Size</p>
                <p className="font-semibold text-foreground">{metadata.fileSize}</p>
              </div>
            )}

            {metadata.iso && (
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">ISO</p>
                <p className="font-semibold text-foreground">{metadata.iso}</p>
              </div>
            )}

            {metadata.fNumber && (
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Aperture</p>
                <p className="font-semibold text-foreground">{metadata.fNumber}</p>
              </div>
            )}

            {metadata.focalLength && (
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Focal Length</p>
                <p className="font-semibold text-foreground">{metadata.focalLength}</p>
              </div>
            )}

            {metadata.exposureTime && (
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Shutter Speed</p>
                <p className="font-semibold text-foreground">{metadata.exposureTime}</p>
              </div>
            )}

            {metadata.dateTime && (
              <div className="glass-card rounded-lg p-3 col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Date Taken</p>
                <p className="font-semibold text-foreground">{metadata.dateTime}</p>
              </div>
            )}

            {metadata.make && (
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Camera Make</p>
                <p className="font-semibold text-foreground">{metadata.make}</p>
              </div>
            )}

            {metadata.model && (
              <div className="glass-card rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Camera Model</p>
                <p className="font-semibold text-foreground">{metadata.model}</p>
              </div>
            )}
          </div>

          {/* Edit Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="w-full gap-2 glass-button"
          >
            <Edit2 className="w-4 h-4" />
            Edit Metadata
          </Button>
        </>
      ) : (
        <>
          {/* Edit Mode */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Width (px)
              </label>
              <Input
                type="number"
                value={editData.width || ''}
                onChange={(e) =>
                  setEditData({ ...editData, width: parseInt(e.target.value) || 0 })
                }
                placeholder="Width in pixels"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Height (px)
              </label>
              <Input
                type="number"
                value={editData.height || ''}
                onChange={(e) =>
                  setEditData({ ...editData, height: parseInt(e.target.value) || 0 })
                }
                placeholder="Height in pixels"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Camera Make
              </label>
              <Input
                value={editData.make || ''}
                onChange={(e) => setEditData({ ...editData, make: e.target.value })}
                placeholder="e.g., Canon, Nikon, Sony"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Camera Model
              </label>
              <Input
                value={editData.model || ''}
                onChange={(e) => setEditData({ ...editData, model: e.target.value })}
                placeholder="e.g., EOS R5"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Focal Length
              </label>
              <Input
                value={editData.focalLength || ''}
                onChange={(e) => setEditData({ ...editData, focalLength: e.target.value })}
                placeholder="e.g., 50mm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Aperture
              </label>
              <Input
                value={editData.fNumber || ''}
                onChange={(e) => setEditData({ ...editData, fNumber: e.target.value })}
                placeholder="e.g., f/2.8"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                ISO
              </label>
              <Input
                type="number"
                value={editData.iso || ''}
                onChange={(e) => setEditData({ ...editData, iso: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              className="flex-1 gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="glass-button"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              title="Reset to original"
              className="glass-button"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
