function ArrayExtensions()
{
	// extension class
}
{
	Array.prototype.addLookups = function(propertyName)
	{
		for (var i = 0; i < this.length; i++)
		{
			var element = this[i];
			var propertyValue = element[propertyName];
			this[propertyValue] = element;
		}
	}
}
