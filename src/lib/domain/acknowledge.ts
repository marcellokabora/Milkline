import type { Animal } from '../api/types';

/** "I've seen her": the farmer has looked at this animal in the state captured by `signature`. */
export interface Acknowledgement {
	signature: string;
	at: number;
}

export type Acknowledgements = Record<string, Acknowledgement>;

/** What the farmer saw: status plus each active flag and its severity. Confidence jitter is not included. */
export function ackSignature(animal: Animal): string {
	const flags = animal.flags.map((f) => `${f.code}:${f.severity}`).sort();
	return [animal.status, ...flags].join('|');
}

export function acknowledge(acks: Acknowledgements, animal: Animal, at: number): Acknowledgements {
	return { ...acks, [animal.id]: { signature: ackSignature(animal), at } };
}

export function unacknowledge(acks: Acknowledgements, id: string): Acknowledgements {
	const { [id]: _removed, ...rest } = acks;
	return rest;
}

/**
 * Handled only for today, and only while nothing new happened: a new flag, a worse status or a
 * changed severity puts the animal back on the list. `day` is `new Date(now).toDateString()`.
 */
export function isAcknowledged(acks: Acknowledgements, animal: Animal, day: string): boolean {
	if (animal.status === 'healthy') return false;
	const ack = acks[animal.id];
	return (
		ack !== undefined &&
		new Date(ack.at).toDateString() === day &&
		ack.signature === ackSignature(animal)
	);
}
