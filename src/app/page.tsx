'use client'
import { Loading } from '@/components/loading'
import { Form } from './form'
import { useState } from 'react'

// note the *
async function* streamReader(res: Response) {
	// This happens behind the scenes using res.json() or res.text()
	const reader = res.body?.getReader()

	const decoder = new TextDecoder()

	if (reader == null) return

	while (true) {
		// we read the next chunk of data
		const { done, value } = await reader.read()
		// We use the decoder.decode() method to convert the binary data into a string.
		const chunk = decoder.decode(value)

		console.log({ chunk })
		// We yield the decoded chunk of data. The yield keyword allows us to return a value from the generator function
		// without exiting the function. In this case, we are returning each chunk of data decoded.
		yield chunk
		if (done) break
	}
}

enum STEPS {
	INITIAL = 'INITIAL',
	LOADING = 'LOADING',
	PREVIEW = 'PREVIEW',
	ERROR = 'ERROR',
}

export default function Home() {
	const [result, setResult] = useState('')
	const [step, setStep] = useState(STEPS.INITIAL)

	const transformUrlToCode = async (url: string) => {
		setStep(STEPS.LOADING)
		const res = await fetch('/api/generate-code-from-image', {
			method: 'POST',
			body: JSON.stringify({ url }),
			headers: {
				'Content-Type': 'application/json',
			},
		})

		if (!res.ok || res.body == null) {
			setStep(STEPS.ERROR)
			throw new Error('Request failed with status: ' + res.status)
		}

		setStep(STEPS.PREVIEW)

		// read the response body as a stream
		for await (const chunk of streamReader(res)) {
			setResult((prev) => prev + chunk)
		}

		// equivalent to:
		// const reader = res.body?.getReader()
		// const decoder = new TextDecoder()
		// while (true) {
		//   const { done, value } = await reader.read()
		//   const chunk = decoder.decode(value)
		//   setResult((prev) => prev + chunk)
		//   if (done) break
		// }
	}

	return (
		<div className="grid grid-cols-[400px_1fr]">
			<aside className="flex flex-col justify-between min-h-screen p-4 bg-gray-900">
				<header className="text-center">
					<h1 className="text-3xl font-semibold">Image 2 Code</h1>
					<h2 className="text-sm opacity-75">Transform any image to HTML + CSS</h2>
				</header>
			</aside>

			<main className="bg-gray-950">
				<section className="max-w-5xl w-full mx-auto p-10">
					{step === STEPS.LOADING && <Loading />}

					{step === STEPS.INITIAL && (
						<div className="flex flex-col gap-4">
							<Form transformUrlToCode={transformUrlToCode} />
						</div>
					)}

					{step === STEPS.PREVIEW && (
						<div className="rounded flex flex-col gap-4">
							<div className="w-full h-full border-4 rounded border-gray-700 aspect-video">
								<iframe srcDoc={result} className="w-full h-full" />
							</div>
							<pre className="pt-10">
								<code>{result}</code>
							</pre>
						</div>
					)}
				</section>
			</main>
		</div>
	)
}
