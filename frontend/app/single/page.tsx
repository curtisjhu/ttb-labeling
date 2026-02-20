"use client";
import React, { useCallback, useState } from "react";
import Image from "next/image";

export default function Home() {

	// Store dropped files in state
	const [droppedFile, setDroppedFile] = useState<File | null>(null);
	const [previews, setPreviews] = useState<string[]>([]);

	const [isSending, setIsSending] = useState(false);
	const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			const files = Array.from(e.dataTransfer.files);
			setDroppedFile(files[0]);
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
	const handleDelete = () => {
		setDroppedFile(null);
		setPreviews([]);
	};


	const [apiResult, setApiResult] = useState<any>(null);

	const handleSend = async () => {
		setIsSending(true);
		if (!droppedFile) return;
		const formData = new FormData();
		formData.append("file", droppedFile);
		try {
			const res = await fetch("https://ttb-labeling-1022869032774.us-central1.run.app/upload", {
				method: "POST",
				body: formData,
			});
			const json = await res.json();
			console.log("API response:", json);
			setApiResult(json.result);
		} catch (err) {
			setApiResult({ success: false, error: err instanceof Error ? err.message : String(err) });
			console.log("API response:", err);
		} finally {
			setIsSending(false);
		}
	};

	return (
		<div
			className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black"
			onDrop={onDrop}
			onDragOver={onDragOver}
		>
			<main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
				<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
					<h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
						AI Alcohol Labeling - Single Files, TTB
					</h1>
					<p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
						Drag and drop (PNG, JPEG) or
						<label
							htmlFor="file-upload"
							className="inline-flex cursor-pointer ml-2 h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
							style={{ verticalAlign: 'middle' }}
						>
							Select
							<input
								id="file-upload"
								type="file"
								multiple={false}
								className="hidden"
								onChange={e => {
									if (e.target.files && e.target.files.length > 0) {
										const files = Array.from(e.target.files);
										setDroppedFile(files[0]);
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
					{droppedFile && (
						<div className="w-full flex flex-col">
							<div className="mt-4 w-full flex flex-row flex-wrap gap-4">
								<div
									className="flex flex-col items-center justify-center w-full min-h-100 h-fit rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 shadow-sm overflow-hidden cursor-pointer relative group"
									style={{ position: 'relative' }}
								>
									{/* Preview background, blurred on hover */}
									<div className="absolute inset-0 z-0 transition-all duration-200 group-hover:blur-sm" style={{ pointerEvents: 'none' }}>
										{previews[0] ? (
											<img
												src={previews[0]}
												alt={droppedFile.name}
												className="object-contain w-full h-full"
												style={{ maxWidth: '100%', maxHeight: '100%' }}
											/>
										) : (
											<div className="flex flex-col items-center justify-center w-full h-full text-zinc-500">
												<svg width="32" height="32" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#e5e7eb" /><path d="M7 17h10M7 13h10M7 9h10" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" /></svg>
												<span className="text-xs mt-2 px-2 text-center break-all">{droppedFile.name}</span>
											</div>
										)}
									</div>
									{/* Delete overlay, only visible on hover */}
									<button
										type="button"
										onClick={() => handleDelete()}
										className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-600/80 bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white font-semibold text-lg tracking-wide focus:outline-none"
										style={{ backdropFilter: 'blur(2px)' }}
									>
										Delete
									</button>
									{previews[0] && (
										<div className="absolute bottom-0 left-0 right-0 bg-black/60 text-xs text-white px-1 py-0.5 truncate z-20" title={droppedFile.name}>
											{droppedFile.name}
										</div>
									)}
								</div>

								{/* Send button or loading spinner */}
								{!isSending ? (
									<button
										type="button"
										className="inline-flex cursor-pointer ml-2 h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
										style={{ verticalAlign: 'middle' }}
										onClick={handleSend}
									>
										Send
									</button>
								) : (
									<div className="ml-2 flex items-center justify-center h-12">
										<svg className="animate-spin h-8 w-8 text-zinc-600 dark:text-zinc-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
										</svg>
									</div>
								)}
								{/* Display API result */}
								{apiResult && (
									<div className="mt-8 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 text-left">
										<h2 className="text-lg font-semibold mb-2 text-black dark:text-zinc-50">Labeled Result</h2>
										<pre className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all">
											{JSON.stringify(apiResult, null, 2)}
										</pre>
									</div>
								)}
							</div>
						</div>
					)}



				</div>
			</main>
		</div>
	);
}



