import { useState, useEffect, useMemo, useCallback } from "react";
import { Edit2, Save, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageMetadata } from "@/types/gallery";
import { cn } from "@/lib/utils";

interface MetadataEditorProps {
  metadata: ImageMetadata;
  onUpdate?: (metadata: ImageMetadata) => void;
  confidence?: number;
}

export const MetadataEditor = ({
  metadata,
  onUpdate,
  confidence = 85,
}: MetadataEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ImageMetadata>({ ...metadata });

  /* ---------------- Sync when metadata changes ---------------- */
  useEffect(() => {
    if (!isEditing) {
      setEditData({ ...metadata });
    }
  }, [metadata, isEditing]);

  /* ---------------- Change detection ---------------- */
  const hasChanges = useMemo(
    () => JSON.stringify(editData) !== JSON.stringify(metadata),
    [editData, metadata],
  );

  const handleSave = useCallback(() => {
    if (!hasChanges) return;
    onUpdate?.({ ...editData });
    setIsEditing(false);
  }, [editData, hasChanges, onUpdate]);

  const handleCancel = useCallback(() => {
    setEditData({ ...metadata });
    setIsEditing(false);
  }, [metadata]);

  const handleReset = useCallback(() => {
    setEditData({ ...metadata });
  }, [metadata]);

  /* ---------------- Confidence color ---------------- */
  const getConfidenceColor = (value: number) => {
    if (value >= 80) return "text-green-400";
    if (value >= 60) return "text-yellow-400";
    return "text-orange-400";
  };

  /* ---------------- Numeric helper ---------------- */
  const parseOptionalNumber = (value: string) =>
    value.trim() === "" ? undefined : Number(value);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Metadata</h3>
        <div className="flex items-center gap-2">
          <div className="confidence-bar w-20">
            <div className="confidence-fill" style={{ width: `${confidence}%` }} />
          </div>
          <span className={cn("text-xs font-bold", getConfidenceColor(confidence))}>
            {confidence}%
          </span>
        </div>
      </div>

      {/* ================= Display Mode ================= */}
      {!isEditing ? (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {metadata.width && metadata.height && (
              <MetaCard label="Dimensions">
                {metadata.width} × {metadata.height}
              </MetaCard>
            )}

            {metadata.fileSize && <MetaCard label="File Size">{metadata.fileSize}</MetaCard>}
            {metadata.iso && <MetaCard label="ISO">{metadata.iso}</MetaCard>}
            {metadata.fNumber && <MetaCard label="Aperture">{metadata.fNumber}</MetaCard>}
            {metadata.focalLength && (
              <MetaCard label="Focal Length">{metadata.focalLength}</MetaCard>
            )}
            {metadata.exposureTime && (
              <MetaCard label="Shutter Speed">{metadata.exposureTime}</MetaCard>
            )}

            {metadata.dateTime && (
              <MetaCard label="Date Taken" span>
                {metadata.dateTime}
              </MetaCard>
            )}

            {metadata.make && <MetaCard label="Camera Make">{metadata.make}</MetaCard>}
            {metadata.model && <MetaCard label="Camera Model">{metadata.model}</MetaCard>}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="w-full gap-2 glass-button"
          >
            <Edit2 className="h-4 w-4" />
            Edit Metadata
          </Button>
        </>
      ) : (
        <>
          {/* ================= Edit Mode ================= */}
          <div
            className="space-y-3"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
          >
            <EditField
              label="Width (px)"
              type="number"
              value={editData.width ?? ""}
              onChange={(v) =>
                setEditData({ ...editData, width: parseOptionalNumber(v) })
              }
            />

            <EditField
              label="Height (px)"
              type="number"
              value={editData.height ?? ""}
              onChange={(v) =>
                setEditData({ ...editData, height: parseOptionalNumber(v) })
              }
            />

            <EditField
              label="Camera Make"
              value={editData.make ?? ""}
              onChange={(v) => setEditData({ ...editData, make: v || undefined })}
            />

            <EditField
              label="Camera Model"
              value={editData.model ?? ""}
              onChange={(v) => setEditData({ ...editData, model: v || undefined })}
            />

            <EditField
              label="Focal Length"
              value={editData.focalLength ?? ""}
              onChange={(v) =>
                setEditData({ ...editData, focalLength: v || undefined })
              }
            />

            <EditField
              label="Aperture"
              value={editData.fNumber ?? ""}
              onChange={(v) => setEditData({ ...editData, fNumber: v || undefined })}
            />

            <EditField
              label="ISO"
              type="number"
              value={editData.iso ?? ""}
              onChange={(v) =>
                setEditData({ ...editData, iso: parseOptionalNumber(v) })
              }
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1 gap-2 bg-gradient-to-r from-blue-500 to-purple-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Save
            </Button>

            <Button size="sm" variant="outline" onClick={handleCancel} className="glass-button">
              <X className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              title="Reset to original"
              disabled={!hasChanges}
              className="glass-button"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

/* ---------------- Small helpers ---------------- */

const MetaCard = ({
  label,
  children,
  span,
}: {
  label: string;
  children: React.ReactNode;
  span?: boolean;
}) => (
  <div className={cn("glass-card rounded-lg p-3", span && "col-span-2")}>
    <p className="mb-1 text-xs text-muted-foreground">{label}</p>
    <p className="font-semibold text-foreground">{children}</p>
  </div>
);

const EditField = ({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string | number;
  type?: string;
  onChange: (value: string) => void;
}) => (
  <div>
    <label className="mb-1 block text-xs font-semibold text-muted-foreground">
      {label}
    </label>
    <Input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
