
function Display(size)
{
	this.size = size;
}
{
	Display.prototype.initialize = function()
	{
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.size.x;
		this.canvas.height = this.size.y;

		this.graphics = this.canvas.getContext("2d");
	}

	Display.prototype.drawRectangle = function(pos, size, colorFill, colorBorder)
	{
		if (colorFill != null)
		{
			this.graphics.fillStyle = colorFill;
			this.graphics.fillRect(pos.x, pos.y, size.x, size.y);
		}
		
		if (colorBorder != null)
		{			
			this.graphics.strokeStyle = colorBorder;
			this.graphics.strokeRect(pos.x, pos.y, size.x, size.y);
		}
	}
	
	Display.prototype.drawText = function(text, pos, colorFill, colorBorder)
	{
		this.graphics.strokeStyle = colorBorder;
		this.graphics.strokeText(text, pos.x, pos.y);

		this.graphics.fillStyle = colorFill;
		this.graphics.fillText(text, pos.x, pos.y);		
	}
}