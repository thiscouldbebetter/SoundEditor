
class FileHelper
{
	static loadFileAsTextAndSendToCallback(fileToLoad: any, callback: any): void
	{
		var fileReader = new FileReader();
		fileReader.onload = (fileLoadedEvent) =>
		{
			var textFromFileLoaded = fileLoadedEvent.target.result;
			callback(fileToLoad, textFromFileLoaded);
		};
		fileReader.readAsText(fileToLoad, "UTF-8");
	}

	static loadFileAsBytesAndSendToCallback(fileToLoad: any, callback: any): void
	{
		var fileReader = new FileReader();
		fileReader.onload = (fileLoadedEvent) =>
		{
			var fileContentsAsBinaryString =
				fileLoadedEvent.target.result as string;
			var fileContentsAsBytes = [];
			for (var i = 0; i < fileContentsAsBinaryString.length; i++)
			{
				var byte = fileContentsAsBinaryString.charCodeAt(i);
				fileContentsAsBytes.push(byte);
			}
			callback(fileToLoad, fileContentsAsBytes);
		};
		fileReader.readAsBinaryString(fileToLoad);
	}

	static saveBytesToFile(bytesToSave: number[], filenameToSaveTo: string): void
	{
		var numberOfBytes = bytesToSave.length;
		var bytesAsArrayBuffer = new ArrayBuffer(numberOfBytes);
		var bytesAsUIntArray = new Uint8Array(bytesAsArrayBuffer);
		for (var i = 0; i < numberOfBytes; i++)
		{
			bytesAsUIntArray[i] = bytesToSave[i];
		}

		var bytesAsBlob = new Blob
		(
			[ bytesAsArrayBuffer ],
			{type:"application/type"}
		);

		var downloadLink = document.createElement("a");
		downloadLink.href = URL.createObjectURL(bytesAsBlob);
		downloadLink.download = filenameToSaveTo;
		downloadLink.click();

	}

	static saveTextAsFile(textToWrite: string, fileNameToSaveAs: string): void
	{
		var textFileAsBlob = new Blob([textToWrite], {type:'text/plain'});

		var downloadLink = document.createElement("a");
		downloadLink.download = fileNameToSaveAs;
		downloadLink.innerHTML = "Download File";
		downloadLink.href = URL.createObjectURL(textFileAsBlob);
		downloadLink.click();
	}
}
