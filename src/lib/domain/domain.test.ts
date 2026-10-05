import { describe, expect, it } from 'vitest';
import type { Animal, Flag } from '../api/types';
import { generateHerd } from '../api/mock/generate';
import { acknowledge, isAcknowledged, unacknowledge } from './acknowledge';
import { applyStreamEvent } from './events';
import { computeFreshness } from './freshness';
import { describeFlag, confidenceWord } from './flagCopy';
import { formatAgo, formatDuration } from './format';
import { compareByPriority, statusFromFlags } from './priority';
import { highlightTag, searchAnimals } from './search';

const NOW = Date.parse('2026-09-18T04:52:11Z');
const herd = generateHerd(NOW);
const byTag = (tag: string) => structuredClone(herd.find((a) => a.tag === tag) as Animal);

describe('mock herd', () => {
	it('has 120 unique animals and 3-8 that need attention', () => {
		expect(herd).toHaveLength(120);
		expect(new Set(herd.map((a) => a.id)).size).toBe(120);
		expect(new Set(herd.map((a) => a.tag)).size).toBe(120);
		expect(herd.every((a) => a.name)).toBe(true);
		const needAttention = herd.filter((a) => a.status === 'critical' || a.status === 'attention');
		expect(needAttention.length).toBeGreaterThanOrEqual(3);
		expect(needAttention.length).toBeLessThanOrEqual(8);
	});

	it('keeps every animal status consistent with its flags', () => {
		for (const animal of herd) expect(statusFromFlags(animal.flags)).toBe(animal.status);
	});
});

describe('priority', () => {
	it('puts critical before attention, then severity, then longest-running', () => {
		const sorted = herd
			.filter((a) => a.status !== 'healthy')
			.sort(compareByPriority)
			.map((a) => a.name);
		// Both critical with a high-severity flag; Maple's flag has the higher confidence.
		expect(sorted.slice(0, 2)).toEqual(['Maple', 'Bluebell']);
		expect(sorted[2]).toBe('Greta');
	});
});

describe('stream events', () => {
	it('raises a flag and moves the status', () => {
		const animal = byTag('IT042-0231');
		const raised: Flag = { code: 'TEMP_HIGH', severity: 'high', confidence: 0.88, detectedAt: '' };
		applyStreamEvent(animal, {
			type: 'flag_raised',
			animalId: animal.id,
			at: '2026-09-18T04:53:40Z',
			flag: { code: raised.code, severity: raised.severity, confidence: raised.confidence },
			statusChangedTo: 'critical'
		});
		expect(animal.status).toBe('critical');
		expect(animal.statusSince).toBe('2026-09-18T04:53:40Z');
		expect(animal.flags.map((f) => f.code)).toContain('TEMP_HIGH');
	});

	it('clears a flag and falls back to the remaining flags', () => {
		const animal = byTag('IT042-0488');
		applyStreamEvent(animal, {
			type: 'flag_cleared',
			animalId: animal.id,
			at: '2026-09-18T04:54:01Z',
			flagCode: 'ACTIVITY_LOW'
		});
		expect(animal.flags).toHaveLength(0);
		expect(animal.status).toBe('healthy');
	});

	it('marks a sensor offline and recovers on the next reading', () => {
		const animal = byTag('IT042-0231');
		applyStreamEvent(animal, { type: 'sensor_offline', animalId: animal.id, at: '2026-09-18T04:54:30Z' });
		expect(animal.status).toBe('no_signal');
		applyStreamEvent(animal, {
			type: 'vitals_update',
			animalId: animal.id,
			at: '2026-09-18T04:59:00Z',
			vitals: { activityIndex: 40 }
		});
		expect(animal.status).toBe('attention');
		expect(animal.flags.some((f) => f.code === 'SENSOR_SILENT')).toBe(false);
	});
});

