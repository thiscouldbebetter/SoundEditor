"use strict";
class ControlBuilder {
    constructor(document) {
        this.document = document;
    }
    label(text) {
        var d = this.document;
        var label = d.createElement("label");
        label.innerHTML = text;
        return label;
    }
    button(text, onclick) {
        var d = this.document;
        var button = d.createElement("button");
        button.innerHTML = text;
        button.onclick = onclick;
        return button;
    }
}
