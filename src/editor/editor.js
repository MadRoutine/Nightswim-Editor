const fs = require("fs");

const {app, dialog} = require("electron").remote;
const {ipcRenderer, shell} = require("electron");

let currentFile = "New File";
let currentFileChanged = false;
let openFileRequest = "";
let wordWrap = false;
let thisWindowId;
let aboutOpen = false;
let extPattern = /(?:\.([^.]+))?$/;
let createFiles = true;
let selectedId = "none";

ipcRenderer.on("request-save-dialog-on-close", () => {
    requestSaveDialog("close");
});

ipcRenderer.on("loading-done", (event, windowId) => {

    thisWindowId = windowId;
    console.log("New window: id is " + windowId);

    // Keyboard shortcut listeners
    let listener = new window.keypress.Listener();

    listener.simple_combo("meta s", function () {
        saveFile();
    });

    listener.simple_combo("meta o", function () {
        openFileDialog();
    });

    listener.simple_combo("meta n", function () {
        ipcRenderer.send("create-new-window");
    });

    listener.simple_combo("meta w", function () {
        requestSaveDialog("close");
    });

    listener.simple_combo("option s", function () {
        startPlayTest();
    });

    listener.simple_combo("option z", function () {
        toggleWordWrap();
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

    $("#new_file").click(() => {
        requestSaveDialog("new");
    });

    $("#new_window").click(() => {
        ipcRenderer.send("create-new-window");
    });

    $("#wordwrap").click(() => {
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

$(document).on("click", "a[href^=\"http\"]", function (event) {
    event.preventDefault();
    shell.openExternal(this.href);
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
            $("#file_info").removeClass("file_unchanged");
            $("#file_info").addClass("file_changed");
            currentFileChanged = true;
        }
    } else {
        if (currentFileChanged) {
            $("#file_info").removeClass("file_changed");
            $("#file_info").addClass("file_unchanged");
            currentFileChanged = false;
        }
    }
};

const showFilename = function () {
    let filename = path.basename(currentFile);
    ipcRenderer.send("update-title", thisWindowId, currentFile);
    $("#file_info").text(filename);
};

const addFileButton = function (parent, filePath, id) {
    // Add button
    $(parent).append(
        "<button id=\"" + id + "\">" + path.basename(filePath) + "</button>"
    );

    if (currentFile === filePath) {
        selectedId = "#" + id;
        $("#" + id).addClass("selected_file");
    }

    // Add click handler
    $("#" + id).click(() => {
        openFileAttempt(filePath);
    });
};

const showFileList = function () {
    let dir = path.dirname(currentFile);
    let file = path.basename(currentFile);
    let storyDir = "not_found";
    let btnId = 0;
    let refresh = false;
    let mainFiles = {
        init: {},
        locations: {},
        npc_list: {},
        obj_list: {}
    };

    $("#main_files").html("");
    $("#scene_files").html("");
    selectedId = "none";

    // 1 Find directory where main story files are
    if (
        file === "init.json" ||
        file === "locations.json" ||
        file === "npc_list.json" ||
        file === "obj_list.json"
    ) {
        storyDir = dir;
    } else {
        let checkFile = path.join(dir, "..", "init.json");
        if (fs.existsSync(checkFile)) {
            storyDir = path.join(dir, "..");
        }
    }

    if (storyDir !== "not_found") {
        // 2 Set paths and check if all main storyfiles are present
        let missingFiles = [];
        let missingContent = [];

        mainFiles.init.path = path.join(storyDir, "init.json");
        mainFiles.locations.path = path.join(storyDir, "locations.json");
        mainFiles.npc_list.path = path.join(storyDir, "npc_list.json");
        mainFiles.obj_list.path = path.join(storyDir, "obj_list.json");

        if (fs.existsSync(mainFiles.init.path)) {
            addFileButton("#main_files", mainFiles.init.path, "init_file");
        } else {
            missingFiles.push(mainFiles.init.path);
            missingContent.push(templates.files.init);
        }
        if (fs.existsSync(mainFiles.locations.path)) {
            addFileButton("#main_files", mainFiles.locations.path, "loc_file");
        } else {
            missingFiles.push(mainFiles.locations.path);
            missingContent.push(templates.files.locations);
        }
        if (fs.existsSync(mainFiles.npc_list.path)) {
            addFileButton("#main_files", mainFiles.npc_list.path, "npc_file");
        } else {
            missingFiles.push(mainFiles.npc_list.path);
            missingContent.push(templates.files.npc_list);
        }
        if (fs.existsSync(mainFiles.obj_list.path)) {
            addFileButton("#main_files", mainFiles.obj_list.path, "obj_file");
        } else {
            missingFiles.push(mainFiles.obj_list.path);
            missingContent.push(templates.files.obj_list);
        }

        if (missingFiles.length > 0 && createFiles) {
            // Ask if user wants the missing files to be created
            dialog.showMessageBox({
                type: "question",
                buttons: ["Yes","No"],
                message: "Can't find one or more required story files.\nWould you like these to be created?"
            }, (response) => {
                if (response === 0) {
                    // Yes
                    let m = 0;
                    missingFiles.forEach((missing) => {
                        fs.writeFile(missing, missingContent[m], (err) => {
                            if(err) {
                                // Error
                                dialog.showErrorBox(
                                    "File Save Error", err.message
                                );
                            }
                        });
                        m += 1;
                    });
                    // Refresh filelist
                    refresh = true;
                    showFileList();
                } else if (response === 1) {
                    // No, save this choice
                    createFiles = false;
                }
            });
        }

        // 3 Check for scene files
        if (!refresh) {
            let sceneDir = path.join(storyDir, "scenes/");
            if (fs.existsSync(sceneDir)) {
                fs.readdir(sceneDir, (err, files) => {
                    files.forEach(file => {
                        let ext = extPattern.exec(file)[1];
                        if (ext === "json") {
                            let thisBtnId = "scene_file_" + btnId;
                            btnId += 1;
                            let filePath = path.join(sceneDir, file);
                            addFileButton("#scene_files", filePath, thisBtnId);
                        }
                    });
                });
            }
        }
    } else {
        // No related files found. Just show all json files in folder
        fs.readdir(dir, (err, files) => {
            files.forEach((file) => {
                let ext = extPattern.exec(file)[1];
                if (ext === "json") {
                    let thisBtnId = "file_" + btnId;
                    btnId += 1;
                    let filePath = path.join(dir, file);
                    addFileButton("#scene_files", filePath, thisBtnId);
                }
            });
        });
    }
};

const toggleWordWrap = () => {
    if (wordWrap) {
        wordWrap = false;
        editor.updateOptions({
            wordWrap: "off"
        });
        $("#wordwrap").removeClass("positive");
    } else {
        wordWrap = true;
        editor.updateOptions({
            wordWrap: "wordWrapColumn"
        });
        $("#wordwrap").addClass("positive");
    }
};

const changeEditorContent = (data, filePath) => {
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
};

const newFile = () => {
    if (selectedId !== "none") {
        // Remove selected class
        $(selectedId).removeClass("selected_file");
    }
    changeEditorContent("", "New File");
};

const openFile = (filePath) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
        if (err) {
            console.log("Can't read file: ");
        } else {
            console.log("File read: " + filePath);
            changeEditorContent(data, filePath);
            // Add file to recent documents list
            app.addRecentDocument(filePath);
            // Show related files in left column
            showFileList();
        }
    });
};

const openFileAttempt = (filePath) => {
    openFileRequest = filePath;
    let ext = extPattern.exec(filePath)[1];
    if (
        // Need better validation of actual MIME-types, not just extension
        ext !== undefined && (ext === "json" || ext === "html" ||
        ext === "txt" || ext === "css")
    ) {
        if (filePath !== currentFile) {
            requestSaveDialog("open");
        }
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

const continueAction = (action) => {
    if (action === "open") {
        // Continue opening the file
        openFile(openFileRequest);
    }
    else if (action === "close") {
        // Continue closing
        ipcRenderer.send("close-window-request", thisWindowId);
    }
    else if (action === "new") {
        // New file
        newFile();
    }
};

const saveFile = (followUpAction) => {
    let content = editor.getValue();
    // Is this a new file?
    if (currentFile === "New File") {
        // Open Save Dialog
        dialog.showSaveDialog((filename) => {
            if (filename === undefined) {
                console.log("No filename specified...");
            } else {
                // Check if it ends with .json
                let ext = extPattern.exec(filename)[1];
                if (ext !== "json") {
                    filename = filename + ".json";
                }
                // Write new file
                fs.writeFile(filename, content, (err) => {
                    if(err) {
                        // Error
                        dialog.showErrorBox("File Save Error", err.message);
                    } else {
                        // Success
                        currentFile = filename;
                        showFeedback("File saved");
                        showFileList();
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

let showFeedback = function (message) {
    message = "<span class=\"positive\">" + message + "</span>";
    $("#file_info").html(message);
    setTimeout(() => {
        showFilename();
    }, 2000);
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
    if (currentFile !== "New File") {
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
        window.alert(
            "First open one of your story files in order to test your story."
        );
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
