
class NumberHelper
{
	static trimNumberToMax(numberToTrim: number, max: number): number
	{
		var value = numberToTrim;

		if (value < 0)
		{
			value = 0;
		}
		else if (value >= max)
		{
			value = max;
		}

		return value;
	}
}
