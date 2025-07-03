
class Track
{
	name: string;
	sounds: Sound[];

	display: Display;
	_displayForSound: Display;
	domElement: any;

	constructor(name: string, sounds: Sound[])
	{
		this.name = name;
		this.sounds = sounds;
	}

	durationInSeconds(): number
	{
		var soundEndInSecondsMax = 0;

		for (var i = 0; i < this.sounds.length; i++)
		{
			var sound = this.sounds[i];
			var soundEndInSeconds =
				sound.offsetInSeconds
				+ sound.durationInSeconds();

			if (soundEndInSeconds > soundEndInSecondsMax)
			{
				soundEndInSecondsMax = soundEndInSeconds;
			}
		}

		return soundEndInSecondsMax;
	}

	// dom

	displayForSound(): Display
	{
		if (this._displayForSound == null)
		{
			this._displayForSound = new Display(this.display.size);
			this._displayForSound.initialize();
		}
		return this._displayForSound;
	}

	domElementRemove(): void
	{
		delete this.domElement;
		delete this.display;
	}

	domElementUpdate(soundEditor: SoundEditor): any
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

	domElementUpdate_Background(viewSizeInPixels: Coords): void
	{
		this.display.drawRectangle
		(
			new Coords(0, 0),
			viewSizeInPixels,
			SoundEditor.ColorViewBackground,
			SoundEditor.ColorViewBorder
		);
	}

	domElementUpdate_BuildIfNecessary(viewSizeInPixels: Coords): void
	{
		if (this.domElement == null)
		{
			this.display = new Display(viewSizeInPixels);
			this.display.initialize();
			this.domElement = this.display.canvas;
			this.domElement.entity = this;
		}
	}

	domElementUpdate_Cursor(soundEditor: SoundEditor): void
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
			SoundEditor.ColorViewCursor,
			null // colorBorder
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

	domElementUpdate_Selections(soundEditor: SoundEditor): any
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

