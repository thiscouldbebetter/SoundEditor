
// classes

function Base64Encoder()
{
	// do nothing
}

{
	// static methods

	Base64Encoder.encodeBytes = function(bytesToEncode)
	{
		// Encode each three sets of eight bits (octets, or bytes)
		// as four sets of six bits (sextets, or Base 64 digits)

		var returnString = "";

		var bytesPerSet = 3;
		var base64DigitsPerSet = 4;

		var base64DigitsAsString = 
			"ABCDEFGHIJKLMNOPQRSTUVWXYZ" 
			+ "abcdefghijklmnopqrstuvwxyz"
			+ "0123456789"
			+ "+/";

		var numberOfBytesToEncode = bytesToEncode.length;
		var numberOfFullSets = Math.floor(numberOfBytesToEncode / bytesPerSet);
		var numberOfBytesInFullSets = numberOfFullSets * bytesPerSet;
		var numberOfBytesLeftAtEnd = numberOfBytesToEncode - numberOfBytesInFullSets;

		for (var s = 0; s < numberOfFullSets; s++)
		{
			var b = s * bytesPerSet;

			var valueToEncode = 
				(bytesToEncode[b] << Constants.BitsPerByteTimesTwo)
				| (bytesToEncode[b + 1] << Constants.BitsPerByte)
				| (bytesToEncode[b + 2]);

			returnString += base64DigitsAsString[((valueToEncode & 0xFC0000) >>> 18)];
			returnString += base64DigitsAsString[((valueToEncode & 0x03F000) >>> 12)];
			returnString += base64DigitsAsString[((valueToEncode & 0x000FC0) >>> 6)];
			returnString += base64DigitsAsString[((valueToEncode & 0x00003F))];
		}	

		var b = numberOfFullSets * bytesPerSet;

		if (numberOfBytesLeftAtEnd == 1)
		{
			var valueToEncode = (bytesToEncode[b] << 16);

			returnString += base64DigitsAsString[((valueToEncode & 0xFC0000) >>> 18)];
			returnString += base64DigitsAsString[((valueToEncode & 0x03F000) >>> 12)];
			returnString += "==";
		}		
		else if (numberOfBytesLeftAtEnd == 2)
		{
			var valueToEncode = 
				(bytesToEncode[b] << 16)
				| (bytesToEncode[b + 1] << 8);

			returnString += base64DigitsAsString[((valueToEncode & 0xFC0000) >>> 18)];
			returnString += base64DigitsAsString[((valueToEncode & 0x03F000) >>> 12)];
			returnString += base64DigitsAsString[((valueToEncode & 0x000FC0) >>> 6)];
			returnString += "=";
		}

		return returnString;
	}
}
