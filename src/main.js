// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");

// Keep an array with all open windows
let allWindows = [];

let openFileRequest = "";
let fileOnStart = process.argv[1];

// Read file that launched the program and return data to the render process
ipcMain.on("get-file-data", function (event) {
  let data = null;
  if (process.platform == "win32" && process.argv.length >= 2) {
    let openFilePath = fileOnStart;
    data = openFilePath;
    openFileRequest = "";
    fileOnStart = null;
  } else if (openFileRequest !== "") {
    data = openFileRequest;
    openFileRequest = "";
  }
  event.returnValue = data;
});

// Prevent menu from showing
Menu.setApplicationMenu(null);

function createWindow () {
  // Create the browser window.
  let newWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    icon: path.join(__dirname, "images/icons/app_icon_64.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  newWindow.loadFile(path.join(__dirname, "editor/editor.html"));

  // Open the DevTools.
  newWindow.webContents.openDevTools();

  // Emitted when the window is actually being closed.
  newWindow.on("closed", function () {
    // Dereference the window object and remove from allWindows array
    let thisWindowIndex = allWindows.indexOf(newWindow);
    allWindows.splice(thisWindowIndex, 1);
    newWindow = null;
  });

  // Emitted when a user clicks the close button
  // Checks if unsaved work needs to be saved before closing
  newWindow.on("close", function (event) {
    newWindow.focus();
    newWindow.webContents.send("request-save-dialog-on-close");
    event.preventDefault();
  });

  newWindow.webContents.on("did-finish-load", function (event) {
    // The editor can now create all event listeners
    newWindow.webContents.send("loading-done", newWindow.id);
  });

  // Add to allWindows array
  allWindows.push(newWindow);
};

function createPlayWindow (playtestPath) {
  let newWindow;

  newWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    icon: path.join(__dirname, "images/icons/app_icon_64.png"),
    webPreferences: {
      nodeIntegration: true
    }
  });

  newWindow.maximize();

  newWindow.loadFile("playtest/playtest.html");

  newWindow.on("closed", function () {
    let thisWindowIndex = allWindows.indexOf(newWindow);
    allWindows.splice(thisWindowIndex, 1);
    newWindow = null;
  });

  newWindow.webContents.on("did-finish-load", function (event) {
    newWindow.webContents.send("playtest-loading-done", playtestPath, newWindow.id);
  });

  allWindows.push(newWindow);
};

function createLicenseWindow (whichLicense) {
  let newWindow;

  newWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    icon: path.join(__dirname, "images/icons/app_icon_64.png"),
    webPreferences: {
      nodeIntegration: true
    }
  });

  newWindow.loadFile("license/license.html");

  newWindow.on("closed", function () {
    let thisWindowIndex = allWindows.indexOf(newWindow);
    allWindows.splice(thisWindowIndex, 1);
    newWindow = null;
  });

  newWindow.webContents.on("did-finish-load", function (event) {
    newWindow.webContents.send("load-license", whichLicense, newWindow.id);
  });

  allWindows.push(newWindow);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  let activeWindows = BrowserWindow.getAllWindows();

  if (
    (activeWindows.length < 1 || activeWindows === undefined ) &&
    allWindows[0] === null
  ) {
    createWindow();
  }
});

// IPC REQUESTS
// =====================================================================

ipcMain.on("close-window-request", function (event, windowId) {
  console.log("Closing window with id " + windowId);
  let thisWindow = BrowserWindow.fromId(windowId);
  thisWindow.destroy();
});

ipcMain.on("create-new-window", function () {
  createWindow();
});

ipcMain.on("create-new-play-window", function (event, path) {
  createPlayWindow(path);
});

ipcMain.on("create-new-license-window", function (event, whichLicense) {
  createLicenseWindow(whichLicense);
});

ipcMain.on("update-title", function (event, windowId, file) {
  let thisWindow = BrowserWindow.fromId(windowId);
  thisWindow.setTitle(file + " - Nightswim Editor");
});

ipcMain.on("reload-playtest", function (event, windowId) {
  let thisWindow = BrowserWindow.fromId(windowId);
  thisWindow.reload();
});

ipcMain.on("toggle-dev-tools", function (event, windowId) {
  let thisWindow = BrowserWindow.fromId(windowId);
  thisWindow.toggleDevTools();
});