
function Session(name, tagsToPlay, tracks, selectionsTagged)
{
	this.name = name;
	this.tagsToPlay = tagsToPlay;
	this.tracks = tracks;
	this.selectionsTagged = selectionsTagged;

	this.trackIndexCurrent = 0;
}

{
	Session.prototype.addLookups = function()
	{
		this.selectionsTagged.addLookups("tag");
	}

	Session.prototype.durationInSeconds = function()
	{
		var trackEndInSecondsMax = 0;

		for (var i = 0; i < this.tracks.length; i++)
		{
			var track = this.tracks[i];
			var trackEndInSeconds = track.durationInSeconds();
			if (trackEndInSeconds > trackEndInSecondsMax)
			{
				trackEndInSecondsMax = trackEndInSeconds;
			}
		}	

		return trackEndInSecondsMax;
	}

	Session.prototype.trackCurrent = function(valueToSet)
	{
		if (valueToSet != null)
		{
			this.trackIndexCurrent = this.tracks.indexOf(valueToSet);
		}

		return this.tracks[this.trackIndexCurrent];
	}

	// dom 

	Session.prototype.domElementRemove = function()
	{
		for (var t = 0; t < this.tracks.length; t++)
		{
			var track = this.tracks[t];
			track.domElementRemove();
		}
	}
}
