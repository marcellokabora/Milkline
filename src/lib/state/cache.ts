import type { Animal } from '../api/types';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface CachedHerd {
	v: 1;
	herdId: string;
	/** When this snapshot last matched what the server said (last fetch or stream message). */
	savedAt: number;
	animals: Animal[];
}

const key = (herdId: string) => `milkline:herd:${herdId}`;

export function loadCachedHerd(herdId: string, now: number): CachedHerd | null {
	try {
		const raw = localStorage.getItem(key(herdId));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as CachedHerd;
		if (parsed.v !== 1 || parsed.herdId !== herdId || !Array.isArray(parsed.animals)) return null;
		// Older than a day is worse than nothing: it would look like a herd report but be last night's.
		if (now - parsed.savedAt > MAX_AGE_MS) return null;
		return parsed;
	} catch {
		return null;
	}
}

export function saveCachedHerd(herdId: string, savedAt: number, animals: Animal[]): void {
	try {
		const payload: CachedHerd = { v: 1, herdId, savedAt, animals };
		localStorage.setItem(key(herdId), JSON.stringify(payload));
	} catch {
		// Storage full or blocked: the app works without a cache.
	}
}

export function clearCachedHerd(herdId: string): void {
	try {
		localStorage.removeItem(key(herdId));
	} catch {
		// ignore
	}
}
