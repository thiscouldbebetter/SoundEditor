
class ControlBuilder
{
	document: any;

	constructor(document: any)
	{
		this.document = document;
	}

	label(text: string): any
	{
		var d = this.document;
		var label = d.createElement("label");
		label.innerHTML = text;
		return label;
	}

	button(text: string, onclick: () => void): any
	{
		var d = this.document;
		var button = d.createElement("button");
		button.innerHTML = text;
		button.onclick = onclick;
		return button;
	}
}