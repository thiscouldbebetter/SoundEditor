
function InputHelper()
{

}

{
	InputHelper.MouseDragDelayInMilliseconds = 100;

	InputHelper.prototype.initialize = function()
	{
		document.body.onmousedown = this.handleEventMouseDown.bind(this);
		document.body.onmousemove = this.handleEventMouseMove.bind(this);
		document.body.onmouseup = this.handleEventMouseUp.bind(this);
		document.body.onkeydown = this.handleEventKeyDown.bind(this);
	}

	// events

	InputHelper.prototype.handleEventKeyDown = function(event)
	{
		this.keyEventPrev = event;

		var entity = Globals.Instance.soundEditor; // hack
		if (entity != null && entity.handleEventKeyDown != null)
		{
			entity.handleEventKeyDown(event);
		}
	}

	InputHelper.prototype.handleEventMouseDown = function(event)
	{
		this.mouseButtonPressed = true;
		this.mouseClickTime = new Date();

		var entity = event.srcElement.entity;
		if (entity != null && entity.handleEventMouseDown != null)
		{
			entity.handleEventMouseDown(event);
		}
	}

	InputHelper.prototype.handleEventMouseMove = function(event)
	{
		if (this.mouseButtonPressed == true)
		{
			var now = new Date();
			var millisecondsElapsedSinceClick = now - this.mouseClickTime;
			if (millisecondsElapsedSinceClick >= InputHelper.MouseDragDelayInMilliseconds)
			{
				var entity = event.srcElement.entity;
				if (entity != null && entity.handleEventMouseMove != null)
				{
					entity.handleEventMouseMove(event);
				}
			}
		}
	}

	InputHelper.prototype.handleEventMouseUp = function(event)
	{
		this.mouseButtonPressed = false;

		if (event.srcElement.handleEventMouseUp != null)
		{
			event.srcElement.handleEventMouseUp(event);
		}

		var entity = event.srcElement.entity;
		if (entity != null && entity.handleEventMouseUp != null)
		{
			entity.handleEventMouseUp(event);
		}
	}
}
