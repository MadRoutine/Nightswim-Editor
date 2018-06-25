const fs = require("fs");

const {app, BrowserWindow, dialog, Menu, MenuItem} = require("electron").remote;
const {ipcRenderer, remote} = require("electron");

let currentFile = "newFile";
let currentFileChanged = false;
let openFileRequest = "";
let wordWrap = false;
let thisWindowId;
let aboutOpen = false;

ipcRenderer.on("request-save-dialog-on-close", () => {
    requestSaveDialog("close");
});

ipcRenderer.on("loading-done", (event, windowId) => {

    thisWindowId = windowId;
    console.log("new window: id is " + windowId);

    // Keyboard shortcut listeners
    let listener = new window.keypress.Listener();

    listener.simple_combo("meta s", function () {
        saveFile();
    });

    listener.simple_combo("meta o", function () {
        requestSaveDialog("open");
    });

    listener.simple_combo("meta n", function () {
        ipcRenderer.send("create-new-window");
    });

    listener.simple_combo("option z", function () {
        toggleWordWrap();
    });

    listener.simple_combo("meta w", function () {
        requestSaveDialog("close");
    });

    listener.simple_combo("option s", function () {
        startPlayTest();
    });

    listener.simple_combo("esc", function () {
        if (aboutOpen) {
            closeAbout();
        }
    });

    // Menu click listeners
    $("#save").click(() => {
        saveFile();
    });

    $("#open").click(() => {
        openFileDialog();
    });

    $("#newWindow").click(() => {
        ipcRenderer.send("create-new-window");
    });

    $("#wordWrap").click(() => {
        toggleWordWrap();
    });


    $("#playtest").click(() => {
        startPlayTest();
    });

    // Click listener only works once, or else the outsideClickListener and
    // this button will conflict with eachother
    $("#about").one("click", () => {
        if (!aboutOpen) {
            openAbout();
        }
    });

    // License link listeners
    $("#btn_lic_ns").click(() => {
        ipcRenderer.send("create-new-license-window", "nightswimedit");
    });

    $("#btn_lic_mon").click(() => {
        ipcRenderer.send("create-new-license-window", "monaco");
    });

    $("#btn_lic_jq").click(() => {
        ipcRenderer.send("create-new-license-window", "jquery");
    });

    $("#btn_lic_kp").click(() => {
        ipcRenderer.send("create-new-license-window", "keypress");
    });

    /* This will receive info about the file that triggered
    the start of the app */
    let fileNameOnStartup = ipcRenderer.sendSync('get-file-data');

    if (fileNameOnStartup ===  null || fileNameOnStartup === ".") {
        console.log("No file on startup");
    } else {
        console.log("App start triggered by file: " + fileNameOnStartup);
        let fileToOpen = fileNameOnStartup;
        openFileAttempt(fileToOpen);
    }

    // Drag and drop
    document.ondragover = document.ondrop = (ev) => {
        ev.preventDefault();
    };

    document.body.ondrop = (ev) => {
        console.log("Drag & Drop detected: " + ev.dataTransfer.files[0].path);
        let fileToOpen = ev.dataTransfer.files[0].path;
        openFileAttempt(fileToOpen);
        ev.preventDefault();
    };

});

const outsideClickListener = function (event) {
    // Used for detecting a click outside the interaction menu
    if (!$(event.target).closest("#about_window").length) {
        if (aboutOpen) {
            closeAbout();
        }
    }
};

const fileChanged = function (changed) {
    if (changed) {
        if (!currentFileChanged) {
            $("#fileInfo").removeClass("fileUnchanged");
            $("#fileInfo").addClass("fileChanged");
            currentFileChanged = true;
        }
    } else {
        if (currentFileChanged) {
            $("#fileInfo").removeClass("fileChanged");
            $("#fileInfo").addClass("fileUnchanged");
            currentFileChanged = false;
        }
    }
};

const toggleWordWrap = () => {
    if (wordWrap) {
        wordWrap = false;
        editor.updateOptions({
            wordWrap: "off"
        });
        $("#wordWrap").removeClass("positive");
    } else {
        wordWrap = true;
        editor.updateOptions({
            wordWrap: "wordWrapColumn"
        });
        $("#wordWrap").addClass("positive");
    }
};

const continueAction = (action) => {
    if (action === "open") {
        // Continue opening the file
        openFile(openFileRequest);
    }
    else if (action === "close") {
        // Continue closing
        ipcRenderer.send("close-window-request", thisWindowId);
    }
};

const saveFile = (followUpAction) => {
    let content = editor.getValue();
    // Is this a new file?
    if (currentFile === "newFile") {
        // Open Save Dialog
        dialog.showSaveDialog((filename) => {
            if (filename === undefined) {
                console.log("No filename specified...");
            } else {
                // Write new file
                fs.writeFile(filename, content, (err) => {
                    if(err) {
                        // Error
                        dialog.showErrorBox("File Save Error", err.message);
                    } else {
                        // Success
                        currentFile = filename;
                        showFeedback("File saved");
                        fileChanged(false);
                        continueAction(followUpAction);
                    }
                });
            }
        });
    } else {
        // Update currentFile
        fs.writeFile(currentFile, content, (err) => {
            if (err) {
                console.log("Cannot update file." + err);
                return;
            } else {
                showFeedback("File saved");
                fileChanged(false);
                continueAction(followUpAction);
            }
        });
    }
};

