/* global numbers */

var WIDTH = 800;
var HEIGHT = 600;

function makeSVG() {
	var svg = d3.select('#pie').append('svg')
		.attr('width', WIDTH)
		.attr('height', HEIGHT);

	return svg;		
}


/**
 * All angles in radians
 */
function draw3DPie(drawInfo, centralAngle, viewAngle, rotation, radius, body) {

	var xRadius = radius;
	var yRadius = radius*Math.sin(viewAngle);

	var xA = WIDTH/2+xRadius*Math.cos(rotation);
	var yA = HEIGHT/2-yRadius*Math.sin(rotation);

	var xB = WIDTH/2+radius*Math.cos(rotation+centralAngle);
	var yB = HEIGHT/2-yRadius*Math.sin(rotation+centralAngle);

	drawInfo.svg.selectAll('ellipse').remove();
	drawInfo.svg.selectAll('path').remove();

	if (body > 0) {

		body *= 1-Math.sin(viewAngle);

		drawInfo.svg.append('path')
			.attr('d', 'M '+(WIDTH/2-xRadius)+','+(HEIGHT/2)+' '+
			'L '+(WIDTH/2-xRadius)+','+(HEIGHT/2+body)+
			'A '+xRadius+','+yRadius+' 0 0 0 '+(WIDTH/2+xRadius)+','+(HEIGHT/2+body)+' '+
			'L '+(WIDTH/2+xRadius)+','+(HEIGHT/2)+' Z')
			.attr('class', 'body');

		if (rotation+centralAngle > Math.PI) {
			var leftX = (rotation > Math.PI)?xA:(WIDTH/2-xRadius);
			var leftY = (rotation > Math.PI)?yA:(HEIGHT/2);
			
			var rightX = (rotation+centralAngle < 2*Math.PI)?xB:(WIDTH/2+xRadius);
			var rightY = (rotation+centralAngle < 2*Math.PI)?yB:(HEIGHT/2);
			
			drawInfo.svg.append('path')
				.attr('d', 'M '+leftX+','+leftY+' '+
				'L '+leftX+','+(leftY+body)+
				'A '+xRadius+','+yRadius+' 0 0 0 '+rightX+','+(rightY+body)+' '+
				'L '+rightX+','+rightY+' Z')
				.attr('class', 'bluebody');
		}
	}
	
	drawInfo.svg.append('ellipse')
		.attr('cx', WIDTH/2)
		.attr('cy', HEIGHT/2)
		.attr('rx', xRadius)
		.attr('ry', yRadius)
		.attr('class', 'grayslice');

	drawInfo.svg.append('path')
		.attr('d', 'M '+(WIDTH/2)+','+(HEIGHT/2)+' '+
		'L '+xB+','+yB+' '+
		'A '+xRadius+','+yRadius+' 0 '+((centralAngle>Math.PI)?1:0)+' 1 '+
		xA+','+yA+' Z')
		.attr('class', 'blueslice');
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