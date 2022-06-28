const encoder = new TextEncoder()

export class Mengke {
	constructor(secret, baseUrl) {
		this.key = window.crypto.subtle.importKey(
			"raw",
			encoder.encode(secret),
			{
				name: "HMAC",
				hash: { name: "SHA-512" },
			},
			false,
			["sign"]
		)
		this.url = new URL("/create", baseUrl)
	}

	async create(url) {
		const key = await this.key
		const mac = await window.crypto.subtle.sign(
			"HMAC",
			key,
			encoder.encode(url),
		).then(buffer => {
			return Array
				.from(
					new Uint8Array(buffer),
					(el) => el.toString(16).padStart(2, "0"),
				)
				.join("");
		})

		const res = await fetch(this.url, {
			method: "PUT",
			body: JSON.stringify({
				url,
				mac,
			}),
		})

		if (!res.ok) {
			throw new Error(`${res.status} status code received`)
		}

		return res
			.json()
			.then(r => r.url)
	}
}
