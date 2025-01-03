import {
	PluginSettingTab,
	type App,
	Setting,
	Modal,
	sanitizeHTMLToDom,
	Notice,
} from "obsidian";
import type CustomMenuPlugin from "src/main";

export interface HideMenuSettings {
	hideTitles: string[];
}

export const FIND_REGEX = /^\/(.*)\/[igmsuy]*$/;

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

	isValidRegex(value: string) {
		if (value.match(FIND_REGEX) === null) return true;
		try {
			this.plugin.createRegexFromText(value);
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	isError(value: string, ignoreEmpty = false): boolean {
		return (
			this.settings.hideTitles.filter((title) => title === value).length > 1 ||
			(!ignoreEmpty && value.trim().length === 0) ||
			!this.isValidRegex(value)
		);
	}

	reloadError() {
		this.containerEl.findAll(".command-name").forEach((el) => {
			const input = el.find("input");
			const textValue = input.getAttr("command-name");
			if (textValue) {
				input.toggleClass("error", this.isError(textValue));
			}
		});
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("custom-menu-settings");

		/* Import old settings */
		new Setting(containerEl).setClass("no-display").addButton((button) => {
			button.setButtonText("Import old settings").onClick(() => {
				new ImportOldSettings(this.app, async (result) => {
					this.settings.hideTitles.push(...result);
					await this.plugin.saveSettings();
					this.display();
				}).open();
			});
		});

		/* Hide commands */

		const desc = `<ul>
		<li>Enter the names of the commands.</li>
		<li>Deleted commandes will automatically reloaded.</li>
		<li>Encapsulate the command between <code>/</code> to use a regex match.</li>
		<div data-callout-metadata="" data-callout-fold="" data-callout="example" class="callout" dir="auto"><div class="callout-title" dir="auto"><div class="callout-icon" dir="auto"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-list"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></div><div class="callout-title-inner" dir="auto">Example</div></div><div class="callout-content" dir="auto">
		<p dir="auto"><code>/(.*)icon(.*)/</code> will hide all commands containing the word <code>icon</code> in it.</p>
		</div></div>
		</ul>`;

		new Setting(containerEl)
			.setHeading()
			.setName("Hide commands")
			.setClass("no-display-control")
			.setDesc(sanitizeHTMLToDom(desc));

		let temp = "";

		new Setting(containerEl)
			.setClass("no-display")
			.setClass("no-border-top")
			.addText((text) => {
				text.setPlaceholder("Enter the name of the command");
				text.inputEl.ariaLabel = "Command name, insensitive";
				text.onChange((value) => {
					temp = value;
					text.inputEl.toggleClass("error", this.isError(value, true));
					const plusButton = containerEl.find("[label='Add command']");
					plusButton.toggleClass("is-disabled", this.isError(value));
					plusButton.toggleAttribute("aria-disabled", this.isError(value));
				});
			})
			.addExtraButton((button) => {
				button
					.setIcon("plus")
					.setTooltip("Add command")
					.onClick(async () => {
						if (this.isError(temp)) {
							new Notice("Invalid command");
							return;
						}
						this.settings.hideTitles.unshift(temp);
						temp = "";
						await this.plugin.saveSettings();
						this.plugin.monkeyPatch(this.plugin.reloadHideTitles());
						this.display();
					})
					.extraSettingsEl.setAttr("label", "Add command");
			});

		new Setting(containerEl).setName("Commands").setHeading();
		this.settings.hideTitles.forEach((title, index) => {
			//add class where there are duplicates

			new Setting(containerEl)
				.setClass("no-display")
				.setClass("command-name")
				.addText((text) => {
					text.setValue(title).onChange(async (value) => {
						this.settings.hideTitles[index] = value;
						//display an error if the text is duplicated
						await this.plugin.saveSettings();
						//remove the error class if there is now only one instance of the text
						text.inputEl.toggleClass("error", this.isError(value));
						text.inputEl.setAttr("command-name", value);
						this.reloadError();
					});
					text.inputEl.setAttr("command-name", title);
					this.reloadError();
				})
				.addExtraButton((button) => {
					button
						.setIcon("trash")
						.setTooltip("Delete command")
						.onClick(async () => {
							this.settings.hideTitles.splice(index, 1);
							await this.plugin.saveSettings();
							for (const monkey of Object.values(this.plugin.activeMonkeys)) {
								monkey();
							}
							this.plugin.activeMonkeys = {};
							this.plugin.monkeyPatch(this.plugin.reloadHideTitles());
							this.display();
						});
				});
		});
	}
}
