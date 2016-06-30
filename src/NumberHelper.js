
function NumberHelper()
{
	// static class
}

{
	NumberHelper.trimValueToRange = function(value, range)
	{
		if (value < 0)
		{
			value = 0;
		}
		else if (value >= range)
		{
			value = range;
		}

		return value;
	}
}
