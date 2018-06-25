// 180602r01
let templates = {
                main: [
                    {
                        id: "main_loc",
                        name: "Location",
                        content: `    {
        "locID": "",
        "name": "",
        "accessMsg": "unlocked",
        "locImg": "no_bg",
        "locSnd": "no_sound",
        "cutscenes": {},
        "scenes": {},
        "content": [
            {
                "sectionHTML": "",
                "conditions": [],
                "consequences": [],
                "delay": 0
            }
        ],
        "styling": {    
            "containerClass": "",
            "buttonClass": "",
            "bgClass": ""
        }
    }`
                    },
                    {
                        id: "main_section",
                        name: "Section",
                        content: `            {
                "sectionHTML": "",
                "conditions": [],
                "consequences": [],
                "delay": 0
            }`
                    },
                    {
                        id: "main_npc",
                        name: "Npc",
                        content: `    {
        "name": "npcID",
        "description": "descr",
        "location": "locID",
        "state": "state",
        "comfortLevel": 0,
        "sceneQueue": [],
        "interactions": [],
        "receive": []
    }`
                    },
                    {
                        id: "main_obj",
                        name: "Obj",
                        content: `    {
        "name": "objID",
        "description": "descr",
        "location": "locID",
        "state": "default",
        "content": "",
        "interactions": [
            {
                "type": "type",
                "activated": true,
                "button": "buttonTxt",
                "feedback": "",
                "conditions": [],
                "consequences": []
            }
        ],
        "receive": [
            {
                "from": "objID",
                "feedback": "feedback",
                "conditions": [],
                "consequences": []
            }
        ],
        "singleUse": false
    }`
                    },
                    {
                        id: "main_interaction",
                        name: "Interaction",
                        content: `    {
                "type": "intType",
                "activated": true,
                "button": "textOnButton",
                "feedback": "",
                "conditions": [],
                "consequences": []
            }`
                    },
                    {
                        id: "main_receive",
                        name: "Receive",
                        content: `    {
                "from": "objID",
                "feedback": "",
                "conditions": [],
                "consequences": []
            }`
                    },
                    {
                        id: "main_scene",
                        name: "Scene",
                        content: `{
    "start": {
        "enabled": true,
        "responses": [
            {
                "response": "FirstTextThePlayerWillSee.",
                "conditions": [],
                "newChoices": ["newChoiceID"]
            }
        ],
        "consequences": []
    },
    "newChoiceID": {
        "enabled": true,
        "choice": "buttonText",
        "responses": [
            {
                "response": "ResponseWhenCertainConditionsAreMet",
                "conditions": [

                ],
                "newChoices": []
            },
            {
                "response": "DefaultResponse",
                "conditions": [],
                "newChoices": []
            }
        ],
        "consequences": []
    }
}`
                    },
                    {
                        id: "main_choice",
                        name: "Choice",
                        content: `    "choiceID": {
        "enabled": true,
        "choice": "buttonText",
        "responses": [
            {
                "response": "response.",
                "conditions": [],
                "newChoices": []
            }
        ],
        "consequences": []
    }`
                    },
                    {
                        id: "main_cutscene",
                        name: "Cutscene",
                        content: `[
    {
        "sectionHTML": "ThisTextWillAppearAndStay ",
        "type": "add",
        "duration": 1000,
        "inAnim": 500,
        "outAnim": -1,
        "playSoundfile": "no_sound",
        "onEnd": "nothing"
    },
    {
        "sectionHTML": "ThisTextWillReplaceThePreviousOneAndFadeOut ",
        "type": "replace",
        "duration": 3000,
        "inAnim": 500,
        "outAnim": 500,
        "playSoundfile": "no_sound",
        "onEnd": "nothing"
    }
]`
                    },
                    {
                        id: "main_event",
                        name: "Event",
                        content: `    {
        "sectionHTML": "text",
        "type": "addOrReplace",
        "duration": 1000,
        "inAnim": 0,
        "outAnim": 0,
        "playSoundfile": "no_sound",
        "onEnd": "nothing"
    }`
                    },
                    {
                        id: "main_response",
                        name: "Response",
                        content: `    {
                "response": "response.",
                "conditions": [],
                "newChoices": []
            }`
                    }
                ],
                conditions: [
                    {
                        id: "cond_inv",
                        name: "inInventory",
                        content: `    {
        "type": "inInventory",
        "obj": "key",
        "failMsg": "messageWhenConditionIsntMet"
    }`
                    },
                    {
                        id: "cond_loc",
                        name: "location",
                        content: `    {
        "type": "location",
        "obj": "key",
        "value": "locationID",
        "failMsg": "messageWhenConditionIsntMet"
    }`
                    },
                    {
                        id: "cond_locaccess",
                        name: "locationAccess",
                        content: `    {
        "type": "locationAccess",
        "loc": "locationID",
        "value": "new message",
        "failMsg": "messageWhenConditionIsntMet"
    }`
                    },
                    {
                        id: "cond_comfort",
                        name: "npcComfortLevel",
                        content: `    {
        "type": "npcComfortLevel",
        "npc": "npcID",
        "value": 0,
        "failMsg": "messageWhenConditionIsntMet"
    }`
                    },
                    {
                        id: "cond_state",
                        name: "state",
                        content: `    {
        "type": "state",
        "obj": "objID, npcID, or player",
        "value": "state",
        "failMsg": "messageWhenConditionIsntMet"
    }`
                    },
                    {
                        id: "cond_setting",
                        name: "storySetting",
                        content: `    {
        "type": "storySetting",
        "storySetting": "nameOfSetting",
        "value": 0,
        "compare": "larger/equal/smaller",
        "failMsg": "messageWhenConditionIsntMet"
    }`
                    },
                    {
                        id: "cond_visited",
                        name: "visited",
                        content: `    {
        "type": "visited",
        "loc": "locID",
        "value": 1,
        "failMsg": "messageWhenConditionIsntMet"
    }`
                    }

                ],
                consequences: [
                    {
                        id: "change_addscene",
                        name: "addScene",
                        content: `    {
        "type": "addScene",
        "npc": "NpcID",
        "scene": "scene filename without .json"
    }`
                    },
                    {
                        id: "change_act",
                        name: "changeActivation",
                        content: `    {
        "type": "changeActivation",
        "obj": "ObjID",
        "index": 0,
        "value": false
    }`
                    },
                    {
                        id: "change_loc",
                        name: "changeLoc",
                        content: `    {
        "type": "changeLoc",
        "loc": "locID"
    }`
                    },
                    {
                        id: "change_locaccess",
                        name: "changeLocAccess",
                        content: `    {
        "type": "changeLocAccess",
        "loc": "locID",
        "accessMsg": "unlocked",
        "feedback": ""
    }`
                    },
                    {
                        id: "change_locbg",
                        name: "changeLocBg",
                        content: `    {
        "type": "changeLocBg",
        "loc": "locID",
        "file": "",
        "feedback": ""
    }`
                    },
                    {
                        id: "change_locsound",
                        name: "changeLocSound",
                        content: `    {
        "type": "changeLocSound",
        "loc": "locID",
        "file": "",
        "feedback": ""
    }`
                    },
                    {
                        id: "change_comfort",
                        name: "increaseNpcComfort",
                        content: `    {
        "type": "increaseNpcComfort",
        "npc": "NpcID",
        "amount": 5
    }`
                    },
                    {
                        id: "change_int",
                        name: "changeNpcInteraction",
                        content: `    {
        "type": "changeNpcInteraction",
        "npc": "NpcID",
        "interaction": ""
    }`
                    },
                    {
                        id: "change_objdescr",
                        name: "changeObjDescr",
                        content: `    {
        "type": "changeObjDescr",
        "obj": "objID",
        "value": "newDescr"
    }`
                    },
                    {
                        id: "change_objloc",
                        name: "changeObjLoc",
                        content: `    {
        "type": "changeObjLoc",
        "obj": "objID",
        "value": "locationID"
    }`
                    },
                    {
                        id: "change_objstate",
                        name: "changeObjState",
                        content: `    {
        "type": "changeObjState",
        "obj": "objID",
        "value": "newState"
    }`
                    },
                    {
                        id: "change_playerstate",
                        name: "changePlayerState",
                        content: `    {
        "type": "changePlayerState",
        "state": "newState"
    }`
                    },
                    {
                        id: "change_scenestate",
                        name: "changeSceneState",
                        content: `    {
        "type": "changeSceneState",
        "loc": "locID",
        "scene": "sceneID",
        "activate": true
    }`
                    },
                    {
                        id: "change_setting",
                        name: "changeStorySetting",
                        content: `    {
        "type": "changeStorySetting",
        "storySetting": "parameter",
        "value": true
    }`
                    },
                    {
                        id: "change_disablechoice",
                        name: "disableChoice",
                        content: `    {
        "type": "disableChoice",
        "choice": "choiceID"
    }`
                    },
                    {
                        id: "change_fadeout",
                        name: "fadeOut",
                        content: `    {
        "type": "fadeOut",
        "id": "htmlID"
    }`
                    },
                    {
                        id: "change_playsound",
                        name: "playSound",
                        content: `    {
        "type": "playSound",
        "url": "filename"
    }`
                    },
                    {
                        id: "change_refresh",
                        name: "refresh",
                        content: `    {
        "type": "refresh"
    }`
                    },
                    {
                        id: "change_removesection",
                        name: "removeSection",
                        content: `    {
        "type": "removeSection",
        "loc": "locID",
        "section": 0
    }`
                    },
                    {
                        id: "change_triggercutscene",
                        name: "triggerCutscene",
                        content: `    {
        "type": "triggerCutscene",
        "cutscene": "sceneID"
    }`
                    },
                    {
                        id: "change_triggerscene",
                        name: "triggerScene",
                        content: `    {
        "type": "triggerScene",
        "scene": "sceneID"
    }`
                    },
                ]
};