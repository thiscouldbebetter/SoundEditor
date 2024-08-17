"use strict";
class Globals {
    initialize(soundEditor) {
        this.soundEditor = soundEditor;
        this.soundEditor.domElementUpdate();
        this.inputHelper = new InputHelper();
        this.inputHelper.initialize();
    }
}
Globals.Instance = new Globals();
