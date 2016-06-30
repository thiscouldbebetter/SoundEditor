
function Sound(name, offsetWithinTrackInSeconds, sourceWavFile)
{
	this.name = name;
	this.offsetWithinTrackInSeconds = offsetWithinTrackInSeconds;
	this.sourceWavFile = sourceWavFile;
}

{
	// instance methods

	Sound.prototype.durationInSeconds = function()
	{
		return this.sourceWavFile.durationInSeconds();
	}
}
