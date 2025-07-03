"use strict";
class Sound {
    constructor(name, sourceWavFile, offsetInSeconds) {
        this.name = name;
        this.sourceWavFile = sourceWavFile;
        this.offsetInSeconds = offsetInSeconds || 0;
    }
    // instance methods
    durationInSeconds() {
        return this.sourceWavFile.durationInSeconds();
    }
    play(callback) {
        var soundAsWavFile = this.sourceWavFile;
        var soundAsBytes = soundAsWavFile.toBytes();
        var soundAsStringBase64 = Base64Encoder.bytesToStringBase64(soundAsBytes);
        var soundAsDataURI = "data:audio/wav;base64," + soundAsStringBase64;
        var domElementSoundSource = document.createElement("source");
        domElementSoundSource.src = soundAsDataURI;
        var domElementAudio = document.createElement("audio");
        domElementAudio.autoplay = true; // "autoplay";
        var sound = this;
        domElementAudio.onended = () => {
            sound.stop();
            if (callback != null) {
                callback();
            }
        };
        this.domElementAudio = domElementAudio;
        domElementAudio.appendChild(domElementSoundSource);
        document.body.appendChild(domElementAudio);
    }
    stop() {
        if (this.domElementAudio != null) {
            this.domElementAudio.parentElement.removeChild(this.domElementAudio);
            this.domElementAudio = null;
        }
    }
    // Serializable.
    static prototypesSetOnObject(soundAsObject) {
        Object.setPrototypeOf(soundAsObject, Sound.prototype);
        var sound = soundAsObject;
        WavFile.objectPrototypesSet(sound.sourceWavFile);
        return sound;
    }
}
