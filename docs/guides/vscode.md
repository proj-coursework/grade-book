# VS Code

It is recommended to use VS Code for development. You can download and install VSCode from the [official website](https://code.visualstudio.com/Download).

> [!NOTE]
> You can also use other IDEs like [Cursor](https://www.cursor.com/), [Windsurf](https://windsurf.com/), [void](https://voideditor.com/), or other IDEs that are a fork of VS Code.

There is a `.vscode` directory in the root of the project that contains several files that are used to configure the development environment.

## Settings (`.vscode/settings.json`)

You can define your editor settings in the `.vscode/settings.json` file. These will override the default settings. Here is an example of the settings provided in the repository:

```json
{
  "workbench.preferredDarkColorTheme": "Default Dark+", // Set the default dark theme
  "workbench.preferredLightColorTheme": "Visual Studio Dark", // Set the default light theme
  "workbench.colorTheme": "Default Light+", // Set the default theme
  "window.autoDetectColorScheme": true, // Automatically detect the color scheme
  "window.zoomLevel": 0, // Set the default zoom level
  "editor.fontSize": 18, // Set the default font size
  "editor.lineHeight": 1.8, // Set the default line height
  "editor.fontFamily": "MonoLisa", // Set the default font family
  "terminal.integrated.fontSize": 18, // Set the default terminal font size
  "terminal.integrated.lineHeight": 1.8, // Set the default terminal line height
  "terminal.integrated.fontFamily": "MonoLisa", // Set the default terminal font family
  "editor.minimap.enabled": false, // Disable the minimap
  "editor.tabSize": 2, // Set the default tab size
  "editor.wordWrap": "off", // Enable word wrap
  "editor.mouseWheelZoom": true, // Enable mouse wheel zoom
  "editor.formatOnSave": true, // Format the code on save
  "editor.defaultFormatter": "esbenp.prettier-vscode", // Set the default formatter
  "typescript.tsdk": "node_modules/typescript/lib" // Set the TypeScript SDK
}
```

## Extensions (`.vscode/extensions.json`)

You can define a set of recommended extensions in the `.vscode/extensions.json` file. When you open the project in VS Code, it will prompt you to install the recommended extensions if you don't have them installed yet. Here is an example of the extensions provided in the repository:

```json
{
  "recommendations": [
    "ms-vscode.js-debug-nightly",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "mechatroner.rainbow-csv",
    "grapecity.gc-excelviewer"
  ]
}
```

The `rainbow-csv` extension is particularly useful for working with CSV files, as it provides syntax highlighting and formatting for CSV files. The `gc-excelviewer` extension allows you to view Excel files directly in VS Code.

## Debugging (`.vscode/launch.json`)

You can define a set of debugging configurations in the `.vscode/launch.json` file. Here is an example of the configurations provided in the repository:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Script"
      // other configurations...
    }
  ]
}
```

### Debugging TypeScript Scripts

```json
{
  "name": "Debug Script",
  "type": "node",
  "request": "launch",
  // Debug current file
  "program": "${file}",
  // Path to tsx binary (Assuming locally installed)
  "runtimeExecutable": "tsx",
  "runtimeArgs": ["--no-warnings"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "skipFiles": [
    "<node_internals>/**",
    "${workspaceFolder}/node_modules/**"
  ],
},
```

Notice the addition of the `"program"` property. Instead of running the `"dev"` script, we are running `tsx` (with the `--no-warnings` flag) to run the program (the current file).

#### How to use the Script debugger

With the launch configuration in place, you are now ready to debug your script in VSCode:

1. **Set Breakpoints**: Open any of the `.ts` files and set breakpoints by clicking on the left margin of the code lines.

2. **Start Debugging**: Open the Debug panel in VSCode, select "Debug Script" from the dropdown, and click the green play button or press `F5` to start debugging.

VSCode will execute your script in debug mode, pausing at any breakpoints you've set, allowing you to step through your code, inspect variables, and utilize various debugging tools.
