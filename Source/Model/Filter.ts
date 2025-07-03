
class Filter
{
	name: string;
	_initializeForSoundSource:
		(ss: WavFile, ps: string) => string;
	_applyToSampleAtTimeWithParameters:
		(s: number, tis: number, ps: string) => number;

	constructor
	(
		name: string,
		initializeForSoundSource:
			(ss: WavFile, ps: string) => string,
		applyToSampleAtTimeWithParameters:
			(s: number, tis: number, ps: string) => number
	)
	{
		this.name = name;
		this._initializeForSoundSource =
			initializeForSoundSource.bind(this);
		this._applyToSampleAtTimeWithParameters =
			applyToSampleAtTimeWithParameters.bind(this);
	}

	applyToSampleAtTimeWithParameters
	(
		sample: number, timeInSeconds: number, parameters: string
	): number
	{
		return this._applyToSampleAtTimeWithParameters
		(
			sample, timeInSeconds, parameters
		);
	}

	initializeForSoundSource
	(
		soundSource: WavFile,
		parameters: string
	): string
	{
		var returnValue =
			this._initializeForSoundSource
			(
				soundSource,
				parameters
			);
		return returnValue;
	}

	static _instances: Filter_Instances;
	static Instances(): Filter_Instances
	{
		if (this._instances == null)
		{
			this._instances = new Filter_Instances();
		}
		return this._instances;
	}

	static byName(name: string): Filter
	{
		return Filter.Instances().byName(name);
	}
}

class Filter_Instances
{
	Amplify: Filter;
	Normalize: Filter;
	Silence: Filter;
	Sine: Filter;

	_All: Filter[];
	_AllByName: Map<string, Filter>;

	constructor()
	{
		this.Amplify = new Filter
		(
			"Amplify",
			this.initialize_DoNothing,
			this.apply_Amplify
		);

		this.Normalize = new Filter
		(
			"Normalize",
			this.initialize_Normalize,
			this.apply_Amplify // Intentionally same as Amplify.
		);

		this.Silence = new Filter
		(
			"Silence",
			this.initialize_DoNothing,
			this.apply_Silence
		);

		this.Sine = new Filter
		(
			"Sine",
			this.initialize_DoNothing,
			this.apply_Sine
		);

		this._All =
		[
			this.Amplify,
			this.Normalize,
			this.Silence,
			this.Sine
		];

		this._AllByName = new Map(this._All.map(x => [x.name, x] ) );
	}

	byName(name: string): Filter
	{
		return this._AllByName.get(name);
	}

	// Initializes.

	initialize_DoNothing
	(
		soundSource: WavFile,
		parameters: string
	): string
	{
		return parameters;
	}

	initialize_Normalize
	(
		soundSource: WavFile,
		parameters: string
	): string
	{
		var sampleAbsoluteMaxSoFar = 0; // Across all channels.

		var samplingInfo = soundSource.samplingInfo;

		var samplesForChannels = soundSource.samplesForChannels;

		var byteConverter = new ByteConverter(samplingInfo.bitsPerSample);

		for (var c = 0; c < samplesForChannels.length; c++)
		{
			var samples = samplesForChannels[c];
			var sampleAbsoluteMaxForChannelSoFar = samples[0];
			for (var i = 1; i < samples.length; i++)
			{
				var sampleAsInteger = samples[i];
				var sample =
					byteConverter.integerToFloat(sampleAsInteger);

				var sampleAbsolute = Math.abs(sample);
				if (sampleAbsolute > sampleAbsoluteMaxForChannelSoFar)
				{
					sampleAbsoluteMaxForChannelSoFar = sampleAbsolute;
				}
			}
			
			if (sampleAbsoluteMaxForChannelSoFar > sampleAbsoluteMaxSoFar)
			{
				sampleAbsoluteMaxSoFar =
					sampleAbsoluteMaxForChannelSoFar;
			}
		}

		var amplitudeMaxToSetAsFraction =
			parseFloat(parameters);
		if (isNaN(amplitudeMaxToSetAsFraction) )
		{
			amplitudeMaxToSetAsFraction = .8;
		}

		if (amplitudeMaxToSetAsFraction > 1)
		{
			amplitudeMaxToSetAsFraction = 1;
		}

		var factorToAmplifyBy =
			amplitudeMaxToSetAsFraction
			/ sampleAbsoluteMaxSoFar;

		return "" + factorToAmplifyBy;
	}

	// Applys.

	apply_Amplify(sample: number, timeInSeconds: number, parameters: string): number
	{
		var amplificationFactor = parseFloat(parameters);
		if (isNaN(amplificationFactor) == true)
		{
			return sample;
		}
		return sample * amplificationFactor;
	}

	apply_Silence(sample: number, timeInSeconds: number, parameters: string): number
	{
		return 0;
	}

	apply_Sine(sample: number, timeInSeconds: number, parameters: string): number
	{
		var cyclesPerSecond = parseFloat(parameters);
		if (isNaN(cyclesPerSecond) == true)
		{
			return sample;
		}
		var timeInCycles = timeInSeconds * cyclesPerSecond;
		var amplitude = .5;
		sample = Math.sin(timeInCycles * Math.PI * 2) * amplitude;
		return sample;
	}

}
