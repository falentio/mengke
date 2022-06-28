import "std/dotenv/load.ts";
import { Application, Router, Status } from "oak";
import * as s from "superstruct";
import { Shortener } from "./shortener.ts";
import { mustGetEnv, Hmac } from "./utils.ts";

const hmac = new Hmac(
	mustGetEnv("HMAC_SECRETS"),
);
const shortener = new Shortener(
	mustGetEnv("DETABASE_PROJECT_ID"),
	mustGetEnv("DETABASE_BASE_NAME"),
	mustGetEnv("DETABASE_APIKEY"),
);
const router = new Router();
router.use(async (ctx, next) => {
	const h = ctx.response.headers
	h.set("cache-control", "private, no-store, no-cache");
	h.set("access-control-allow-origin", "*");
	h.set("access-control-allow-methods", "PUT, GET")
	await next()
})
router.get("/health", (ctx) => {
	ctx.response.status = 204;
});
router.get(
	"/:slug([a-z]*)",
	async (ctx) => {
		const slug = ctx.params.slug;
		const target = await shortener.get(slug);
		const h = ctx.response.headers
		if (target !== null) {
			h.set("cache-control", "public, max-age=3153600");
			ctx.response.redirect(target);
		} else {
			h.set("cache-control", "public, max-age=60");
			ctx.response.status = 404;
		}
	},
);
router.put(
	"/create",
	async (ctx) => {
		const b = await ctx.request.body({ type: "json" }).value
			.catch(e => {
				if (e instanceof SyntaxError) {
					ctx.throw(Status.BadRequest, "body is invalid json value")
				}
				throw e
			});
		const Body = s.object({
			url: s.define("URL", (v) => {
				try {
					if (typeof v !== "string") {
						return false;
					}
					new URL(v);
					return true;
				} catch {
					return false;
				}
			}),
			mac: s.string(),
		});
		const [err, body] = s.validate(b, Body);
		if (err) {
			ctx.throw(Status.BadRequest, err.message);
			return;
		}
		const valid = await hmac.verify(body.mac, body.url);
		if (!valid) {
			ctx.throw(Status.Unauthorized, "invalid mac")
		}
		const slug = await shortener.create(body.url);
		ctx.response.body = {
			url: new URL(`/${slug}`, ctx.request.url).href,
		};
		return;
	},
);

export const app = new Application({
	proxy: true,
});

app.use(async (ctx, next) => {
	try {
		await next();
	} catch (e) {
		ctx.response.status = e.status ?? 500;
		ctx.response.body = e.message ?? "internal server error";
		if (ctx.response.status === 500) {
			console.error(e);
		}
	}
});
app.use(router.routes());

if (import.meta.main) {
	const port = Number(Deno.env.get("PORT") ?? 8080);
	console.log("listening on port: " + port);
	app.listen({ port });
}