	domElementUpdate_Selection
	(
		soundEditor: SoundEditor,
		selectionCurrent: Selection_
	): void
	{
		var viewSizeInPixels = soundEditor.viewSizeInPixels;

		var selectionDurationInSeconds = selectionCurrent.durationInSeconds();

		var selection = selectionCurrent;
		var timeStartInSecondsRelative =
			selection.timeStartInSeconds - soundEditor.viewOffsetInSeconds;
		/*
		var timeEndInSecondsRelative =
			selection.timeEndInSeconds - soundEditor.viewOffsetInSeconds;
		*/

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

	domElementUpdate_Sound(soundEditor: SoundEditor, sound: Sound): void
	{
		if (soundEditor.hasViewBeenUpdated)
		{
			this.domElementUpdate_Sound_Refresh(soundEditor, sound);
		}

		var canvas = this._displayForSound.canvas;
		this.display.drawImage(canvas, new Coords(0, 0));
	}

	domElementUpdate_Sound_Refresh(soundEditor: SoundEditor, sound: Sound): void
	{
		soundEditor.hasViewBeenUpdated = false;

		var soundSource = sound.sourceWavFile;
		var samplingInfo = soundSource.samplingInfo;
		var bitsPerSample = samplingInfo.bitsPerSample;
		var samplesPerSecond = samplingInfo.samplesPerSecond; // hack
		var samples = soundSource.samplesForChannels[0]; // hack

		var soundOffsetInSamples = Math.round
		(
			sound.offsetInSeconds * samplesPerSecond
		);

		var viewSizeInPixels = soundEditor.viewSizeInPixels;
		var viewWidthInPixels = viewSizeInPixels.x;
		var viewHeightInPixelsHalf = soundEditor.viewSizeInPixelsHalf.y;

		var viewOffsetInSamples =
			Math.round(soundEditor.viewOffsetInSeconds * samplesPerSecond);
		var viewWidthInSamples =
			Math.round(soundEditor.viewWidthInSeconds * samplesPerSecond);
		var samplePosInPixelsStart =
			new Coords(0, viewHeightInPixelsHalf);
		var samplesAsPoints = [ samplePosInPixelsStart ];
		var byteConverter = new ByteConverter(bitsPerSample);

		for (var i = 0; i < viewWidthInSamples; i++)
		{
			var samplePosInPixels =
				this.domElementUpdate_Sound_Refresh_Sample
				(
					viewOffsetInSamples,
					soundOffsetInSamples,
					samples,
					viewWidthInPixels,
					viewHeightInPixelsHalf,
					viewWidthInSamples,
					byteConverter,
					i
				);

			samplesAsPoints.push(samplePosInPixels);
		}

		var displayForSound = this.displayForSound();

		displayForSound.drawPathBetweenPoints(samplesAsPoints);

		displayForSound.drawRectangle
		(
			new Coords(0, soundEditor.viewSizeInPixelsHalf.y),
			viewSizeInPixels,
			null, // colorFill
			SoundEditor.ColorViewBaseline
		);
	}

	domElementUpdate_Sound_Refresh_Sample
	(
		viewOffsetInSamples: number,
		soundOffsetInSamples: number,
		samples: number[],
		viewWidthInPixels: number,
		viewHeightInPixelsHalf: number,
		viewWidthInSamples: number,
		byteConverter: ByteConverter,
		i: number
	): Coords
	{
		var samplePosInPixels: Coords;

		var sampleIndex =
			i
			+ viewOffsetInSamples
			- soundOffsetInSamples;

		if (sampleIndex < 0 || sampleIndex >= samples.length)
		{
			throw new Error("Sample index is out of range.");
		}

		var samplePosInPixelsXNext =
			i
			* viewWidthInPixels
			/ viewWidthInSamples;

		var sampleBytes = samples[sampleIndex];

		var sampleValue =
			byteConverter.integerToFloat(sampleBytes);

		var samplePosInPixels = new Coords
		(
			samplePosInPixelsXNext,
			viewHeightInPixelsHalf
			+
			(
				sampleValue
				* viewHeightInPixelsHalf
				* .8 // max amplitude
			)
		);

		return samplePosInPixels;
	}

	domElementUpdate_Title(viewSizeInPixels: Coords): void
	{
		this.display.drawText
		(
			this.name,
			new Coords(2, viewSizeInPixels.y - SoundEditor.TextHeightInPixels * .2),
			SoundEditor.ColorViewText,
			SoundEditor.ColorViewBackground
		);
	}

	domElementUpdate_ViewTimeRange(soundEditor: SoundEditor): void
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

	// Serializable.

	static prototypesSetOnObject(trackAsObject: unknown): Track
	{
		Object.setPrototypeOf(trackAsObject, Track.prototype);
		var track = trackAsObject as Track;
		track.sounds.forEach(x => Sound.prototypesSetOnObject(x) );
		return track;
	}

	// event

	handleEventMouseDown(event: any): void
	{
		var soundEditor = Globals.Instance.soundEditor;
		var session = soundEditor.session;
		session.trackCurrentSet(this);
		soundEditor.selectionCurrent = null;
		var clickOffsetInSeconds =
			this.mousePointerOffsetInSecondsForEvent(event);
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

	handleEventMouseMove(event: any): void
	{
		var soundEditor = Globals.Instance.soundEditor;

		if (soundEditor.selectionCurrent == null)
		{
			soundEditor.selectionCurrent = new Selection_
			(
				null, // tag
				soundEditor.cursorOffsetInSeconds,
				soundEditor.cursorOffsetInSeconds
			);
		}

		var mousePointerOffsetInSeconds =
			this.mousePointerOffsetInSecondsForEvent(event);

		soundEditor.cursorOffsetInSeconds = mousePointerOffsetInSeconds;
		soundEditor.selectionCurrent.timeEndInSeconds = soundEditor.cursorOffsetInSeconds;
		soundEditor.domElementUpdate();
	}

	handleEventMouseUp(event: any): void
	{
		var soundEditor = Globals.Instance.soundEditor;

		if (soundEditor.selectionCurrent != null)
		{
			soundEditor.selectionCurrent.rectify();
		}
	}

	mousePointerOffsetInSecondsForEvent(event: any): number
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

	toWavFile(): WavFile
	{
		var soundToExport = this.sounds[0]; // todo - Combine.
		var soundToExportAsWavFile = soundToExport.sourceWavFile; // todo - Transform.
		return soundToExportAsWavFile;
	}
}
