"use client";
import React, { useCallback, useState } from "react";
import Image from "next/image";

export default function Home() {

  // Store dropped files in state
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setDroppedFiles(prev => [...prev, ...files]);
      // Generate previews for image files
      const readers: Promise<string>[] = files.map(file => {
        return new Promise(resolve => {
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = ev => resolve(ev.target?.result as string || "");
            reader.readAsDataURL(file);
          } else {
            resolve("");
          }
        });
      });
      Promise.all(readers).then(setPreviews);
      console.log("Dropped files:", files.map(f => f.name));
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  // Delete file handler
  const handleDelete = (idx: number) => {
    setDroppedFiles(files => files.filter((_, i) => i !== idx));
    setPreviews(previews => previews.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    setIsSending(true);

    // SINGLE FILE
    if (!droppedFiles || droppedFiles.length === 0) return;
    if (droppedFiles.length == 1) {
      const formData = new FormData();
      formData.append("file", droppedFiles[0]);
      try {
        const res = await fetch("https://ttb-labeling-1022869032774.us-central1.run.app/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        console.log("API response:", json);

        if (!json.result) {
          throw new Error("Invalid response from server: missing result");
        }

        window.open(`/results?result=${encodeURIComponent(json.result)}`, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.log("API response:", err);
      } finally {
        setIsSending(false);
      }
    }

    // MULTIPLE
    if (droppedFiles.length < 8) {
      const formData = new FormData();
      droppedFiles.forEach(file => {
        formData.append("files", file);
      });
      try {
        const res = await fetch("https://ttb-labeling-1022869032774.us-central1.run.app/upload-multiple", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        console.log("API response:", json);

        if (!json.job_id || !json.operation_name) {
          throw new Error("Invalid response from server: missing job_id or operation_name");
        }

        window.open(`/results?job_id=${json.job_id}&operation_name=${json.operation_name}`, '_blank', 'noopener,noreferrer'); 
      } catch (err) {
        console.log("API response:", err);
      } finally {
        setIsSending(false);
      }
    } else {

      // BATCH
      try {
        const res = await fetch("https://ttb-labeling-1022869032774.us-central1.run.app/generate-upload-url", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileCount: droppedFiles.length })
        });
        const { url, id } = await res.json();

        if (!id || !url) {
          throw new Error("Invalid response from server: missing url or id");
        }

        window.open(`/results?job_id=${id}`, '_blank', 'noopener,noreferrer');

        // Upload each file to the signed URL
        droppedFiles.forEach(async (file, idx) => {
          const r = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': file.type },
            body: file
          });
          await r.json();
          console.log(`Uploaded ${file.name} to ${url}`);

          setPreviews(prev => {
            const newPreviews = [...prev];
            newPreviews[idx] = "uploaded";
            return newPreviews;
          });
        });

        window.open(`/results?job_id=${id}`, '_blank', 'noreferrer');

      } catch (err) {
        console.log("API response:", err);
      } finally {
        setIsSending(false);
      }

    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            AI Alcohol Labeling, TTB
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Drag and drop (PNG, JPEG) or
            <label
              htmlFor="file-upload"
              className="inline-flex cursor-pointer ml-2 h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
              style={{ verticalAlign: 'middle' }}
            >
              Upload
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={e => {
                  if (e.target.files && e.target.files.length > 0) {
                    const files = Array.from(e.target.files);
                    setDroppedFiles(files);
                    const readers: Promise<string>[] = files.map(file => {
                      return new Promise(resolve => {
                        if (file.type.startsWith("image/")) {
                          const reader = new FileReader();
                          reader.onload = ev => resolve(ev.target?.result as string || "");
                          reader.readAsDataURL(file);
                        } else {
                          resolve("");
                        }
                      });
                    });
                    Promise.all(readers).then(setPreviews);
                  }
                }}
              />
            </label>
          </p>
          {droppedFiles.length > 0 && (
            <div className="mt-4 w-full flex flex-wrap gap-4">
              {droppedFiles.map((file, idx) => (
                <div
                  key={file.name + idx}
                  className="flex flex-col items-center justify-center w-32 h-32 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 shadow-sm overflow-hidden cursor-pointer relative group"
                  style={{ position: 'relative' }}
                >
                  {/* Preview background, blurred on hover */}
                  <div className="absolute inset-0 z-0 transition-all duration-200 group-hover:blur-sm" style={{ pointerEvents: 'none' }}>
                    {previews[idx] ? (
                      <img
                        src={previews[idx]}
                        alt={file.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full text-zinc-500">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#e5e7eb"/><path d="M7 17h10M7 13h10M7 9h10" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/></svg>
                        <span className="text-xs mt-2 px-2 text-center break-all">{file.name}</span>
                      </div>
                    )}
                  </div>
                  {/* Delete overlay, only visible on hover */}
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-600/80 bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white font-semibold text-lg tracking-wide focus:outline-none"
                    style={{ backdropFilter: 'blur(2px)' }}
                  >
                    Delete
                  </button>
                  {previews[idx] && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs text-white px-1 py-0.5 truncate z-20" title={file.name}>
                      {file.name}
                    </div>
                  )}
                </div>
              ))}

              {isSending ? (
                <div className="flex items-center justify-center w-full py-4">
                  <svg className="animate-spin h-8 w-8 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                </div>
              ) : (
                <button
                  type="button"
                  className="inline-flex cursor-pointer ml-2 h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
                  style={{ verticalAlign: 'middle' }}
                  onClick={handleSend}
                >
                  Send
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
