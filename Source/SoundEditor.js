"use strict";
class SoundEditor {
    constructor(viewSizeInPixels, session) {
        this.viewSizeInPixels = viewSizeInPixels;
        this.session = session;
        if (this.session == null) {
            this.sessionNew();
        }
        this.viewSizeInPixelsHalf =
            this.viewSizeInPixels.clone().divideScalar(2);
        this.selectionCurrent = null;
        this.cursorOffsetInSeconds = 0;
        this.viewZoomToFit();
    }
    // instance methods
    cursorMove(shouldAdjustmentBeSmall, direction) {
        var distanceToMoveInSeconds = this.distancePerAdjustmentInSeconds(shouldAdjustmentBeSmall);
        var displacementInSeconds = distanceToMoveInSeconds * direction;
        this.cursorOffsetInSeconds = NumberHelper.trimNumberToMax(this.cursorOffsetInSeconds + displacementInSeconds, this.session.durationInSeconds());
        this.domElementUpdate();
    }
    distancePerAdjustmentInSeconds(shouldAdjustmentBeSmall) {
        var distanceToMoveInSeconds;
        if (shouldAdjustmentBeSmall == true) {
            distanceToMoveInSeconds = .001;
        }
        else {
            distanceToMoveInSeconds = this.viewSecondsPerPixel();
        }
        return distanceToMoveInSeconds;
    }
    filterByName(name) {
        return Filter.byName(name);
    }
    filterSelection() {
        var track = this.session.trackCurrent();
        if (track == null || this.selectionCurrent == null) {
            this.statusMessageSet("No selection to filter!");
            return;
        }
        var filterSelectedName = this.selectFilterType.selectedOptions[0].value;
        var filterSelected = this.filterByName(filterSelectedName);
        var parametersForFilter = this.inputFilterParameters.value;
        var sound = track.sounds[0];
        var soundSource = sound.sourceWavFile;
        parametersForFilter =
            filterSelected.initializeForSoundSource(soundSource, parametersForFilter);
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
        for (var c = 0; c < samplesForChannels.length; c++) {
            var samplesForChannel = samplesForChannels[c];
            for (var s = 0; s < durationInSamples; s++) {
                var sampleIndex = timeStartInSamples + s;
                var sample = samplesForChannel[sampleIndex];
                var timeInSeconds = s / samplesPerSecond;
                var sampleAsFloat = byteConverter.integerToFloat(sample);
                sampleAsFloat = filterSelected.applyToSampleAtTimeWithParameters(sampleAsFloat, timeInSeconds, parametersForFilter);
                var sampleAsFloatAbsolute = Math.abs(sampleAsFloat);
                if (sampleAsFloatAbsolute > 1) {
                    sampleAsFloat /= sampleAsFloatAbsolute;
                }
                sample = byteConverter.floatToInteger(sampleAsFloat);
                samplesForChannel[sampleIndex] = sample;
            }
        }
        this.hasViewBeenUpdatedSet();
        this.domElementUpdate();
    }
    hasViewBeenUpdatedSet() {
        this.hasViewBeenUpdated = true;
    }
    play() {
        if (this.soundPlaying != null) {
            return;
        }
        var track = this.session.trackCurrent();
        if (track == null) {
            this.statusMessageSet("Nothing to play!");
            return;
        }
        var soundToPlay = track.sounds[0];
        if (this.selectionCurrent != null) {
            var soundSource = soundToPlay.sourceWavFile;
            var selection = this.selectionCurrent;
            var timeStartInSeconds = selection.timeStartInSeconds;
            var timeEndInSeconds = selection.timeEndInSeconds;
            var selectionAsWavFile = soundSource.clipBetweenTimes(timeStartInSeconds, timeEndInSeconds);
            soundToPlay = new Sound("[current selection]", selectionAsWavFile, 0 // offsetInSeconds
            );
        }
        this.soundPlaying = soundToPlay;
        var soundEditor = this;
        soundToPlay.play(() => soundEditor.play_PlaybackComplete());
    }
    play_PlaybackComplete() {
        this.soundPlaying = null;
    }
    record() {
        this.statusMessageSet("Not yet implemented!");
    }
    stop() {
        if (this.soundPlaying != null) {
            this.soundPlaying.stop();
            this.soundPlaying = null;
        }
    }
    selectAll() {
        this.selectionCurrent = new Selection_(null, // tag
        0, this.session.durationInSeconds());
        this.viewZoomToFit();
    }
    selectNone() {
        this.selectionCurrent = null;
        this.domElementUpdate();
    }
    selectionRemoveByTag() {
        var tagToRemove = this.inputTagText.value;
        var session = this.session;
        var selectionsTagged = session.selectionsTagged;
        for (var i = 0; i < selectionsTagged.length; i++) {
            var selectionExisting = selectionsTagged[i];
            if (selectionExisting.tag == tagToRemove) {
                selectionsTagged.splice(selectionsTagged.indexOf(selectionExisting), 1);
                delete selectionsTagged[tagToRemove];
                this.domElementUpdate();
                break;
            }
        }
    }
    selectionResize(shouldAdjustmentBeSmall, direction) {
        if (this.selectionCurrent == null) {
            this.selectionCurrent = new Selection_(null, // tag
            this.cursorOffsetInSeconds, this.cursorOffsetInSeconds);
        }
        var amountToResizeInSeconds = this.distancePerAdjustmentInSeconds(shouldAdjustmentBeSmall);
        var displacementInSeconds = amountToResizeInSeconds * direction;
        if (direction < 0) {
            this.timeStartInSeconds = NumberHelper.trimNumberToMax(this.timeStartInSeconds + displacementInSeconds, this.session.durationInSeconds());
        }
        else {
            this.timeEndInSeconds = NumberHelper.trimNumberToMax(this.timeEndInSeconds + displacementInSeconds, this.session.durationInSeconds());
        }
        this.domElementUpdate();
    }
    selectionSelectByTag() {
        var tagToSelect = this.inputTagText.value;
        var session = this.session;
        var selectionsTagged = session.selectionsTagged;
        for (var i = 0; i < selectionsTagged.length; i++) {
            var selectionExisting = selectionsTagged[i];
            if (selectionExisting.tag == tagToSelect) {
                this.selectionCurrent = selectionExisting;
                this.domElementUpdate();
                break;
            }
        }
    }
    selectionTag() {
        if (this.selectionCurrent != null) {
            var session = this.session;
            var selectionsTagged = session.selectionsTagged;
            var doesSelectionCurrentOverlapWithAnyExisting = false;
            for (var i = 0; i < selectionsTagged.length; i++) {
                var selectionExisting = selectionsTagged[i];
                if (this.selectionCurrent.overlapsWith(selectionExisting)) {
                    doesSelectionCurrentOverlapWithAnyExisting = true;
                    break;
                }
            }
            if (doesSelectionCurrentOverlapWithAnyExisting == false) {
                var tagText = this.inputTagText.value;
                this.selectionCurrent.tag = tagText;
                selectionsTagged.push(this.selectionCurrent);
                /*
                // todo
                selectionsTaggedByTag.put
                (
                    this.selectionCurrent.tag, this.selectionCurrent
                );
                */
            }
            this.selectionCurrent = null;
            this.domElementUpdate();
        }
    }
    selectionsTaggedExport() {
        var fileContents = Selection_.convertManyToStringSRT(this.session.selectionsTagged);
        FileHelper.saveTextAsFile(fileContents, this.session.name + ".srt");
    }
    selectionsTaggedImport() {
        var d = document;
        var inputFileToLoad = d.createElement("input");
        inputFileToLoad.type = "file";
        var callback = this.selectionsTaggedImport_LoadComplete.bind(this);
        inputFileToLoad.onchange = (event) => {
            var srcElement = event.srcElement;
            var fileToLoad = srcElement.files[0];
            srcElement.parentElement.removeChild(srcElement);
            FileHelper.loadFileAsTextAndSendToCallback(fileToLoad, callback);
        };
        this.divControlsFile.insertBefore(inputFileToLoad, this.buttonTagsImport.nextSibling);
    }
    selectionsTaggedImport_LoadComplete(textFromFile) {
        var selections = Selection_.buildManyFromStringSRT(textFromFile);
        this.session.selectionsTagged = selections;
        this.domElementUpdate();
    }
    sessionLoad() {
        var d = document;
        var inputFileToLoad = d.createElement("input");
        inputFileToLoad.type = "file";
        var callback = this.sessionLoad_LoadComplete.bind(this);
        inputFileToLoad.onchange = (event) => {
            var srcElement = event.srcElement;
            var fileToLoad = srcElement.files[0];
            srcElement.parentElement.removeChild(srcElement);
            FileHelper.loadFileAsTextAndSendToCallback(fileToLoad, callback);
        };
        this.divControlsFile.insertBefore(inputFileToLoad, this.buttonSessionLoad.nextSibling);
    }
    sessionLoad_LoadComplete(file, textFromFile) {
        this.domElementRemove();
        this.session = Session.fromStringJSON(textFromFile);
        //this.session.addLookups();
        this.viewZoomToFit();
        this.domElementUpdate();
    }
    sessionNew() {
        this.session = new Session("[untitled]", [], // tagsToPlay // Formerly ""
        [], // tracks
        [] // selections
        );
        this.domElementRemove();
        this.domElementUpdate();
    }
    sessionExportAsWav() {
        this.statusMessageSet("Not yet implemented!");
        return;
        this.domElementRemove();
        var sessionAsWavFile = this.session.toWavFile();
        var sessionAsWavFileBytes = sessionAsWavFile.toBytes();
        FileHelper.saveBytesToFile(sessionAsWavFileBytes, this.session.name + ".wav");
        this.domElementUpdate();
    }
    sessionSave() {
        this.domElementRemove();
        var sessionAsJson = this.session.toStringJSON();
        var sessionFileName = this.session.name + ".SoundEditorSession.json";
        FileHelper.saveTextAsFile(sessionAsJson, sessionFileName);
        this.domElementUpdate();
    }
    statusMessageSet(messageToSet) {
        var d = document;
        var divControlsStatus = d.getElementById("divControlsStatus");
        divControlsStatus.innerHTML = messageToSet;
    }
    tagsExportAsSound() {
        var track = this.session.trackCurrent();
        if (track == null) {
            this.statusMessageSet("Nothing to export!");
            return;
        }
        var soundToSelectFrom = track.sounds[0];
        var soundToExport = this.tagsPlay_BuildSound(soundToSelectFrom);
        var wavFileToExport = soundToExport.sourceWavFile;
        var soundToExportAsBytes = wavFileToExport.toBytes();
        var filename = this.session.tagsToPlay.join("-") + ".wav";
        FileHelper.saveBytesToFile(soundToExportAsBytes, filename);
    }
    tagsPlay() {
        var track = this.session.trackCurrent();
        if (track == null) {
            this.statusMessageSet("Nothing to play!");
            return;
        }
        var soundToSelectFrom = track.sounds[0];
        var soundToPlay = this.tagsPlay_BuildSound(soundToSelectFrom);
        this.soundPlaying = soundToPlay;
        soundToPlay.play(this.play_PlaybackComplete);
    }
    tagsPlay_BuildSound(soundToSelectFrom) {
        var soundAsWavFileSource = soundToSelectFrom.sourceWavFile;
        var numberOfChannels = soundAsWavFileSource.samplesForChannels.length;
        var samplesForChannels = [];
        for (var i = 0; i < numberOfChannels; i++) {
            samplesForChannels.push([]);
        }
        var soundAsWavFileTarget = new WavFile(soundAsWavFileSource.filePath, soundAsWavFileSource.samplingInfo, samplesForChannels);
        var tagsToPlayAsStrings = this.session.tagsToPlay;
        if (tagsToPlayAsStrings.length == 0) {
            this.statusMessageSet("No tags to play!");
        }
        else {
            for (var t = 0; t < tagsToPlayAsStrings.length; t++) {
                var tagAsString = tagsToPlayAsStrings[t];
                var tag = this.session.selectionByTag(tagAsString);
                if (tag != null) {
                    soundAsWavFileTarget.appendClipFromWavFileBetweenTimesStartAndEnd(soundAsWavFileSource, tag.timeStartInSeconds, tag.timeEndInSeconds);
                }
            }
        }
        var returnValue = new Sound("[tags]", soundAsWavFileTarget, 0 // offsetInSeconds
        );
        return returnValue;
    }
    trackAdd() {
        var inputFileToLoadAlreadyPresent = this.divControlsFile.getElementsByTagName("input").length > 0;
        if (inputFileToLoadAlreadyPresent == false) {
            var d = document;
            var inputFileToLoad = d.createElement("input");
            inputFileToLoad.type = "file";
            var callback = this.trackAdd_LoadComplete.bind(this);
            inputFileToLoad.onchange = (event) => {
                var srcElement = event.srcElement;
                var fileToLoad = srcElement.files[0];
                FileHelper.loadFileAsBytesAndSendToCallback(fileToLoad, callback);
                srcElement.parentElement.removeChild(srcElement);
            };
            this.divControlsFile.insertBefore(inputFileToLoad, this.buttonTrackAdd.nextSibling);
        }
    }
    trackAdd_LoadComplete(wavFileLoadedAsFileObject, wavFileAsBytes) {
        var wavFileName = wavFileLoadedAsFileObject.name;
        var wavFileLoaded = WavFile.fromBytes(wavFileName, wavFileAsBytes);
        var sound = new Sound(wavFileLoaded.filePath, wavFileLoaded, 0 // offsetInSeconds
        );
        var track = new Track(wavFileLoaded.filePath, [sound]);
        this.session.tracks.push(track);
        this.viewZoomToFit();
        this.domElementUpdate();
    }
    trackRemove() {
        this.statusMessageSet("Not yet implemented!");
    }
    viewSecondsPerPixel() {
        var returnValue = this.viewWidthInSeconds / this.viewSizeInPixels.x;
        return returnValue;
    }
    viewSlide(shouldAdjustmentBeSmall, direction) {
        var distanceToMoveInSeconds;
        if (shouldAdjustmentBeSmall == true) {
            distanceToMoveInSeconds = .001;
        }
        else {
            distanceToMoveInSeconds = this.viewSecondsPerPixel();
        }
        var displacementInSeconds = distanceToMoveInSeconds * direction;
        this.viewOffsetInSeconds = NumberHelper.trimNumberToMax(this.viewOffsetInSeconds + displacementInSeconds, this.session.durationInSeconds() - this.viewWidthInSeconds);
        this.hasViewBeenUpdatedSet();
        this.domElementUpdate();
    }
    viewZoomToFit() {
        this.viewOffsetInSeconds = 0;
        this.viewWidthInSeconds = this.session.durationInSeconds();
        this.hasViewBeenUpdatedSet();
        this.domElementUpdate();
    }
    viewZoomToSelection() {
        if (this.selectionCurrent != null) {
            var selectionDurationInSeconds = this.selectionCurrent.durationInSeconds();
            if (selectionDurationInSeconds > 0) {
                var selection = this.selectionCurrent;
                var timeStartInSeconds = selection.timeStartInSeconds;
                //var timeEndInSeconds = selection.timeEndInSeconds;
                this.viewOffsetInSeconds = timeStartInSeconds;
                this.viewWidthInSeconds = selectionDurationInSeconds;
                this.selectionCurrent = null;
                this.hasViewBeenUpdatedSet();
                this.domElementUpdate();
            }
        }
    }
    // dom
    domElementRemove() {
        if (this.domElement != null) {
            this.domElement.parentElement.removeChild(this.domElement);
            delete this.domElement;
            this.session.domElementRemove();
        }
    }
    domElementUpdate() {
        this.domElementUpdate_BuildIfNecessary();
        this.domElementUpdate_Controls();
        this.domElementUpdate_Waveform();
        this.domElementUpdate_Cursor();
        this.domElementUpdate_Selection();
        return this.domElement;
    }
    domElementUpdate_BuildIfNecessary() {
        if (this.domElement == null) {
            var d = document;
            var divEditor = d.createElement("div");
            divEditor.appendChild(this.domElementUpdate_BuildIfNecessary_ControlsSessionName());
            var divTracks = this.domElementUpdate_BuildIfNecessary_Tracks();
            divEditor.appendChild(divTracks);
            this.divTracks = divTracks;
            var divControls = d.createElement("div");
            divControls.appendChild(this.domElementUpdate_BuildIfNecessary_ControlsCursor());
            divControls.appendChild(this.domElementUpdate_BuildIfNecessary_ControlsSelection());
            divControls.appendChild(this.domElementUpdate_BuildIfNecessary_ControlsFilter());
            divControls.appendChild(this.domElementUpdate_BuildIfNecessary_ControlsPlayback());
            divControls.appendChild(this.domElementUpdate_BuildIfNecessary_ControlsComposite());
            divControls.appendChild(this.domElementUpdate_BuildIfNecessary_ControlsZoom());
            divControls.appendChild(this.domElementUpdate_BuildIfNecessary_ControlsFile());
            divControls.appendChild(this.domElementUpdate_BuildIfNecessary_ControlsStatus());
            divEditor.appendChild(divControls);
            this.divControls = divControls;
            this.domElement = divEditor;
            d.body.appendChild(this.domElement);
        }
    }
    domElementUpdate_BuildIfNecessary_ControlsSessionName() {
        var d = document;
        var controlBuilder = new ControlBuilder(d);
        var divControlsSessionName = d.createElement("div");
        divControlsSessionName.style.border = "1px solid";
        var labelSessionName = controlBuilder.label("Session Name:");
        divControlsSessionName.appendChild(labelSessionName);
        this.inputSessionName = d.createElement("input");
        this.inputSessionName.style.width = 200;
        this.inputSessionName.onchange =
            this.handleEventInputSessionNameChanged.bind(this);
        divControlsSessionName.appendChild(this.inputSessionName);
        return divControlsSessionName;
    }
    domElementUpdate_BuildIfNecessary_Tracks() {
        var d = document;
        var returnValue = d.createElement("div");
        returnValue.style.border = "1px solid";
        returnValue.style.width = this.viewSizeInPixels.x + "px";
        for (var t = 0; t < this.session.tracks.length; t++) {
            var track = this.session.tracks[t];
            var domElementForTrack = track.domElementUpdate(this);
            returnValue.appendChild(domElementForTrack);
        }
        return returnValue;
    }
    domElementUpdate_BuildIfNecessary_ControlsComposite() {
        var d = document;
        var controlBuilder = new ControlBuilder(d);
        var divControlsComposite = d.createElement("div");
        divControlsComposite.style.border = "1px solid";
        var labelTagsToPlay = controlBuilder.label("Tags to Play:");
        divControlsComposite.appendChild(labelTagsToPlay);
        this.inputTagsToPlay = d.createElement("input");
        this.inputTagsToPlay.style.width = 256;
        this.inputTagsToPlay.onchange =
            this.handleEventInputTagsToPlay_Changed.bind(this);
        divControlsComposite.appendChild(this.inputTagsToPlay);
        var buttonPlay = controlBuilder.button("Play Tagged Selections", this.tagsPlay.bind(this));
        divControlsComposite.appendChild(buttonPlay);
        var buttonExport = controlBuilder.button("Export Tagged Selections", this.tagsExportAsSound.bind(this));
        divControlsComposite.appendChild(buttonExport);
        return divControlsComposite;
    }
    domElementUpdate_BuildIfNecessary_ControlsCursor() {
        var d = document;
        var controlBuilder = new ControlBuilder(d);
        var divControlsCursor = d.createElement("div");
        divControlsCursor.style.border = "1px solid";
        var labelCursor = controlBuilder.label("Cursor:");
        divControlsCursor.appendChild(labelCursor);
        var labelCursorPosInSeconds = controlBuilder.label("Seconds:");
        divControlsCursor.appendChild(labelCursorPosInSeconds);
        this.inputCursorPosInSeconds = d.createElement("input");
        this.inputCursorPosInSeconds.disabled = true; // todo
        this.inputCursorPosInSeconds.style.width = 64;
        this.inputCursorPosInSeconds.type = "number";
        this.inputCursorPosInSeconds.onchange =
            this.handleEventInputCursorPosInSecondsChanged.bind(this);
        divControlsCursor.appendChild(this.inputCursorPosInSeconds);
        return divControlsCursor;
    }
    domElementUpdate_BuildIfNecessary_ControlsFile() {
        var d = document;
        var controlBuilder = new ControlBuilder(d);
        var divControlsFile = d.createElement("div");
        divControlsFile.style.border = "1px solid";
        this.buttonTrackAdd = controlBuilder.button("Load Sound as Track", this.trackAdd.bind(this));
        divControlsFile.appendChild(this.buttonTrackAdd);
        var buttonSessionNew = controlBuilder.button("New Session", this.sessionNew.bind(this));
        divControlsFile.appendChild(buttonSessionNew);
        this.buttonSessionLoad = controlBuilder.button("Load Session", this.sessionLoad.bind(this));
        divControlsFile.appendChild(this.buttonSessionLoad);
        var buttonSessionSave = controlBuilder.button("Save Session", this.sessionSave.bind(this));
        divControlsFile.appendChild(buttonSessionSave);
        var buttonSessionExportAsWav = controlBuilder.button("Export Session as WAV", this.sessionExportAsWav.bind(this));
        divControlsFile.appendChild(buttonSessionExportAsWav);
        var buttonTagsExport = controlBuilder.button("Export Tags", this.selectionsTaggedExport.bind(this));
        divControlsFile.appendChild(buttonTagsExport);
        this.buttonTagsImport = controlBuilder.button("Import Tags", this.selectionsTaggedImport.bind(this));
        divControlsFile.appendChild(this.buttonTagsImport);
        this.divControlsFile = divControlsFile;
        return divControlsFile;
    }
    domElementUpdate_BuildIfNecessary_ControlsFilter() {
        var d = document;
        var controlBuilder = new ControlBuilder(d);
        var divControlsFilter = d.createElement("div");
        divControlsFilter.style.border = "1px solid";
        var labelFilter = controlBuilder.label("Filter:");
        divControlsFilter.appendChild(labelFilter);
        var labelType = controlBuilder.label("Type:");
        divControlsFilter.appendChild(labelType);
        this.selectFilterType = d.createElement("select");
        this.selectFilterType.style.width = 128;
        divControlsFilter.appendChild(this.selectFilterType);
        var filters = Filter.Instances()._All;
        for (var i = 0; i < filters.length; i++) {
            var filter = filters[i];
            var optionForFilter = d.createElement("option");
            optionForFilter.innerHTML = filter.name;
            // optionForFilter.entity = filter;
            this.selectFilterType.appendChild(optionForFilter);
        }
        var labelParameters = controlBuilder.label("Parameters:");
        divControlsFilter.appendChild(labelParameters);
        this.inputFilterParameters = d.createElement("input");
        this.inputFilterParameters.style.width = 128;
        divControlsFilter.appendChild(this.inputFilterParameters);
        var buttonFilterSelection = controlBuilder.button("Filter Selection", this.filterSelection.bind(this));
        divControlsFilter.appendChild(buttonFilterSelection);
        return divControlsFilter;
    }
    domElementUpdate_BuildIfNecessary_ControlsPlayback() {
        var d = document;
        var controlBuilder = new ControlBuilder(d);
        var divControlsPlayback = d.createElement("div");
        divControlsPlayback.style.border = "1px solid";
        var buttonPlay = controlBuilder.button("Play", this.play.bind(this));
        divControlsPlayback.appendChild(buttonPlay);
        var buttonStop = controlBuilder.button("Stop", this.stop.bind(this));
        divControlsPlayback.appendChild(buttonStop);
        this.buttonRecord = controlBuilder.button("Record", this.record.bind(this));
        divControlsPlayback.appendChild(this.buttonRecord);
        this.divControlsPlayback = divControlsPlayback;
        return divControlsPlayback;
    }
    domElementUpdate_BuildIfNecessary_ControlsSelection() {
        var d = document;
        var controlBuilder = new ControlBuilder(d);
        var divControlsSelection = d.createElement("div");
        divControlsSelection.style.border = "1px solid";
        var labelSelected = controlBuilder.label("Selected:");
        divControlsSelection.appendChild(labelSelected);
        var labelSelectionStartInSeconds = controlBuilder.label("Seconds:");
        divControlsSelection.appendChild(labelSelectionStartInSeconds);
        this.inputSelectionStartInSeconds = d.createElement("input");
        this.inputSelectionStartInSeconds.disabled = true; // todo
        this.inputSelectionStartInSeconds.style.width = 64;
        this.inputSelectionStartInSeconds.type = "number";
        this.inputSelectionStartInSeconds.onchange = this.handleEventInputSelectionStartInSecondsChanged.bind(this);
        divControlsSelection.appendChild(this.inputSelectionStartInSeconds);
        var labelSelectionEndInSeconds = controlBuilder.label("to");
        divControlsSelection.appendChild(labelSelectionEndInSeconds);
        this.inputSelectionEndInSeconds = d.createElement("input");
        this.inputSelectionEndInSeconds.disabled = true;
        this.inputSelectionEndInSeconds.style.width = 64;
        this.inputSelectionEndInSeconds.type = "number";
        this.inputSelectionEndInSeconds.onchange = this.handleEventInputSelectionEndInSecondsChanged.bind(this);
        divControlsSelection.appendChild(this.inputSelectionEndInSeconds);
        var buttonSelectAll = controlBuilder.button("All", this.selectAll.bind(this));
        divControlsSelection.appendChild(buttonSelectAll);
        var buttonSelectNone = controlBuilder.button("None", this.selectNone.bind(this));
        divControlsSelection.appendChild(buttonSelectNone);
        var labelTag = controlBuilder.label("Tag:");
        divControlsSelection.appendChild(labelTag);
        this.inputTagText = d.createElement("input");
        this.inputTagText.style.width = 128;
        divControlsSelection.appendChild(this.inputTagText);
        var buttonTagAdd = controlBuilder.button("Tag Selection", this.selectionTag.bind(this));
        divControlsSelection.appendChild(buttonTagAdd);
        var buttonTagSelect = controlBuilder.button("Select by Tag", this.selectionSelectByTag.bind(this));
        divControlsSelection.appendChild(buttonTagSelect);
        var buttonTagRemove = controlBuilder.button("Remove Selection by Tag", this.selectionRemoveByTag.bind(this));
        divControlsSelection.appendChild(buttonTagRemove);
        return divControlsSelection;
    }
    domElementUpdate_BuildIfNecessary_ControlsStatus() {
        var d = document;
        var divControlsStatus = d.createElement("div");
        divControlsStatus.id = "divControlsStatus";
        divControlsStatus.style.border = "1px solid";
        divControlsStatus.innerHTML = "Ready.";
        return divControlsStatus;
    }
    domElementUpdate_BuildIfNecessary_ControlsZoom() {
        var d = document;
        var controlBuilder = new ControlBuilder(d);
        var divControlsZoom = d.createElement("div");
        divControlsZoom.style.border = "1px solid";
        var buttonZoomToSelection = controlBuilder.button("Zoom to Selection", this.viewZoomToSelection.bind(this));
        divControlsZoom.appendChild(buttonZoomToSelection);
        var buttonZoomToFit = controlBuilder.button("Zoom to Fit", this.viewZoomToFit.bind(this));
        divControlsZoom.appendChild(buttonZoomToFit);
        return divControlsZoom;
    }
    domElementUpdate_Controls() {
        this.inputSessionName.value = this.session.name;
        this.inputTagsToPlay.value = this.session.tagsToPlay.join(",");
    }
    domElementUpdate_Cursor() {
        this.inputCursorPosInSeconds.value =
            this.cursorOffsetInSeconds;
    }
    domElementUpdate_Selection() {
        if (this.selectionCurrent == null) {
            this.inputSelectionStartInSeconds.value = "";
            this.inputSelectionEndInSeconds.value = "";
        }
        else {
            var selection = this.selectionCurrent;
            var timeStartInSeconds = selection.timeStartInSeconds;
            var timeEndInSeconds = selection.timeEndInSeconds;
            this.inputSelectionStartInSeconds.value = timeStartInSeconds;
            this.inputSelectionEndInSeconds.value = timeEndInSeconds;
        }
    }
    domElementUpdate_Waveform() {
        var tracks = this.session.tracks;
        for (var t = 0; t < tracks.length; t++) {
            var track = tracks[t];
            var domElementForTrack = track.domElementUpdate(this);
            if (domElementForTrack.parentElement == null) {
                this.divTracks.appendChild(domElementForTrack);
            }
        }
    }
    // events
    handleEventInputCursorPosInSecondsChanged(event) {
        // todo
    }
    handleEventInputSelectionStartInSecondsChanged(event) {
        // todo
    }
    handleEventInputSelectionEndInSecondsChanged(event) {
        // todo
    }
    handleEventInputSessionNameChanged(event) {
        this.session.name = event.target.value;
    }
    handleEventInputTagsToPlay_Changed(event) {
        this.session.tagsToPlay = event.target.value.split(",");
    }
    handleEventKeyDown(event) {
        var key = event.key;
        if (key == "ArrowLeft") {
            this.handleEventKeyDown_ArrowLeftOrRight(event, -1);
        }
        else if (key == "ArrowUp") {
            this.trackIndexCurrent = NumberHelper.trimNumberToMax(this.trackIndexCurrent - 1, this.session.tracks.length);
        }
        else if (key == "ArrowRight") {
            this.handleEventKeyDown_ArrowLeftOrRight(event, 1);
        }
        else if (key == "ArrowDown") {
            this.trackIndexCurrent = NumberHelper.trimNumberToMax(this.trackIndexCurrent + 1, this.session.tracks.length);
        }
        else if (key == "a") {
            // todo - contingent event.preventDefault();
            if (event.ctrlKey == true) {
                if (event.shiftKey == true) {
                    this.selectNone();
                }
                else {
                    this.selectAll();
                }
            }
        }
    }
    handleEventKeyDown_ArrowLeftOrRight(event, direction) {
        var shouldAdjustmentBeSmall = event.ctrlKey;
        if (event.altKey == true) {
            this.viewSlide(shouldAdjustmentBeSmall, direction);
        }
        else if (event.shiftKey == true) {
            this.selectionResize(shouldAdjustmentBeSmall, direction);
        }
        else {
            this.cursorMove(shouldAdjustmentBeSmall, direction);
        }
    }
}
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
