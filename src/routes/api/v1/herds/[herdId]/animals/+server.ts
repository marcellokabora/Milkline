import { error, json } from '@sveltejs/kit';
import { generateHerd } from '#lib/api/mock/generate.js';
import type { AnimalsPage } from '#lib/api/types.js';
import type { RequestHandler } from './$types';

const PAGE_SIZE = 50;
const SLOW_MS = 3500;

export const GET: RequestHandler = async ({ params, url, request }) => {
	if (!/^h_\d+$/.test(params.herdId)) error(404, 'Unknown herd');

	const scenario = request.headers.get('x-mock-scenario');
	if (scenario === 'slow') await new Promise((resolve) => setTimeout(resolve, SLOW_MS));
	if (scenario === 'fail') error(503, 'Milkline API is unavailable');

	const requested = Number(url.searchParams.get('page') ?? 1);
	const page = Number.isInteger(requested) && requested >= 1 ? requested : 1;

	const now = Date.now();
	const herd = generateHerd(now);
	const body: AnimalsPage = {
		herdId: params.herdId,
		page,
		pageSize: PAGE_SIZE,
		total: herd.length,
		asOf: new Date(now).toISOString(),
		animals: herd.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
	};
	return json(body, { headers: { 'cache-control': 'no-store' } });
};
