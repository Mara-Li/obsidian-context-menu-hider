import { PluginSettingTab, type App, Setting, Modal } from "obsidian";
import type CustomMenuPlugin from "src/main";

export interface HideMenuSettings {
	hideTitles: string[];
}

export const DEFAULT_SETTINGS: HideMenuSettings = {
	hideTitles: [],
};

class ImportOldSettings extends Modal {
	result: string[] = [];
	onSubmit: (result: string[]) => void;
	constructor(app: App, onSubmit: (result: string[]) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClasses(["custom-menu-settings", "import-old-settings"]);

		new Setting(contentEl).setHeading().setName("Import old settings");

		new Setting(contentEl).setClass("no-display").addTextArea((text) => {
			text.setPlaceholder(
				"Paste your old settings here, as a string separated by commas"
			);
			text.onChange((value) => {
				this.result = value.split(/[,\n] ?/).map((v) => v.trim());
			});
		});

		new Setting(contentEl)

			.addButton((button) => {
				button
					.setButtonText("Import")
					.onClick(() => {
						this.onSubmit(this.result);
						this.close();
					})
					.setCta();
			})
			.addButton((button) => {
				button
					.setButtonText("Cancel")
					.onClick(() => this.close())
					.setWarning();
			});
	}
	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export default class HideMenuSettingsTab extends PluginSettingTab {
	plugin: CustomMenuPlugin;
	settings: HideMenuSettings;

	constructor(app: App, plugin: CustomMenuPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = plugin.settings;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("custom-menu-settings");

		/* Import old settings */
		new Setting(containerEl).setClass("no-display").addButton((button) => {
			button
				.setCta()
				.setButtonText("Import old settings")
				.onClick(() => {
					new ImportOldSettings(this.app, async (result) => {
						this.settings.hideTitles.push(...result);
						await this.plugin.saveSettings();
						this.display();
					}).open();
				});
		});

		/* Hide commands */
		new Setting(containerEl)
			.setHeading()
			.setName("Hide commands")
			.setDesc(
				"Enter the names of the commands. You will need to restart the plugin or Obsidian for the changes to take effect."
			)
			.addButton((button) => {
				button
					.setButtonText("Add command")
					.setCta()
					.onClick(async () => {
						//push at the start of the array
						this.settings.hideTitles.unshift("");
						await this.plugin.saveSettings();
						this.display();
					});
			});

		this.settings.hideTitles.forEach((title, index) => {
			//add class where there are duplicates
			const duplicate =
				this.settings.hideTitles.filter((value) => title === value).length > 1;
			const isEmpty = title.trim().length === 0;
			new Setting(containerEl)
				.setClass("no-display")
				.addText((text) => {
					text.setValue(title).onChange(async (value) => {
						this.settings.hideTitles[index] = value;
						//display an error if the text is duplicated
						await this.plugin.saveSettings();
						//remove the error class if there is now only one instance of the text
						const duplicate =
							this.settings.hideTitles.filter((value) => title === value).length > 1;
						const isEmpty = value.trim().length === 0;
						text.inputEl.toggleClass("error", duplicate || isEmpty);
					});
					text.inputEl.toggleClass(
						"error",
						this.settings.hideTitles.filter((value) => title === value).length > 1 ||
							isEmpty
					);
					text.inputEl.ariaLabel = duplicate
						? "Duplicate command"
						: isEmpty
							? "Empty command"
							: "Command name, insensitive";
				})
				.addExtraButton((button) => {
					button
						.setIcon("trash")
						.setTooltip("Delete command")
						.onClick(async () => {
							this.settings.hideTitles.splice(index, 1);
							await this.plugin.saveSettings();
							this.display();
						});
				});
		});
	}
}
