export type AnimalStatus = 'healthy' | 'watch' | 'attention' | 'critical' | 'no_signal';
export type Severity = 'low' | 'medium' | 'high';
export type FlagCode =
	| 'RUMINATION_DROP'
	| 'ACTIVITY_LOW'
	| 'ACTIVITY_SPIKE'
	| 'TEMP_HIGH'
	| 'YIELD_DROP'
	| 'HEAT_DETECTED'
	| 'CALVING_IMMINENT'
	| 'SENSOR_SILENT';

export interface Flag {
	code: FlagCode;
	severity: Severity;
	detectedAt: string;
	confidence: number;
}

export interface Vitals {
	ruminationMinutes24h: number;
	ruminationBaseline: number;
	activityIndex: number;
	activityBaseline: number;
	bodyTempC: number;
	yieldLitres24h: number;
	yieldBaseline: number;
}

export interface Animal {
	id: string;
	tag: string;
	name: string;
	lactationDay: number;
	status: AnimalStatus;
	statusSince: string;
	flags: Flag[];
	vitals: Vitals;
	location: { zone: string; lastSeen: string };
	sensor: { battery: number; lastContact: string };
}

export interface AnimalsPage {
	herdId: string;
	page: number;
	pageSize: number;
	total: number;
	asOf: string;
	animals: Animal[];
}

export type StreamEvent =
	| { type: 'vitals_update'; animalId: string; at: string; vitals: Partial<Vitals> }
	| {
			type: 'flag_raised';
			animalId: string;
			at: string;
			flag: Pick<Flag, 'code' | 'severity' | 'confidence'>;
			statusChangedTo?: AnimalStatus;
	  }
	| {
			type: 'flag_cleared';
			animalId: string;
			at: string;
			flagCode: FlagCode;
			statusChangedTo?: AnimalStatus;
	  }
	| { type: 'sensor_offline'; animalId: string; at: string };

export type MockScenario = 'slow' | 'fail';
