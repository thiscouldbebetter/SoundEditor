
function Track(name, sounds)
{
	this.name = name;
	this.sounds = sounds;
}

{
	Track.prototype.durationInSeconds = function()
	{
		var soundEndInSecondsMax = 0;

		for (var i = 0; i < this.sounds.length; i++)
		{
			var sound = this.sounds[i];
			var soundEndInSeconds =
				sound.offsetWithinTrackInSeconds
				+ sound.durationInSeconds();

			if (soundEndInSeconds > soundEndInSecondsMax)
			{
				soundEndInSecondsMax = soundEndInSeconds;
			}
		}

		return soundEndInSecondsMax;
	}

	// dom

	Track.prototype.domElementRemove = function()
	{
		delete this.domElement;
		delete this.graphics;
	}

	Track.prototype.domElementUpdate = function(soundEditor)
	{
		var viewSizeInPixels = soundEditor.viewSizeInPixels;

		this.domElementUpdate_BuildIfNecessary(viewSizeInPixels);
		this.domElementUpdate_Background(viewSizeInPixels);

		for (var s = 0; s < this.sounds.length; s++)
		{
			var sound = this.sounds[s];
			this.domElementUpdate_Sound(soundEditor, sound);
		}

		this.domElementUpdate_Selections(soundEditor);

		this.domElementUpdate_Cursor(soundEditor);

		this.domElementUpdate_ViewTimeStart(soundEditor);

		this.domElementUpdate_Title(viewSizeInPixels);

		return this.domElement;
	}

	Track.prototype.domElementUpdate_Background = function(viewSizeInPixels)
	{
		this.graphics.fillStyle = SoundEditor.ColorViewBackground;
		this.graphics.strokeStyle = SoundEditor.ColorViewBorder;
		this.graphics.fillRect
		(
			0,
			0,
			viewSizeInPixels.x,
			viewSizeInPixels.y
		);
		this.graphics.strokeRect
		(
			0,
			0,
			viewSizeInPixels.x,
			viewSizeInPixels.y
		);
	}

	Track.prototype.domElementUpdate_BuildIfNecessary = function(viewSizeInPixels)
	{
		if (this.domElement == null)
		{
			var canvasView = document.createElement("canvas");
			canvasView.width = viewSizeInPixels.x;
			canvasView.height = viewSizeInPixels.y;

			this.graphics = canvasView.getContext("2d");

			this.domElement = canvasView;
			this.domElement.entity = this;
		}
	}

	Track.prototype.domElementUpdate_Cursor = function(soundEditor)
	{
		var cursorPosInSeconds = Math.floor
		(
			soundEditor.cursorOffsetInSeconds * 1000
		) / 1000;

		var cursorPosInPixels =
			(
				cursorPosInSeconds
				- soundEditor.viewOffsetInSeconds
			)
			* soundEditor.viewSizeInPixels.x
			/ soundEditor.viewWidthInSeconds;

		this.graphics.strokeStyle = SoundEditor.ColorViewCursor;
		this.graphics.strokeRect
		(
			cursorPosInPixels, 0,
			1, soundEditor.viewSizeInPixels.y
		);

		var cursorPosInSecondsAsString = "" + cursorPosInSeconds;

		this.graphics.strokeStyle = SoundEditor.ColorViewBackground;
		this.graphics.strokeText
		(
			cursorPosInSecondsAsString,
			cursorPosInPixels + 2, SoundEditor.TextHeightInPixels
		);

		this.graphics.fillStyle = SoundEditor.ColorViewCursor;
		this.graphics.fillText
		(
			cursorPosInSecondsAsString,
			cursorPosInPixels + 2, SoundEditor.TextHeightInPixels

		);
	}

	Track.prototype.domElementUpdate_Selections = function(soundEditor)
	{
		var selectionsTagged = soundEditor.session.selectionsTagged;

		for (var i = 0; i < selectionsTagged.length; i++)
		{
			var selectionTagged = selectionsTagged[i];
			this.domElementUpdate_Selection(soundEditor, selectionTagged)
		}

		var selectionCurrent = soundEditor.selectionCurrent;

		if (selectionCurrent != null)
		{
			this.domElementUpdate_Selection(soundEditor, selectionCurrent);
		}

		return this.domElement;
	}

	Track.prototype.domElementUpdate_Selection = function(soundEditor, selectionCurrent)
	{
		var viewSizeInPixels = soundEditor.viewSizeInPixels;

		var selectionDurationInSeconds = selectionCurrent.durationInSeconds();

		var timesStartAndEndInSeconds = selectionCurrent.timesStartAndEndInSeconds;
		var timeStartInSecondsRelative =
			timesStartAndEndInSeconds[0]
			- soundEditor.viewOffsetInSeconds;
		var timeEndInSecondsRelative =
			timesStartAndEndInSeconds[1]
			- soundEditor.viewOffsetInSeconds;

		var secondsPerPixel = soundEditor.viewSecondsPerPixel();

		// todo - reversible selections?

		var selectionStartInPixels = timeStartInSecondsRelative / secondsPerPixel;

		var selectionSizeInPixels =
			selectionDurationInSeconds
			/ secondsPerPixel;

		this.graphics.fillStyle = SoundEditor.ColorViewSelectionFill;
		this.graphics.strokeStyle = SoundEditor.ColorViewSelectionBorder;

		this.graphics.fillRect
		(
			selectionStartInPixels, 0,
			selectionSizeInPixels, viewSizeInPixels.y
		);

		this.graphics.strokeRect
		(
			selectionStartInPixels, 0,
			selectionSizeInPixels, viewSizeInPixels.y
		);

		if (selectionCurrent.tag != null)
		{
			var selectionAsString = selectionCurrent.toString();

			this.graphics.strokeStyle = SoundEditor.ColorViewBackground;
			this.graphics.strokeText
			(
				selectionAsString,
				selectionStartInPixels + 2,
				SoundEditor.TextHeightInPixels

			);


			this.graphics.fillStyle = SoundEditor.ColorViewText;
			this.graphics.fillText
			(
				selectionAsString,
				selectionStartInPixels + 2,
				SoundEditor.TextHeightInPixels

			);
		}
	}

	Track.prototype.domElementUpdate_Sound = function(soundEditor, sound)
	{
		var soundSource = sound.sourceWavFile;
		var samplingInfo = soundSource.samplingInfo;
		var bitsPerSample = samplingInfo.bitsPerSample;
		var samplesPerSecond = samplingInfo.samplesPerSecond; // hack
		var samples = soundSource.samplesForChannels[0]; // hack

		var soundOffsetWithinTrackInSamples = Math.round
		(
			sound.offsetWithinTrackInSeconds
			* samplesPerSecond
		);

		var viewSizeInPixels = soundEditor.viewSizeInPixels;
		var viewSizeInPixelsHalf = soundEditor.viewSizeInPixelsHalf;

		var viewOffsetInSamples = Math.round(soundEditor.viewOffsetInSeconds * samplesPerSecond);
		var viewWidthInSamples = Math.round(soundEditor.viewWidthInSeconds * samplesPerSecond);
		var samplePosInPixels = new Coords(0, viewSizeInPixelsHalf.y);
		var sampleValue = 0;

		this.graphics.beginPath();

		var byteConverter = new ByteConverter(bitsPerSample);

		for (var i = 0; i < viewWidthInSamples; i++)
		{
			var sampleIndex =
				i
				+ viewOffsetInSamples
				- soundOffsetWithinTrackInSamples;

			if (sampleIndex >= 0 && sampleIndex <= samples.length)
			{
				var samplePosInPixelsXNext =
					i
					* viewSizeInPixels.x
					/ viewWidthInSamples;

				if (samplePosInPixelsXNext != samplePosInPixels.x)
				{
					var sampleBytes = samples[sampleIndex];

					sampleValue = byteConverter.integerToFloat
					(
						sampleBytes
					);

					samplePosInPixels.x = samplePosInPixelsXNext;

					samplePosInPixels.y =
						viewSizeInPixelsHalf.y
						+
						(
							sampleValue
							* viewSizeInPixelsHalf.y
							* .8 // max amplitude
						);

					this.graphics.lineTo
					(
						samplePosInPixels.x,
						samplePosInPixels.y
					);
				}
			}
		}

		this.graphics.stroke();

		this.graphics.strokeStyle = SoundEditor.ColorViewBaseline;
		this.graphics.strokeRect
		(
			0, soundEditor.viewSizeInPixelsHalf.y,
			viewSizeInPixels.x, viewSizeInPixelsHalf.y
		);
	}

	Track.prototype.domElementUpdate_Title = function(viewSizeInPixels)
	{
		this.graphics.strokeStyle = SoundEditor.ColorViewBackground;
		this.graphics.strokeText
		(
			this.name,
			2, viewSizeInPixels.y - SoundEditor.TextHeightInPixels
 * .2
		);

		this.graphics.fillStyle = SoundEditor.ColorViewText;
		this.graphics.fillText
		(
			this.name,
			2, viewSizeInPixels.y - SoundEditor.TextHeightInPixels
 * .2
		);
	}

	Track.prototype.domElementUpdate_ViewTimeStart = function(soundEditor)
	{
		var viewSizeInPixels = soundEditor.viewSizeInPixels;

		var viewOffsetInSeconds = Math.floor
		(
			soundEditor.viewOffsetInSeconds * 1000
		) / 1000 + "";

		this.graphics.strokeStyle = SoundEditor.ColorViewBackground;
		this.graphics.strokeText
		(
			viewOffsetInSeconds,
			0, SoundEditor.TextHeightInPixels

		);
		this.graphics.fillStyle = SoundEditor.ColorViewText;
		this.graphics.fillText
		(
			viewOffsetInSeconds,
			0, SoundEditor.TextHeightInPixels

		);
	}

	// event

	Track.prototype.handleEventMouseDown = function(event)
	{
		var soundEditor = Globals.Instance.soundEditor;
		var session = soundEditor.session;
		session.trackCurrent(this);
		soundEditor.selectionCurrent = null;
		var clickOffsetInSeconds = this.mousePointerOffsetInSecondsForEvent(event);
		soundEditor.cursorOffsetInSeconds = clickOffsetInSeconds;

		for (var i = 0; i < session.selectionsTagged.length; i++)
		{
			var selectionTagged = session.selectionsTagged[i];
			var timesStartAndEndInSeconds = selectionTagged.timesStartAndEndInSeconds;
			var timeStartInSeconds = timesStartAndEndInSeconds[0];
			var timeEndInSeconds = timesStartAndEndInSeconds[1];

			var isClickWithinSelection =
			(
				clickOffsetInSeconds >= timeStartInSeconds
				&& clickOffsetInSeconds <= timeEndInSeconds
			);

			if (isClickWithinSelection == true)
			{
				// For now, existing selections cannot be selected.
				//soundEditor.selectionCurrent = selectionTagged;
			}
		}

		soundEditor.domElementUpdate();
	}

	Track.prototype.handleEventMouseMove = function(event)
	{
		var soundEditor = Globals.Instance.soundEditor;

		if (soundEditor.selectionCurrent == null)
		{
			soundEditor.selectionCurrent = new Selection
			(
				null, // tag
				[
					soundEditor.cursorOffsetInSeconds,
					soundEditor.cursorOffsetInSeconds
				]
			);
		}

		var mousePointerOffsetInSeconds = this.mousePointerOffsetInSecondsForEvent(event);

		soundEditor.cursorOffsetInSeconds = mousePointerOffsetInSeconds;
		soundEditor.selectionCurrent.timesStartAndEndInSeconds[1] = soundEditor.cursorOffsetInSeconds;
		soundEditor.domElementUpdate();
	}

	Track.prototype.handleEventMouseUp = function(event)
	{
		var soundEditor = Globals.Instance.soundEditor;

		if (soundEditor.selectionCurrent != null)
		{
			soundEditor.selectionCurrent.rectify();
		}
	}

	Track.prototype.mousePointerOffsetInSecondsForEvent = function(event)
	{
		var mousePointerPosInPixels =
			event.x
			- event.srcElement.getBoundingClientRect().left;

		var soundEditor = Globals.Instance.soundEditor;

		var mousePointerPosInSeconds =
			mousePointerPosInPixels
			* soundEditor.viewWidthInSeconds
			/ soundEditor.viewSizeInPixels.x;

		var mousePointerOffsetInSeconds =
			mousePointerPosInSeconds
			+ soundEditor.viewOffsetInSeconds

		return mousePointerOffsetInSeconds;
	}
}
