export type Freshness = 'live' | 'delayed' | 'stale' | 'offline' | 'unknown';

export const LIVE_WINDOW_MS = 15_000;
export const STALE_AFTER_MS = 120_000;

export interface FreshnessInput {
	now: number;
	/** When data (fetch or stream message) last reached this device. Null until the first load. */
	lastDataAt: number | null;
	/** Browser online and the stream is open or opening. */
	connected: boolean;
}

/**
 * The single source of truth for "how much can I trust this screen right now".
 * Disconnected always wins: a recent timestamp must never read as live when nothing is arriving.
 */
export function computeFreshness({ now, lastDataAt, connected }: FreshnessInput): Freshness {
	if (lastDataAt === null) return connected ? 'unknown' : 'offline';
	if (!connected) return 'offline';
	const age = now - lastDataAt;
	if (age <= LIVE_WINDOW_MS) return 'live';
	if (age <= STALE_AFTER_MS) return 'delayed';
	return 'stale';
}
