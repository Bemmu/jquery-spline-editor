jquery-spline-editor
====================

jQuery widget for editing cubic splines that wrap around.

![spline editor widget](https://github.com/Bemmu/jquery-spline-editor/raw/master/screenshot.png)

##Live demo

[http://www.bemmu.com/jquery-spline-editor/example.html](http://www.bemmu.com/jquery-spline-editor/example.html)

##Basic usage

The widget needs a div to live in, with an explicitly defined size so the canvas element that gets created inside of it knows how big to be.

    <div id="foo" style="width:200px;height:200px;"></div>

Init the widget like so:

    $('#foo').splineEditor();

Naturally you need to include the plugin and the dependencies jquery, underscore and sylvester. Please see [example.html](https://github.com/Bemmu/jquery-spline-editor/blob/master/example.html) on how to do this.

##Defining initial knots

You can choose the initial knots (also known as control points) by passing in the initialKnots option.

			$('#foo').splineEditor({
				initialKnots: [
					[100, 140],
					[160, 100],
					[220, 140]
				]
			});
