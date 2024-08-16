
class Globals
{
	static Instance = new Globals();

	initialize(soundEditor)
	{
		this.soundEditor = soundEditor;

		this.soundEditor.domElementUpdate();

		this.inputHelper = new InputHelper();
		this.inputHelper.initialize();
	}
}
