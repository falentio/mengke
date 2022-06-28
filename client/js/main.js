import { Mengke } from "./index.js"

const [
	secret,
	baseUrl,
	url,
] = Deno.args

new Mengke(secret, baseUrl)
	.create(url)
	.then(console.log)
