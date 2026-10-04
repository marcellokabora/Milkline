import type { Animal, StreamEvent } from '../api/types';
import { statusFromFlags } from './priority';

/** Applies one stream message to an animal in place. Unknown or partial data is ignored, never guessed. */
export function applyStreamEvent(animal: Animal, event: StreamEvent): void {
	const setStatus = (next: Animal['status'], at: string) => {
		if (next !== animal.status) {
			animal.status = next;
			animal.statusSince = at;
		}
	};

	switch (event.type) {
		case 'vitals_update':
			Object.assign(animal.vitals, event.vitals);
			animal.sensor.lastContact = event.at;
			animal.location.lastSeen = event.at;
			// Hearing from a silent sensor means it is back; its remaining flags decide the status.
			if (animal.status === 'no_signal') {
				animal.flags = animal.flags.filter((f) => f.code !== 'SENSOR_SILENT');
				setStatus(statusFromFlags(animal.flags), event.at);
			}
			break;
		case 'flag_raised': {
			const flag = { ...event.flag, detectedAt: event.at };
			const existing = animal.flags.findIndex((f) => f.code === flag.code);
			if (existing >= 0) animal.flags[existing] = { ...flag, detectedAt: animal.flags[existing].detectedAt };
			else animal.flags.push(flag);
			setStatus(event.statusChangedTo ?? statusFromFlags(animal.flags), event.at);
			break;
		}
		case 'flag_cleared':
			animal.flags = animal.flags.filter((f) => f.code !== event.flagCode);
			setStatus(event.statusChangedTo ?? statusFromFlags(animal.flags), event.at);
			break;
		case 'sensor_offline':
			if (!animal.flags.some((f) => f.code === 'SENSOR_SILENT')) {
				animal.flags.push({
					code: 'SENSOR_SILENT',
					severity: 'medium',
					detectedAt: event.at,
					confidence: 1
				});
			}
			setStatus('no_signal', event.at);
			break;
	}
}
