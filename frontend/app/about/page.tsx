
export default function Home() {
	  return (
	<div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
	  <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
		<div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
		  <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
			 About TTB Labeling AI
		  </h1>
		  <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
			TTB Labeling AI is a cutting-edge tool designed to assist alcohol producers in ensuring their product labels comply with the Alcohol and Tobacco Tax and Trade Bureau (TTB) regulations. Our
			AI-powered system analyzes label images to identify potential compliance issues, helping producers avoid costly mistakes and streamline the approval process.

			With TTB Labeling AI, you can quickly upload your label designs and receive detailed feedback on any elements that may not meet TTB standards. Our technology is trained on a vast dataset of compliant and non-compliant labels, allowing it to provide accurate and actionable insights. Whether you're a small craft distillery or a large beverage company, TTB Labeling AI is here to help you navigate the complex world of alcohol labeling regulations with confidence and ease.
		  </p>
		</div>
	  </main>
	</div>
  );
}