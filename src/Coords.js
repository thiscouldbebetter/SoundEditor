
function Coords(x, y)
{
	this.x = x;
	this.y = y;
}

{
	Coords.prototype.clone = function()
	{
		return new Coords(this.x, this.y);
	}

	Coords.prototype.divideScalar = function(scalar)
	{
		this.x /= scalar;
		this.y /= scalar;

		return this;
	}
}
