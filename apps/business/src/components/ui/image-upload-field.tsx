"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImage } from "@/lib/actions/upload";

export function ImageUploadField({
  name,
  label,
  defaultValue,
  shape = "square",
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  shape?: "square" | "circle";
  hint?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await uploadImage(formData);
      if (result.error) setError(result.error);
      else if (result.url) setUrl(result.url);
    });
  }

  return (
    <div>
      <label className="field-label">{label}</label>
      <input type="hidden" name={name} value={url} />
      <div
        role="button"
        tabIndex={0}
        data-dragging={dragging}
        className="upload-zone"
        style={{
          width: shape === "circle" ? 96 : "100%",
          height: shape === "circle" ? 96 : 140,
          borderRadius: shape === "circle" ? "50%" : "var(--radius-md)",
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {pending ? (
          <Loader2 size={22} className="animate-spin" />
        ) : url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              className="upload-zone-remove"
              onClick={(e) => {
                e.stopPropagation();
                setUrl("");
              }}
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 px-2 text-center">
            <ImagePlus size={20} />
            {shape === "square" && <span className="text-xs">Click or drag an image</span>}
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {hint && !error && (
        <p className="mt-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1.5 text-xs" style={{ color: "var(--status-cancelled-fg)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
