/* global numbers */

// SVG width = XPAD + RADIUS*2 + XSEP + RADIUS*2 (+ XPAD)
// SVG height = YPAD + RADIUS*2 (+YPAD)
var RADIUS = 180;

var XPAD = 20;
var YPAD = 50;
var XSEP = 100;

function makeSVG() {

	var svg = d3.select('#pie').select('svg');

	return svg;		
}

function drawBody(rotation, centralAngle, body, xRadius, yRadius, xA, yA, xB, yB, depthCue, xPad) {
	var leftX = (rotation > Math.PI)?xA:xPad;
	var leftY = (rotation > Math.PI)?yA:(YPAD+RADIUS);
	
	var rightX = (rotation+centralAngle < 2*Math.PI)?xB:(xPad+2*RADIUS);
	var rightY = (rotation+centralAngle < 2*Math.PI)?yB:(YPAD+RADIUS);
	
	var path = drawInfo.svg.append('path')
		.attr('d', 'M '+leftX+','+leftY+' '+
		'L '+leftX+','+(leftY+body)+
		'A '+xRadius+','+yRadius+' 0 0 0 '+rightX+','+(rightY+body)+' '+
		'L '+rightX+','+rightY+' Z');
	
	if (depthCue == 0) {
		path.attr('class', 'bluebody');
	} else {
		path.style('fill', 'url(#blueGradient)');
	}
}

/**
 * All angles in radians
 */
function draw3DPie(drawInfo, centralAngle, viewAngle, rotation, radius, body, depthCue, xPad) {

	var xRadius = radius;
	var yRadius = radius*Math.sin(viewAngle);

	var xA = xPad+radius+xRadius*Math.cos(rotation);
	var yA = YPAD+radius-yRadius*Math.sin(rotation);

	var xB = xPad+radius+radius*Math.cos(rotation+centralAngle);
	var yB = YPAD+radius-yRadius*Math.sin(rotation+centralAngle);

	drawInfo.svg.selectAll('ellipse').remove();
	drawInfo.svg.selectAll('path').remove();

	if (body > 0) {

		body *= 1-Math.sin(viewAngle);

		var path = drawInfo.svg.append('path')
			.attr('d', 'M '+(xPad)+','+(YPAD+radius)+' '+
			'L '+(xPad)+','+(YPAD+radius+body)+
			'A '+xRadius+','+yRadius+' 0 0 0 '+(xPad+2*radius)+','+(YPAD+radius+body)+' '+
			'L '+(xPad+2*radius)+','+(YPAD+radius)+' Z');
			
		if (depthCue == 0) {
			path.attr('class', 'body');
		} else {
			path.style('fill', 'url(#grayGradient)');
		}
		
		if (rotation+centralAngle > Math.PI) {
			drawBody(rotation, centralAngle, body, xRadius, yRadius, xA, yA, xB, yB, depthCue, xPad);
			
			if (rotation+centralAngle > 3*Math.PI) {
				drawBody(Math.PI, rotation+centralAngle-3*Math.PI, body, xRadius, yRadius, xA, yA, xB, yB, depthCue, xPad);
			}
		}
	}
	
	drawInfo.svg.append('ellipse')
		.attr('cx', xPad+radius)
		.attr('cy', YPAD+radius)
		.attr('rx', xRadius)
		.attr('ry', yRadius)
		.attr('class', 'grayslice');

	if (depthCue == 1) {
		drawInfo.svg.append('ellipse')
			.attr('cx', xPad+radius)
			.attr('cy', YPAD+radius)
			.attr('rx', xRadius)
			.attr('ry', yRadius)
			.attr('class', 'graypattern');
	}

	drawInfo.svg.append('path')
		.attr('d', 'M '+(xPad+radius)+','+(YPAD+radius)+' '+
		'L '+xB+','+yB+' '+
		'A '+xRadius+','+yRadius+' 0 '+((centralAngle>Math.PI)?1:0)+' 1 '+
		xA+','+yA+' Z')
		.attr('class', 'blueslice');

	if (depthCue == 1) {
		drawInfo.svg.append('path')
			.attr('d', 'M '+(xPad+radius)+','+(YPAD+radius)+' '+
			'L '+xB+','+yB+' '+
			'A '+xRadius+','+yRadius+' 0 '+((centralAngle>Math.PI)?1:0)+' 1 '+
			xA+','+yA+' Z')
			.attr('class', 'bluepattern');
			
		drawInfo.svg.selectAll('pattern')
			.attr('patternTransform', 'scale(1 '+Math.sin(viewAngle)+') rotate(45)');
	} else if (depthCue == 2) {
		var surfaceEllipse = d3.arc()
			.startAngle(0)
			.endAngle(2*Math.PI)
			.innerRadius(xRadius*.2)
			.outerRadius(xRadius*.4);
		
		drawInfo.svg.append('path')
			.attr('d', surfaceEllipse())
			.attr('class', 'surfaceEllipse')
			.attr('transform', 'translate('+(xPad+radius)+' '+(YPAD+radius)+') scale(1 '+Math.sin(viewAngle)+')');

		surfaceEllipse
			.innerRadius(xRadius*.6)
			.outerRadius(xRadius*.8);
		
		drawInfo.svg.append('path')
			.attr('d', surfaceEllipse())
			.attr('class', 'surfaceEllipse')
			.attr('transform', 'translate('+(xPad+radius)+' '+(YPAD+radius)+') scale(1 '+Math.sin(viewAngle)+')');
	}
}