const requestSaveDialog = (action) => {
    let content = editor.getValue();
    if (currentFileChanged && content !== "") {
        dialog.showMessageBox({
            type: "question",
            buttons: ["Save","Don't Save", "Cancel"],
            message: "Your file has unsaved changes. Would you like to save it?"
        }, (response) => {
            if (response === 0) {
                // User wants to save
                saveFile(action);
            } else if (response === 1) {
                // User doesn't want to save
                continueAction(action);
            }
        });
    } else {
        continueAction(action);
    }
};

const openFile = (filePath) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
        if (err) {
            console.log("Can't read file: ");
        } else {
            console.log("File read: " + filePath);
            fileChanged(false);
            currentFile = filePath;
            openFileRequest = "";
            // Update window title
            showFilename();
            // Replace everything in Monaco with new content
            if (monacoReady) {
                editor.setModel(monaco.editor.createModel(data, 'json'));
            } else {
                let timePassed = 0;
                let waitForMonaco = setInterval(() => {
                    if (monacoReady) {
                        clearInterval(waitForMonaco);
                        editor.setModel(monaco.editor.createModel(data, 'json'));
                    } else {
                        timePassed += 100;
                        if (timePassed > 5000) {
                            // Give up
                            clearInterval(waitForMonaco);
                            window.alert("Loading failed.");
                        }
                    }
                }, 100);
            }
            // Add file to recent documents list
            app.addRecentDocument(filePath);
        }
    });
};

const openFileAttempt = (fileName) => {
    openFileRequest = fileName;
    let extPattern = /(?:\.([^.]+))?$/;
    let ext = extPattern.exec(fileName)[1];
    console.log("extension is " + ext);
    if (
        // Need better validation of actual MIME-types, not just extension
        ext !== undefined && (ext === "json" || ext === "html" ||
        ext === "txt" || ext === "css")
    ) {
        requestSaveDialog("open");
    } else if (ext !== undefined) {
        window.alert("File type not supported");
    }
    // Do nothing if file has no extension
};

const openFileDialog = () => {
    dialog.showOpenDialog((selectedFiles) => {
        if (selectedFiles === undefined) {
            console.log("No files were selected");
        } else {
            openFileAttempt(selectedFiles[0]);
        }
    });
};

let showFeedback = function (message) {
    message = "<span class=\"positive\">" + message + "</span>";
    $("#fileInfo").html(message);
    setTimeout(() => {
        showFilename();
    }, 2000);
};

let showFilename = function () {
    let filename = path.basename(currentFile);
    ipcRenderer.send("update-title", thisWindowId, currentFile);
    $("#fileInfo").text(filename);
};

let insertAtCursor = function (content) {
    var selection = editor.getSelection();
    var range = new monaco.Range(selection.startLineNumber, selection.startColumn, selection.endLineNumber, selection.endColumn);
    var id = { major: 1, minor: 1 };
    var text = content;
    var op = {identifier: id, range: range, text: text, forceMoveMarkers: true};
    editor.executeEdits("my-source", [op]);
    editor.focus();
    editor.getAction('editor.action.formatDocument').run();
};

let generateButton = function (cat, template) {
    // Create a button
    $("#" + cat).append("<button id =\"" + template.id + "\">" +
        template.name + "</button>");
    // Make click event
    $("#" + template.id).click(function () {
        //copyContent(template.content);
        //pasteContent();
        insertAtCursor(template.content);
    });
};

templates.main.forEach(function (template) {
generateButton("main", template);
});

templates.conditions.forEach(function (template) {
generateButton("conditions", template);
});

templates.consequences.forEach(function (template) {
generateButton("consequences", template);
});

const startPlayTest = () => {
    // First: let's see if we can find a path
    let indexFile;
    if (currentFile !== "newFile") {
        let currentDir = path.dirname(currentFile);
        indexFile = path.join(currentDir, "..", "index.html");
        if (fs.existsSync(indexFile)) {
            ipcRenderer.send("create-new-play-window", indexFile);
        } else {
            // Check one level deeper (we might have a scenefile open)
            indexFile = path.join(currentDir, "..", "..", "index.html");
            if (fs.existsSync(indexFile)) {
                ipcRenderer.send("create-new-play-window", indexFile);
            } else {
                window.alert("No index.html found");
            }
        }
    } else {
        window.alert("First open one of your story files in order to test your story.");
    }
};

const openAbout = () => {
    $("#about_window").fadeIn(200);
    aboutOpen = true;
    document.addEventListener("mouseup", outsideClickListener);
};

const closeAbout = () => {
    $("#about_window").fadeOut(200);
    aboutOpen = false;
    document.removeEventListener("mouseup", outsideClickListener);
    // Re-add the click listener for the about button, but wait a bit
    setTimeout(() => {
        $("#about").one("click", () => {
            if (!aboutOpen) {
                openAbout();
            }
        });
    }, 100);
};
