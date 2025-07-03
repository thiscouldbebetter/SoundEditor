"use strict";
class Filter {
    constructor(name, initializeForSoundSource, applyToSampleAtTimeWithParameters) {
        this.name = name;
        this._initializeForSoundSource =
            initializeForSoundSource.bind(this);
        this._applyToSampleAtTimeWithParameters =
            applyToSampleAtTimeWithParameters.bind(this);
    }
    applyToSampleAtTimeWithParameters(sample, timeInSeconds, parameters) {
        return this._applyToSampleAtTimeWithParameters(sample, timeInSeconds, parameters);
    }
    initializeForSoundSource(soundSource, parameters) {
        var returnValue = this._initializeForSoundSource(soundSource, parameters);
        return returnValue;
    }
    static Instances() {
        if (this._instances == null) {
            this._instances = new Filter_Instances();
        }
        return this._instances;
    }
    static byName(name) {
        return Filter.Instances().byName(name);
    }
}
class Filter_Instances {
    constructor() {
        this.Amplify = new Filter("Amplify", this.initialize_DoNothing, this.apply_Amplify);
        this.Metronome = new Filter("Metronome", this.initialize_DoNothing, this.apply_Metronome);
        this.Normalize = new Filter("Normalize", this.initialize_Normalize, this.apply_Amplify // Intentionally same as Amplify.
        );
        this.Silence = new Filter("Silence", this.initialize_DoNothing, this.apply_Silence);
        this.Sine = new Filter("Sine", this.initialize_DoNothing, this.apply_Sine);
        this._All =
            [
                this.Amplify,
                this.Metronome,
                this.Normalize,
                this.Silence,
                this.Sine
            ];
        this._AllByName = new Map(this._All.map(x => [x.name, x]));
    }
    byName(name) {
        return this._AllByName.get(name);
    }
    // Initializes.
    initialize_DoNothing(soundSource, parameters) {
        return parameters;
    }
    initialize_Normalize(soundSource, parameters) {
        var sampleAbsoluteMaxSoFar = 0; // Across all channels.
        var samplingInfo = soundSource.samplingInfo;
        var samplesForChannels = soundSource.samplesForChannels;
        var byteConverter = new ByteConverter(samplingInfo.bitsPerSample);
        for (var c = 0; c < samplesForChannels.length; c++) {
            var samples = samplesForChannels[c];
            var sampleAbsoluteMaxForChannelSoFar = samples[0];
            for (var i = 1; i < samples.length; i++) {
                var sampleAsInteger = samples[i];
                var sample = byteConverter.integerToFloat(sampleAsInteger);
                var sampleAbsolute = Math.abs(sample);
                if (sampleAbsolute > sampleAbsoluteMaxForChannelSoFar) {
                    sampleAbsoluteMaxForChannelSoFar = sampleAbsolute;
                }
            }
            if (sampleAbsoluteMaxForChannelSoFar > sampleAbsoluteMaxSoFar) {
                sampleAbsoluteMaxSoFar =
                    sampleAbsoluteMaxForChannelSoFar;
            }
        }
        var amplitudeMaxToSetAsFraction = parseFloat(parameters);
        if (isNaN(amplitudeMaxToSetAsFraction)) {
            amplitudeMaxToSetAsFraction = .8;
        }
        if (amplitudeMaxToSetAsFraction > 1) {
            amplitudeMaxToSetAsFraction = 1;
        }
        var factorToAmplifyBy = amplitudeMaxToSetAsFraction
            / sampleAbsoluteMaxSoFar;
        return "" + factorToAmplifyBy;
    }
    // Applys.
    apply_Amplify(sample, timeInSeconds, parameters) {
        var amplificationFactor = parseFloat(parameters);
        if (isNaN(amplificationFactor) == true) {
            return sample;
        }
        return sample * amplificationFactor;
    }
    apply_Metronome(sample, timeInSeconds, parameters) {
        var beatsPerMinute = parseFloat(parameters);
        if (isNaN(beatsPerMinute)) {
            beatsPerMinute = 60;
        }
        if (beatsPerMinute <= 0 || beatsPerMinute > 1000) {
            beatsPerMinute = 60;
        }
        var secondsPerBeat = 60 / beatsPerMinute;
        var clickDurationInBeats = .2;
        var timeInBeats = timeInSeconds / secondsPerBeat;
        var beatsSinceStartOfBeat = timeInBeats - Math.floor(timeInBeats);
        if (beatsSinceStartOfBeat >= clickDurationInBeats) {
            sample = 0;
        }
        else {
            sample = sample;
        }
        return sample;
    }
    apply_Silence(sample, timeInSeconds, parameters) {
        return 0;
    }
    apply_Sine(sample, timeInSeconds, parameters) {
        var cyclesPerSecond = parseFloat(parameters);
        if (isNaN(cyclesPerSecond) == true) {
            return sample;
        }
        var timeInCycles = timeInSeconds * cyclesPerSecond;
        var amplitude = .5;
        sample = Math.sin(timeInCycles * Math.PI * 2) * amplitude;
        return sample;
    }
}
