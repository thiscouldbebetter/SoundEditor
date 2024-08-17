"use strict";
function main() {
    var soundEditor = new SoundEditor(new Coords(600, 200), // viewSizeInPixels
    null // sessionToEdit
    );
    Globals.Instance.initialize(soundEditor);
}
