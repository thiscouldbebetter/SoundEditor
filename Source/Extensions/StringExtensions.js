
function StringExtensions()
{
	// Extension class.
}

{
	String.prototype.padLeft = function(stringToPadWith, lengthAfterPadding)
	{
		var returnValue = this;

		while (returnValue.length < lengthAfterPadding)
		{
			returnValue =
				stringToPadWith
				+ returnValue;
		}

		return returnValue;
	}
}
