import type { Animal, AnimalStatus, Flag, FlagCode, Severity, Vitals } from '../types';

const HERD_SEED = 4417;
export const HERD_SIZE = 120;

const NAMES = `Abby Agnes Alma Amber Annie Aster Aurora Babe Beatrice Bella Belle Bernice Betsy Birdie Blossom Bonnie Brandy Buttercup Caramel Carla Cecilia Cherry Cinder Clementine Cocoa Coral Cricket Dahlia Delia Dolly Dottie Edith Eleanor Elsie Emma Esme Fawn Fern Fiona Flora Freya Ginger Gladys Goldie Hannah Harriet Heidi Honey Ida Iris Ivy Jasmine Josie Kate Lacey Lila Lola Lucy Mabel Maggie Marigold Marta Maude Mavis Mildred Millie Minnie Mocha Molly Nell Nora Nutmeg Opal Orla Patsy Peaches Penny Petunia Pippa Polly Queenie Rosie Ruby Ruth Sadie Sage Sally Sienna Sophie Stella Sunny Tessa Tilly Trixie Ursula Vera Violet Wanda Winnie Zelda Zinnia Dot Edna Gemma Hope Inez Joy Kit Lena Mina Nia Olga Pru Remy Tansy Uma Vida`.split(
	/\s+/
);

const ZONES = [
	'Barn 1 · Pen A',
	'Barn 1 · Pen B',
	'Barn 1 · Parlor Hold',
	'Barn 2 · Pen A',
	'Barn 2 · Pen B',
	'Barn 2 · Pen C',
	'Pasture North',
	'Pasture South'
];

interface FlagSpec {
	code: FlagCode;
	severity: Severity;
	minutesAgo: number;
	confidence: number;
}

interface Spec {
	num: number;
	name: string;
	status: AnimalStatus;
	zone: string;
	lactationDay?: number;
	flags: FlagSpec[];
	vitals?: Partial<Vitals>;
	silentMinutes?: number;
	battery?: number;
}

// The handful of animals that make the screen interesting; everything else is healthy.
const CURATED: Spec[] = [
	{
		num: 614,
		name: 'Bluebell',
		status: 'critical',
		zone: 'Barn 1 · Pen B',
		lactationDay: 142,
		flags: [
			{ code: 'TEMP_HIGH', severity: 'high', minutesAgo: 35, confidence: 0.93 },
			{ code: 'RUMINATION_DROP', severity: 'high', minutesAgo: 95, confidence: 0.88 },
			{ code: 'YIELD_DROP', severity: 'medium', minutesAgo: 40, confidence: 0.71 }
		],
		vitals: {
			bodyTempC: 40.2,
			ruminationMinutes24h: 270,
			ruminationBaseline: 455,
			yieldLitres24h: 18.4,
			yieldBaseline: 30.1
		}
	},
	{
		num: 903,
		name: 'Maple',
		status: 'critical',
		zone: 'Barn 2 · Calving Pen',
		lactationDay: 0,
		flags: [
			{ code: 'CALVING_IMMINENT', severity: 'high', minutesAgo: 20, confidence: 0.96 },
			{ code: 'ACTIVITY_SPIKE', severity: 'medium', minutesAgo: 50, confidence: 0.8 }
		],
		vitals: { activityIndex: 118, activityBaseline: 62 }
	},
	{
		num: 231,
		name: 'Greta',
		status: 'attention',
		zone: 'Barn 2 · Pen C',
		lactationDay: 87,
		flags: [
			{ code: 'RUMINATION_DROP', severity: 'high', minutesAgo: 162, confidence: 0.91 },
			{ code: 'ACTIVITY_LOW', severity: 'medium', minutesAgo: 72, confidence: 0.74 }
		],
		vitals: {
			ruminationMinutes24h: 291,
			ruminationBaseline: 468,
			activityIndex: 38,
			activityBaseline: 71,
			bodyTempC: 38.9,
			yieldLitres24h: 21.2,
			yieldBaseline: 29.8
		}
	},
	{
		num: 488,
		name: 'Bessie',
		status: 'attention',
		zone: 'Barn 1 · Parlor Hold',
		lactationDay: 203,
		flags: [{ code: 'ACTIVITY_LOW', severity: 'medium', minutesAgo: 140, confidence: 0.74 }],
		vitals: { activityIndex: 33, activityBaseline: 68 }
	},
	{
		num: 77,
		name: 'Daisy',
		status: 'attention',
		zone: 'Barn 2 · Pen A',
		lactationDay: 64,
		flags: [{ code: 'TEMP_HIGH', severity: 'medium', minutesAgo: 55, confidence: 0.79 }],
		vitals: { bodyTempC: 39.5 }
	},
	{
		num: 352,
		name: 'Poppy',
		status: 'attention',
		zone: 'Barn 1 · Pen A',
		lactationDay: 118,
		flags: [
			{ code: 'YIELD_DROP', severity: 'medium', minutesAgo: 180, confidence: 0.83 },
			{ code: 'RUMINATION_DROP', severity: 'low', minutesAgo: 120, confidence: 0.62 }
		],
		vitals: {
			yieldLitres24h: 19.6,
			yieldBaseline: 28.9,
			ruminationMinutes24h: 395,
			ruminationBaseline: 462
		}
	},
	{
		num: 129,
		name: 'Clover',
		status: 'watch',
		zone: 'Pasture North',
		flags: [{ code: 'HEAT_DETECTED', severity: 'low', minutesAgo: 30, confidence: 0.85 }]
	},
	{
		num: 560,
		name: 'Willow',
		status: 'watch',
		zone: 'Barn 2 · Pen B',
		flags: [{ code: 'HEAT_DETECTED', severity: 'low', minutesAgo: 85, confidence: 0.77 }]
	},
	{
		num: 705,
		name: 'Hazel',
		status: 'watch',
		zone: 'Barn 1 · Pen B',
		flags: [{ code: 'ACTIVITY_SPIKE', severity: 'low', minutesAgo: 45, confidence: 0.66 }],
		vitals: { activityIndex: 99, activityBaseline: 70 }
	},
	{
		num: 842,
		name: 'Juniper',
		status: 'watch',
		zone: 'Pasture South',
		flags: [{ code: 'RUMINATION_DROP', severity: 'low', minutesAgo: 110, confidence: 0.6 }],
		vitals: { ruminationMinutes24h: 402, ruminationBaseline: 470 }
	},
	{
		num: 268,
		name: 'Pearl',
		status: 'no_signal',
		zone: 'Barn 2 · Pen B',
		flags: [{ code: 'SENSOR_SILENT', severity: 'medium', minutesAgo: 190, confidence: 1 }],
		silentMinutes: 190,
		battery: 0.04
	},
	{
		num: 951,
		name: 'Olive',
		status: 'no_signal',
		zone: 'Pasture North',
		flags: [{ code: 'SENSOR_SILENT', severity: 'medium', minutesAgo: 75, confidence: 1 }],
		silentMinutes: 75,
		battery: 0.51
	}
];

