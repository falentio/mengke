const encoder = new TextEncoder();

export function mustGetEnv(name: string): string {
	const e = Deno.env.get(name);
	if (e) {
		return e;
	}
	throw new Error(`can not find "${name}" in env variable`);
}

export class Hmac {
	#keys: Promise<CryptoKey>[] = [];
	constructor(secrets: string) {
		for (const secret of secrets.split(",")) {
			const key = crypto.subtle.importKey(
				"raw",
				encoder.encode(secret),
				{
					name: "HMAC",
					hash: { name: "SHA-512" },
				},
				false,
				["sign", "verify"],
			);
			this.#keys.push(key)
		}
	}

	async verify(mac: string, data: string) {
		const arrMac = Uint8Array.from(
			mac.match(/[\da-f]{2}/gi) ?? [],
			(el) => parseInt(el, 16),
		);
		for (const keyPromise of this.#keys) {
			const key = await keyPromise
			const valid = await crypto.subtle.verify(
				"HMAC",
				key,
				arrMac,
				encoder.encode(data),
			);
			if (valid) {
				return true
			}
		}
		return false
	}
}
