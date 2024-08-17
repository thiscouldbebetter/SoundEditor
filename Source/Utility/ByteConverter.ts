
class ByteConverter
{
	numberOfBits: number;

	numberOfBytes: number;
	maxValueSigned: number;
	maxValueUnsigned: number;

	constructor(numberOfBits: number)
	{
		this.numberOfBits = numberOfBits;
		this.numberOfBytes = Math.floor(this.numberOfBits / 8);

		this.maxValueSigned =
			(1 << (numberOfBits - 1)) - 1;

		this.maxValueUnsigned =
			(1 << (numberOfBits));
	}

	bytesToFloat(bytes: number[]): number
	{
		var bytesAsInteger = this.bytesToInteger(bytes);

		var returnValue = this.integerToFloat(bytesAsInteger);


		return returnValue;
	}

	bytesToInteger(bytes: number[]): number
	{
		var returnValue = 0;

		var numberOfBytes = bytes.length;

		for (var i = 0; i < numberOfBytes; i++)
		{
			returnValue |= bytes[i] << (i * Constants.BitsPerByte);
		}

		if (returnValue > this.maxValueSigned)
		{
			returnValue -= this.maxValueUnsigned;
		}

		return returnValue;
	}

	floatToInteger(floatToConvert: number): number
	{
		return floatToConvert * this.maxValueSigned;
	}

	integerToBytes(integer: number): number[]
	{
		var returnValues = [];

		for (var i = 0; i < this.numberOfBytes; i++)
		{
			var byteValue = (integer >> (8 * i)) & 0xFF;
			returnValues.push(byteValue);
		}

		return returnValues;
	}

	integerToFloat(integer: number): number
	{
		var returnValue =
			integer / this.maxValueSigned;

		return returnValue;
	}
}
