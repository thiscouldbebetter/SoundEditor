
class Filter
{
	name: string;
	applyToSampleAtTimeWithParameters:
		(s: number, tis: number, ps: string) => number;

	constructor
	(
		name: string,
		applyToSampleAtTimeWithParameters:
			(s: number, tis: number, ps: string) => number
	)
	{
		this.name = name;
		this.applyToSampleAtTimeWithParameters =
			applyToSampleAtTimeWithParameters;
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
}

class Filter_Instances
{
	Amplify: Filter;
	Silence: Filter;
	Sine: Filter;

	_All: Filter[];
	_AllByName: Map<string, Filter>;

	constructor()
	{
		this.Amplify = new Filter
		(
			"Amplify",
			(sample, timeInSeconds, parameters) =>
			{
				var amplificationFactor = parseFloat(parameters);
				if (isNaN(amplificationFactor) == true)
				{
					return sample;
				}
				return sample * amplificationFactor;
			}
		);

		this.Silence = new Filter
		(
			"Silence",
			(sample, timeInSeconds, parameters) =>
			{
				return 0;
			}
		);

		this.Sine = new Filter
		(
			"Sine",
			(sample, timeInSeconds, parameters) =>
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
		);


		this._All =
		[
			this.Amplify,
			this.Silence,
			this.Sine,
		];

		this._AllByName = new Map(this._All.map(x => [x.name, x] ) );
	}
}
