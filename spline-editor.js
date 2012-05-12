/*
 jQuery widget for editing cubic splines that wrap around.
 Useful especially for controlling looping animations.

 See example.html to learn how to use this.

 To understand this code, read these:
  http://en.wikipedia.org/wiki/Spline_interpolation
  http://docs.jquery.com/Plugins/Authoring

 Author: Bemmu Sepponen, me@bemmu.com
 MIT license
*/
(function ($) {
	function computeFirstDerivativesAtKnotPoints(sortedByX) {

		// Width of matrix is how many knots there are (because each equation refers to current, prev and next knot)
		// Height of matrix is how many knots there are, because there is one equation for each

		// To solve for the derivatives, it becomes that Ax = b situation where x is solved for.
		var aElements = [];
		var bElements = [];

		for (var i = 0; i < sortedByX.length; i++) {

			// Gather the variables needed to compose the system of linear equations
			var currentKnotX = sortedByX[i].x;
			var currentKnotY = sortedByX[i].y;
			var isLastKnot = i == sortedByX.length-1;
			var isFirstKnot = i == 0;

			// When referring to next and previous knots, assume they wrap around horizontally.
			var rightBorder = this.settings.width;
			var previousKnotX = isFirstKnot ? -(rightBorder - sortedByX[sortedByX.length-1].x) : sortedByX[i - 1].x;
			var previousKnotY = isFirstKnot ? sortedByX[sortedByX.length-1].y : sortedByX[i - 1].y;
			var nextKnotX = isLastKnot ? rightBorder + sortedByX[0].x : sortedByX[i + 1].x;
			var nextKnotY = isLastKnot ? sortedByX[0].y : sortedByX[i + 1].y;

			var elementRow = [];
			for (var j = 0; j < sortedByX.length; j++) {
				if (j == i - 1 || (i == 0 && j == sortedByX.length-1)) {
					elementRow.push(1/(currentKnotX - previousKnotX));
				} else if (j == i) {
					elementRow.push(2 * ( 1/(currentKnotX - previousKnotX) + 1/(nextKnotX-currentKnotX) ));
				} else if (j == i + 1 || (i == sortedByX.length-1 && j == 0)) {
					elementRow.push(1/(nextKnotX - currentKnotX));
				} else {
					elementRow.push(0);
				}
			}
			aElements.push(elementRow);

			var denom1 = currentKnotX-previousKnotX;
			var denom2 = nextKnotX-currentKnotX;
			var bElement = 3*( (currentKnotY-previousKnotY)/(denom1*denom1) + (nextKnotY-currentKnotY)/(denom2*denom2) );
			bElements.push([bElement]);
		}

		// Solve for first derivatives (K_i)
		var A = $M(aElements);
		var B = $M(bElements);
		var solution = A.inverse().multiply(B);

		return solution;
	}

	function drawKnot(knot) {
		var context = this.context;

		switch (knot) {
		case this.knotBeingDragged:
			context.fillStyle = 'rgb(51,51,102)';
			context.strokeStyle = 'black';
			break;
		case this.knotBeingHovered:
			context.fillStyle = 'rgba(145,145,171,0.9)';
			context.strokeStyle = '#333';
			break;
		default:
			context.fillStyle = 'rgba(240,240,240,0.8)';
			context.strokeStyle = '#666';
		}

		context.beginPath();
		context.arc(knot.x, knot.y, this.knotRadius, 0, Math.PI*2, true);
		context.closePath();
		context.stroke();
		context.fill();
	}

	function clearBackground() {
		var context = this.context;
		context.fillStyle = this.settings.backgroundColor;
		context.fillRect(0, 0, this.settings.width, this.settings.height);
	}

	function distance(x1, y1, x2, y2) {
		return Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
	}

	function knotsUnderPoint(x, y) {
		var knotRadius = this.knotRadius;
		return _.filter(this.knots, function (knot) {
			var d = distance(knot.x, knot.y, x, y);
			return d <= knotRadius;
		});
	}

	function nearestKnotToPoint(knots, x, y) {
		var sorted = _.sortBy(knots, function (knot) {
			return distance(knot.x, knot.y, x, y);
		});
		return sorted.length === 0 ? null : sorted[0];
	}

	function knotMouseEventRefersTo(evt) {
		var x = evt.offsetX;
		var y = evt.offsetY;
		var under = this.knotsUnderPoint(x, y);
		return nearestKnotToPoint(under, x, y);
	}

	function renderThisLast(knot) {
		this.knots = _.without(this.knots, knot);
		this.knots.push(knot);
	}

	function bindMouseEvents(canvas) {
		var that = this;
		canvas.bind('mouseup', function (evt) {
			if (that.knotBeingDragged) {
				if (!that.knotBeingDragged.wasMoved) {
					// Clicked without moving means delete the knot
					that.knots = _.without(that.knots, that.knotBeingDragged);
				} else {
					that.knotBeingHovered = that.knotMouseEventRefersTo(evt);
					that.knotBeingDragged = null;
				}
				that.refresh();
			}
		});
		canvas.bind('mousedown', function (evt) {
			var knot = that.knotMouseEventRefersTo(evt);
			if (knot) {
				that.mouseXRelativeToKnotAtStartOfDrag = evt.offsetX - knot.x;
				that.mouseYRelativeToKnotAtStartOfDrag = evt.offsetY - knot.y;
				that.knotBeingHovered = null;
				that.knotBeingDragged = knot;
				that.knotBeingDragged.wasMoved = false;
				that.renderThisLast(that.knotBeingDragged);	
				that.refresh();
			} else {
				that.addKnot([evt.offsetX, evt.offsetY]);
			}
		});
		canvas.bind('mousemove', function (evt) {
			if (that.knotBeingDragged) {
				that.knotBeingDragged.x = evt.offsetX - that.mouseXRelativeToKnotAtStartOfDrag;
				that.knotBeingDragged.y = evt.offsetY - that.mouseYRelativeToKnotAtStartOfDrag;
				that.knotBeingDragged.wasMoved = true;
				that.refresh();
			} else {
				var prev = that.knotBeingHovered;
				that.knotBeingHovered = that.knotMouseEventRefersTo(evt);
				canvas.css('cursor', that.knotBeingHovered ? 'pointer' : '');
				var hoveredKnotChanged = prev !== that.knotBeingHovered;
				if (hoveredKnotChanged) {
					that.refresh();
				}
			}
		});
	}

	function createRandomKnotsInsideArea() {
		for (var i = 0; i < 8; i++) {
			this.addKnot([
				this.settings.width * i/8,
				this.settings.height * (0.4 + Math.random() * 0.2)
			]);
/*			this.knots.push({
				x : this.settings.width * i/8,
				y : this.settings.height * (0.4 + Math.random() * 0.2)
			});*/
		}
	}

	function findInterval(x, sortedByX) {
		for (var i = sortedByX.length - 1; i >= 0; i--) {
			if (x >= sortedByX[i].x) {
				return i;
			}
		}
		return sortedByX.length - 1;
	}

	function cubicSplineAtX(x, sortedByX, firstDerivativeMatrix) {

		// First find which interval this is in to choose the correct
		// x1, x2, y1, y2, k1, k2 for the interval function q.
		var i = findInterval(x, sortedByX);
		var iNext = i == sortedByX.length-1 ? 0 : i + 1;

		var x1 = sortedByX[i].x;
		var x2 = sortedByX[iNext].x;
		var y1 = sortedByX[i].y;
		var y2 = sortedByX[iNext].y;
		var k1 = firstDerivativeMatrix.elements[i][0];
		var k2 = firstDerivativeMatrix.elements[iNext][0];

		var a = k1*(x2-x1)-(y2-y1);
		var b = -k2*(x2-x1)+(y2-y1);
		var t = (x-x1)/(x2-x1);
		return (1-t)*y1+t*y2+t*(1-t)* (a*(1-t)+b*t) ;
	}

	function initCanvas() {
		this.canvas.width = this.settings.width; // buffer size
		this.canvas.height = this.settings.height;
		$('canvas').css({ // displayed size, stretched if not same
			width: this.settings.width,
			height: this.settings.height
		});
		this.context = this.canvas.getContext('2d');
	}

	// Bottleneck. If this script seems too slow for your
	// purposes, look into storing sortedByX and firstDerivativeMatrix
	// and only recomputing them when needed.

	function getY(x) {
		var sortedByX = _.sortBy(this.knots, 'x');

		// If several knots have same X, ignore all but one
		sortedByX = _.uniq(sortedByX, true, function (knot) {
			return knot.x;
		});

		// Pretend like there are extra mirrored knots in the beginning and end
		// to get continuity. Actually, I thought this wouldn't be necessary since
		// already accounting for that when making the matrices, but experimentally
		// the extra knots turned out to be necessary ( == magic).
		var firstMirroredKnot = {
			x: -(this.settings.width - sortedByX[sortedByX.length-1].x),
			y: sortedByX[sortedByX.length-1].y
		}
		var lastMirroredKnot = {
			x: this.settings.width + sortedByX[0].x,
			y: sortedByX[0].y
		}
		var sortedByX = _.union([firstMirroredKnot], sortedByX, [lastMirroredKnot]);
		var firstDerivativeMatrix = this.computeFirstDerivativesAtKnotPoints(sortedByX);
		var y = cubicSplineAtX(x, sortedByX, firstDerivativeMatrix);
		return y;
	}

	function drawPlayhead() {
		this.context.strokeStyle = "black";
		this.context.lineWidth = 2;
		this.context.beginPath();		
		this.context.moveTo(this.playheadX, 0);
		this.context.lineTo(this.playheadX, this.settings.height);
		this.context.stroke();
		this.context.closePath();				
	}

	function refresh() {
		if (!this.context) {
			return;
		}

		this.clearBackground();
		for (var i = 0; i < this.knots.length; i++) {
			this.drawKnot(this.knots[i]);
		}

		this.context.strokeStyle = "rgb(30,30,128)";
		this.context.lineWidth = 3;
		this.context.beginPath();
		for (var x = 0; x < this.settings.width; x++) {
			var y = this.getY(x);
			if (x == 0) {
				this.context.moveTo(x, y);
			} else {
				this.context.lineTo(x, y);
			}
		}
		this.context.stroke();
		this.context.closePath();

		if (this.playheadVisible) {
			this.drawPlayhead();
		}
	}

	function addKnot(pos) {
		this.knots.push({
			x: pos[0],
			y: pos[1]
		});
		this.refresh();
	}

	function showPlayhead() {
		this.playheadVisible = true;
		this.refresh();
	}

	function hidePlayhead() {
		this.playheadVisible = false;
		this.refresh();
	}

	function setPlayheadX(x) {
		this.playheadX = x;
		this.refresh();
	}

	function createEditor(canvas, settings) {
		var editor = {
			knotRadius: 10,
			knots: [],
			knotBeingDragged: null,
			knotBeingHovered: null,
			mouseXRelativeToKnotAtStartOfDrag: null,
			mouseYRelativeToKnotAtStartOfDrag: null,
			playheadVisible: false,
			playheadX: 20, // to be reasonably sure it's initially visible
			canvas: canvas,
			context: null,
			refresh: refresh,
			initCanvas: initCanvas,
			settings: settings,
			drawKnot: drawKnot,
			knotsUnderPoint: knotsUnderPoint,
			renderThisLast: renderThisLast,
			computeFirstDerivativesAtKnotPoints: computeFirstDerivativesAtKnotPoints,
			clearBackground: clearBackground,
			knotMouseEventRefersTo: knotMouseEventRefersTo,
			bindMouseEvents: bindMouseEvents,
			createRandomKnotsInsideArea: createRandomKnotsInsideArea,
			addKnot: addKnot,
			getY: getY,
			showPlayhead: showPlayhead,
			hidePlayhead: hidePlayhead,
			setPlayheadX: setPlayheadX,
			drawPlayhead: drawPlayhead
		};
		return editor;
	}

	var methods = {
		init: function(options) {
			var settings = $.extend({
				width: $(this).width(),
				height: $(this).height(),
				backgroundColor: 'white'
			}, options);

			return this.each(function () {
				var canvas = $('<canvas></canvas>').css({
					width : settings.width,
					height : settings.height
				}).get(0);
				$(this).append(canvas);

				var editor = createEditor(canvas, settings);

				if (options && options.initialKnots) {
					for (var i = 0; i < options.initialKnots.length; i++) {
						editor.addKnot(options.initialKnots[i]);
					}
				} else {
					editor.createRandomKnotsInsideArea();
				}

				editor.initCanvas();
				editor.bindMouseEvents($(canvas));
				editor.refresh();
				$(this).data('editor', editor);
			});			
		},
		getY: function (x) {
			if (this.length === 1) {
				return $(this[0]).data('editor').getY(x);
			} else {
				console.log('Spline editor error: Asked Y from ' + this.length + ' widgets.');
			}
		},
		showPlayhead: function () {
			return this.each(function () {
				$(this).data('editor').showPlayhead();
			});			
		},
		setPlayheadX: function (x) {
			return this.each(function () {
				$(this).data('editor').setPlayheadX(x);
			});			
		},
		hidePlayhead: function () {
			return this.each(function () {
				$(this).data('editor').hidePlayhead();
			});			
		}
	}

	$.fn.splineEditor = function( method ) {
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Spline editor does not support method ' + method);
		}
	};
})(jQuery);

