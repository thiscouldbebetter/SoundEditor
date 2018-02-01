
function Filter(name, applyToSampleAtTimeWithParameters)
{
	this.name = name;
	this.applyToSampleAtTimeWithParameters = applyToSampleAtTimeWithParameters;
}

{
	Filter.Instances = new Filter_Instances();

	function Filter_Instances()
	{
		this.Amplify = new Filter
		(
			"Amplify",
			function(sample, timeInSeconds, parameters)
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
			function(sample, timeInSeconds, parameters)
			{
				return 0;
			}
		);

		this.Sine = new Filter
		(
			"Sine",
			function(sample, timeInSeconds, parameters)
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

		this._All.addLookups("name");
	}
}
