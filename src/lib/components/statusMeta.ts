import OctagonAlert from '@lucide/svelte/icons/octagon-alert';
import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
import Eye from '@lucide/svelte/icons/eye';
import CircleCheck from '@lucide/svelte/icons/circle-check';
import WifiOff from '@lucide/svelte/icons/wifi-off';
import Thermometer from '@lucide/svelte/icons/thermometer';
import Wheat from '@lucide/svelte/icons/wheat';
import Footprints from '@lucide/svelte/icons/footprints';
import Zap from '@lucide/svelte/icons/zap';
import Milk from '@lucide/svelte/icons/milk';
import Flame from '@lucide/svelte/icons/flame';
import Baby from '@lucide/svelte/icons/baby';
import RadioTower from '@lucide/svelte/icons/radio-tower';
import type { Component } from 'svelte';
import type { AnimalStatus, FlagCode } from '../api/types';

type Icon = Component<{ class?: string; size?: number | string; 'aria-hidden'?: 'true' }>;

export interface StatusMeta {
	label: string;
	icon: Icon;
	/** Tinted fill, readable text and a solid border: used by chips and summary tiles. */
	tone: string;
	/** Solid colour for the card's leading edge. */
	stripe: string;
	border: string;
}

// Status is never colour alone: every status has its own icon and word.
export const STATUS_META: Record<AnimalStatus, StatusMeta> = {
	critical: {
		label: 'Critical',
		icon: OctagonAlert as Icon,
		tone: 'bg-status-critical-bg text-status-critical-fg border-status-critical',
		stripe: 'bg-status-critical',
		border: 'border-status-critical'
	},
	attention: {
		label: 'Attention',
		icon: TriangleAlert as Icon,
		tone: 'bg-status-attention-bg text-status-attention-fg border-status-attention',
		stripe: 'bg-status-attention',
		border: 'border-status-attention'
	},
	watch: {
		label: 'Watch',
		icon: Eye as Icon,
		tone: 'bg-status-watch-bg text-status-watch-fg border-status-watch',
		stripe: 'bg-status-watch',
		border: 'border-status-watch'
	},
	healthy: {
		label: 'Healthy',
		icon: CircleCheck as Icon,
		tone: 'bg-status-healthy-bg text-status-healthy-fg border-status-healthy',
		stripe: 'bg-status-healthy',
		border: 'border-border'
	},
	no_signal: {
		label: 'No signal',
		icon: WifiOff as Icon,
		tone: 'bg-status-nosignal-bg text-status-nosignal-fg border-status-nosignal',
		stripe: 'bg-status-nosignal',
		border: 'border-status-nosignal'
	}
};

export const FLAG_ICONS: Record<FlagCode, Icon> = {
	RUMINATION_DROP: Wheat as Icon,
	ACTIVITY_LOW: Footprints as Icon,
	ACTIVITY_SPIKE: Zap as Icon,
	TEMP_HIGH: Thermometer as Icon,
	YIELD_DROP: Milk as Icon,
	HEAT_DETECTED: Flame as Icon,
	CALVING_IMMINENT: Baby as Icon,
	SENSOR_SILENT: RadioTower as Icon
};
