"use strict";
class TimeHelper {
    static secondsToStringHHMMSSmmm(secondsTotal) {
        var minutesTotal = Math.floor(secondsTotal / TimeHelper.SecondsPerMinute);
        var minutesPastHour = minutesTotal % TimeHelper.MinutesPerHour;
        var hours = Math.floor(minutesTotal / TimeHelper.MinutesPerHour);
        var secondsPastMinute = Math.floor(secondsTotal % TimeHelper.SecondsPerMinute);
        var millisecondsPastSecond = Math.floor((secondsTotal * TimeHelper.MillisecondsPerSecond)
            % TimeHelper.MillisecondsPerSecond);
        var hoursPadded = ("" + hours).padStart(2, "0");
        var minutesPastHourPadded = ("" + minutesPastHour).padStart(2, "0");
        var secondsPastMinutePadded = ("" + secondsPastMinute).padStart(2, "0");
        var millisecondsPastSecondPadded = ("" + millisecondsPastSecond).padStart(3, "0");
        var returnValue = hoursPadded + ":"
            + minutesPastHourPadded + ":"
            + secondsPastMinutePadded + "," // French radix point
            + millisecondsPastSecondPadded;
        return returnValue;
    }
    static secondsToStringSecondsMilliseconds(secondsTotal) {
        var secondsWhole = Math.floor(secondsTotal);
        var millisecondsPastSecond = Math.floor((secondsTotal * TimeHelper.MillisecondsPerSecond)
            % TimeHelper.MillisecondsPerSecond);
        var millisecondsPastSecondPadded = ("" + millisecondsPastSecond).padStart(3, "0");
        var returnValue = +secondsWhole + "."
            + millisecondsPastSecondPadded;
        return returnValue;
    }
}
TimeHelper.SecondsPerMinute = 60;
TimeHelper.MinutesPerHour = 60;
TimeHelper.MillisecondsPerSecond = 1000;
