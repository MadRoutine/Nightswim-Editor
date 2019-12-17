# Nightswim Editor

Nightswim Editor is build in [Electron](https://electronjs.org/) and packaged by
[Electron Builder](https://electron.build/). It uses
[Monaco](https://microsoft.github.io/monaco-editor/index.html) as its code
editor.

Keyboard shortcuts in editor:
- All the regular ones like CTRL+O, CTRL+S, etc.
- Alt + S to start playtesting
- Alt + Z to toggle Word Wrap

## Build info
1. In order to build Nightswim Editor you need to download and install [Yarn](www.yarnpkg.com), and (optionally)
[Git](www.git-scm.com).
2. Clone this repository (or download the zip-file from GitHub and put it somewhere on your hard drive)
3. In a terminal, navigate to the folder where you downloaded/cloned the Nightswim Editor code
4. Install all dependencies:
`yarn install`
5. Start it directly or build it:
`yarn start` or `yarn dist`

## License information
Nightswim Editor is released under the MIT license. It includes the following (unmodified) open source components:
- Electron: MIT License
- Monaco: MIT License
- jQuery: MIT License
- Keypress: Apache License 2.0

License files for these components can be found in the lib/ directory
