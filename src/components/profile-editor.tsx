"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type Props = {
  initialBio: string | null;
  initialImage: string | null;
  username: string;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProfileEditor({ initialBio, initialImage, username }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(initialBio || "");
  const [image, setImage] = useState<string | null>(initialImage);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      if (!file.type.startsWith("image/")) {
        toast("File must be an image", "error");
        return;
      }
      if (file.size > 4 * 1024 * 1024) {
        toast("Image must be under 4MB", "error");
        return;
      }

      const fileData = await fileToBase64(file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name || "avatar.png",
          fileType: file.type,
          fileData,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error || "Upload failed", "error");
        return;
      }

      setImage(data.url);
      toast("Photo uploaded");
    } catch {
      toast("Upload failed", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio.trim() || null,
          image: image || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error || "Could not save profile", "error");
        setLoading(false);
        return;
      }

      toast("Profile updated");
      setEditing(false);
      router.refresh();
    } catch {
      toast("Could not save profile", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setBio(initialBio || "");
    setImage(initialImage);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Edit profile
      </button>
    );
  }

  return (
    <div className="w-full max-w-md space-y-4 rounded-lg border bg-zinc-50 p-4 dark:bg-zinc-950">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Profile photo</label>
        <div className="flex items-center gap-3">
          {image ? (
            <img
              src={image}
              alt={username}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-200 text-lg font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {username.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadAvatar(file);
              }}
              className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white dark:text-zinc-400 dark:file:bg-zinc-100 dark:file:text-zinc-900"
            />
            {image && (
              <button
                type="button"
                onClick={() => setImage(null)}
                className="text-xs text-red-600 hover:underline dark:text-red-400"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="bio" className="text-sm font-medium">
            About me
          </label>
          <span className="text-xs text-zinc-400">{bio.length}/500</span>
        </div>
        <textarea
          id="bio"
          rows={3}
          maxLength={500}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short intro (optional)"
          className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:bg-zinc-900"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || uploading}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}