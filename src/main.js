const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const path = require("path");
//const { addBypassChecker } = require("electron-compile");

let allWindows = [];
let openFileRequest = "";
let fileOnStart = process.argv[1];

/* This bypasses the Electron-Compile security layer that prevents any assets
from outside the project from loading
addBypassChecker((filePath) => {
  return filePath.indexOf(app.getAppPath()) === -1;
});


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) { // eslint-disable-line global-require
  app.quit();
}
*/

// Check on macOS if somebody launched the app by dropping a file on the icon
// in the dock. NEEDS TESTING!
app.on("open-file", (event, file) => {
  event.preventDefault();
  // Store the filename
  openFileRequest = file;
});

// Read file that launched the program and return data to the render process
ipcMain.on("get-file-data", function(event) {
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
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  let url = path.resolve(__dirname, "editor/editor.html");
  newWindow.loadURL(url);

  // Open the DevTools.
  // newWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  newWindow.on("closed", function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    let thisWindowIndex = allWindows.indexOf(newWindow);
    allWindows.splice(thisWindowIndex, 1);
    newWindow = null;
  });

  newWindow.on("close", (event) => {
    newWindow.focus();
    newWindow.webContents.send("request-save-dialog-on-close");
    event.preventDefault();
  });

  newWindow.webContents.on("did-finish-load", (event) => {
    newWindow.webContents.send("loading-done", newWindow.id);
  });

  allWindows.push(newWindow);
  return newWindow;
};

function createPlayWindow(playtestPath) {
  let newWindow;

  newWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    icon: path.join(__dirname, "images/icons/app_icon_64.png"),
    webPreferences: {
      nodeIntegration: true
    }
  });

  // newWindow.webContents.openDevTools();

  // newWindow.setMenu(null);

  newWindow.maximize();

  let url = path.resolve(__dirname, "playtest/playtest.html");
  newWindow.loadFile(url);

  newWindow.on("closed", () => {
    let thisWindowIndex = allWindows.indexOf(newWindow);
    allWindows.splice(thisWindowIndex, 1);
    newWindow = null;
  });

  newWindow.webContents.on("did-finish-load", (event) => {
    newWindow.webContents.send("playtest-loading-done", playtestPath, newWindow.id);
  });

  allWindows.push(newWindow);
  return newWindow;
};

function createLicenseWindow(whichLicense) {
  let newWindow;

  newWindow = new BrowserWindow({
    width: 800,
    height: 1000,
    icon: path.join(__dirname, "images/icons/app_icon_64.png"),
    webPreferences: {
      nodeIntegration: true
    }
  });

  // newWindow.webContents.openDevTools();
  newWindow.setMenu(null);

  let url = path.resolve(__dirname, "license/license.html");
  newWindow.loadFile(url);

  newWindow.on("closed", () => {
    let thisWindowIndex = allWindows.indexOf(newWindow);
    allWindows.splice(thisWindowIndex, 1);
    newWindow = null;
  });

  newWindow.webContents.on("did-finish-load", (event) => {
    newWindow.webContents.send("load-license", whichLicense, newWindow.id);
  });

  allWindows.push(newWindow);
  return newWindow;
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  mainWindow = createWindow();
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  let activeWindows = BrowserWindow.getAllWindows();

  if (
    (activeWindows.length < 1 || activeWindows === undefined ) &&
    mainWindow === null
  ) {
    mainWindow = createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on("close-window-request", (event, windowId) => {
  console.log("Closing window with id " + windowId);
  let thisWindow = BrowserWindow.fromId(windowId);
  thisWindow.destroy();
});

ipcMain.on("create-new-window", () => {
    createWindow();
});

ipcMain.on("create-new-play-window", (event, path) => {
  createPlayWindow(path);
});

ipcMain.on("create-new-license-window", (event, whichLicense) => {
  createLicenseWindow(whichLicense);
});

ipcMain.on("update-title", (event, windowId, file) => {
  let thisWindow = BrowserWindow.fromId(windowId);
  thisWindow.setTitle(file + " - Nightswim Editor");
});

ipcMain.on("reload-playtest", (event, windowId) => {
  let thisWindow = BrowserWindow.fromId(windowId);
  thisWindow.reload();
});

ipcMain.on("toggle-dev-tools", (event, windowId) => {
  let thisWindow = BrowserWindow.fromId(windowId);
  thisWindow.toggleDevTools();
});

// ESLint will warn about any use of eval(), even this one
// eslint-disable-next-line
global.eval = function () {
    throw new Error("Sorry, this app does not support window.eval().");
};