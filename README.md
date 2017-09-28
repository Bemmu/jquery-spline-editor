jquery-spline-editor
====================

jQuery widget for editing cubic splines that wrap around. Useful at least for controlling looping animations.

![spline editor widget](https://github.com/Bemmu/jquery-spline-editor/raw/master/screenshot.png)

## Examples

[Basic init with random knots](http://www.bemmu.com/jquery-spline-editor/example.html)

[Init with chosen knots](http://www.bemmu.com/jquery-spline-editor/example2.html)

[Reading the computed y-values](http://www.bemmu.com/jquery-spline-editor/example3.html)

[Showing the playhead and controlling an animation](http://www.bemmu.com/jquery-spline-editor/example4.html)

## Basic usage

The widget needs a div to live in, with an explicitly defined size so the canvas element that gets created inside of it knows how big to be.

    <div id="foo" style="width:200px;height:200px;"></div>

Init the widget like so:

    $('#foo').splineEditor();

Naturally you need to include the plugin and the dependencies jquery, underscore and sylvester. Please see [example.html](https://github.com/Bemmu/jquery-spline-editor/blob/master/example.html) on how to do this.

## Defining initial knots

You can choose the initial knots (also known as control points) by passing in the initialKnots option. [0, 0] is top left.

	$('#foo').splineEditor({
		initialKnots: [
			[100, 140],
			[160, 100],
			[220, 140]
		]
	});

## Getting at the data

To get what the interpolated y is at some point:

	var x = 100; // for example
	var y = $('#foo').splineEditor('getY', x);

To animate based on the data, you would start a setInterval and then read each y for each frame.

## The playhead

When using the editor to control an animation, you might want to show the user where the animation is currently at, similar to how Adobe Flash shows a playhead as the animation is playing. You can show a black line at a certain x pos by using showPlayhead, setPlayheadX and hidePlayhead. See [example4.html](http://www.bemmu.com/jquery-spline-editor/example4.html).

## Was this useful for you?

If you found the editor widget useful, I'd love to hear from you.Drop me a line at me@bemmu.com
