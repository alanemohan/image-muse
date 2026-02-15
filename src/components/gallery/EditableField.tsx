import { useState, useCallback, useRef, useEffect } from "react";
import { Check, X, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  label: string;
  multiline?: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export const EditableField = ({
  value,
  onSave,
  label,
  multiline = false,
  onRegenerate,
  isRegenerating = false,
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  /* Sync external value */
  useEffect(() => {
    if (!isEditing) {
      setEditedValue(value);
    }
  }, [value, isEditing]);

  /* Auto focus on edit */
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if ("select" in inputRef.current) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    const next = editedValue.trim();

    // No-op if unchanged
    if (next === value.trim()) {
      setIsEditing(false);
      return;
    }

    // Prevent accidental empty overwrite
    onSave(next || value);
    setIsEditing(false);
  }, [editedValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditedValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Save on Enter only for single-line inputs
      if (!multiline && e.key === "Enter") {
        e.preventDefault();
        handleSave();
      }

      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    },
    [multiline, handleSave, handleCancel],
  );

  /* ---------------- Editing Mode ---------------- */

  if (isEditing) {
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </label>

        {multiline ? (
          <Textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className="min-h-[80px] resize-none text-sm bg-muted/50 border-primary/20 focus:border-primary"
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className="text-sm bg-muted/50 border-primary/20 focus:border-primary"
          />
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            className="h-7 px-3 gradient-primary text-primary-foreground"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Save
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-7 px-3"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  /* ---------------- Display Mode ---------------- */

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </label>

        <div className="flex gap-1">
          {onRegenerate && (
            <Button
              size="icon"
              variant="ghost"
              className="w-6 h-6"
              onClick={onRegenerate}
              disabled={isRegenerating}
              title="Regenerate with AI"
            >
              <RefreshCw
                className={cn(
                  "w-3 h-3",
                  isRegenerating && "animate-spin",
                )}
              />
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            className="w-6 h-6"
            onClick={() => setIsEditing(true)}
            title={`Edit ${label}`}
          >
            <Pencil className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div
        onClick={() => setIsEditing(true)}
        className={cn(
          "cursor-pointer p-2 -mx-2 rounded-lg",
          "transition-colors hover:bg-muted/50",
        )}
      >
        <p
          className={cn(
            "text-sm leading-relaxed",
            multiline ? "text-foreground" : "font-medium text-foreground",
          )}
        >
          {value || (
            <span className="italic text-muted-foreground">
              Click to add {label.toLowerCase()}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
