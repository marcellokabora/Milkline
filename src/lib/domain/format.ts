/** Plain-language durations. Coarse on purpose: a farmer needs "about 3 hours", not "10,812 s". */
export function formatDuration(ms: number): string {
	const totalMin = Math.max(0, Math.round(ms / 60_000));
	if (totalMin < 1) return 'under a minute';
	if (totalMin < 60) return `${totalMin} min`;
	const hours = Math.floor(totalMin / 60);
	const mins = totalMin % 60;
	if (hours < 24) return mins ? `${hours} h ${mins} min` : `${hours} h`;
	const days = Math.floor(hours / 24);
	return `${days} d`;
}

export function formatAgo(ms: number): string {
	return ms < 45_000 ? 'just now' : `${formatDuration(ms)} ago`;
}

/** Second-level precision, used only for the freshness pill where seconds matter. */
export function formatAgeShort(ms: number): string {
	const seconds = Math.max(0, Math.floor(ms / 1000));
	return seconds < 60 ? `${seconds} s` : formatDuration(ms);
}

export function formatMinutes(totalMinutes: number): string {
	const hours = Math.floor(totalMinutes / 60);
	const mins = Math.round(totalMinutes % 60);
	if (hours === 0) return `${mins} min`;
	return mins ? `${hours} h ${mins} min` : `${hours} h`;
}

/** Local clock time; adds the day when the moment is not today so old data is never mistaken for new. */
export function formatClock(timestamp: number, now: number = Date.now()): string {
	const date = new Date(timestamp);
	const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	if (date.toDateString() === new Date(now).toDateString()) return time;
	const day = date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
	return `${day}, ${time}`;
}
