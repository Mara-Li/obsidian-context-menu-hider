# Obsidian Context-menu hider

This plugin allows you to hide any commands, including those of community plugins, to the right click menu. 

## Remove Commands
Add the name of the command to hide exactly as it appears in the Obsidian menu (unless the capitalization). Note that this setting will remove *all* instances of a command with that name from all context menus across Obsidian (note menu, file explorer menu, etc), not just the in-note menu. This means that in cases where a command with the same name appears in several different menus (for instance, "Open in default app" in both the file explorer menu and the note menu), it is currently impossible to hide just one of them.

If you would like to style the listed commands yourself, instead of simply removing them, the selector is `div.custom-menu-hide-item`.

Regex are supported if the text is enclosed by `/` (e.g. `/^Open in default app$/`), as flags (`i`, `g`, `m`, `s`) are supported.

You can try [regex here](https://regex101.com/) but don't forget to set the flavor on **ECMAScript (JavaScript)**.

When a command is added or removed, the menu will automatically hide them, without needing to reload Obsidian or the plugin.

> [!NOTE]
> You need to disable "native menu" to use this.
> This option can be disabled in the "Appareance" > "Native menu"

## Thanks
- This plugin was initially a fork of phibr0's excellent [customizable sidebar](https://github.com/phibr0/obsidian-customizable-sidebar)
- The code for hiding menu items comes in part from Panossa's [Mindful Obsidian](https://github.com/Panossa/mindful-obsidian/blob/master/main.ts)
- The original code for this plugin was written by [kzhovn](https://github.com/kzhovn/obsidian-customizable-menu). I removed part that is now handle by [Obsidian Commander](https://github.com/phibr0/obsidian-commander) and reworked the settings. As the ID of the plugin was changed, you can import safely your old settings with the big button "Import old settings" and copy and paste the string you eventually have before.
