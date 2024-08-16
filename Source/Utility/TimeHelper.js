
class TimeHelper
{
	static SecondsPerMinute = 60;
	static MinutesPerHour = 60;
	static MillisecondsPerSecond = 1000;

	static secondsToStringHHMMSSmmm(secondsTotal)
	{
		var minutesTotal =
			Math.floor(secondsTotal / TimeHelper.SecondsPerMinute);
		var minutesPastHour =
			minutesTotal % TimeHelper.MinutesPerHour;
		var hours =
			Math.floor(minutesTotal / TimeHelper.MinutesPerHour);
		var secondsPastMinute =
			Math.floor(secondsTotal % TimeHelper.SecondsPerMinute);
		var millisecondsPastSecond = Math.floor
		(
			(secondsTotal * TimeHelper.MillisecondsPerSecond)
			% TimeHelper.MillisecondsPerSecond
		);

		var hoursPadded = ("" + hours).padLeft("0", 2);
		var minutesPastHourPadded =
			("" + minutesPastHour).padLeft("0", 2);
		var secondsPastMinutePadded =
			("" + secondsPastMinute).padLeft("0", 2);
		var millisecondsPastSecondPadded =
			("" + millisecondsPastSecond).padLeft("0", 3);

		var returnValue =
			hoursPadded + ":"
			+ minutesPastHourPadded + ":"
			+ secondsPastMinutePadded + "," // French radix point
			+ millisecondsPastSecondPadded;

		return returnValue;
	}

	static secondsToStringSecondsMilliseconds(secondsTotal)
	{
		var secondsWhole = Math.floor(secondsTotal);

		var millisecondsPastSecond = Math.floor
		(
			(secondsTotal * TimeHelper.MillisecondsPerSecond)
			% TimeHelper.MillisecondsPerSecond
		);

		var millisecondsPastSecondPadded =
			("" + millisecondsPastSecond).padLeft("0", 3);

		var returnValue =
			+ secondsWhole + "."
			+ millisecondsPastSecondPadded;

		return returnValue;
	}

}
