import type { AnimalsPage } from '../types';
import { generateHerd } from './generate';

const PAGE_SIZE = 50;
const SLOW_MS = 3500;
const ROUTE = /\/api\/v1\/herds\/(h_\d+)\/animals$/;

function reply(body: unknown, status = 200): Response {
	return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function wait(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(resolve, ms);
		signal.addEventListener(
			'abort',
			() => {
				clearTimeout(timer);
				reject(signal.reason);
			},
			{ once: true }
		);
	});
}

/**
 * The mock backend as a plain Request -> Response function, so the same code answers the SvelteKit
 * route on a server and, in a static build with no server, a fetch made inside the browser.
 */
export async function handleAnimalsRequest(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const herdId = ROUTE.exec(url.pathname)?.[1];
	if (!herdId) return reply({ message: 'Unknown herd' }, 404);

	const scenario = request.headers.get('x-mock-scenario');
	if (scenario === 'slow') await wait(SLOW_MS, request.signal);
	if (scenario === 'fail') return reply({ message: 'Milkline API is unavailable' }, 503);

	const requested = Number(url.searchParams.get('page') ?? 1);
	const page = Number.isInteger(requested) && requested >= 1 ? requested : 1;

	const now = Date.now();
	const herd = generateHerd(now);
	const body: AnimalsPage = {
		herdId,
		page,
		pageSize: PAGE_SIZE,
		total: herd.length,
		asOf: new Date(now).toISOString(),
		animals: herd.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
	};
	return reply(body);
}
