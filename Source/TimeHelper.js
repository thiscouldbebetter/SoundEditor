
function TimeHelper()
{
	// static class
}

{
	TimeHelper.SecondsPerMinute = 60;
	TimeHelper.MinutesPerHour = 60;
	TimeHelper.MillisecondsPerSecond = 1000;

	TimeHelper.secondsToStringHHMMSSmmm = function(secondsTotal)
	{
		var minutesTotal = Math.floor(secondsTotal / TimeHelper.SecondsPerMinute);
		var minutesPastHour = minutesTotal % TimeHelper.MinutesPerHour;
		var hours = Math.floor(minutesTotal / TimeHelper.MinutesPerHour);
		var secondsPastMinute = Math.floor(secondsTotal % TimeHelper.SecondsPerMinute);
		var millisecondsPastSecond = Math.floor
		(
			(secondsTotal * TimeHelper.MillisecondsPerSecond)
			% TimeHelper.MillisecondsPerSecond
		);

		var hoursPadded = StringHelper.padLeft("" + hours, "0", 2);
		var minutesPastHourPadded = StringHelper.padLeft("" + minutesPastHour, "0", 2);
		var secondsPastMinutePadded = StringHelper.padLeft("" + secondsPastMinute, "0", 2);
		var millisecondsPastSecondPadded = StringHelper.padLeft("" + millisecondsPastSecond, "0", 3);

		var returnValue =
			hoursPadded + ":"
			+ minutesPastHourPadded + ":"
			+ secondsPastMinutePadded + "," // French radix point
			+ millisecondsPastSecondPadded;

		return returnValue;
	}

	TimeHelper.secondsToStringSecondsMilliseconds = function(secondsTotal)
	{
		var secondsWhole = Math.floor(secondsTotal);

		var millisecondsPastSecond = Math.floor
		(
			(secondsTotal * TimeHelper.MillisecondsPerSecond)
			% TimeHelper.MillisecondsPerSecond
		);

		var millisecondsPastSecondPadded = StringHelper.padLeft
		(
			"" + millisecondsPastSecond, "0", 3
		);

		var returnValue =
			+ secondsWhole + "."
			+ millisecondsPastSecondPadded;

		return returnValue;
	}

}
