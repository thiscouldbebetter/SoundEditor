
class Coords
{
	constructor(x, y)
	{
		this.x = x;
		this.y = y;
	}

	clone()
	{
		return new Coords(this.x, this.y);
	}

	divideScalar(scalar)
	{
		this.x /= scalar;
		this.y /= scalar;

		return this;
	}
}