describe('freshness', () => {
	const base = { now: NOW, connected: true };
	it('is live, delayed, then stale as data ages', () => {
		expect(computeFreshness({ ...base, lastDataAt: NOW - 5_000 })).toBe('live');
		expect(computeFreshness({ ...base, lastDataAt: NOW - 60_000 })).toBe('delayed');
		expect(computeFreshness({ ...base, lastDataAt: NOW - 300_000 })).toBe('stale');
	});
	it('never reports live while disconnected', () => {
		expect(computeFreshness({ now: NOW, connected: false, lastDataAt: NOW - 1_000 })).toBe('offline');
	});
	it('is unknown before the first load', () => {
		expect(computeFreshness({ ...base, lastDataAt: null })).toBe('unknown');
	});
});

describe('search', () => {
	it('finds by the serial part of the tag, partial or full', () => {
		expect(searchAnimals(herd, '0231')[0].tag).toBe('IT042-0231');
		expect(searchAnimals(herd, '231')[0].tag).toBe('IT042-0231');
		expect(searchAnimals(herd, 'it042-0488')[0].name).toBe('Bessie');
	});
	it('does not match the shared herd prefix on digits', () => {
		expect(searchAnimals(herd, '042')).not.toHaveLength(herd.length);
	});
	it('returns nothing for an empty or unknown query', () => {
		expect(searchAnimals(herd, '  ')).toEqual([]);
		expect(searchAnimals(herd, 'zzzz')).toEqual([]);
	});
});

describe('highlightTag', () => {
	it('highlights a digits-only match inside the serial, not the shared prefix', () => {
		expect(highlightTag('IT042-0452', '45')).toEqual([
			{ text: 'IT042-0', match: false },
			{ text: '45', match: true },
			{ text: '2', match: false }
		]);
	});
	it('highlights a letters match anywhere in the tag', () => {
		expect(highlightTag('IT042-0452', 'it042')).toEqual([{ text: 'IT042', match: true }, { text: '-0452', match: false }]);
	});
	it('returns the whole tag unmatched when the query misses or is empty', () => {
		expect(highlightTag('IT042-0452', '999')).toEqual([{ text: 'IT042-0452', match: false }]);
		expect(highlightTag('IT042-0452', '')).toEqual([{ text: 'IT042-0452', match: false }]);
	});
});

describe('copy', () => {
	it('explains a flag with the vital next to its baseline, in words', () => {
		const greta = byTag('IT042-0231');
		const copy = describeFlag(greta.flags[0], greta, NOW);
		expect(copy.title).toBe('Chewing less than normal');
		expect(copy.detail).toBe('4 h 51 min a day, usually 7 h 48 min');
	});
	it('turns confidence into words', () => {
		expect(confidenceWord(0.91)).toBe('Very likely');
		expect(confidenceWord(0.74)).toBe('Likely');
		expect(confidenceWord(0.5)).toBe('Possible');
	});
	it('formats durations coarsely', () => {
		expect(formatDuration(162 * 60_000)).toBe('2 h 42 min');
		expect(formatAgo(10_000)).toBe('just now');
		expect(formatAgo(5 * 60_000)).toBe('5 min ago');
	});
});
describe('acknowledge', () => {
	const day = new Date(NOW).toDateString();
	const sick = () => herd.find((a) => a.status === 'attention') as Animal;

	it('hides an animal until something about it changes', () => {
		const animal = structuredClone(sick());
		const acks = acknowledge({}, animal, NOW);
		expect(isAcknowledged(acks, animal, day)).toBe(true);
		applyStreamEvent(animal, {
			type: 'flag_raised',
			animalId: animal.id,
			at: new Date(NOW).toISOString(),
			flag: { code: 'TEMP_HIGH', severity: 'high', confidence: 0.9 },
			statusChangedTo: 'critical'
		});
		expect(isAcknowledged(acks, animal, day)).toBe(false);
	});

	it('only counts for the day it was made, and can be undone', () => {
		const animal = sick();
		const acks = acknowledge({}, animal, NOW);
		expect(isAcknowledged(acks, animal, new Date(NOW + 24 * 3_600_000).toDateString())).toBe(false);
		expect(isAcknowledged(unacknowledge(acks, animal.id), animal, day)).toBe(false);
	});

	it('never applies to healthy animals', () => {
		const animal = herd.find((a) => a.status === 'healthy') as Animal;
		expect(isAcknowledged(acknowledge({}, animal, NOW), animal, day)).toBe(false);
	});
});
