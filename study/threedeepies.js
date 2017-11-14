/* global numbers */

// SVG width = XPAD + RADIUS*2 + XSEP + RADIUS*2 (+ XPAD)
// SVG height = YPAD + RADIUS*2 (+YPAD)
var RADIUS = 200;

var XPAD = 0;
var YPAD = 5;
var XSEP = 20;

function makeSVG() {

	var svg = d3.select('#pie').select('svg');

	return svg;		
}

function drawBody(rotation, centralAngle, body, xRadius, yRadius, xA, yA, xB, yB, depthCue) {
	var leftX = (rotation > Math.PI)?xA:(XPAD);
	var leftY = (rotation > Math.PI)?yA:(YPAD+RADIUS);
	
	var rightX = (rotation+centralAngle < 2*Math.PI)?xB:(XPAD+2*RADIUS);
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
function draw3DPie(drawInfo, centralAngle, viewAngle, rotation, radius, body, depthCue) {

	var xRadius = radius;
	var yRadius = radius*Math.sin(viewAngle);

	var xA = XPAD+radius+xRadius*Math.cos(rotation);
	var yA = YPAD+radius-yRadius*Math.sin(rotation);

	var xB = XPAD+radius+radius*Math.cos(rotation+centralAngle);
	var yB = YPAD+radius-yRadius*Math.sin(rotation+centralAngle);

	drawInfo.svg.selectAll('ellipse').remove();
	drawInfo.svg.selectAll('path').remove();

	if (body > 0) {

		body *= 1-Math.sin(viewAngle);

		var path = drawInfo.svg.append('path')
			.attr('d', 'M '+(XPAD)+','+(YPAD+radius)+' '+
			'L '+(XPAD)+','+(YPAD+radius+body)+
			'A '+xRadius+','+yRadius+' 0 0 0 '+(XPAD+2*radius)+','+(YPAD+radius+body)+' '+
			'L '+(XPAD+2*radius)+','+(YPAD+radius)+' Z');
			
		if (depthCue == 0) {
			path.attr('class', 'body');
		} else {
			path.style('fill', 'url(#grayGradient)');
		}
		
		if (rotation+centralAngle > Math.PI) {
			drawBody(rotation, centralAngle, body, xRadius, yRadius, xA, yA, xB, yB, depthCue);
			
			if (rotation+centralAngle > 3*Math.PI) {
				drawBody(Math.PI, rotation+centralAngle-3*Math.PI, body, xRadius, yRadius, xA, yA, xB, yB, depthCue);
			}
		}
	}
	
	drawInfo.svg.append('ellipse')
		.attr('cx', XPAD+radius)
		.attr('cy', YPAD+radius)
		.attr('rx', xRadius)
		.attr('ry', yRadius)
		.attr('class', 'grayslice');

	if (depthCue == 1) {
		drawInfo.svg.append('ellipse')
			.attr('cx', XPAD+radius)
			.attr('cy', YPAD+radius)
			.attr('rx', xRadius)
			.attr('ry', yRadius)
			.attr('class', 'graypattern');
	}

	drawInfo.svg.append('path')
		.attr('d', 'M '+(XPAD+radius)+','+(YPAD+radius)+' '+
		'L '+xB+','+yB+' '+
		'A '+xRadius+','+yRadius+' 0 '+((centralAngle>Math.PI)?1:0)+' 1 '+
		xA+','+yA+' Z')
		.attr('class', 'blueslice');

	if (depthCue == 1) {
		drawInfo.svg.append('path')
			.attr('d', 'M '+(XPAD+radius)+','+(YPAD+radius)+' '+
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
			.attr('transform', 'translate('+(XPAD+radius)+' '+(YPAD+radius)+') scale(1 '+Math.sin(viewAngle)+')');

		surfaceEllipse
			.innerRadius(xRadius*.6)
			.outerRadius(xRadius*.8);
		
		drawInfo.svg.append('path')
			.attr('d', surfaceEllipse())
			.attr('class', 'surfaceEllipse')
			.attr('transform', 'translate('+(XPAD+radius)+' '+(YPAD+radius)+') scale(1 '+Math.sin(viewAngle)+')');
	}
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

function init() {
	var drawInfo = {}
	
	drawInfo.svg = makeSVG();
	
	return drawInfo;
}