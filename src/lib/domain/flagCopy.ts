import type { Animal, Flag } from '../api/types';
import { formatDuration, formatMinutes } from './format';

export const NORMAL_TEMP_C = 38.6;

export interface FlagCopy {
	title: string;
	detail: string;
}

/** Rounded to the nearest 5% so a ticking vital does not make the sentence flicker. */
function percentOff(value: number, baseline: number): number {
	if (baseline <= 0) return 0;
	return Math.max(5, Math.round((Math.abs(value - baseline) / baseline) * 20) * 5);
}

export function confidenceWord(confidence: number): string {
	if (confidence >= 0.85) return 'Very likely';
	if (confidence >= 0.65) return 'Likely';
	return 'Possible';
}

export function describeFlag(flag: Flag, animal: Animal, now: number): FlagCopy {
	const v = animal.vitals;
	switch (flag.code) {
		case 'RUMINATION_DROP':
			return {
				title: 'Chewing less than normal',
				detail: `${formatMinutes(v.ruminationMinutes24h)} a day, usually ${formatMinutes(v.ruminationBaseline)}`
			};
		case 'ACTIVITY_LOW':
			return {
				title: 'Moving less than normal',
				detail: `About ${percentOff(v.activityIndex, v.activityBaseline)}% less active than usual`
			};
		case 'ACTIVITY_SPIKE':
			return {
				title: 'Unusually restless',
				detail: `About ${percentOff(v.activityIndex, v.activityBaseline)}% more active than usual`
			};
		case 'TEMP_HIGH':
			return {
				title: 'Temperature high',
				detail: `${v.bodyTempC.toFixed(1)} °C, normal is about ${NORMAL_TEMP_C} °C`
			};
		case 'YIELD_DROP':
			return {
				title: 'Giving less milk',
				detail: `${v.yieldLitres24h.toFixed(1)} L in 24 h, usually ${v.yieldBaseline.toFixed(1)} L`
			};
		case 'HEAT_DETECTED':
			return { title: 'Likely in heat', detail: 'A good time to check for breeding' };
		case 'CALVING_IMMINENT':
			return { title: 'Calving soon', detail: 'Signs point to calving very soon' };
		case 'SENSOR_SILENT':
			return {
				title: 'Sensor offline',
				detail: `Last heard from ${formatDuration(now - Date.parse(animal.sensor.lastContact))} ago, so health can't be checked remotely`
			};
	}
}
