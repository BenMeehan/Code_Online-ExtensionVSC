# Run Code Online — VS Code Extension

Compile and run code in **28+ programming languages** directly from VS Code using an online compiler API. With AI-powered code analysis, custom input support, and seamless editor integration.

## Supported Languages

| Category | Languages |
|---|---|
| **Systems** | C, C++, Rust, Go, D, Assembly (NASM x86-64) |
| **JVM** | Java, Kotlin, Scala, Groovy |
| **Scripting** | Python, JavaScript, TypeScript, Ruby, PHP, Perl, Lua, Bash |
| **Functional** | Haskell, OCaml, Erlang, Elixir, Racket |
| **Enterprise** | C#, Pascal, Fortran |
| **Data Science** | R, Prolog |

> The extension auto-detects the language from your file extension. See the [backend README](https://github.com/benmeehan/gomult#supported-languages) for the full list of 28 language keys and their extensions.

## Features

- **28+ languages** — C, C++, Python, Java, JavaScript, Go, Rust, TypeScript, Kotlin, Scala, Ruby, PHP, Haskell, and many more
- **Dynamic language discovery** — Auto-fetches supported languages from the API server on startup
- **AI-powered analysis** — Optional Deepseek AI integration that analyzes your code for bugs, suggests fixes, and explains errors
- **Custom input** — Enter stdin input inline via dialog, read from `input.txt`, or run without input
- **Output channel** — Results are displayed in a dedicated VS Code output channel (with optional file output)
- **Progress indicator** — Visual progress notification while your code runs
- **Status bar integration** — One-click run from the status bar, shows the current language
- **Keyboard shortcut** — `Ctrl+Alt+R` (`Cmd+Alt+R` on macOS)
- **Context menu** — Right-click in the editor to run with/without input
- **Editor title button** — Run button in the editor title bar
- **Configurable API URL** — Point to your own server or the public one
- **Auto-save** — Automatically saves your file before sending it

## Installation

1. Launch VS Code
2. Go to Extensions (`Ctrl+Shift+X`)
3. Search for **Run Code Online**
4. Click **Install**

## Usage

### Quick Run
1. Open a code file (`.py`, `.cpp`, `.java`, `.js`, etc.)
2. Press **`Ctrl+Alt+R`** (or `Cmd+Alt+R` on macOS)
3. Choose how to provide input (or skip)
4. View results in the **Output** panel

### Other Ways to Run

| Method | Action |
|---|---|
| **Status bar** | Click the `▶ Run <Language>` button in the status bar |
| **Command Palette** | `Ctrl+Shift+P` → `Run Code Online` |
| **Right-click** | Right-click in the editor → `Run Code Online` |
| **Editor title** | Click the `▶` icon in the editor title bar |
| **With input** | Command Palette → `Run Code Online (with input)` |
| **No input** | Command Palette → `Run Code Online (no input)` |

### Providing Input
The extension offers three input modes:
- **Enter custom input** — Type stdin data in an input box
- **Read from input.txt** — Auto-reads `input.txt` from your file's directory
- **No input** — Runs the program without stdin

### AI Analysis
Enable AI-powered code analysis in Settings (`Ctrl+,`):
- Set `codeOnline.analyze` to `true`
- The server must be configured with a Deepseek API key
- Analysis results appear at the bottom of the output

### Output
- Results are displayed in the **Output** panel (View → Output → select "Run Code Online")
- A copy is also saved as `<filename>-output.txt` in the same directory

## Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `codeOnline.apiUrl` | `string` | `https://load-balancer-1l8h.onrender.com` | API server URL |
| `codeOnline.analyze` | `boolean` | `false` | Enable AI code analysis |
| `codeOnline.showHeader` | `boolean` | `true` | Show info header in output |

## Feedback and Support

For issues, suggestions, or feature requests:
- **Email**: benmeehan111@gmail.com
- **Source**: [github.com/benmeehan/gomult](https://github.com/benmeehan/gomult)

**Enjoy coding with Run Code Online!**
