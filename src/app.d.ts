// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare global {
	/** Set at build time: true for the static GitHub Pages build, which has no server for the mock API. */
	const __MOCK_IN_BROWSER__: boolean;
}

export {};
