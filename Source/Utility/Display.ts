
class Display
{
	size: Coords;

	canvas: any;
	graphics: any;

	constructor(size: Coords)
	{
		this.size = size;
	}

	initialize(): void
	{
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.size.x;
		this.canvas.height = this.size.y;

		this.graphics = this.canvas.getContext("2d");
	}

	drawImage(image: any, pos: Coords): void
	{
		this.graphics.drawImage(image, pos.x, pos.y);
	}

	drawPathBetweenPoints(points: Coords[]): void
	{
		this.graphics.beginPath();
		var point0 = points[0];
		this.graphics.moveTo(point0.x, point0.y);
		for (var i = 1; i < points.length; i++)
		{
			var point = points[i];
			this.graphics.lineTo(point.x, point.y);
		}
		this.graphics.stroke();
	}

	drawRectangle(pos: Coords, size: Coords, colorFill: string, colorBorder: string)
	{
		var g = this.graphics;

		if (colorFill != null)
		{
			g.fillStyle = colorFill;
			g.fillRect(pos.x, pos.y, size.x, size.y);
		}

		if (colorBorder != null)
		{
			g.strokeStyle = colorBorder;
			g.strokeRect(pos.x, pos.y, size.x, size.y);
		}
	}

	drawText(text: string, pos: Coords, colorFill: string, colorBorder: string): void
	{
		var g = this.graphics;

		g.strokeStyle = colorBorder;
		g.strokeText(text, pos.x, pos.y);

		g.fillStyle = colorFill;
		g.fillText(text, pos.x, pos.y);
	}
}