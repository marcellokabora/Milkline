import type { AnimalStatus } from '../api/types';

export interface Verdict {
	headline: string;
	detail: string;
	tone: 'critical' | 'attention' | 'ok';
}

/** One short line that answers "does anything need me?"; the tiles below carry the counts. */
export function verdictFor(counts: Record<AnimalStatus, number>): Verdict {
	if (counts.critical > 0) return { headline: 'Needs you now', detail: '', tone: 'critical' };
	if (counts.attention > 0) return { headline: 'Needs you today', detail: '', tone: 'attention' };
	if (counts.watch > 0) return { headline: 'Nothing urgent', detail: '', tone: 'ok' };
	if (counts.no_signal > 0) {
		return { headline: 'No alerts', detail: 'some sensors silent', tone: 'ok' };
	}
	return { headline: 'All clear', detail: '', tone: 'ok' };
}