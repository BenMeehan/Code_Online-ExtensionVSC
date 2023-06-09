# RunCodeOnline VSCode Extension

The CodeOnline extension for Visual Studio Code allows you to run code from various programming languages using an online compiler API. It takes the code from the currently open file, makes an API request to compile it, and provides the output in a separate output text file. It also supports providing custom inputs for the code execution.

## Features

- Supports multiple programming languages.
- Automatically detects the language based on the file extension.
- Reads the code from the currently open file in the editor.
- Optionally reads custom inputs from an `input.txt` file.
- Makes an API request to an online compiler to compile the code.
- Saves the output in an output text file with the same name as the input file but with `-output` suffix.

## Prerequisites

To use this extension, you need:

- Visual Studio Code installed on your machine.
- Internet connectivity.

## Installation

1. Launch Visual Studio Code.
2. Go to the Extensions view (Ctrl+Shift+X).
3. Search for "CodeOnline" and click Install.
4. Once installed, you're ready to use the extension.

## Usage

1. Open the file containing the code you want to run.
2. Make sure there is an optional `input.txt` file in the same directory if you want to provide custom inputs.
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the Command Palette.
4. Type "CodeOnline: Run" and select the command.
5. The extension will compile the code and display a message in the status bar.
6. Once the compilation is complete, check the output in a new file with the same name as the input file but with `-output` suffix.

## Supported Languages

The CodeOnline extension currently supports the following programming languages:

- C++
- C
- Python
- Java
- Javascript
- Go
- Rust
*more to be added soon...*

## Configuration

The extension uses an online compiler API for code compilation. The API endpoint is currently set to `https://load-balancer-1l8h.onrender.com/compile`. If you want to use a different API or change any other configurations, you can modify the `config` object in the extension code.

## Feedback and Contributions

If you encounter any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request on the GitHub repository of this extension.