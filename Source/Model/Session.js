"use strict";
class Session {
    constructor(name, tagsToPlay, tracks, selectionsTagged) {
        this.name = name;
        this.tagsToPlay = tagsToPlay;
        this.tracks = tracks;
        this.selectionsTagged = selectionsTagged;
        this.trackIndexCurrent = 0;
    }
    durationInSeconds() {
        var trackEndInSecondsMax = 0;
        for (var i = 0; i < this.tracks.length; i++) {
            var track = this.tracks[i];
            var trackEndInSeconds = track.durationInSeconds();
            if (trackEndInSeconds > trackEndInSecondsMax) {
                trackEndInSecondsMax = trackEndInSeconds;
            }
        }
        return trackEndInSecondsMax;
    }
    selectionByTag(tagToFind) {
        return this.selectionsTagged.find(x => x.tag == tagToFind);
    }
    trackCurrent() {
        return this.tracks[this.trackIndexCurrent];
    }
    trackCurrentSet(valueToSet) {
        this.trackIndexCurrent = this.tracks.indexOf(valueToSet);
        return this;
    }
    // dom
    domElementRemove() {
        for (var t = 0; t < this.tracks.length; t++) {
            var track = this.tracks[t];
            track.domElementRemove();
        }
    }
    // Serializable.
    static prototypesSetOnObject(sessionAsObject) {
        Object.setPrototypeOf(sessionAsObject, Session.prototype);
        var session = sessionAsObject;
        session.tracks
            .forEach(x => Track.prototypesSetOnObject(x));
        session.selectionsTagged
            .forEach(x => Selection_.prototypesSetOnObject(x));
        return session;
    }
    static fromStringJSON(sessionAsJSON) {
        var sessionAsObject = JSON.parse(sessionAsJSON);
        var session = Session.prototypesSetOnObject(sessionAsObject);
        var tracks = session.tracks;
        for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            Object.setPrototypeOf(track, Track.prototype);
            var sounds = track.sounds;
            for (var s = 0; s < sounds.length; s++) {
                var sound = sounds[s];
                Object.setPrototypeOf(sound, Sound.prototype);
                // The conversion at save time
                // isn't happening at the moment,
                // so instead we just assign the prototype.
                /*
                var sourceWavFileAsJSON = sound.sourceWavFile;
                var sourceWavFile =
                    WavFile.fromStringJSON(sourceWavFileAsJSON);
                sound.sourceWavFile = sourceWavFile;
                */
                var wavFile = sound.sourceWavFile;
                Object.setPrototypeOf(wavFile, WavFile.prototype);
                wavFile.prototypesSet();
            }
        }
        var selections = session.selectionsTagged;
        for (var i = 0; i < selections.length; i++) {
            var selection = selections[i];
            Object.setPrototypeOf(selection, Selection_.prototype);
        }
        return session;
    }
    toStringJSON() {
        var wavFilesToRestore = [];
        var tracks = this.tracks;
        for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            var sounds = track.sounds;
            for (var s = 0; s < sounds.length; s++) {
                var sound = sounds[s];
                var wavFile = sound.sourceWavFile;
                wavFilesToRestore.push(wavFile);
                var wavFileAsStringJSON = wavFile.toStringJSON();
                sound.sourceWavFileAsJson = wavFileAsStringJSON;
            }
        }
        var returnValue = JSON.stringify(this, null, 4);
        for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            var sounds = track.sounds;
            for (var s = 0; s < sounds.length; s++) {
                var sound = sounds[s];
                delete sound.sourceWavFile;
            }
        }
        return returnValue;
    }
    // wav
    toWavFile() {
        var trackToExport = this.tracks[0]; // todo - Mix down.
        var trackToExportAsWavFile = trackToExport.toWavFile();
        return trackToExportAsWavFile;
    }
}
