import QuickLRU from "quick-lru";
import { DetabaseKV } from "deta";
import { mustGetEnv } from "./utils.ts";

export class Shortener {
	#deta: DetabaseKV<string>;
	#cache: QuickLRU<string, string | null>;

	constructor(
		projectId: string,
		baseName: string,
		apikey: string,
	) {
		this.#deta = new DetabaseKV<string>({
			projectId,
			baseName,
			apikey,
		});

		this.#cache = new QuickLRU<string, string | null>({
			maxSize: 1000,
		});
	}

	create(target: string, slug: string = generate()) {
		return this.#deta
			.set(slug, target)
			.then((_) => slug);
	}

	async get(slug: string): Promise<string | null> {
		let target = this.#cache.get(slug);
		if (target) {
			return target;
		}
		target = await this.#deta.get(slug);
		this.#cache.set(slug, target);
		return target;
	}
}

const consonant = "bcdfghjklmnpqrstvwxyz";
const vowel = "aiueo";

function generate() {
	let result = "";
	let i = 0;
	if (Math.random() > 0.5) {
		i++;
	}
	while (result.length < 8) {
		const c = i++ % 2 === 0 ? vowel : consonant;
		result += c[Math.random() * c.length | 0];
	}
	return result;
}
