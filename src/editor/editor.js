const {app, dialog} = require("electron").remote;
const {ipcRenderer, shell} = require("electron");

/* For consistency:
    dir always refers to the absolute directory the file lives in
    (file)name always refers to name.ext without directory
    (file)path always refers to dir+name
    currentFile.path contains a path to the currently open file
*/
let currentFile = {
    path: "New File",
    type: "regular"
};
let currentLang = "json";
let currentFileChanged = false;
let prevFile = {
    path: "none",
    type: "none"
};
let openFileRequest = "";
let openingArchive = false;
let wordWrap = false;
let thisWindowId;
let aboutOpen = false;
let extPattern = /(?:\.([^.]+))?$/;
let createFiles = true;
let session = new Map();
let cat = {
    main: true,
    scene: true,
    other: true,
    prev: true
};

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
    $("#new_window").click(() => {
        ipcRenderer.send("create-new-window");
    });

    $("#new_file").click(() => {
        requestSaveDialog("new");
    });

    $("#open").click(() => {
        openFileDialog();
    });

    $("#save").click(() => {
        saveFile();
    });

    $("#archive").click(() => {
        createArchiveCopy();
    });

    $("#playtest").click(() => {
        startPlayTest();
    });

    $("#wordwrap").click(() => {
        toggleWordWrap();
    });

    // Click listener only works once, or else the outsideClickListener and
    // this button will conflict with eachother
    $("#about").one("click", () => {
        if (!aboutOpen) {
            openAbout();
        }
    });

    // Related files column: category visibility toggles:
    $("#h_main").click(() => {
        toggleCat("main");
    });

    $("#h_scene").click(() => {
        toggleCat("scene");
    });

    $("#h_other").click(() => {
        toggleCat("other");
    });

    $("#h_prev").click(() => {
        toggleCat("prev");
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

ipcRenderer.on("request-save-dialog-on-close", () => {
    requestSaveDialog("close");
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
    let filename = path.basename(currentFile.path);
    ipcRenderer.send("update-title", thisWindowId, currentFile.path);
    $("#file_info").text(filename);
};

const addFileButton = function (parent, filePath, id) {
    // Add button
    if (parent === "#prev_files") {
        $(parent).prepend(
            // This will show newer files first
            "<button id=\"" + id + "\">" + path.basename(filePath) + "</button>"
        );
    } else {
        $(parent).append(
            "<button id=\"" + id + "\">" + path.basename(filePath) + "</button>"
        );
    }

    if (currentFile.path === filePath) {
        $("#" + id).addClass("selected_file");
    }

    // Add click handler
    $("#" + id).click(() => {
        if (parent === "#prev_files") {
            openingArchive = true;
        }
        openFileAttempt(filePath);
    });
};

const showFileList = function () {
    let refFile;
    let dir;
    let fileName;
    let storyDir = "not_found";
    let btnId = 0;
    let refresh = false;
    let mainFiles = {
        init: {},
        locations: {},
        npc_list: {},
        obj_list: {}
    };

    if (
        (currentFile.path === "New File" || currentFile.type === "archive") &&
        prevFile !== "none"
    ) {
        refFile = prevFile;
    } else {
        refFile = currentFile;
    }

    console.log("currentFile.type: " + currentFile.type);
    console.log("currentFile.path: " + currentFile.path);
    console.log("prevFile.path: " + prevFile.path);
    console.log("refFile.path: " + refFile.path);

    dir = path.dirname(refFile.path);
    fileName = path.basename(refFile.path);

    $("#main_files").html("");
    $("#scene_files").html("");
    $("#other_files").html("");
    $("#prev_files").html("");

    // 1 Find directory where main story files are
    if (
        fileName === "init.json" ||
        fileName === "locations.json" ||
        fileName === "npc_list.json" ||
        fileName === "obj_list.json"
    ) {
        // current fileName indicates that this is the story folder
        storyDir = dir;
    } else {
        // We might be in story/scenes, so let's check one level up
        let checkPath = path.join(dir, "..", "init.json");
        if (fs.existsSync(checkPath)) {
            storyDir = path.join(dir, "..");
        } else {
            // Or we might be in root, so let's also check story/
            checkPath = path.join(dir, "story/", "init.json");
            if (fs.existsSync(checkPath)) {
                storyDir = path.join(dir, "story/");
            }
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
                    // No, remember this choice
                    createFiles = false;
                }
            });
        }

        /* This function was called again when files were automatically created
        Only continue here if that's not the case */
        if (!refresh) {
            // Check for scene files
            let sceneDir = path.join(storyDir, "scenes/");
            if (fs.existsSync(sceneDir)) {
                fs.readdir(sceneDir, (err, sceneFiles) => {
                    sceneFiles.forEach(sceneFileName => {
                        let ext = extPattern.exec(sceneFileName)[1];
                        if (ext === "json") {
                            let thisBtnId = "scene_file_" + btnId;
                            btnId += 1;
                            let filePath = path.join(sceneDir, sceneFileName);
                            addFileButton("#scene_files", filePath, thisBtnId);
                        }
                    });
                });
            }
            // Check for .html, .css and .txt files
            let otherDir = path.join(storyDir, "..");
            if (fs.existsSync(otherDir)) {
                fs.readdir(otherDir, (err, otherFiles) => {
                    otherFiles.forEach(otherFileName => {
                        let ext = extPattern.exec(otherFileName)[1];
                        if (ext === "html" || ext === "css" || ext === "txt") {
                            let thisBtnId = "other_file_" + btnId;
                            btnId += 1;
                            let filePath = path.join(otherDir, otherFileName);
                            addFileButton("#other_files", filePath, thisBtnId);
                        }
                    });
                });
            }
        }
    } else {
        /* No related files found. Just show all json files in folder,
        except package and package-lock */
        fs.readdir(dir, (err, files) => {
            files.forEach((sceneFileName) => {
                let ext = extPattern.exec(sceneFileName)[1];
                if (
                    ext === "json" &&
                    fileName !== "package.json" &&
                    fileName !== "package-lock.json"
                ) {
                    let thisBtnId = "file_" + btnId;
                    btnId += 1;
                    let filePath = path.join(dir, sceneFileName);
                    addFileButton("#scene_files", filePath, thisBtnId);
                }
            });
        });
    }

    // Check for archive/previous versions of the current file
    if (!refresh) {
        let extStart = fileName.search(extPattern);
        let fileNameNoExt = fileName.substr(0, extStart);
        let archiveDir = path.join(dir, "archive/");
        // Check if archive/ exists
        if (fs.existsSync(archiveDir)) {
            fs.readdir(archiveDir, (err, archiveFiles) => {

                // Check every file in archive/
                archiveFiles.forEach(archiveFile => {
                    let startPos = archiveFile.search(fileNameNoExt);
                    if (startPos !== undefined && startPos !== -1) {
                        /* We found the name of the currently open file in one of the files in the archive folder. Display it. */
                        let thisBtnId = "prev_" + btnId;
                        btnId += 1;
                        let filePath = path.join(archiveDir, archiveFile);
                        addFileButton("#prev_files", filePath, thisBtnId);
                    }
                });
            });
        }
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
    editor.focus();
};

const changeEditorContent = (data, filePath) => {
    fileChanged(false);
    // Save view state of file that is about to be replaced
    session.set(currentFile.path, editor.saveViewState());

    // Update prevFile
    if (currentFile.path !== "New File" && currentFile.type !== "archive") {
        prevFile.path = currentFile.path;
        prevFile.type = currentFile.type;
        console.log("prevFile updated");
    }

    // Update currentFile.type
    if (openingArchive) {
        currentFile.type = "archive";
        // We're done with openingArchive, reset it
        openingArchive = false;
    } else {
        currentFile.type = "regular";
    }

    // Update currentFile.path
    currentFile.path = filePath;

    openFileRequest = "";
    // Set correct language
    // Assume new file is json type
    let ext = extPattern.exec(filePath)[1];
    if (filePath === "New File" || (ext !== undefined && ext === "json")) {
        currentLang = "json";
    } else if (ext !== undefined && ext === "html") {
        currentLang = "html";
    } else if (ext !== undefined && ext === "css") {
        currentLang = "css";
    } else if (ext !== undefined && ext === "txt") {
        currentLang = "plaintext";
    }
    // Update window title
    showFilename();
    // Replace everything in Monaco with new content
    if (monacoReady) {
        editor.setModel(monaco.editor.createModel(data, currentLang));
        editor.focus();
        // Check if file is in session, if yes, restore its view state
        if (session.has(filePath)) {
            let state = session.get(filePath);
            editor.restoreViewState(state);
        }
    } else {
        let timePassed = 0;
        let waitForMonaco = setInterval(() => {
            if (monacoReady) {
                clearInterval(waitForMonaco);
                editor.setModel(monaco.editor.createModel(data, currentLang));
                editor.focus();
                // Check if file is in session, if yes, restore its view state
                if (session.has(filePath)) {
                    let state = session.get(filePath);
                    editor.restoreViewState(state);
                }
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
    if (session.has("New File")) {
        // There is info saved from a previous new file,
        // so lets delete it!
        session.delete("New File");
    }
    changeEditorContent("", "New File");
    /* Show related files in left column, in this case based on a previously
    opened file (if there was) */
    showFileList();
};

const openFile = (filePath) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
        if (err) {
            console.log("Can't read file: ");
        } else {
            console.log("File read: " + filePath);
            changeEditorContent(data, filePath);
            // Show related files in left column
            showFileList();
            // Add file to recent documents list
            app.addRecentDocument(filePath);
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
        if (filePath !== currentFile.path) {
            requestSaveDialog("open");
        }
    } else if (ext !== undefined) {
        window.alert("File type not supported");
    }
    // Do nothing if file has no extension
};

const openFileDialog = () => {
   dialog.showOpenDialog({
    properties: ['openFile']
  }).then(result => {
    if (!result.canceled) {
        openFileAttempt(result.filePaths[0]);
    }
  }).catch(err => {
    console.log(err);
  })
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

const createArchiveCopy = () => {
    if (currentFile.path !== "New File") {
        let dir = path.dirname(currentFile.path);
        let fileName = path.basename(currentFile.path);
        let extStart = fileName.search(extPattern);
        let ext = extPattern.exec(fileName)[1];
        let fileNameNoExt = fileName.substr(0, extStart);
        let timestamp = new Date();
        let dd = ("0" + timestamp.getDate()).slice(-2);
        let mm = ("0" + (timestamp.getMonth() + 1)).slice(-2); //January is 0!
        let yyyy = timestamp.getFullYear();
        let archiveName = fileNameNoExt + "_" + yyyy + mm + dd + "r";
        let archiveDir = path.join(dir, "archive/");
        let archivePath;
        let content = editor.getValue();

        // Check if archive directory exists. If not: create it
        if (!fs.existsSync(archiveDir)) {
            fs.mkdirSync(archiveDir);
            // Revision number will be '01'
            archiveName = archiveName + "01." + ext;
        } else {
            // Find out revision number
            let rev = 0;
            let exists = true;
            do {
                rev += 1;
                let checkFileName = archiveName +
                    ("0" + rev).slice(-2) +
                    "." +
                    ext;
                let checkFilePath = path.join(archiveDir, checkFileName);
                if (!fs.existsSync(checkFilePath)) {
                    exists = false;
                    archiveName = checkFileName;
                }
            } while (exists);
        }

        // Save it
        archivePath = path.join(archiveDir, archiveName);
        fs.writeFile(archivePath, content, (err) => {
            if(err) {
                // Error
                dialog.showErrorBox("File Save Error", err.message);
            } else {
                // Success
                showFeedback("Archive copy saved");
                showFileList();
            }
        });
    } else {
        window.alert("Please save your file first.");
    }
    editor.focus();
};

const saveFile = (followUpAction) => {
    let content = editor.getValue();
    // Is this a new file?
    if (currentFile.path === "New File") {
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
                        currentFile.path = filename;
                        showFeedback("File saved");
                        showFileList();
                        fileChanged(false);
                        continueAction(followUpAction);
                    }
                });
            }
        });
    } else {
        // Update currentFile.path
        fs.writeFile(currentFile.path, content, (err) => {
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
    editor.focus();
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
            } else if (response === 2) {
                // User cancelled
                if (openingArchive) {
                    openingArchive = false;
                }
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
    editor.focus();
    if (currentFile.path !== "New File") {
        let currentDir = path.dirname(currentFile.path);
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
    editor.focus();
};

const toggleCat = (whichCat) => {
    if (whichCat === "main") {
        if (cat.main) {
            $("#main_files").css("display", "none");
            $("#h_main").addClass("folded");
            cat.main = false;
        } else {
            $("#main_files").css("display", "block");
            $("#h_main").removeClass("folded");
            cat.main = true;
        }
    } else if (whichCat === "scene") {
        if (cat.scene) {
            $("#scene_files").css("display", "none");
            $("#h_scene").addClass("folded");
            cat.scene = false;
        } else {
            $("#scene_files").css("display", "block");
            $("#h_scene").removeClass("folded");
            cat.scene = true;
        }
    } else if (whichCat === "other") {
        if (cat.other) {
            $("#other_files").css("display", "none");
            $("#h_other").addClass("folded");
            cat.other = false;
        } else {
            $("#other_files").css("display", "block");
            $("#h_other").removeClass("folded");
            cat.other = true;
        }
    } else if (whichCat === "prev") {
        if (cat.prev) {
            $("#prev_files").css("display", "none");
            $("#h_prev").addClass("folded");
            cat.prev = false;
        } else {
            $("#prev_files").css("display", "block");
            $("#h_prev").removeClass("folded");
            cat.prev = true;
        }
    }
};