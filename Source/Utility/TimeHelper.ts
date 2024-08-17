
class TimeHelper
{
	static SecondsPerMinute = 60;
	static MinutesPerHour = 60;
	static MillisecondsPerSecond = 1000;

	static secondsToStringHHMMSSmmm(secondsTotal: number): string
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

		var hoursPadded = ("" + hours).padStart(2, "0");
		var minutesPastHourPadded =
			("" + minutesPastHour).padStart(2, "0");
		var secondsPastMinutePadded =
			("" + secondsPastMinute).padStart(2, "0");
		var millisecondsPastSecondPadded =
			("" + millisecondsPastSecond).padStart(3, "0");

		var returnValue =
			hoursPadded + ":"
			+ minutesPastHourPadded + ":"
			+ secondsPastMinutePadded + "," // French radix point
			+ millisecondsPastSecondPadded;

		return returnValue;
	}

	static secondsToStringSecondsMilliseconds(secondsTotal: number): string
	{
		var secondsWhole = Math.floor(secondsTotal);

		var millisecondsPastSecond = Math.floor
		(
			(secondsTotal * TimeHelper.MillisecondsPerSecond)
			% TimeHelper.MillisecondsPerSecond
		);

		var millisecondsPastSecondPadded =
			("" + millisecondsPastSecond).padStart(3, "0");

		var returnValue =
			+ secondsWhole + "."
			+ millisecondsPastSecondPadded;

		return returnValue;
	}

}
