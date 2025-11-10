import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface ImageUploadProps {
  onUploadComplete: (attachment: {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    storage_path: string;
    alt_text?: string;
    caption?: string;
  }) => void;
  onError: (error: string) => void;
  taskId?: string;
  scratchpadNoteId?: string;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  onError,
  taskId,
  scratchpadNoteId,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  className = "",
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`;
      }

      if (!acceptedTypes.includes(file.type)) {
        return `File type ${file.type} is not supported. Please use JPG, PNG, GIF, or WebP.`;
      }

      return null;
    },
    [maxFileSize, acceptedTypes],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const validation = validateFile(file);
      if (validation) {
        onError(validation);
        return;
      }

      if (!taskId && !scratchpadNoteId) {
        onError("Either taskId or scratchpadNoteId must be provided");
        return;
      }

      if (taskId && scratchpadNoteId) {
        onError("Cannot attach to both task and scratchpad note");
        return;
      }

      setUploading(true);

      try {
        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `attachments/${fileName}`;

        // Upload to Supabase Storage
        const { error: storageError } = await supabase.storage
          .from("attachments")
          .upload(filePath, file);

        if (storageError) {
          throw new Error(`Storage upload failed: ${storageError.message}`);
        }

        // Create attachment record in database
        const { data: attachment, error: dbError } = await supabase
          .from("attachments")
          .insert({
            task_id: taskId || null,
            scratchpad_note_id: scratchpadNoteId || null,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_path: filePath,
          })
          .select()
          .single();

        if (dbError) {
          // Clean up the uploaded file if database insert fails
          await supabase.storage.from("attachments").remove([filePath]);
          throw new Error(`Database error: ${dbError.message}`);
        }

        onUploadComplete(attachment);
      } catch (error) {
        console.error("Upload failed:", error);
        onError(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [
      taskId,
      scratchpadNoteId,
      maxFileSize,
      acceptedTypes,
      onUploadComplete,
      onError,
      validateFile,
    ],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    // Reset input value to allow same file to be selected again
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      // Only handle paste if the upload area is focused or if we're not in an input field
      const activeElement = document.activeElement;
      const isInputField =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      // If we're in an input field, don't intercept the paste
      if (isInputField) {
        return;
      }

      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      const items = Array.from(clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));

      if (imageItem) {
        e.preventDefault(); // Prevent default paste behavior for images

        const file = imageItem.getAsFile();
        if (file) {
          // Create a proper File object with a meaningful name
          const timestamp = new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/[:-]/g, "");
          const extension = file.type.split("/")[1] || "png";
          const fileName = `pasted-image-${timestamp}.${extension}`;

          const renamedFile = new File([file], fileName, {
            type: file.type,
            lastModified: Date.now(),
          });

          uploadFile(renamedFile);
        }
      }
    },
    [uploadFile],
  );

  // Set up paste event listener
  useEffect(() => {
    const handlePasteEvent = (e: ClipboardEvent) => handlePaste(e);

    // Add event listener to document to catch paste events globally
    document.addEventListener("paste", handlePasteEvent);

    return () => {
      document.removeEventListener("paste", handlePasteEvent);
    };
  }, [handlePaste]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        ref={uploadAreaRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all
          ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-foreground-dim/30 hover:border-primary/50 hover:bg-primary/5"
          }
          ${uploading ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <div className="flex flex-col items-center space-y-2">
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-foreground-dim">Uploading...</p>
            </>
          ) : (
            <>
              <div className="p-2 bg-primary/10 rounded-full">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Click to upload, drag & drop, or paste an image
                </p>
                <p className="text-xs text-foreground-dim mt-1">
                  PNG, JPG, GIF, WebP up to{" "}
                  {Math.round(maxFileSize / 1024 / 1024)}MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface AttachmentViewProps {
  attachment: {
    id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    storage_path: string;
    alt_text?: string | null;
    caption?: string | null;
    created_at: string;
  };
  onDelete?: (attachmentId: string) => void;
  onUpdate?: (
    attachmentId: string,
    updates: { alt_text?: string; caption?: string },
  ) => void;
  showControls?: boolean;
  className?: string;
}

export const AttachmentView: React.FC<AttachmentViewProps> = ({
  attachment,
  onDelete,
  onUpdate,
  showControls = false,
  className = "",
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [altText, setAltText] = useState(attachment.alt_text || "");
  const [caption, setCaption] = useState(attachment.caption || "");

  React.useEffect(() => {
    const loadImage = async () => {
      try {
        const { data, error } = await supabase.storage
          .from("attachments")
          .createSignedUrl(attachment.storage_path, 3600); // 1 hour expiry

        if (error) throw error;
        setImageUrl(data.signedUrl);
      } catch (err) {
        console.error("Failed to load image:", err);
        setError("Failed to load image");
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [attachment.storage_path]);

  const handleSaveMetadata = () => {
    if (onUpdate) {
      onUpdate(attachment.id, { alt_text: altText, caption });
    }
    setEditMode(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center p-8 border border-foreground-dim/20 rounded-lg bg-foreground-dim/5 ${className}`}
      >
        <Loader2 className="w-6 h-6 animate-spin text-foreground-dim" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div
        className={`flex items-center justify-center p-8 border border-foreground-dim/20 rounded-lg bg-foreground-dim/5 ${className}`}
      >
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-foreground-dim mx-auto mb-2" />
          <p className="text-sm text-foreground-dim">
            {error || "Failed to load image"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      <div className="border border-foreground-dim/20 rounded-lg overflow-hidden bg-foreground-dim/5">
        <div className="relative">
          <img
            src={imageUrl}
            alt={attachment.alt_text || attachment.file_name}
            className="w-full h-auto max-h-96 object-contain"
          />

          {showControls && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex space-x-1">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="p-1.5 bg-black/70 text-white rounded hover:bg-black/80 transition-colors"
                  title="Edit caption and alt text"
                >
                  <ImageIcon className="w-3 h-3" />
                </button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(attachment.id)}
                    className="p-1.5 bg-red-600/80 text-white rounded hover:bg-red-600 transition-colors"
                    title="Delete attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-foreground-dim">
            <span className="truncate flex-1">{attachment.file_name}</span>
            <span className="ml-2 flex-shrink-0">
              {formatFileSize(attachment.file_size)}
            </span>
          </div>

          {(attachment.caption || editMode) && (
            <div>
              {editMode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Alt text (for accessibility)"
                    className="form-input text-xs"
                  />
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Caption (optional)"
                    rows={2}
                    className="form-textarea text-xs"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveMetadata}
                      className="btn-primary text-xs px-2 py-1"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="btn-secondary text-xs px-2 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                attachment.caption && (
                  <p className="text-xs text-foreground-dim italic">
                    {attachment.caption}
                  </p>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
