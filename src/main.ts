import { Plugin, MenuItem } from "obsidian";
import HideMenuSettingsTab, {
	type HideMenuSettings,
	DEFAULT_SETTINGS,
	FIND_REGEX,
} from "./settingsTab";
import { around } from "monkey-around";

export default class CustomMenuPlugin extends Plugin {
	settings: HideMenuSettings;
	activeMonkeys: Record<string, any> = {};

	monkeyPatch(hideTitles: Set<string>) {
		const matchWithRegex = this.matchWithRegex.bind(this);
		console.log(`[${this.manifest.name}] Monkey patching - Hiding menu items`);
		this.activeMonkeys.menu = around(MenuItem.prototype, {
			setTitle(old) {
				return function (title: string | DocumentFragment) {
					this.dom.dataset.stylizerTitle = String(title);
					for (const hidden of hideTitles) {
						if (matchWithRegex(String(title).toLowerCase(), hidden)) {
							this.dom.classList.add("custom-menu-hide-item");
						}
					}
					return old.call(this, title);
				};
			},
		});
	}

	createRegexFromText(toReplace: string): RegExp {
		const flagsRegex = toReplace.match(/\/([gimy]+)$/);
		const flags = flagsRegex ? Array.from(new Set(flagsRegex[1].split(""))).join("") : "";
		return new RegExp(toReplace.replace(/\/(.+)\/.*/, "$1"), flags);
	}

	matchWithRegex(title: string, command: string) {
		if (command.match(FIND_REGEX)) {
			const regex = this.createRegexFromText(command);
			return title.match(regex);
		} else return title.toLowerCase() === command.toLowerCase();
	}

	reloadHideTitles() {
		return new Set(
			this.settings.hideTitles
				.map((title) => title.toLowerCase())
				.filter((title) => title.trim().length > 0)
		);
	}

	async onload() {
		console.log(`[${this.manifest.name}] Loading`);

		await this.loadSettings();
		this.addSettingTab(new HideMenuSettingsTab(this.app, this));

		/* moneky-around doesn't know about my this.settings, need to set it here */

		const hideTitles = this.reloadHideTitles();
		/* Hide menu items */
		/* https://github.com/Panossa/mindful-obsidian/blob/master/main.ts */
		this.monkeyPatch(hideTitles);
	}

	//add command to right-click menu

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	onunload(): void {
		console.log(`[${this.manifest.name}] Unloading`);
		for (const monkey of Object.values(this.activeMonkeys)) {
			monkey();
		}
		this.activeMonkeys = {};
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
