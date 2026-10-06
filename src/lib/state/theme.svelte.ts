type Theme = 'light' | 'dark';

const STORAGE_KEY = 'milkline:theme';

class ThemeStore {
	resolved = $state<Theme>('light');

	/** Follows the system until the farmer picks a theme by hand; the choice then sticks. */
	init(): () => void {
		this.resolved = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
		const media = matchMedia('(prefers-color-scheme: dark)');
		const onChange = (e: MediaQueryListEvent) => {
			if (!localStorage.getItem(STORAGE_KEY)) this.apply(e.matches ? 'dark' : 'light');
		};
		media.addEventListener('change', onChange);
		return () => media.removeEventListener('change', onChange);
	}

	toggle() {
		const next: Theme = this.resolved === 'dark' ? 'light' : 'dark';
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// ignore
		}
		this.apply(next);
	}

	private apply(theme: Theme) {
		this.resolved = theme;
		document.documentElement.dataset.theme = theme;
		const bar = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
		if (bar) bar.content = theme === 'dark' ? '#0e1116' : '#f4f1ea';
	}
}

export const theme = new ThemeStore();
