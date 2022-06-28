import { Mengke } from "./index.js"

const [
	secret,
	baseUrl,
	url,
] = Deno.args

new Mengke(secret, algorithm, baseUrl)
	.create(url)
	.then(console.log)
