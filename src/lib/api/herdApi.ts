import type { Animal, AnimalsPage, MockScenario } from './types';

export class HerdApiError extends Error {
	constructor(
		message: string,
		readonly kind: 'network' | 'http' | 'timeout' | 'aborted'
	) {
		super(message);
	}
}

export interface FetchOptions {
	scenario?: MockScenario | null;
	signal?: AbortSignal;
	timeoutMs?: number;
}

/** A static deploy (GitHub Pages) has no server, so the mock backend answers inside the browser. */
async function send(url: string, init: RequestInit): Promise<Response> {
	if (!__MOCK_IN_BROWSER__) return fetch(url, init);
	const { handleAnimalsRequest } = await import('./mock/handler');
	return handleAnimalsRequest(new Request(new URL(url, location.href), init));
}

async function fetchPage(
	herdId: string,
	page: number,
	{ scenario, signal, timeoutMs = 12_000 }: FetchOptions
): Promise<AnimalsPage> {
	const timeout = AbortSignal.timeout(timeoutMs);
	const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
	try {
		const res = await send(`/api/v1/herds/${herdId}/animals?page=${page}`, {
			signal: combined,
			headers: scenario ? { 'x-mock-scenario': scenario } : undefined
		});
		if (!res.ok) throw new HerdApiError(`Server answered ${res.status}`, 'http');
		return (await res.json()) as AnimalsPage;
	} catch (err) {
		if (err instanceof HerdApiError) throw err;
		if (signal?.aborted) throw new HerdApiError('Request cancelled', 'aborted');
		if (timeout.aborted) throw new HerdApiError('The server took too long to answer', 'timeout');
		throw new HerdApiError('No connection to the server', 'network');
	}
}

export interface HerdSnapshot {
	herdId: string;
	asOf: number;
	animals: Animal[];
}

/** The API is paginated and unordered, so the whole herd must be loaded before ranking it. */
export async function fetchHerd(herdId: string, options: FetchOptions = {}): Promise<HerdSnapshot> {
	const first = await fetchPage(herdId, 1, options);
	const animals = [...first.animals];
	const pages = Math.ceil(first.total / first.pageSize);
	if (pages > 1) {
		const rest = await Promise.all(
			Array.from({ length: pages - 1 }, (_, i) => fetchPage(herdId, i + 2, options))
		);
		for (const page of rest) animals.push(...page.animals);
	}
	return { herdId: first.herdId, asOf: Date.parse(first.asOf), animals };
}
