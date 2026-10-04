interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PwaStore {
	canInstall = $state(false);
	private deferred: BeforeInstallPromptEvent | null = null;

	/** Captures the browser's install prompt so it can be offered from our own button. */
	init(): () => void {
		const onPrompt = (e: Event) => {
			e.preventDefault();
			this.deferred = e as BeforeInstallPromptEvent;
			this.canInstall = true;
		};
		const onInstalled = () => {
			this.deferred = null;
			this.canInstall = false;
		};
		window.addEventListener('beforeinstallprompt', onPrompt);
		window.addEventListener('appinstalled', onInstalled);
		return () => {
			window.removeEventListener('beforeinstallprompt', onPrompt);
			window.removeEventListener('appinstalled', onInstalled);
		};
	}

	async install() {
		const event = this.deferred;
		if (!event) return;
		// The prompt can only be used once, whatever the user answers.
		this.deferred = null;
		this.canInstall = false;
		await event.prompt();
		await event.userChoice;
	}
}

export const pwa = new PwaStore();
