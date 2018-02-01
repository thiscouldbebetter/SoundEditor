
function StringHelper()
{
	// static class
}

{
	StringHelper.padLeft = function(stringToBePadded, stringToPadWith, lengthAfterPadding)
	{
		var returnValue = stringToBePadded;

		while (returnValue.length < lengthAfterPadding)
		{
			returnValue =
				stringToPadWith
				+ returnValue;
		}

		return returnValue;
	}
}
