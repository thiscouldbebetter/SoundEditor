
class Globals
{
	static Instance: Globals = new Globals();

	soundEditor: SoundEditor;

	inputHelper: InputHelper;

	initialize(soundEditor: SoundEditor)
	{
		this.soundEditor = soundEditor;

		this.soundEditor.domElementUpdate();

		this.inputHelper = new InputHelper();
		this.inputHelper.initialize();
	}
}
