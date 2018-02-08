
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
		delete this.display;
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

		this.domElementUpdate_ViewTimeRange(soundEditor);

		this.domElementUpdate_Title(viewSizeInPixels);

		return this.domElement;
	}

	Track.prototype.domElementUpdate_Background = function(viewSizeInPixels)
	{
		this.display.drawRectangle
		(
			new Coords(0, 0),
			viewSizeInPixels,
			SoundEditor.ColorViewBackground,
			SoundEditor.ColorViewBorder
		);
	}

	Track.prototype.domElementUpdate_BuildIfNecessary = function(viewSizeInPixels)
	{
		if (this.domElement == null)
		{
			this.display = new Display(viewSizeInPixels);
			this.display.initialize();
			this.domElement = this.display.canvas;
			this.domElement.entity = this;
		}
	}

	Track.prototype.domElementUpdate_Cursor = function(soundEditor)
	{
		var cursorPosInSeconds = soundEditor.cursorOffsetInSeconds;

		var cursorPosInPixels =
			(
				cursorPosInSeconds
				- soundEditor.viewOffsetInSeconds
			)
			* soundEditor.viewSizeInPixels.x
			/ soundEditor.viewWidthInSeconds;

		this.display.drawRectangle
		(
			new Coords(cursorPosInPixels, 0),
			new Coords(1, soundEditor.viewSizeInPixels.y),
			SoundEditor.ColorViewCursor
		);

		var cursorPosInSecondsAsString = "" + cursorPosInSeconds;

		this.display.drawText
		(
			cursorPosInSecondsAsString,
			new Coords
			(
				cursorPosInPixels + 2,
				SoundEditor.TextHeightInPixels
			),
			SoundEditor.ColorViewCursor,
			SoundEditor.ColorViewBackground
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

		var selection = selectionCurrent;
		var timeStartInSecondsRelative =
			selection.timeStartInSeconds - soundEditor.viewOffsetInSeconds;
		var timeEndInSecondsRelative =
			selection.timeEndInSeconds - soundEditor.viewOffsetInSeconds;

		var secondsPerPixel = soundEditor.viewSecondsPerPixel();

		// todo - reversible selections?

		var selectionStartInPixels = timeStartInSecondsRelative / secondsPerPixel;

		var selectionSizeInPixels =
			selectionDurationInSeconds
			/ secondsPerPixel;

		this.display.drawRectangle
		(
			new Coords(selectionStartInPixels, 0),
			new Coords(selectionSizeInPixels, viewSizeInPixels.y),
			SoundEditor.ColorViewSelectionFill,
			SoundEditor.ColorViewSelectionBorder
		);

		if (selectionCurrent.tag != null)
		{
			var selectionAsString = selectionCurrent.toString();

			this.display.drawText
			(
				selectionAsString,
				new Coords
				(
					selectionStartInPixels + 2,
					SoundEditor.TextHeightInPixels
				),
				SoundEditor.ColorViewText,
				SoundEditor.ColorViewBackground
			);
		}
	}

	Track.prototype.domElementUpdate_Sound = function(soundEditor, sound)
	{
		if (soundEditor.hasViewBeenUpdated == true)
		{
			soundEditor.hasViewBeenUpdated = false;

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

			this.displayForSound = new Display(this.display.size);
			this.displayForSound.initialize();
			this.displayForSound.graphics.beginPath();

			var byteConverter = new ByteConverter(bitsPerSample);

			for (var i = 0; i < viewWidthInSamples; i++)
			{
				var sampleIndex =
					i
					+ viewOffsetInSamples
					- soundOffsetWithinTrackInSamples;

				if (sampleIndex < 0 || sampleIndex >= samples.length)
				{
					throw "Error!";
				}
				else
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

						this.displayForSound.graphics.lineTo
						(
							samplePosInPixels.x,
							samplePosInPixels.y
						);
					}
				}
			}

			this.displayForSound.graphics.stroke();

			this.displayForSound.drawRectangle
			(
				new Coords(0, soundEditor.viewSizeInPixelsHalf.y),
				viewSizeInPixels,
				null, // colorFill
				SoundEditor.ColorViewBaseline
			);
		}

		this.display.drawImage(this.displayForSound.canvas, new Coords(0, 0));
	}

	Track.prototype.domElementUpdate_Title = function(viewSizeInPixels)
	{
		this.display.drawRectangle
		(
			this.name,
			new Coords(2, viewSizeInPixels.y - SoundEditor.TextHeightInPixels * .2),
			SoundEditor.ColorViewText,
			SoundEditor.ColorViewBackground
		);
	}

	Track.prototype.domElementUpdate_ViewTimeRange = function(soundEditor)
	{
		var viewMinInSeconds = Math.floor
		(
			soundEditor.viewOffsetInSeconds * 1000
		) / 1000 + "";

		var viewMaxInSeconds = Math.floor
		(
			(
				soundEditor.viewOffsetInSeconds
				+ soundEditor.viewWidthInSeconds
			) * 1000
		) / 1000 + "";

		var textHeightInPixels = SoundEditor.TextHeightInPixels;

		this.display.drawText
		(
			viewMinInSeconds,
			new Coords(0, textHeightInPixels),
			SoundEditor.ColorViewText,
			SoundEditor.ColorViewBackground
		);

		this.display.drawText
		(
			viewMaxInSeconds,
			new Coords
			(
				soundEditor.viewSizeInPixels.x
				- (viewMaxInSeconds.length * textHeightInPixels * .6),
				textHeightInPixels
			),
			SoundEditor.ColorViewText,
			SoundEditor.ColorViewBackground
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
			var timeStartInSeconds = selectionTagged.timeStartInSeconds;
			var timeEndInSeconds = selectionTagged.timeEndInSeconds;

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
				soundEditor.cursorOffsetInSeconds,
				soundEditor.cursorOffsetInSeconds
			);
		}

		var mousePointerOffsetInSeconds = this.mousePointerOffsetInSecondsForEvent(event);

		soundEditor.cursorOffsetInSeconds = mousePointerOffsetInSeconds;
		soundEditor.selectionCurrent.timeEndInSeconds = soundEditor.cursorOffsetInSeconds;
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
