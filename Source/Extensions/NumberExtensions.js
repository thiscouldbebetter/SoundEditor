
function NumberExtensions()
{
	// Extension class.
}

{
	Number.prototype.trimToRange = function(range)
	{
		var value = this;

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
