"use client"
import React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResultsPage() {

	const searchParams = useSearchParams();
	const jobId = searchParams.get("job_id");

	const [result, setResult] = React.useState<any>(null);
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [openFiles, setOpenFiles] = React.useState<{ [url: string]: boolean }>({});
	const [fileContents, setFileContents] = React.useState<{ [url: string]: string }>({});

	React.useEffect(() => {
		if (!jobId) return;
		setLoading(true);
		fetch(`https://ttb-labeling-1022869032774.us-central1.run.app/job/${jobId}`)
			.then(async (response) => {
				if (!response.ok) throw new Error("Failed to fetch results");
				const json = await response.json();
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
			<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
				<main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
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
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
			<main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
				<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
					<h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
						Batch Job Results
					</h1>
					<p>Job ID: {jobId}</p>
					{loading && <div className="text-zinc-500">Loading results...</div>}
					{error && <div className="text-red-500">Error: {error}</div>}
					{result && result.public_urls && result.public_urls.length > 0 && (
						<div className="w-full max-w-2xl mt-6">
							<h2 className="text-lg font-semibold mb-2">Output Files</h2>
							<ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
								{result.public_urls.map((url: string) => {
									// Extract file name from URL
									const parts = url.split("/");
									const fileName = parts[parts.length - 1] || url;
									const isOpen = openFiles[url] || false;
									const content = fileContents[url];
									return (
										<li key={url} className="py-2">
											<button
												className="text-blue-600 hover:underline text-left font-mono"
												onClick={async () => {
													setOpenFiles((prev) => ({ ...prev, [url]: !isOpen }));
													if (!isOpen && !fileContents[url]) {
														try {
															const resp = await fetch(url);
															const text = await resp.text();
															setFileContents((prev) => ({ ...prev, [url]: text }));
														} catch (e) {
															setFileContents((prev) => ({ ...prev, [url]: "Failed to fetch file contents." }));
														}
													}
												}}
											>
												{isOpen ? "▼ " : "► "}{fileName}
											</button>
											{isOpen && (
												<>
													<div className="mt-2 bg-zinc-100 dark:bg-zinc-900 rounded p-2 border border-zinc-200 dark:border-zinc-700 overflow-x-auto text-xs">
														<pre className="whitespace-pre-wrap break-all">{content ? content : "Loading..."}</pre>
													</div>
													<div className="mt-2 flex gap-2">
														<button
															className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
															onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
														>
															Open in new tab
														</button>
														<a
															href={url}
															download={fileName}
															className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs flex items-center"
															target="_blank"
															rel="noopener noreferrer"
														>
															Download
														</a>
													</div>
												</>
											)}
										</li>
									);
								})}
							</ul>
						</div>
					)}
					{result && (!result.public_urls || result.public_urls.length === 0) && (
						<div className="text-zinc-500">No output files found yet.</div>
					)}
				</div>
				<p>
					<Link href={`/results?job_id=${jobId}`} className="text-blue-500 hover:underline">Refresh results</Link>
					<br />
					{"  "}This page is a UI problem. To me this data laid out like so makes the most sense, but can naturally do a lot more.
				</p>
			</main>
		</div>
	);
}