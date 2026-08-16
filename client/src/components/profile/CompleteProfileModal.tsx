import { useState } from "react";
import { ArrowRight, Check, Image as ImageIcon, LoaderCircle, MapPin, Phone, ShieldCheck, Sparkles, User, X } from "lucide-react";
import { toast } from "sonner";
import { useTravelSession } from "@/contexts/TravelSessionContext";
import { uploadImageFree } from "@/lib/freeStorage";
import { doc, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase";

export function CompleteProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, completeAuth } = useTravelSession();
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [city, setCity] = useState(profile?.city || "");
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergencyPhone || "");
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImageFree(file);
      setPhotoURL(res.url);
      toast.success("Profile photo uploaded!");
    } catch {
      toast.error("Could not upload photo. Using default.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    setSaving(true);
    try {
      const updatedData = {
        displayName: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        emergencyPhone: emergencyPhone.trim(),
        photoURL: photoURL.trim(),
        profileComplete: true,
      };

      if (firebaseDb && profile?.uid) {
        await updateDoc(doc(firebaseDb, "travelerProfiles", profile.uid), updatedData);
      }

      if (profile) {
        completeAuth({
          ...profile,
          name: updatedData.displayName,
          phone: updatedData.phone,
          city: updatedData.city,
          emergencyPhone: updatedData.emergencyPhone,
          photoURL: updatedData.photoURL,
          profileComplete: true,
        });
      }

      toast.success("Profile details completed!");
      onClose();
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="complete-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="badge">
            <Sparkles size={13} />
            <span>HAR HAR MAHADEV TOURS</span>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-intro">
          <h2>Complete your traveler profile</h2>
          <p>
            Your Google account is linked. Add your trip contact details so your local host can reach you on the road.
          </p>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div className="avatar-preview">
              {photoURL ? (
                <img src={photoURL} alt={name} />
              ) : (
                <div className="avatar-initials">
                  {name.slice(0, 2).toUpperCase() || "VG"}
                </div>
              )}
              {uploading && (
                <div className="avatar-loading">
                  <LoaderCircle size={20} className="animate-spin" />
                </div>
              )}
            </div>
            <div className="avatar-actions">
              <label className="upload-avatar-btn">
                <ImageIcon size={14} />
                <span>{photoURL ? "Change Photo" : "Upload Photo (Free)"}</span>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
              </label>
              <small>Zero cloud fee · Stored securely</small>
            </div>
          </div>

          <div className="form-grid-2">
            <label>
              Full Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </label>

            <label>
              WhatsApp / Mobile Number
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
              />
            </label>

            <label>
              City / State
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai, Maharashtra"
              />
            </label>

            <label>
              Emergency Contact (Optional)
              <input
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+91 00000 00000"
              />
            </label>
          </div>

          <button type="submit" className="submit-btn" disabled={saving || uploading}>
            {saving ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />}
            <span>{saving ? "Saving to Firestore…" : "Save & Continue Journey"}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="modal-trust">
          <ShieldCheck size={14} />
          <span>Your travel data is protected and never shared with third parties.</span>
        </div>
      </div>

      <style>{`
        .complete-profile-modal {
          width: 100%;
          max-width: 520px;
          background: #ffffff;
          border-radius: 20px;
          padding: 32px;
          margin: auto;
          box-shadow: 0 24px 60px rgba(0,0,0,0.18);
          animation: slideUp 0.25s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .modal-header .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--color-brand, #f06a3a);
          background: rgba(240,106,58,0.1);
          padding: 4px 10px;
          border-radius: 20px;
        }
        .close-btn {
          background: none;
          border: none;
          color: #777;
          cursor: pointer;
          padding: 4px;
        }
        .modal-intro h2 {
          font-size: 22px;
          margin: 0 0 6px;
          font-weight: 800;
        }
        .modal-intro p {
          font-size: 13.5px;
          color: #666;
          line-height: 1.5;
          margin: 0 0 20px;
        }
        .avatar-section {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px;
          background: #faf8f5;
          border-radius: 12px;
          margin-bottom: 20px;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .avatar-preview {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          overflow: hidden;
          background: #e8e4dc;
          flex-shrink: 0;
        }
        .avatar-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-initials {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: #555;
          font-size: 18px;
        }
        .avatar-loading {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .avatar-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .upload-avatar-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: white;
          border: 1px solid rgba(0,0,0,0.15);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          color: #222;
          width: fit-content;
        }
        .avatar-actions small {
          font-size: 11px;
          color: #888;
        }
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 24px;
        }
        @media (max-width: 520px) {
          .form-grid-2 { grid-template-columns: 1fr; }
        }
        .form-grid-2 label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          color: #333;
        }
        .form-grid-2 input {
          padding: 10px 12px;
          border: 1.5px solid rgba(0,0,0,0.12);
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
        }
        .form-grid-2 input:focus {
          outline: none;
          border-color: var(--color-brand, #f06a3a);
        }
        .submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--color-brand, #f06a3a);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .submit-btn:hover { opacity: 0.92; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .modal-trust {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 16px;
          font-size: 11.5px;
          color: #777;
        }
      `}</style>
    </div>
  );
}
