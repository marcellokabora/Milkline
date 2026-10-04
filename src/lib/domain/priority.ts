import type { Animal, AnimalStatus, Flag, Severity } from '../api/types';

export const STATUS_RANK: Record<AnimalStatus, number> = {
	critical: 4,
	attention: 3,
	watch: 2,
	no_signal: 1,
	healthy: 0
};

const SEVERITY_RANK: Record<Severity, number> = { high: 3, medium: 2, low: 1 };

export const ATTENTION_STATUSES: AnimalStatus[] = ['critical', 'attention'];

export function severityRank(flags: Flag[]): number {
	return flags.reduce((max, f) => Math.max(max, SEVERITY_RANK[f.severity]), 0);
}

function topConfidence(flags: Flag[]): number {
	return flags.reduce((max, f) => Math.max(max, f.confidence), 0);
}

/** Sort order: status, then worst flag severity, then confidence, then longest-running first. */
export function compareByPriority(a: Animal, b: Animal): number {
	return (
		STATUS_RANK[b.status] - STATUS_RANK[a.status] ||
		severityRank(b.flags) - severityRank(a.flags) ||
		topConfidence(b.flags) - topConfidence(a.flags) ||
		Date.parse(a.statusSince) - Date.parse(b.statusSince) ||
		a.tag.localeCompare(b.tag)
	);
}

/** Status implied by the flags still active (used when a stream event omits statusChangedTo). */
export function statusFromFlags(flags: Flag[]): AnimalStatus {
	if (flags.some((f) => f.code === 'SENSOR_SILENT')) return 'no_signal';
	let status: AnimalStatus = 'healthy';
	for (const f of flags) {
		let next: AnimalStatus;
		if (f.code === 'CALVING_IMMINENT' || (f.code === 'TEMP_HIGH' && f.severity === 'high')) {
			next = 'critical';
		} else if (f.severity === 'low') {
			next = 'watch';
		} else {
			next = 'attention';
		}
		if (STATUS_RANK[next] > STATUS_RANK[status]) status = next;
	}
	return status;
}
