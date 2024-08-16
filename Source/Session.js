
class Session
{
	constructor(name, tagsToPlay, tracks, selectionsTagged)
	{
		this.name = name;
		this.tagsToPlay = tagsToPlay;
		this.tracks = tracks;
		this.selectionsTagged = selectionsTagged;

		this.trackIndexCurrent = 0;
	}

	addLookups()
	{
		this.selectionsTagged.addLookups("tag");
	}

	durationInSeconds()
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

	trackCurrent(valueToSet)
	{
		if (valueToSet != null)
		{
			this.trackIndexCurrent = this.tracks.indexOf(valueToSet);
		}

		return this.tracks[this.trackIndexCurrent];
	}

	// dom

	domElementRemove()
	{
		for (var t = 0; t < this.tracks.length; t++)
		{
			var track = this.tracks[t];
			track.domElementRemove();
		}
	}

	// json

	static fromStringJSON(sessionAsJSON)
	{
		var session = JSON.parse(sessionAsJSON);
		session.__proto__ = Session.prototype;

		var tracks = session.tracks;
		for (var i = 0; i < tracks.length; i++)
		{
			var track = tracks[i];
			track.__proto__ = Track.prototype;

			var sounds = track.sounds;
			for (var s = 0; s < sounds.length; s++)
			{
				var sound = sounds[s];
				sound.__proto__ = Sound.prototype;

				var sourceWavFileAsJSON = sound.sourceWavFile;
				var sourceWavFile = WavFile.fromStringJSON(sourceWavFileAsJSON);
				sound.sourceWavFile = sourceWavFile;
			}
		}

		var selections = session.selectionsTagged;
		for (var i = 0; i < selections.length; i++)
		{
			var selection = selections[i];
			selection.__proto__ = Selection.prototype;
		}

		return session;
	}

	toStringJSON()
	{
		var wavFilesToRestore = [];

		var tracks = this.tracks;
		for (var i = 0; i < tracks.length; i++)
		{
			var track = tracks[i];
			var sounds = track.sounds;
			for (var s = 0; s < sounds.length; s++)
			{
				var sound = sounds[s];
				var wavFile = sound.sourceWavFile;
				wavFilesToRestore.push(wavFile);
				var wavFileAsStringJSON = wavFile.toStringJSON();
				sound.sourceWavFile = wavFileAsStringJSON;
			}
		}

		var returnValue = JSON.stringify(this, null, 4);

		for (var i = 0; i < tracks.length; i++)
		{
			var track = tracks[i];
			var sounds = track.sounds;
			for (var s = 0; s < sounds.length; s++)
			{
				var sound = sounds[s];
				var wavFileToRestore = wavFilesToRestore[0];
				wavFilesToRestore.splice(0, 1);
				sound.sourceWavFile = wavFileToRestore;
			}
		}

		return returnValue;
	}

	// wav

	toWavFile()
	{
		var trackToExport = this.tracks[0]; // todo - Mix down.
		var trackToExportAsWavFile = trackToExport.toWavFile();
		return trackToExportAsWavFile;
	}
}