function drawInteractionPie(drawInfo, centralAngle, radius, xPad) {

	drawInfo.svg.selectAll('.interactive').remove();

	drawInfo.cx = xPad+radius;
	drawInfo.cy = YPAD+radius;

	drawInfo.svg.append('ellipse')
		.attr('cx', drawInfo.cx)
		.attr('cy', drawInfo.cy)
		.attr('rx', radius)
		.attr('ry', radius)
		.attr('class', 'grayslice interactive');

	var xHandle = xPad+radius+radius*1.15*Math.cos(Math.PI/2-centralAngle);
	var yHandle = YPAD+radius-radius*1.15*Math.sin(Math.PI/2-centralAngle);
	
	drawInfo.svg.append('line')
		.attr('x1', drawInfo.cx)
		.attr('y1', drawInfo.cy)
		.attr('x2', xHandle)
		.attr('y2', yHandle)
		.attr('class', 'handle interactive');

	drawInfo.svg.append('ellipse')
		.attr('cx', xHandle)
		.attr('cy', yHandle)
		.attr('rx', 8)
		.attr('ry', 8)
		.attr('class', 'blueslice interactive');

	var xA = xPad+radius+radius*Math.cos(Math.PI/2-centralAngle);
	var yA = YPAD+radius-radius*Math.sin(Math.PI/2-centralAngle);
	
	drawInfo.svg.append('path')
		.attr('d', 'M '+(xPad+radius)+','+(YPAD+radius)+' '+
		'L '+(xPad+radius)+','+YPAD+' '+
		'A '+radius+','+radius+' 0 '+((centralAngle>Math.PI)?1:0)+' 1 '+
		xA+','+yA+' Z')
		.attr('class', 'blueslice interactive');
}

function ellipseArea(a, b, angle) {
	var area = 0;
	var quarters = 0;
	while (angle > Math.PI/2) {
		area += a * b * Math.PI / 4;
		angle -= Math.PI / 2;
		quarters += 1;
	}

	if ((quarters % 2) == 0) { // starts at a vertical edge
		area += a * b * Math.PI / 4 - .5 * a * b * Math.atan(a * Math.tan(Math.PI/2 - angle) / b);
	} else {
		area += .5 * a * b * Math.atan(a * Math.tan(angle) / b);
	}
	
	return area;
}

function ellipseArc(a, b, t) {
	return Math.sqrt(a*a * Math.sin(t)*Math.sin(t) + b*b * Math.cos(t)*Math.cos(t));
}

/**
 * Angles in radians
 */
function predict(centralAngle, viewAngle, rotation) {
	
	var aspect = Math.sin(viewAngle)
	
	var xA = Math.cos(rotation);
	var yA = Math.sin(rotation)*aspect;

	var xB = Math.cos(rotation+centralAngle);
	var yB = Math.sin(rotation+centralAngle)*aspect;
	
	var rotationProj = Math.atan2(yA, xA)
	var angleDistorted = Math.atan2(yB, xB) - rotationProj;
	
	if (rotationProj < 0) {
		rotationProj += Math.PI*2		
	}

	if (angleDistorted < 0) {
		angleDistorted += Math.PI*2;
	}
	
	function ellipseArcClosure(t) {
		return ellipseArc(aspect, 1, t);
	}
	
	var ellipsePerimeter = 2*numbers.calculus.adaptiveSimpson(ellipseArcClosure, 0, Math.PI, .0001)
	
	var arcLength = numbers.calculus.adaptiveSimpson(ellipseArcClosure, 0, angleDistorted+rotationProj, .0001) - numbers.calculus.adaptiveSimpson(ellipseArcClosure, 0, rotationProj, .0001)
	
	var angleByArc = Math.PI*2*arcLength/ellipsePerimeter;
	
	var totalArea = 1*aspect*Math.PI
	
	var sliceArea = ellipseArea(aspect, 1, angleDistorted+rotationProj) - ellipseArea(aspect, 1, rotationProj);
	
	var angleByArea = Math.PI*2*sliceArea/totalArea;
	
	var predictions = {
		angle: centralAngle,
		angleDistorted: angleDistorted,
		angleByArc: angleByArc,
		angleByArea: angleByArea
	}
	
	return predictions;
}

function updateGuess(that) {

	if (drawInfo.mouseDown === false)
		return;

	var coords = d3.mouse(that);

	var dx = coords[0]-drawInfo.cx;
	var dy = coords[1]-drawInfo.cy;

	var angle = Math.PI/2+Math.atan2(dy, dx);
	if (angle < 0) {
		angle += Math.PI*2;
	}

	drawInfo.guess = Math.min(.995, Math.max(.005, angle/(Math.PI*2)));

	if (inStudy) {
		trials[trialIndex].answer = drawInfo.guess;
	}

	if (inStudy) {
		updatePie();
	} else {
		redraw();
	}
}

function init() {
	var drawInfo = {
		cx: 0,
		cy: 0,
		mouseDown: false,
		guess: .37
	}
	
	drawInfo.svg = makeSVG();
	
	drawInfo.svg.on('mousedown', function() { drawInfo.mouseDown = true; updateGuess(this); });
	drawInfo.svg.on('mouseup', function() { drawInfo.mouseDown = false; });
	drawInfo.svg.on('mousemove', function() { updateGuess(this); });

	d3.select("body").on('keydown', function() {
		if (d3.event.key === " " || d3.event.key === "Enter") {
			nextStep();
		}
	});

	return drawInfo;
}