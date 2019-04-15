import { createReadStream, existsSync } from "fs";
import { basename, extname, join, resolve } from "path";
import { KaenContext } from "@kaenjs/core";
import { MimeType } from "@kaenjs/core/mime-types";
declare global {
	namespace KaenExtensible {
		interface KaenContext {
			send(file: string): Promise<void>
		}
	}
}
interface IStaticContent {
	/** @param {string} [directory=public] - defaults *public* */
	directory?:string
	/** @param {string} [requestUrl=assets]  - defaults *assets* */
	urlPrefix?:string
}
export function StaticContent(config?:IStaticContent) {
	const { directory, urlPrefix} = Object.assign({}, {directory:'public', urlPrefix:'assets'}, config);
	let prereg = `/${urlPrefix}/(.*)`.replace('//', '/');
	let queryUrl = new RegExp(prereg);
	return async function StaticContent( ctx:KaenContext) {
		ctx.send = async function send(file: string) {
			let ext = extname(basename(file));
			if (['.html'].includes(ext)) file = `views/${file}`;
			let filepath = resolve(file);
			if (existsSync(filepath)) {
				ctx.body = createReadStream(filepath);
				ctx.type = MimeType[ext];
			}
			ctx.finished = true;
		}
		const [_, file] = queryUrl.exec(ctx.url.path)|| [] as RegExpExecArray;
		if ( file ) {
			let url = join(`./${directory}`, ctx.url.path.replace('assets', ''));
			ctx.send(url);
		}
	}
}
