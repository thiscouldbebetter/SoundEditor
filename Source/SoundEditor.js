
function SoundEditor
(
	viewSizeInPixels,
	session
)
{
	this.viewSizeInPixels = viewSizeInPixels;
	this.session = session;

	if (this.session == null)
	{
		this.sessionNew();

	}

	this.viewSizeInPixelsHalf = this.viewSizeInPixels.clone().divideScalar(2);

	this.selectionCurrent = null;
	this.cursorOffsetInSeconds = 0;
	this.viewZoomToFit();

}

{
	// constants

	SoundEditor.ColorViewBackground = "White";
	SoundEditor.ColorViewBaseline = "Black";
	SoundEditor.ColorViewBorder = "Gray";
	SoundEditor.ColorViewCursor = "Black";
	SoundEditor.ColorViewSelectionBorder = "Gray";
	SoundEditor.ColorViewSelectionFill = "rgba(0, 0, 0, .05)";
	SoundEditor.ColorViewText = "Black";
	SoundEditor.ColorViewWaveform = "Gray";

	SoundEditor.TextHeightInPixels = 10;

	// instance methods

	SoundEditor.prototype.cursorMove = function
	(
		shouldAdjustmentBeSmall,
		direction
	)
	{
		var distanceToMoveInSeconds = this.distancePerAdjustmentInSeconds
		(
			shouldAdjustmentBeSmall
		);

		var displacementInSeconds = distanceToMoveInSeconds * direction;

		this.cursorOffsetInSeconds =
		(
			this.cursorOffsetInSeconds + displacementInSeconds
		).trimToRange
		(
			this.session.durationInSeconds()
		);

		this.domElementUpdate();
	}

	SoundEditor.prototype.distancePerAdjustmentInSeconds = function(shouldAdjustmentBeSmall)
	{
		var distanceToMoveInSeconds;

		if (shouldAdjustmentBeSmall == true)
		{
			distanceToMoveInSeconds = .001;
		}
		else
		{
			distanceToMoveInSeconds = this.viewSecondsPerPixel();
		}

		return distanceToMoveInSeconds;
	}

	SoundEditor.prototype.filterSelection = function()
	{
		var track = this.session.trackCurrent();

		if (track == null || this.selectionCurrent == null)
		{
			alert("Nothing to filter!");
			return;
		}

		var filterSelected = this.selectFilterType.selectedOptions[0].entity;
		var parametersForFilter = this.inputFilterParameters.value;

		var sound = track.sounds[0];

		var soundSource = sound.sourceWavFile;
		var samplingInfo = soundSource.samplingInfo;
		var samplesPerSecond = samplingInfo.samplesPerSecond;

		var selection = this.selectionCurrent;
		var timeStartInSeconds = selection.timeStartInSeconds;
		var timeEndInSeconds = selection.timeEndInSeconds;

		var timeStartInSamples = Math.round(samplesPerSecond * timeStartInSeconds);
		var timeEndInSamples = Math.round(samplesPerSecond * timeEndInSeconds);
		var durationInSamples = timeEndInSamples - timeStartInSamples;

		var samplesForChannels = soundSource.samplesForChannels;

		var byteConverter = new ByteConverter(samplingInfo.bitsPerSample);

		for (var c = 0; c < samplesForChannels.length; c++)
		{
			var samplesForChannel = samplesForChannels[c];

			for (var s = 0; s < durationInSamples; s++)
			{
				var sampleIndex = timeStartInSamples + s;
				var sample = samplesForChannel[sampleIndex];

				var timeInSeconds = s / samplesPerSecond;

				var sampleAsFloat = byteConverter.integerToFloat(sample);

				sampleAsFloat = filterSelected.applyToSampleAtTimeWithParameters
				(
					sampleAsFloat,
					timeInSeconds,
					parametersForFilter
				);

				var sampleAsFloatAbsolute = Math.abs(sampleAsFloat);
				if (sampleAsFloatAbsolute > 1)
				{
					sampleAsFloat /= sampleAsFloatAbsolute;
				}

				sample = byteConverter.floatToInteger(sampleAsFloat);
				samplesForChannel[sampleIndex] = sample;
			}
		}

		this.domElementUpdate();
	}

	SoundEditor.prototype.play = function()
	{
		if (this.soundPlaying != null)
		{
			return;
		}

		var track = this.session.trackCurrent();

		if (track == null)
		{
			alert("Nothing to play!");
			return;
		}

		var soundToPlay = track.sounds[0];

		if (this.selectionCurrent != null)
		{
			var soundSource = soundToPlay.sourceWavFile;

			var selection = this.selectionCurrent;
			var timeStartInSeconds = selection.timeStartInSeconds;
			var timeEndInSeconds = selection.timeEndInSeconds;

			var selectionAsWavFile = soundSource.clipBetweenTimes
			(
				timeStartInSeconds, timeEndInSeconds
			);

			soundToPlay = new Sound
			(
				"[current selection]",
				selectionAsWavFile
			);
		}

		this.soundPlaying = soundToPlay;
		soundToPlay.play(this.play_PlaybackComplete);
	}

	SoundEditor.prototype.play_PlaybackComplete = function()
	{
		this.soundPlaying = null;
	}

	SoundEditor.prototype.record = function()
	{
		alert("Not yet implemented!");
	}

	SoundEditor.prototype.stop = function()
	{
		if (this.soundPlaying != null)
		{
			this.soundPlaying.stop();
			this.soundPlaying = null;
		}
	}

	SoundEditor.prototype.selectAll = function()
	{
		this.selectionCurrent = new Selection
		(
			null, // tag
			0, this.session.durationInSeconds()
		);
		this.viewZoomToFit();
	}

	SoundEditor.prototype.selectNone = function()
	{
		this.selectionCurrent = null;
		this.domElementUpdate();
	}

	SoundEditor.prototype.selectionRemoveByTag = function()
	{
		var tagToRemove = this.inputTagText.value;

		var session = this.session;
		var selectionsTagged = session.selectionsTagged;

		for (var i = 0; i < selectionsTagged.length; i++)
		{
			var selectionExisting = selectionsTagged[i];
			if (selectionExisting.tag == tagToRemove)
			{
				selectionsTagged.splice
				(
					selectionsTagged.indexOf(selectionExisting),
					1
				);
				delete selectionsTagged[tagToRemove];
				this.domElementUpdate();
				break;
			}
		}
	}

	SoundEditor.prototype.selectionResize = function
	(
		shouldAdjustmentBeSmall,
		direction
	)
	{
		if (this.selectionCurrent == null)
		{
			this.selectionCurrent = new Selection
			(
				null, // tag
				this.cursorOffsetInSeconds,
				this.cursorOffsetInSeconds,
			);
		}

		var amountToResizeInSeconds = this.distancePerAdjustmentInSeconds
		(
			shouldAdjustmentBeSmall
		);

		var displacementInSeconds = amountToResizeInSeconds * direction;

		if (direction < 0)
		{
			this.timeStartInSeconds =
			(
				this.timeStartInSeconds + displacementInSeconds
			).trimToRange
			(
				this.session.durationInSeconds()
			);
		}
		else
		{
			this.timeEndInSeconds =
			(
				this.timeEndInSeconds + displacementInSeconds
			).trimToRange
			(
				this.session.durationInSeconds()
			);
		}

		this.domElementUpdate();
	}

	SoundEditor.prototype.selectionSelectByTag = function()
	{
		var tagToSelect = this.inputTagText.value;

		var session = this.session;
		var selectionsTagged = session.selectionsTagged;

		for (var i = 0; i < selectionsTagged.length; i++)
		{
			var selectionExisting = selectionsTagged[i];
			if (selectionExisting.tag == tagToSelect)
			{
				this.selectionCurrent = selectionExisting;
				this.domElementUpdate();
				break;
			}
		}
	}

	SoundEditor.prototype.selectionTag = function()
	{
		if (this.selectionCurrent != null)
		{
			var session = this.session;
			var selectionsTagged = session.selectionsTagged;

			var doesSelectionCurrentOverlapWithAnyExisting = false;
			for (var i = 0; i < selectionsTagged.length; i++)
			{
				var selectionExisting = selectionsTagged[i];
				if (this.selectionCurrent.overlapsWith(selectionExisting) == true)
				{
					doesSelectionCurrentOverlapWithAnyExisting = true;
					break;
				}
			}

			if (doesSelectionCurrentOverlapWithAnyExisting == false)
			{
				var tagText = this.inputTagText.value;
				this.selectionCurrent.tag = tagText;
				selectionsTagged.push(this.selectionCurrent);
				selectionsTagged[this.selectionCurrent.tag] = this.selectionCurrent;
			}

			this.selectionCurrent = null;

			this.domElementUpdate();
		}
	}

	SoundEditor.prototype.selectionsTaggedExport = function()
	{
		var fileContents = Selection.convertManyToStringSRT
		(
			this.session.selectionsTagged
		);

		FileHelper.saveTextAsFile(fileContents, this.session.name + ".srt");
	}

	SoundEditor.prototype.selectionsTaggedImport = function()
	{
		var inputFileToLoad = document.createElement("input");
		inputFileToLoad.type = "file";
		var callback = this.selectionsTaggedImport_LoadComplete.bind(this);
		inputFileToLoad.onchange = function(event)
		{
			var srcElement = event.srcElement;
			var fileToLoad = srcElement.files[0];
			srcElement.parentElement.removeChild(srcElement);

			FileHelper.loadFileAsText(fileToLoad, callback);
		}

		this.divControlsFile.insertBefore
		(
			inputFileToLoad,
			this.buttonTagsImport.nextSibling
		);
	}

	SoundEditor.prototype.selectionsTaggedImport_LoadComplete = function(textFromFile)
	{
		var selections = Selection.buildManyFromStringSRT
		(
			textFromFile
		);

		this.session.selectionsTagged = selections;

		this.domElementUpdate();
	}

	SoundEditor.prototype.sessionLoad = function()
	{
		var inputFileToLoad = document.createElement("input");
		inputFileToLoad.type = "file";
		var callback = this.sessionLoad_LoadComplete.bind(this);
		inputFileToLoad.onchange = function(event)
		{
			var srcElement = event.srcElement;
			var fileToLoad = srcElement.files[0];
			srcElement.parentElement.removeChild(srcElement);

			FileHelper.loadFileAsText(fileToLoad, callback);
		}

		this.divControlsFile.insertBefore
		(
			inputFileToLoad,
			this.buttonSessionLoad.nextSibling
		);
	}

	SoundEditor.prototype.sessionLoad_LoadComplete = function(file, textFromFile)
	{
		this.domElementRemove();

		this.session = Session.fromStringJSON(textFromFile);

		this.session.addLookups();

		this.viewZoomToFit();

		this.domElementUpdate();
	}

	SoundEditor.prototype.sessionNew = function()
	{
		this.session = new Session
		(
			"[untitled]",
			"", // tagsToPlay
			[], // tracks
			[] // selections
		);

		this.domElementRemove();

		this.domElementUpdate();
	}

	SoundEditor.prototype.sessionSave = function()
	{
		this.domElementRemove();

		var sessionAsJSON = this.session.toStringJSON();

		FileHelper.saveTextAsFile(sessionAsJSON, this.session.name + ".json");

		this.domElementUpdate();
	}

	SoundEditor.prototype.tagsExportAsSound = function()
	{
		var track = this.session.trackCurrent();

		if (track == null)
		{
			alert("Nothing to export!");
			return;
		}

		var soundToSelectFrom = track.sounds[0];

		var soundToExport = this.tagsPlay_BuildSound(soundToSelectFrom);
		var wavFileToExport = soundToExport.sourceWavFile;
		var soundToExportAsBytes = wavFileToExport.toBytes();

		var filename = this.session.tagsToPlay + ".wav";

		FileHelper.saveBytesToFile
		(
			soundToExportAsBytes,
			filename
		);
	}

	SoundEditor.prototype.tagsPlay = function()
	{
		var track = this.session.trackCurrent();

		if (track == null)
		{
			alert("Nothing to play!");
			return;
		}

		var soundToSelectFrom = track.sounds[0];

		var soundToPlay = this.tagsPlay_BuildSound(soundToSelectFrom);

		this.soundPlaying = soundToPlay;
		soundToPlay.play(this.play_PlaybackComplete);
	}

	SoundEditor.prototype.tagsPlay_BuildSound = function(soundToSelectFrom)
	{
		var soundAsWavFileSource = soundToSelectFrom.sourceWavFile;

		var numberOfChannels = soundAsWavFileSource.samplesForChannels.length;
		var samplesForChannels = [];
		for (var i = 0; i < numberOfChannels; i++)
		{
			samplesForChannels.push([]);
		}

		var soundAsWavFileTarget = new WavFile
		(
			soundAsWavFileSource.filePath,
			soundAsWavFileSource.samplingInfo,
			samplesForChannels
		);

		var tagsToPlayAsString = this.session.tagsToPlay; // this.inputTagsToPlay.value;
		var tagsToPlayAsStrings = tagsToPlayAsString.split(" ");

		for (var t = 0; t < tagsToPlayAsStrings.length; t++)
		{
			var tagAsString = tagsToPlayAsStrings[t];
			var tag = this.session.selectionsTagged[tagAsString];

			if (tag != null)
			{
				soundAsWavFileTarget.appendClipFromWavFileBetweenTimesStartAndEnd
				(
					soundAsWavFileSource,
					tag.timeStartInSeconds,
					tag.timeEndInSeconds
				);
			}
		}

		var returnValue = new Sound
		(
			"[tags]",
			soundAsWavFileTarget
		);

		return returnValue;
	}

	SoundEditor.prototype.trackAdd = function()
	{
		var inputFileToLoad = document.createElement("input");
		inputFileToLoad.type = "file";
		var callback = this.trackAdd_LoadComplete.bind(this);
		inputFileToLoad.onchange = function(event)
		{
			var srcElement = event.srcElement;
			var fileToLoad = srcElement.files[0];
			FileHelper.loadFileAsBytes
			(
				fileToLoad,
				callback
			);
			srcElement.parentElement.removeChild(srcElement);
		}

		this.divControlsFile.insertBefore
		(
			inputFileToLoad,
			this.buttonTrackAdd.nextSibling
		);
	}

	SoundEditor.prototype.trackAdd_LoadComplete = function(wavFileName, wavFileAsBytes)
	{
		var wavFileLoaded = WavFile.fromBytes(wavFileName, wavFileAsBytes);
		var sound = new Sound
		(
			wavFileLoaded.filePath,
			wavFileLoaded
		);

		var track = new Track
		(
			wavFileLoaded.filePath,
			[ sound ]
		);

		this.session.tracks.push(track);

		this.viewZoomToFit();

		this.domElementUpdate();
	}

	SoundEditor.prototype.trackRemove = function()
	{
		alert("Not yet implemented!");
	}

	SoundEditor.prototype.viewSecondsPerPixel = function()
	{
		var returnValue = this.viewWidthInSeconds / this.viewSizeInPixels.x;

		return returnValue;
	}

	SoundEditor.prototype.viewSlide = function(shouldAdjustmentBeSmall, direction)
	{
		var distanceToMoveInSeconds;

		if (shouldAdjustmentBeSmall == true)
		{
			distanceToMoveInSeconds = .001;
		}
		else
		{
			distanceToMoveInSeconds = this.viewSecondsPerPixel();
		}

		var displacementInSeconds =
			distanceToMoveInSeconds * direction;

		this.viewOffsetInSeconds =
		(
			this.viewOffsetInSeconds + displacementInSeconds
		).trimToRange
		(
			this.session.durationInSeconds() - this.viewWidthInSeconds
		);

		this.hasViewBeenUpdated = true;

		this.domElementUpdate();
	}

	SoundEditor.prototype.viewZoomToFit = function()
	{
		this.viewOffsetInSeconds = 0;
		this.viewWidthInSeconds = this.session.durationInSeconds();
		this.hasViewBeenUpdated = true;
		this.domElementUpdate();
	}

	SoundEditor.prototype.viewZoomToSelection = function()
	{
		if (this.selectionCurrent != null)
		{
			var selectionDurationInSeconds = this.selectionCurrent.durationInSeconds();
			if (selectionDurationInSeconds > 0)
			{
				var selection = this.selectionCurrent;
				var timeStartInSeconds = selection.timeStartInSeconds;
				var timeEndInSeconds = selection.timeEndInSeconds;

				this.viewOffsetInSeconds = timeStartInSeconds;
				this.viewWidthInSeconds = selectionDurationInSeconds;

				this.selectionCurrent = null;
				this.hasViewBeenUpdated = true;

				this.domElementUpdate();
			}
		}
	}

	// dom

	SoundEditor.prototype.domElementRemove = function()
	{
		if (this.domElement != null)
		{
			this.domElement.parentElement.removeChild(this.domElement);
			delete this.domElement;

			this.session.domElementRemove();
		}
	}

	SoundEditor.prototype.domElementUpdate = function()
	{
		this.domElementUpdate_BuildIfNecessary();
		this.domElementUpdate_Controls();
		this.domElementUpdate_Waveform();
		this.domElementUpdate_Cursor();
		this.domElementUpdate_Selection();

		return this.domElement;
	}

	SoundEditor.prototype.domElementUpdate_BuildIfNecessary = function()
	{
		if (this.domElement == null)
		{
			var divEditor = document.createElement("div");

			divEditor.appendChild
			(
				this.domElementUpdate_BuildIfNecessary_ControlsSessionName()
			);

			var divTracks = this.domElementUpdate_BuildIfNecessary_Tracks();
			divEditor.appendChild(divTracks);
			this.divTracks = divTracks;

			var divControls = document.createElement("div");

			divControls.appendChild
			(
				this.domElementUpdate_BuildIfNecessary_ControlsCursor()
			);

			divControls.appendChild
			(
				this.domElementUpdate_BuildIfNecessary_ControlsSelection()
			);

			divControls.appendChild
			(
				this.domElementUpdate_BuildIfNecessary_ControlsFilter()
			);

			divControls.appendChild
			(
				this.domElementUpdate_BuildIfNecessary_ControlsPlayback()
			);

			divControls.appendChild
			(
				this.domElementUpdate_BuildIfNecessary_ControlsComposite()
			);

			divControls.appendChild
			(
				this.domElementUpdate_BuildIfNecessary_ControlsZoom()
			);

			divControls.appendChild
			(
				this.domElementUpdate_BuildIfNecessary_ControlsFile()
			);

			divEditor.appendChild(divControls);

			this.divControls = divControls;

			this.domElement = divEditor;

			document.body.appendChild(this.domElement);
		}
	}

	SoundEditor.prototype.domElementUpdate_BuildIfNecessary_ControlsSessionName = function()
	{
		var divControlsSessionName = document.createElement("div");
		divControlsSessionName.style.border = "1px solid";

		var labelSessionName = document.createElement("label");
		labelSessionName.innerHTML = "Session Name:";
		divControlsSessionName.appendChild(labelSessionName);

		this.inputSessionName = document.createElement("input");
		this.inputSessionName.style.width = 200;
		this.inputSessionName.onchange = this.handleEventInputSessionNameChanged.bind(this);
		divControlsSessionName.appendChild(this.inputSessionName);

		return divControlsSessionName;
	}

	SoundEditor.prototype.domElementUpdate_BuildIfNecessary_Tracks = function()
	{
		var returnValue = document.createElement("div");

		returnValue.style.border = "1px solid";
		returnValue.style.width = this.viewSizeInPixels.x;

		for (var t = 0; t < this.session.tracks.length; t++)
		{
			var track = this.session.tracks[t];
			var domElementForTrack = track.domElementUpdate(this);
			returnValue.appendChild(domElementForTrack);
		}

		return returnValue;
	}

	SoundEditor.prototype.domElementUpdate_BuildIfNecessary_ControlsComposite = function()
	{
		var divControlsComposite = document.createElement("div");
		divControlsComposite.style.border = "1px solid";

		var labelTagsToPlay = document.createElement("label");
		labelTagsToPlay.innerHTML = "Tags to Play:"
		divControlsComposite.appendChild(labelTagsToPlay);

		this.inputTagsToPlay = document.createElement("input");
		this.inputTagsToPlay.style.width = 256;
		this.inputTagsToPlay.onchange = this.handleEventInputTagsToPlay_Changed.bind(this);
		divControlsComposite.appendChild(this.inputTagsToPlay);

		var buttonPlay = document.createElement("button");
		buttonPlay.innerHTML = "Play Tagged Selections";
		buttonPlay.onclick = this.tagsPlay.bind(this);
		divControlsComposite.appendChild(buttonPlay);

		var buttonExport = document.createElement("button");
		buttonExport.innerHTML = "Export Tagged Selections";
		buttonExport.onclick = this.tagsExportAsSound.bind(this);
		divControlsComposite.appendChild(buttonExport);

		return divControlsComposite;
	}

	SoundEditor.prototype.domElementUpdate_BuildIfNecessary_ControlsCursor = function()
	{
		var divControlsCursor = document.createElement("div");
		divControlsCursor.style.border = "1px solid";

		var labelCursor = document.createElement("label");
		labelCursor.innerHTML = "Cursor:";
		divControlsCursor.appendChild(labelCursor);

		var labelCursorPosInSeconds = document.createElement("label");
		labelCursorPosInSeconds.innerHTML = "Seconds:";
		divControlsCursor.appendChild(labelCursorPosInSeconds);

		this.inputCursorPosInSeconds = document.createElement("input");
		this.inputCursorPosInSeconds.disabled = true; // todo
		this.inputCursorPosInSeconds.style.width = 64;
		this.inputCursorPosInSeconds.type = "number";
		this.inputCursorPosInSeconds.onchange = this.handleEventInputCursorPosInSecondsChanged.bind(this);
		divControlsCursor.appendChild(this.inputCursorPosInSeconds);

		return divControlsCursor;
	}

	SoundEditor.prototype.domElementUpdate_BuildIfNecessary_ControlsFile = function()
	{
		var divControlsFile = document.createElement("div");
		divControlsFile.style.border = "1px solid";

		var buttonTrackAdd = document.createElement("button");
		buttonTrackAdd.innerHTML = "Load Sound as Track";
		buttonTrackAdd.onclick = this.trackAdd.bind(this);
		divControlsFile.appendChild(buttonTrackAdd);
		this.buttonTrackAdd = buttonTrackAdd;

		var buttonSessionNew = document.createElement("button");
		buttonSessionNew.innerHTML = "New Session";
		buttonSessionNew.onclick = this.sessionNew.bind(this);
		divControlsFile.appendChild(buttonSessionNew);

		var buttonSessionLoad = document.createElement("button");
		buttonSessionLoad.innerHTML = "Load Session";
		buttonSessionLoad.onclick = this.sessionLoad.bind(this);
		divControlsFile.appendChild(buttonSessionLoad);
		this.buttonSessionLoad = buttonSessionLoad;

		var buttonSessionSave = document.createElement("button");
		buttonSessionSave.innerHTML = "Save Session";
		buttonSessionSave.onclick = this.sessionSave.bind(this);
		divControlsFile.appendChild(buttonSessionSave);

		var buttonTagsExport = document.createElement("button");
		buttonTagsExport.innerHTML = "Export Tags";
		buttonTagsExport.onclick = this.selectionsTaggedExport.bind(this);
		divControlsFile.appendChild(buttonTagsExport);

		var buttonTagsImport = document.createElement("button");
		buttonTagsImport.innerHTML = "Import Tags";
		buttonTagsImport.onclick = this.selectionsTaggedImport.bind(this);
		divControlsFile.appendChild(buttonTagsImport);
		this.buttonTagsImport = buttonTagsImport;

		this.divControlsFile = divControlsFile;

		return divControlsFile;
	}

	SoundEditor.prototype.domElementUpdate_BuildIfNecessary_ControlsFilter = function()
	{
		var divControlsFilter = document.createElement("div");
		divControlsFilter.style.border = "1px solid";

		var labelFilter = document.createElement("label");
		labelFilter.innerHTML = "Filter:";
		divControlsFilter.appendChild(labelFilter);

		var labelType = document.createElement("label");
		labelType.innerHTML = "Type:";
		divControlsFilter.appendChild(labelType);

		this.selectFilterType = document.createElement("select");
		this.selectFilterType.style.width = 128;
		divControlsFilter.appendChild(this.selectFilterType);

		var filters = Filter.Instances._All;

		for (var i = 0; i < filters.length; i++)
		{
			var filter = filters[i];

			var optionForFilter = document.createElement("option");
			optionForFilter.innerHTML = filter.name;
			optionForFilter.entity = filter;

			this.selectFilterType.appendChild(optionForFilter);
		}

		var labelParameters = document.createElement("label");
		labelParameters.innerHTML = "Parameters:";
		divControlsFilter.appendChild(labelParameters);

		this.inputFilterParameters = document.createElement("input");
		this.inputFilterParameters.style.width = 128;
		divControlsFilter.appendChild(this.inputFilterParameters);

		var buttonFilterSelection = document.createElement("button");
		buttonFilterSelection.innerHTML = "Filter Selection";
		buttonFilterSelection.onclick = this.filterSelection.bind(this);
		divControlsFilter.appendChild(buttonFilterSelection);

		return divControlsFilter;
	}

	SoundEditor.prototype.domElementUpdate_BuildIfNecessary_ControlsPlayback = function()
	{
		var divControlsPlayback = document.createElement("div");
		divControlsPlayback.style.border = "1px solid";

		var buttonPlay = document.createElement("button");
		buttonPlay.innerHTML = "Play";
		buttonPlay.onclick = this.play.bind(this);
		divControlsPlayback.appendChild(buttonPlay);

		var buttonStop = document.createElement("button");
		buttonStop.innerHTML = "Stop";
		buttonStop.onclick = this.stop.bind(this);
		divControlsPlayback.appendChild(buttonStop);

		var buttonRecord = document.createElement("button");
		buttonRecord.innerHTML = "Record";
		buttonRecord.onclick = this.record.bind(this);
		this.buttonRecord = buttonRecord;
		divControlsPlayback.appendChild(buttonRecord);

		this.divControlsPlayback = divControlsPlayback;

		return divControlsPlayback;
	}

	SoundEditor.prototype.domElementUpdate_BuildIfNecessary_ControlsSelection = function()
	{
		var divControlsSelection = document.createElement("div");
		divControlsSelection.style.border = "1px solid";

		var labelSelected = document.createElement("label");
		labelSelected.innerHTML = "Selected:";
		divControlsSelection.appendChild(labelSelected);

		var labelSelectionStartInSeconds = document.createElement("label");
		labelSelectionStartInSeconds.innerHTML = "Seconds:";
		divControlsSelection.appendChild(labelSelectionStartInSeconds);

		this.inputSelectionStartInSeconds = document.createElement("input");
		this.inputSelectionStartInSeconds.disabled = true; // todo
		this.inputSelectionStartInSeconds.style.width = 64;
		this.inputSelectionStartInSeconds.type = "number";
		this.inputSelectionStartInSeconds.onchange = this.handleEventInputSelectionStartInSecondsChanged.bind(this);
		divControlsSelection.appendChild(this.inputSelectionStartInSeconds);

		var labelSelectionEndInSeconds = document.createElement("label");
		labelSelectionEndInSeconds.innerHTML = "to";
		divControlsSelection.appendChild(labelSelectionEndInSeconds);

		this.inputSelectionEndInSeconds = document.createElement("input");
		this.inputSelectionEndInSeconds.disabled = true;
		this.inputSelectionEndInSeconds.style.width = 64;
		this.inputSelectionEndInSeconds.type = "number";
		this.inputSelectionEndInSeconds.onchange = this.handleEventInputSelectionEndInSecondsChanged.bind(this);
		divControlsSelection.appendChild(this.inputSelectionEndInSeconds);

		var buttonSelectAll = document.createElement("button");
		buttonSelectAll.innerHTML = "All";
		buttonSelectAll.onclick = this.selectAll.bind(this);
		divControlsSelection.appendChild(buttonSelectAll);

		var buttonSelectNone = document.createElement("button");
		buttonSelectNone.innerHTML = "None";
		buttonSelectNone.onclick = this.selectNone.bind(this);
		divControlsSelection.appendChild(buttonSelectNone);

		var labelTag = document.createElement("label");
		labelTag.innerHTML = "Tag:";
		divControlsSelection.appendChild(labelTag);

		this.inputTagText = document.createElement("input");
		this.inputTagText.style.width = 128;
		divControlsSelection.appendChild(this.inputTagText);

		var buttonTagAdd = document.createElement("button");
		buttonTagAdd.innerHTML = "Tag Selection";
		buttonTagAdd.onclick = this.selectionTag.bind(this);
		divControlsSelection.appendChild(buttonTagAdd);

		var buttonTagSelect = document.createElement("button");
		buttonTagSelect.innerHTML = "Select by Tag";
		buttonTagSelect.onclick = this.selectionSelectByTag.bind(this);
		divControlsSelection.appendChild(buttonTagSelect);

		var buttonTagRemove = document.createElement("button");
		buttonTagRemove.innerHTML = "Remove Selection by Tag";
		buttonTagRemove.onclick = this.selectionRemoveByTag.bind(this);
		divControlsSelection.appendChild(buttonTagRemove);

		return divControlsSelection;
	}

	SoundEditor.prototype.domElementUpdate_BuildIfNecessary_ControlsZoom = function()
	{
		var divControlsZoom = document.createElement("div");
		divControlsZoom.style.border = "1px solid";

		var buttonZoomToSelection = document.createElement("button");
		buttonZoomToSelection.innerHTML = "Zoom to Selection";
		buttonZoomToSelection.onclick = this.viewZoomToSelection.bind(this);
		divControlsZoom.appendChild(buttonZoomToSelection);

		var buttonZoomToFit = document.createElement("button");
		buttonZoomToFit.innerHTML = "Zoom to Fit";
		buttonZoomToFit.onclick = this.viewZoomToFit.bind(this);
		divControlsZoom.appendChild(buttonZoomToFit);

		return divControlsZoom;
	}

	SoundEditor.prototype.domElementUpdate_Controls = function()
	{
		this.inputSessionName.value = this.session.name;
		this.inputTagsToPlay.value = this.session.tagsToPlay;
	}

	SoundEditor.prototype.domElementUpdate_Cursor = function()
	{
		this.inputCursorPosInSeconds.value = this.cursorOffsetInSeconds;
	}

	SoundEditor.prototype.domElementUpdate_Selection = function()
	{
		if (this.selectionCurrent == null)
		{
			this.inputSelectionStartInSeconds.value = "";
			this.inputSelectionEndInSeconds.value = "";
		}
		else
		{
			var selection = this.selectionCurrent;
			var timeStartInSeconds = selection.timeStartInSeconds;
			var timeEndInSeconds = selection.timeEndInSeconds;

			this.inputSelectionStartInSeconds.value = timeStartInSeconds;
			this.inputSelectionEndInSeconds.value = timeEndInSeconds;
		}
	}

	SoundEditor.prototype.domElementUpdate_Waveform = function()
	{
		for (var t = 0; t < this.session.tracks.length; t++)
		{
			var track = this.session.tracks[t];
			var domElementForTrack = track.domElementUpdate(this);
			if (domElementForTrack.parentElement == null)
			{
				this.divTracks.appendChild(domElementForTrack);
			}
		}
	}

	// events

	SoundEditor.prototype.handleEventInputCursorPosInSecondsChanged = function(event)
	{
		// todo
	}

	SoundEditor.prototype.handleEventInputSelectionStartInSecondsChanged = function(event)
	{
		// todo
	}

	SoundEditor.prototype.handleEventInputSelectionEndInSecondsChanged = function(event)
	{
		// todo
	}

	SoundEditor.prototype.handleEventInputSessionNameChanged = function(event)
	{
		this.session.name = event.target.value;
	}

	SoundEditor.prototype.handleEventInputTagsToPlay_Changed = function(event)
	{
		this.session.tagsToPlay = event.target.value;
	}

	SoundEditor.prototype.handleEventKeyDown = function(event)
	{
		var key = event.key;

		if (key == "ArrowLeft")
		{
			this.handleEventKeyDown_ArrowLeftOrRight(event, -1);
		}
		else if (key == "ArrowUp")
		{
			this.trackIndexCurrent =
			(
				this.trackIndexCurrent - 1
			).trimToRange
			(
				this.session.tracks.length
			);
		}
		else if (key == "ArrowRight")
		{
			this.handleEventKeyDown_ArrowLeftOrRight(event, 1);
		}
		else if (key == "ArrowDown")
		{
			this.trackIndexCurrent =
			(
				this.trackIndexCurrent + 1
			).trimToRange
			(
				this.session.tracks.length
			);
		}
		else if (key == "a")
		{
			// todo - contingent event.preventDefault();

			if (event.ctrlKey == true)
			{
				if (event.shiftKey == true)
				{
					this.selectNone();
				}
				else
				{
					this.selectAll();
				}
			}
		}
	}

	SoundEditor.prototype.handleEventKeyDown_ArrowLeftOrRight = function(event, direction)
	{
		var shouldAdjustmentBeSmall = event.ctrlKey;

		if (event.altKey == true)
		{
			this.viewSlide
			(
				shouldAdjustmentBeSmall,
				direction
			);
		}
		else if (event.shiftKey == true)
		{
			this.selectionResize
			(
				shouldAdjustmentBeSmall,
				direction
			);
		}
		else
		{
			this.cursorMove(shouldAdjustmentBeSmall, direction);
		}
	}
}
