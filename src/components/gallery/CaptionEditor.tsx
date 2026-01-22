import { useState, useCallback, useRef, useEffect } from 'react';
import { Check, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface CaptionEditorProps {
  caption: string;
  onSave: (caption: string) => void;
}

export const CaptionEditor = ({ caption, onSave }: CaptionEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCaption, setEditedCaption] = useState(caption);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    onSave(editedCaption.trim() || caption);
    setIsEditing(false);
  }, [editedCaption, caption, onSave]);

  const handleCancel = useCallback(() => {
    setEditedCaption(caption);
    setIsEditing(false);
  }, [caption]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  if (isEditing) {
    return (
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={editedCaption}
          onChange={(e) => setEditedCaption(e.target.value)}
          onKeyDown={handleKeyDown}
          className="resize-none text-sm min-h-[60px] bg-muted/50 border-primary/20 focus:border-primary"
          placeholder="Enter a caption..."
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            className="gradient-primary text-primary-foreground h-7 px-3"
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

  return (
    <div 
      className={cn(
        "group flex items-start gap-2 cursor-pointer p-2 -m-2 rounded-lg",
        "transition-colors hover:bg-muted/50"
      )}
      onClick={() => setIsEditing(true)}
    >
      <p className="text-sm text-foreground leading-relaxed flex-1">
        {caption}
      </p>
      <Button
        size="icon"
        variant="ghost"
        className="w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        <Pencil className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};
