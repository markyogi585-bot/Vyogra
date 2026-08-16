import { FileUp, ImagePlus, LoaderCircle, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpcClient";

type MediaFolder = "packages" | "users" | "tickets" | "announcements" | "trip_updates";
export type UploadedMedia = { id: number; storageKey: string; url: string; fileName: string; mimeType: string };

export function MediaUploadBox({ label = "Add trip media", accept = "image/jpeg,image/png,image/webp,application/pdf", folder = "trip_updates", onUploaded }: { label?: string; accept?: string; folder?: MediaFolder; onUploaded?: (media: UploadedMedia) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const upload = trpc.media.upload.useMutation({ onSuccess: (media) => { setFileName(media.fileName); onUploaded?.(media); toast.success(`${media.fileName} uploaded to secure storage.`); }, onError: (error) => { setFileName(""); toast.error(error.message || "Secure upload failed."); } });
  const handleFile = (file?: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Choose a file under 10 MB."); return; }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) { toast.error("Choose a JPEG, PNG, WebP, or PDF file."); return; }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onerror = () => { setFileName(""); toast.error("The selected file could not be read."); };
    reader.onload = () => upload.mutate({ folder, fileName: file.name, mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" | "application/pdf", base64: String(reader.result) });
    reader.readAsDataURL(file);
  };
  return <div className="media-upload-box"><input ref={ref} type="file" accept={accept} onChange={(event) => handleFile(event.target.files?.[0])} />{fileName ? <div><ImagePlus size={18} /><span><b>{fileName}</b><small>{upload.isPending ? "Uploading securely…" : "Stored securely"}</small></span>{upload.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <button onClick={() => { setFileName(""); if (ref.current) ref.current.value = ""; }} aria-label="Remove selected file"><X size={15} /></button>}</div> : <button onClick={() => ref.current?.click()}><FileUp size={19} /><span><b>{label}</b><small>JPEG, PNG, WebP, or PDF · 10 MB max</small></span></button>}</div>;
}
