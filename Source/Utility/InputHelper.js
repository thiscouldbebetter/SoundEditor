
class InputHelper
{
	static MouseDragDelayInMilliseconds = 100;

	initialize()
	{
		var body = document.body;
		body.onmousedown = this.handleEventMouseDown.bind(this);
		body.onmousemove = this.handleEventMouseMove.bind(this);
		body.onmouseup = this.handleEventMouseUp.bind(this);
		body.onkeydown = this.handleEventKeyDown.bind(this);
	}

	// events

	handleEventKeyDown(event)
	{
		this.keyEventPrev = event;

		var entity = Globals.Instance.soundEditor; // hack
		if (entity != null && entity.handleEventKeyDown != null)
		{
			entity.handleEventKeyDown(event);
		}
	}

	handleEventMouseDown(event)
	{
		this.mouseButtonPressed = true;
		this.mouseClickTime = new Date();

		var entity = event.srcElement.entity;
		if (entity != null && entity.handleEventMouseDown != null)
		{
			entity.handleEventMouseDown(event);
		}
	}

	handleEventMouseMove(event)
	{
		if (this.mouseButtonPressed)
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

	handleEventMouseUp(event)
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