function mulberry32(seed: number) {
	let a = seed;
	return () => {
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const minutes = (m: number) => m * 60_000;
const iso = (ms: number) => new Date(ms).toISOString();
const round = (n: number, digits = 0) => {
	const f = 10 ** digits;
	return Math.round(n * f) / f;
};

/** Deterministic herd of 120 animals, with timestamps relative to `now`. */
export function generateHerd(now: number = Date.now()): Animal[] {
	const rand = mulberry32(HERD_SEED);
	const between = (min: number, max: number) => min + rand() * (max - min);

	const usedNums = new Set(CURATED.map((s) => s.num));
	const specs: Spec[] = [...CURATED];
	const nameQueue = NAMES.filter((n) => !CURATED.some((s) => s.name === n));

	for (let i = CURATED.length; i < HERD_SIZE; i++) {
		let num: number;
		do {
			num = 1 + Math.floor(rand() * 999);
		} while (usedNums.has(num));
		usedNums.add(num);
		specs.push({
			num,
			name: nameQueue[i - CURATED.length],
			status: 'healthy',
			zone: ZONES[Math.floor(rand() * ZONES.length)],
			flags: []
		});
	}

	return specs
		.map((spec): Animal => {
			const rumBase = round(between(430, 500));
			const actBase = round(between(60, 80));
			const yieldBase = round(between(22, 35), 1);
			const vitals: Vitals = {
				ruminationMinutes24h: round(rumBase * between(0.94, 1.06)),
				ruminationBaseline: rumBase,
				activityIndex: round(actBase * between(0.9, 1.1)),
				activityBaseline: actBase,
				bodyTempC: round(between(38.3, 38.9), 1),
				yieldLitres24h: round(yieldBase * between(0.93, 1.05), 1),
				yieldBaseline: yieldBase,
				...spec.vitals
			};

			const flags: Flag[] = spec.flags.map((f) => ({
				code: f.code,
				severity: f.severity,
				detectedAt: iso(now - minutes(f.minutesAgo)),
				confidence: f.confidence
			}));
			const oldest = flags.length ? Math.min(...flags.map((f) => Date.parse(f.detectedAt))) : null;
			const contactAgo = spec.silentMinutes ?? Math.floor(between(1, 9));
			const lastContact = iso(now - minutes(contactAgo));

			return {
				id: `a_${String(spec.num).padStart(5, '0')}`,
				tag: `IT042-${String(spec.num).padStart(4, '0')}`,
				name: spec.name,
				lactationDay: spec.lactationDay ?? Math.floor(between(8, 380)),
				status: spec.status,
				statusSince: oldest ? iso(oldest) : iso(now - minutes(between(600, 20000))),
				flags,
				vitals,
				location: { zone: spec.zone, lastSeen: lastContact },
				sensor: { battery: spec.battery ?? round(between(0.3, 1), 2), lastContact }
			};
		})
		.sort((a, b) => a.id.localeCompare(b.id));
}
