import OpenAI from 'openai'
import { OpenAIStream, StreamingTextResponse } from 'ai'

// prompts taken from: https://github.com/abi/screenshot-to-code/blob/main/backend/prompts/screenshot_system_prompts.py

// user query
const USER_PROMPT = 'Generate code for a web page that looks exactly like the image attached'

// context and instructions
const SYSTEM_PROMPT = `You are an expert Tailwind developer
You take screenshots of a reference web page from the user, and then build single page apps 
using Tailwind, HTML and JS.

- Make sure the app looks exactly like the screenshot.
- Pay close attention to background color, text color, font size, font family, 
padding, margin, border, etc. Match the colors and sizes exactly.
- Use the exact text from the screenshot.
- Do not add comments in the code such as "<!-- Add other navigation links as needed -->" and "<!-- ... other news items ... -->" in place of writing the full code. WRITE THE FULL CODE.
- Repeat elements as needed to match the screenshot. For example, if there are 15 items, the code should have 15 items. DO NOT LEAVE comments like "<!-- Repeat for each news item -->" or bad things will happen.
- For images, use placeholder images from https://placehold.co and include a detailed description of the image in the alt text so that an image generation AI can generate the image later.

In terms of libraries,
- Use this script to include Tailwind: <script src="https://cdn.tailwindcss.com"></script>
- You can use Google Fonts
- Font Awesome for icons: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"></link>

Do not include any introduction to the code such as "Here is the code for the web page that looks exactly like the image attached." or "The following is the code for the web page that looks exactly like the image attached.". Only include the code in HTML, CSS, and JS.
Do not include markdown "\`\`\`" or "\`\`\`html" at the start or end.`

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_TOKEN,
})

// https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes#runtime-differences
export const runtime = 'edge'

export async function POST(req: Request) {
	const { url } = await req.json()

	// https://platform.openai.com/docs/guides/vision
	const response = await openai.chat.completions.create({
		model: 'gpt-4-vision-preview',
		stream: true,
		max_tokens: 4096, // should be enough to generate all the code
		messages: [
			{
				role: 'system',
				content: SYSTEM_PROMPT,
			},
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: USER_PROMPT,
					},
					{
						type: 'image_url',
						image_url: url,
					},
				],
			},
		],
	})

	// allows to have streaming responses
	const stream = OpenAIStream(response)
	return new StreamingTextResponse(stream)
}
