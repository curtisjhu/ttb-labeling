"use client"
import React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function ResultsPage() {

	const searchParams = useSearchParams();
	const jobId = searchParams.get("job_id");

	const [result, setResult] = React.useState<any>(null);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [openFiles, setOpenFiles] = React.useState<{ [url: string]: boolean }>({});
	const [fileContents, setFileContents] = React.useState<{ [url: string]: string }>({});
	const [listMode, setListMode] = React.useState<"grid" | "list">("grid");
	const [modalUrl, setModalUrl] = React.useState<string | null>(null);
	const [modalImgUrl, setModalImgUrl] = React.useState<string | null>(null);
	const [modalFileName, setModalFileName] = React.useState<string | null>(null);
	const [modalContent, setModalContent] = React.useState<any | null>(null);

	const filterJson = (json: any) => {
		try {
			var newJson: any = {};

			for (const key of json.entities) {
				newJson[key.type] = key.mentionText;
			}

			return newJson;
		} catch (err) {
			return json;
		}
	}

	React.useEffect(() => {
		if (!jobId) return;
		setLoading(true);
		fetch(`https://ttb-labeling-1022869032774.us-central1.run.app/job/${jobId}`)
			.then(async (response) => {
				if (!response.ok) throw new Error("Failed to fetch results");
				const json = await response.json();
				console.log(json);
				setResult(json);
				setLoading(false);
			})
			.catch((err) => {
				setError(err.message);
				setLoading(false);
			});
	}, [jobId]);

	if (!jobId) {
		return (
			<div className="flex min-h-screen items-center justify-center font-sans">
				<main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">
					<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
						<h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
							Results
						</h1>
						<p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
							Missing job_id in query parameters. Please <Link href="/">go back</Link> and submit a job first.
						</p>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center font-sans">
			<main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">
				<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
					<h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
						Batch Job Results
					</h1>
					<p>Job ID: {jobId}</p>

					<button
						className="mb-2 px-4 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
						onClick={() => setListMode(listMode === "grid" ? "list" : "grid")}
					>
						{listMode === "grid" ? "Switch to List View" : "Switch to Grid View"}
					</button>

					{loading && <div className="text-zinc-500">Loading results...</div>}
					{error && <div className="text-red-500">Error: {error}</div>}

					{listMode === "list" && (
						<div className="w-full max-w-4xl mt-6">
							<h2 className="text-lg font-semibold mb-2">Output Files</h2>
							<ul className="space-y-2">
								{result && result.public_urls && result.public_urls.map((url: string) => {
									const parts = url.split("/");
									const fileName = parts[parts.length - 1] || url;
									return (
										<li key={url} className="flex items-center justify-between p-2 border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900">
											<span>{fileName}</span>
											<button onClick={async () => {
												setModalUrl(url);
												setModalImgUrl(result.original_urls[result.public_urls.indexOf(url)]);
												setModalFileName(fileName);
												if (!fileContents[url]) {
													try {
														const resp = await fetch(url);
														const text = await resp.json();
														const filtered = filterJson(text);
														setFileContents((prev) => ({ ...prev, [url]: filtered }));
														setModalContent(filtered);
													} catch (e) {
														setFileContents((prev) => ({ ...prev, [url]: "Failed to fetch file contents." }));
														setModalContent("Failed to fetch file contents.");
													}
												} else {
													setModalContent(fileContents[url]);
												}
											}} className="text-blue-500 hover:underline">View</button>
										</li>
									);
								})}
							</ul>
						</div>
					)}
					
					{listMode === "grid" && result && result.public_urls && result.public_urls.length > 0 && (
						<div className="w-full max-w-4xl mt-6">
							<h2 className="text-lg font-semibold mb-2">Output Files</h2>
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
								{result.public_urls.map((url: string, idx: number) => {
									const parts = url.split("/");
									const fileName = parts[parts.length - 1] || url;
									return (
										<div
											key={`${url}-${idx}`}
											className="relative group cursor-pointer border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden bg-white dark:bg-zinc-900 shadow hover:shadow-lg transition"
											onClick={async () => {
												setModalImgUrl(result.original_urls[idx]);
												setModalUrl(url);
												setModalFileName(fileName);
												if (!fileContents[url]) {
													try {
														const resp = await fetch(url);
														var json = await resp.json();
														json = filterJson(json);

														setFileContents((prev) => ({ ...prev, [url]: json }));
														setModalContent(filterJson(json));
													} catch (e) {
														setFileContents((prev) => ({ ...prev, [url]: "Failed to fetch file contents." }));
														setModalContent("Failed to fetch file contents.");
													}
												} else {
													setModalContent(fileContents[url]);
												}
											}}
										>
											{result.original_urls[idx] ? (
												<img src={result.original_urls[idx]} alt={fileName} className="w-full h-40 object-cover" />
											) : (
												<div className="flex items-center justify-center w-full h-40 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-xs">
													{fileName}
												</div>
											)}
											<div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-40 text-white text-xs px-2 py-1 truncate">{fileName}</div>
										</div>
									);
								})}
							</div>
						</div>
					)}
					{result && (!result.public_urls || result.public_urls.length === 0) && (
						<div className="text-zinc-500">No output files found yet.</div>
					)}
				</div>
				<p>
					<Link href={`/results?job_id=${jobId}`} className="text-blue-500 hover:underline">Refresh results (esp. large jobs)</Link>
					<br />
					{"  "}This page is a UI problem. To me this data laid out like so makes the most sense, but can naturally do a lot more.
				</p>

				{/* Modal Popup */}
				{modalUrl && (
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
						<div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg max-w-lg w-full p-6 relative">
							<button
								className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xl"
								onClick={() => { setModalUrl(null); setModalImgUrl(null); setModalContent(null); setModalFileName(null); }}
								aria-label="Close"
							>
								×
							</button>
							<div className="mb-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
								<div className="font-semibold text-base mb-2 truncate">{modalFileName}</div>

								<Image src={modalImgUrl} alt={modalFileName || "Preview"} width={400} height={300} className="w-full max-h-80 object-contain rounded" />

									<div className="mt-8 w-full bg-zinc-100 dark:bg-zinc-900 rounded-lg p-4 text-left">
										<h2 className="text-lg font-semibold mb-2 text-black dark:text-zinc-50">Labeled Result</h2>
										<pre className="text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all">
											{JSON.stringify(modalContent, null, 2)}
										</pre>
									</div>
							</div>
							<div className="flex gap-2">
								<a
									href={modalUrl}
									download={modalFileName || undefined}
									className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-green-600 text-xs flex items-center"
									target="_blank"
									rel="noopener noreferrer"
								>
									Open json
								</a>
								<a
									href={modalImgUrl}
									download={modalFileName || undefined}
									className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs flex items-center"
									target="_blank"
									rel="noopener noreferrer"
								>
									Open img
								</a>
							</div>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}