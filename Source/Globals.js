
function Globals()
{}
{
	Globals.Instance = new Globals();

	Globals.prototype.initialize = function(soundEditor)
	{
		this.soundEditor = soundEditor;

		this.soundEditor.domElementUpdate();

		this.inputHelper = new InputHelper();
		this.inputHelper.initialize();
	}
}
