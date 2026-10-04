import type { AnimalStatus } from '../api/types';

export interface Verdict {
	headline: string;
	detail: string;
	tone: 'critical' | 'attention' | 'ok';
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One sentence that answers "does anything need me?" before anything else is read. */
export function verdictFor(counts: Record<AnimalStatus, number>): Verdict {
	const urgent = counts.critical + counts.attention;
	if (urgent > 0) {
		const verb = urgent === 1 ? 'needs' : 'need';
		const when = counts.critical > 0 ? 'now' : 'today';
		return {
			headline: `${plural(urgent, 'animal', 'animals')} ${verb} you ${when}`,
			// The tiles below already break the number down by status.
			detail: '',
			tone: counts.critical > 0 ? 'critical' : 'attention'
		};
	}
	if (counts.watch > 0) {
		return {
			headline: 'Nothing urgent',
			detail: `${plural(counts.watch, 'animal', 'animals')} to keep an eye on`,
			tone: 'ok'
		};
	}
	if (counts.no_signal > 0) {
		return {
			headline: 'No health alerts',
			detail: `${plural(counts.no_signal, 'sensor is', 'sensors are')} silent, so those animals can't be checked`,
			tone: 'ok'
		};
	}
	return { headline: 'All clear', detail: 'No animals need you today', tone: 'ok' };
}
