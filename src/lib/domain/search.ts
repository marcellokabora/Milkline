import type { Animal } from '../api/types';
import { compareByPriority } from './priority';

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export interface TagSegment {
	text: string;
	match: boolean;
}

/**
 * Splits a tag into plain/matched segments so the UI can highlight the part of the tag a
 * search query found, using the same rule as searchAnimals: a digits-only query only matches
 * the serial after the last dash, anything else can match anywhere in the tag.
 */
export function highlightTag(tag: string, query: string): TagSegment[] {
	const q = normalise(query);
	if (!q) return [{ text: tag, match: false }];

	const digitsOnly = /^\d+$/.test(q);
	const dashIndex = tag.lastIndexOf('-');
	const scopeStart = digitsOnly && dashIndex !== -1 ? dashIndex + 1 : 0;
	const scope = tag.slice(scopeStart);

	let normalised = '';
	const toOriginal: number[] = [];
	for (let i = 0; i < scope.length; i++) {
		const ch = scope[i].toLowerCase();
		if (/[a-z0-9]/.test(ch)) {
			normalised += ch;
			toOriginal.push(i);
		}
	}

	const at = normalised.indexOf(q);
	if (at === -1) return [{ text: tag, match: false }];

	const start = scopeStart + toOriginal[at];
	const end = scopeStart + toOriginal[at + q.length - 1] + 1;

	return [
		{ text: tag.slice(0, start), match: false },
		{ text: tag.slice(start, end), match: true },
		{ text: tag.slice(end), match: false }
	].filter((segment) => segment.text.length > 0);
}

/**
 * Splits a name into plain/matched segments for the same reason as highlightTag: letters-only
 * queries can match the start of the name ("sa" finds "Sage"), digits-only queries never do.
 */
export function highlightName(name: string, query: string): TagSegment[] {
	const q = normalise(query);
	if (!q || /^\d+$/.test(q)) return [{ text: name, match: false }];

	let normalised = '';
	const toOriginal: number[] = [];
	for (let i = 0; i < name.length; i++) {
		const ch = name[i].toLowerCase();
		if (/[a-z0-9]/.test(ch)) {
			normalised += ch;
			toOriginal.push(i);
		}
	}
	if (!normalised.startsWith(q)) return [{ text: name, match: false }];

	const end = toOriginal[q.length - 1] + 1;
	return [
		{ text: name.slice(0, end), match: true },
		{ text: name.slice(end), match: false }
	].filter((segment) => segment.text.length > 0);
}

/**
 * Digits-only queries match the serial part of the tag ("231" finds IT042-0231), since every
 * tag in a herd shares the same prefix. Anything with letters matches the full tag or the name.
 */
export function searchAnimals(animals: Animal[], query: string): Animal[] {
	const q = normalise(query);
	if (!q) return [];
	const digitsOnly = /^\d+$/.test(q);

	const scored: { animal: Animal; exact: boolean }[] = [];
	for (const animal of animals) {
		const serial = normalise(animal.tag.split('-').pop() ?? '');
		if (digitsOnly) {
			if (serial.includes(q)) scored.push({ animal, exact: serial.endsWith(q) });
		} else if (normalise(animal.tag).includes(q) || normalise(animal.name).startsWith(q)) {
			scored.push({ animal, exact: normalise(animal.tag).endsWith(q) });
		}
	}
	return scored
		.sort((a, b) => Number(b.exact) - Number(a.exact) || compareByPriority(a.animal, b.animal))
		.map((s) => s.animal);
}
