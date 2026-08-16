import { useState, useRef } from "react";
import { Check, CloudUpload, Image as ImageIcon, LoaderCircle, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImageFree } from "@/lib/freeStorage";

interface ImgBBDropzoneProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  aspectRatio?: string;
}

export function ImgBBDropzone({
  value,
  onChange,
  label = "Upload Image (Free ImgBB CDN)",
  hint = "Drag & drop PNG, JPG or WebP up to 10MB",
  aspectRatio = "16/9",
}: ImgBBDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP).");
      return;
    }
    setUploading(true);
    try {
      const res = await uploadImageFree(file);
      onChange(res.url);
      toast.success(`Image uploaded successfully (${res.sizeKb} KB)!`);
    } catch {
      toast.error("Upload failed. Please try another image.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="imgbb-uploader-wrap">
      {label && <label className="uploader-label">{label}</label>}

      {value ? (
        <div className="uploader-preview" style={{ aspectRatio }}>
          <img src={value} alt="Uploaded preview" />
          <div className="preview-overlay">
            <button
              type="button"
              className="change-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudUpload size={15} /> Change Image
            </button>
            <button
              type="button"
              className="remove-btn"
              onClick={() => onChange("")}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`uploader-dropzone ${dragOver ? "drag-over" : ""} ${uploading ? "loading" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{ aspectRatio }}
        >
          {uploading ? (
            <div className="uploader-status">
              <LoaderCircle size={28} className="animate-spin" />
              <span>Optimizing WebP & Uploading to ImgBB…</span>
            </div>
          ) : (
            <div className="uploader-status">
              <div className="icon-circle">
                <UploadCloud size={24} />
              </div>
              <strong>Click to upload or drag & drop</strong>
              <small>{hint}</small>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        hidden
      />

      <style>{`
        .imgbb-uploader-wrap {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }
        .uploader-label {
          font-size: 13px;
          font-weight: 700;
          color: #222;
        }
        .uploader-dropzone {
          border: 2px dashed rgba(0,0,0,0.15);
          border-radius: 14px;
          background: #faf8f5;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          padding: 20px;
          text-align: center;
        }
        .uploader-dropzone:hover, .uploader-dropzone.drag-over {
          border-color: var(--color-brand, #f06a3a);
          background: #fff6f2;
        }
        .uploader-status {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #444;
        }
        .icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: white;
          border: 1px solid rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-brand, #f06a3a);
        }
        .uploader-status strong {
          font-size: 14px;
        }
        .uploader-status small {
          font-size: 12px;
          color: #777;
        }
        .uploader-preview {
          position: relative;
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          background: #111;
        }
        .uploader-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .preview-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .uploader-preview:hover .preview-overlay {
          opacity: 1;
        }
        .change-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: white;
          color: #111;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .remove-btn {
          padding: 8px;
          background: #e02424;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
