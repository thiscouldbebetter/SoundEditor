
function Selection(tag, timeStartInSeconds, timeEndInSeconds)
{
	this.tag = tag;
	this.timeStartInSeconds = timeStartInSeconds;
	this.timeEndInSeconds = timeEndInSeconds;
}

{
	// static methods

	Selection.buildFromStringSRT = function(selectionAsStringSRT)
	{
		var newline = Constants.Newline;

		var selectionAsLines = selectionAsStringSRT.split(newline);

		var startAndEndTimeAsString = selectionAsLines[1];
		var startAndEndTimesAsStrings = startAndEndTimeAsString.split
		(
			" --> "
		);

		var startAndEndTimesInSeconds = [];
		for (var i = 0; i < startAndEndTimesAsStrings.length; i++)
		{
			var timeAsString = startAndEndTimesAsStrings[i];
			var timeComponentsHMS = timeAsString.split(":");

			// todo - handle minutes and hours

			var timeComponentSeconds = timeComponentsHMS[2];
			var secondsAndMillisecondsAsStrings = timeComponentSeconds.split(","); // French radix point
			var secondsAsString = secondsAndMillisecondsAsStrings[0];
			var millisecondsAsString = secondsAndMillisecondsAsStrings[1];
			var seconds = parseInt(secondsAsString);
			var milliseconds = parseInt(millisecondsAsString);

			var timeInSeconds = seconds + (milliseconds / 1000);

			startAndEndTimesInSeconds.push(timeInSeconds);
		}

		var tag = selectionAsLines[2];

		var returnValue = new Selection
		(
			tag,
			startAndEndTimesInSeconds[0],
			startAndEndTimesInSeconds[1]
		);

		return returnValue;
	}

	Selection.buildManyFromStringSRT = function(selectionsAsStringSRT)
	{
		var returnValues = [];

		var newline = Constants.Newline;

		var selectionsAsStringsSRT = selectionsAsStringSRT.split
		(
			newline + newline
		);

		for (var i = 0; i < selectionsAsStringsSRT.length; i++)
		{
			var selectionAsStringSRT = selectionsAsStringsSRT[i];
			if (selectionAsStringSRT.length > 0)
			{
				var selection = Selection.buildFromStringSRT
				(
					selectionAsStringSRT
				);
				returnValues.push(selection);
				returnValues[selection.tag] = selection;
			}
		}

		return returnValues;
	}

	Selection.convertManyToStringSRT = function(selections)
	{
		var returnValue = "";

		var newline = Constants.Newline;

		for (var i = 0; i < selections.length; i++)
		{
			var selection = selections[i];

			var selectionAsString = selection.toStringSRT(i);

			returnValue += selectionAsString + newline + newline;
		}

		return returnValue;
	}

	// instance methods

	Selection.prototype.overlapsWith = function(other)
	{
		return false; // todo
	}

	Selection.prototype.rectify = function()
	{
		if (this.timeStartInSeconds > this.timeEndInSeconds)
		{
			var temp = this.timeStartInSeconds;
			this.timeStartInSeconds = this.timeEndInSeconds;
			this.timeEndInSeconds = temp;
		}
	}

	Selection.prototype.durationInSeconds = function()
	{
		var returnValue = this.timeEndInSeconds - this.timeStartInSeconds;
		return returnValue;
	}

	Selection.prototype.toString = function()
	{
		var timeStartAsString = TimeHelper.secondsToStringSecondsMilliseconds
		(
			this.timeStartInSeconds
		);

		var timeEndAsString = TimeHelper.secondsToStringSecondsMilliseconds
		(
			this.timeEndInSeconds
		);

		var returnValue =
			timeStartAsString + "-" + timeEndAsString
			+ " " + this.tag;

		return returnValue;
	}

	Selection.prototype.toStringSRT = function(index)
	{
		// SubRip subtitle format

		var indexAsString = "" + (index + 1);

		var newline = Constants.Newline;

		var timeStartAsString = TimeHelper.secondsToStringHHMMSSmmm
		(
			this.timeStartInSeconds
		);

		var timeEndAsString = TimeHelper.secondsToStringHHMMSSmmm
		(
			this.timeEndInSeconds
		);

		var returnValue =
			indexAsString + newline
			+ timeStartAsString
			+ " --> "
			+ timeEndAsString + newline
			+ this.tag;

		return returnValue;
	}
}
