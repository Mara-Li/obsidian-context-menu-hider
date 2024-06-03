import { Plugin, MenuItem } from "obsidian";
import HideMenuSettingsTab, {
	type HideMenuSettings,
	DEFAULT_SETTINGS,
} from "./settingsTab";
import { around } from "monkey-around";

export default class CustomMenuPlugin extends Plugin {
	settings: HideMenuSettings;

	async onload() {
		console.log("Loading customizable menu");

		await this.loadSettings();
		this.addSettingTab(new HideMenuSettingsTab(this.app, this));

		/* moneky-around doesn't know about my this.settings, need to set it here */

		const hideTitles = new Set(
			this.settings.hideTitles
				.map((title) => title.toLowerCase())
				.filter((title) => title.trim().length > 0)
		);
		/* Hide menu items */
		/* https://github.com/Panossa/mindful-obsidian/blob/master/main.ts */
		this.register(
			around(MenuItem.prototype, {
				setTitle(old) {
					return function (title: string | DocumentFragment) {
						this.dom.dataset.stylizerTitle = String(title);

						if (hideTitles.has(String(title).toLowerCase())) {
							this.dom.addClass("custom-menu-hide-item");
						}

						return old.call(this, title);
					};
				},
			})
		);
	}

	//add command to right-click menu

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
