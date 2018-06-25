# Nightswim Editor

Nightswim Editor is build in [Electron](https://electronjs.org/) and packaged by
[Electron Forge](https://electronforge.io/). It uses
[Monaco](https://microsoft.github.io/monaco-editor/index.html) as its code
editor.

Keyboard shortcuts in editor:
- All the regular ones like CTRL+O, CTRL+S, etc.
- Alt + S to start playtesting
- Alt + Z to toggle Word Wrap

Keyboard shortcuts in Story Preview window:
- R to reload
- ESC to close

## Build info
In order to build Nightswim Editor with Electron Forge you need to download and install [Node.js](www.nodejs.com) and
[Git](www.git-scm.com). Alternatively you can use [Electron Builder](https://www.electron.build/) or manually do each step of the packaging. Instructions for building with
Electron Forge:
1. Install Node.js & Git
2. Clone this repository (or download the ZIP and put it somewhere on your hard drive)
3. Install Electron Forge from the command line:
`npm install -g electron-forge`
4. Navigate to the folder where you downloaded/cloned the Nightswim Editor code, and make a
   new directory called "Temp".
5. Navigate to Temp on the command line, and initialize a new Electron Forge
   project: `electron-forge init`. Electron Forge will now download all
   development dependencies.
6. Open the package.json file in the root folder, copy
   everything from the top up until `"dependencies"`, and paste it over the same
   info in the package.json in temp/.
7. Cut node_modules, .compilerc, .eslintrc, package.json and package-lock.json
   from temp/ and paste it in the root folder, overwriting the files that are
   there already.
8. Delete the temp/ folder.
9. Build it!
`electron-forge make`

## License information
Nightswim Editor is released under the MIT license. It includes the following (unmodified) open source components:
- Monaco: MIT License
- jQuery: MIT License
- Keypress: Apache License 2.0

License files for these components can be found in the lib/ directory
