
var WIDTH = 800;
var HEIGHT = 610;

function lineRectIntersect(angle, radius, width, height) {
	var x = width/2+Math.cos(angle)*radius;

	x = Math.min(x, width);
	x = Math.max(x, 0);

	var y = height/2+Math.sin(angle)*radius;
	y = Math.min(y, height);
	y = Math.max(y, 0);

	return {x: x, y: y};
}

function drawBasePie(drawInfo, rotation, radius, circleClass) {
	var g = drawInfo.svg.append('g')
		.attr('transform', 'translate('+WIDTH/2+','+HEIGHT/2+') rotate('+deg(-rotation)+')');

	g.append('circle')
		.attr('cx', 0)
		.attr('cy', 0)
		.attr('r', radius)
		.attr('class', circleClass?circleClass:'grayslice');

	return g;
}

function drawStandardPie(drawInfo, percentage, rotation, radius) {

	drawInfo.svg.selectAll('g').remove();

	var angle = Math.PI/50*percentage;

	var g = drawBasePie(drawInfo, rotation-angle/2, radius);

	x = Math.cos(angle)*radius;
	y = -Math.sin(angle)*radius;

	var points = 'M 0,0 L '+x+','+y+' ';

	points += 'A '+radius+','+radius+' 0 '+(angle<Math.PI?0:1)+',1 '+radius+',0 Z';

	g.append('path')
		.attr('d', points)
		.attr('class', 'blueslice');

	return angle;
}

// from http://mathworld.wolfram.com/Circle-CircleIntersection.html, R=r case
function circularLensAreaSameRadius(radius, distance) {
	return 2*radius*radius*Math.acos(distance/(2*radius))-distance/2*Math.sqrt(4*radius*radius-distance*distance);
}

function drawCircularSegmentPie(drawInfo, percentage, rotation, radius) {

	var circleArea = radius*radius*Math.PI;

	var optFunc = function(distance) {
		return circularLensAreaSameRadius(radius, distance)/circleArea - percentage/100;
	}

	var distance = binaryZeroSearch(optFunc, 0, radius*2, optFunc(0), optFunc(radius*2));

	var areaFraction = circularLensAreaSameRadius(radius, distance) / circleArea;

	var x = distance/2;

	var y = Math.sqrt(radius*radius-x*x);

	var path = 'M '+x+','+y+' A '+radius+','+radius+' 0,0 0 '+x+','+(-y)+' ';

	path += 'A '+radius+','+radius+' 0,0 0 '+x+','+y+' Z';

	drawInfo.svg.selectAll('g').remove();

	var g = drawBasePie(drawInfo, rotation, radius);

	g.append('path')
		.attr('d', path)
		.attr('class', 'blueslice');

	return {areaFraction: areaFraction, distance: distance};
}

// from http://mathworld.wolfram.com/Circle-CircleIntersection.html, with r=d, distance = radius2
function circularLensAreaRadiusEqualsDistance(radius1, radius2) {
	return radius2*radius2*Math.acos((2*radius2*radius2-radius1*radius1)/(2*radius2*radius2)) + 
			radius1*radius1*Math.acos(radius1/(2*radius2)) -
			Math.sqrt(radius1*(radius2+radius2-radius1)*radius1*(radius2+radius2+radius1))/2;
}

function binaryZeroSearch(func, min, max, minVal, maxVal, epsilon) {

	epsilon = epsilon || 1;

	var mid = (min+max)/2;

	if (max-min < epsilon) {
		return mid;
	} else {
		var midVal = func(mid);
		if (Math.sign(minVal) != Math.sign(midVal)) {
			return binaryZeroSearch(func, min, mid, minVal, midVal, epsilon);
		} else {
			return binaryZeroSearch(func, mid, max, midVal, maxVal, epsilon);
		}
	}
}

function drawCenteredCircularSegmentPie(drawInfo, percentage, rotation, radius) {

	var greaterThan50 = percentage > 50;

	if (greaterThan50)
		percentage = 100-percentage;

	drawInfo.svg.selectAll('g').remove();

	var g = drawBasePie(drawInfo, greaterThan50?(Math.PI+rotation):rotation, radius, greaterThan50?'blueslice':'grayslice');

	var areaFraction = 0;

	if (percentage == 50) {
		drawStandardPie(drawInfo, percentage, rotation, radius);
	} else if (percentage <= 25) {
		var smallRadius = Math.sqrt(radius*radius*percentage/100);

		g.append('circle')
			.attr('cx', smallRadius)
			.attr('cy', 0)
			.attr('r', smallRadius)
			.attr('class', greaterThan50?'grayslice':'blueslice');

		areaFraction = smallRadius*smallRadius/(radius*radius);
	} else {
		var circleArea = radius*radius*Math.PI;
		var optFunc = function(distance) {
			return circularLensAreaRadiusEqualsDistance(radius, distance)/circleArea - percentage/100;
		}

		var distance = binaryZeroSearch(optFunc, radius/2, radius*20, optFunc(radius/2), optFunc(radius*10));

		areaFraction = circularLensAreaRadiusEqualsDistance(radius, distance)/circleArea;

		// x = (d^2-r^2+R^2)/2d, but d=r
		var x = radius*radius/(distance+distance);

		var y = Math.sqrt(radius*radius-x*x);

		var path = 'M '+x+','+y+
					' A '+radius+','+radius+' 0 0,0 '+x+','+(-y)+
				 	' A '+distance+','+distance+' 0 '+(distance<x?'1':'0')+',0 '+x+','+y+
					' Z';

		g.append('path')
			.attr('d', path)
			.attr('class', greaterThan50?'grayslice':'blueslice');


	}

	return areaFraction;
}

function drawSmallCirclePie(drawInfo, percentage, rotation, radius, centered) {

	drawInfo.svg.selectAll('g').remove();

	var g = drawBasePie(drawInfo, rotation, radius);

	var smallRadius = radius*Math.sqrt(percentage/100);

	var x = 0;

	if (centered == false) {
		x = radius-smallRadius;
	}

	g.append('circle')
		.attr('cx', x)
		.attr('cy', 0)
		.attr('r', smallRadius)
		.attr('class', 'blueslice');

	return smallRadius*smallRadius/(radius*radius);
}

// Formula from http://math.stackexchange.com/questions/1450961/overlapping-area-between-a-circle-and-a-square
function circleSquareIntersectionArea(radius, side) {
	var theta = Math.acos(side/radius);

	return (Math.PI-4*theta)*radius*radius + 4*side*radius*Math.sin(theta);
}

function drawCenteredSquarePie(drawInfo, percentage, rotation, radius) {

	drawInfo.svg.selectAll('g').remove();

	var g = drawBasePie(drawInfo, rotation, radius);

	var circleArea = radius*radius*Math.PI;

	var squareArea = circleArea*percentage/100;

	var size = Math.sqrt(squareArea);

	if (radius*radius >= size*size/2) { // square fits into circle
		g.append('rect')
			.attr('x', -size/2)
			.attr('y', -size/2)
			.attr('width', size)
			.attr('height', size)
			.attr('class', 'blueslice');
		
		return squareArea/circleArea;

	} else {

		var optFunc = function(side) {
			return circleSquareIntersectionArea(radius, side)/circleArea - percentage/100;
		}

		var size = binaryZeroSearch(optFunc, radius/2, radius*2, optFunc(radius/2), optFunc(radius*2));

		var x = size;
		var y = Math.sqrt(radius*radius-size*size);

		var d = 'M '+x+','+y+' A '+radius+','+radius+' 0,0 1 '+y+','+x+' L '+(-y)+','+x+
				' A '+radius+','+radius+' 0,0 1 '+(-x)+','+y+' L '+(-x)+','+(-y)+
				' A '+radius+','+radius+' 0,0 1 '+(-y)+','+(-x)+' L '+y+','+(-x)+
				' A '+radius+','+radius+' 0,0 1 '+x+','+(-y)+
				' Z';

		g.append('path')
			.attr('d', d)
			.attr('class', 'blueslice');

		return circleSquareIntersectionArea(radius, size)/circleArea;
	}
}

function offCenterSliceArea(largeRadius, smallRadius, angle) {
	var x = largeRadius*Math.cos(angle);
	var y = largeRadius*Math.sin(angle);
	var xP = smallRadius*Math.cos(angle/2);
	var yP = smallRadius*Math.sin(angle/2);

	var a = Math.sqrt((largeRadius-xP) * (largeRadius-xP)+yP*yP);
	var b = Math.sqrt((largeRadius-x) * (largeRadius-x)+y*y);
	var h = Math.sqrt(a*a - (b/2)*(b/2));

	var areaSmallTriangle = b * h / 2;

	var areaWedge = largeRadius*largeRadius*Math.PI*angle/(2*Math.PI);

	var areaLargeTriangle = (smallRadius+h) * b / 2;

	return areaWedge-areaLargeTriangle+areaSmallTriangle;
}

function drawOffCenterPie(drawInfo, percentage, rotation, largeRadius, smallRadius) {

	var circleArea = largeRadius*largeRadius*Math.PI;

	var optFunc = function(angle) {
		return offCenterSliceArea(largeRadius, smallRadius, angle)/circleArea - percentage/100;
	}

	var angle = binaryZeroSearch(optFunc, 0, 2*Math.PI, optFunc(0), optFunc(2*Math.PI), .01);

	drawInfo.svg.selectAll('g').remove();

	var g = drawBasePie(drawInfo, rotation, largeRadius);

	var x = largeRadius*Math.cos(angle/2);
	var y = largeRadius*Math.sin(angle/2);

	var d = 'M '+smallRadius+',0 L '+x+','+y+
			' A '+largeRadius+','+largeRadius+' 0,'+(angle<Math.PI?'0':'1')+' 0 '+x+','+(-y)+
			' L '+smallRadius+',0 Z';

	g.append('path')
		.attr('d', d)
		.attr('class', 'blueslice');

	return offCenterSliceArea(largeRadius, smallRadius, angle)/circleArea;

}

function drawWeirdPie(drawInfo, radius, rotation, percentage, chartType) {
	switch(chartType) {
		case 'baseline':
			var centralAngle = drawStandardPie(drawInfo, percentage, rad(rotation), radius);
			$('#angle').text(deg(centralAngle).toFixed(0));
		break;

		case 'circular':
			var params = drawCircularSegmentPie(drawInfo, percentage, rad(rotation), radius);

			$('#areaFraction').text((params.areaFraction*100).toFixed(0));
			$('#distance').text(params.distance.toFixed(0));
		break;

		case 'circular-center':
			var areaFraction = drawCenteredCircularSegmentPie(drawInfo, percentage, rad(rotation), radius);
			$('#areaFraction').text((areaFraction*100).toFixed(0));
		break;

		case 'off-center':
			var areaFraction = drawOffCenterPie(drawInfo, percentage, rad(rotation), radius, radius/3);
			$('#areaFraction').text((areaFraction*100).toFixed(0));
		break;

		case 'centered-circle':
			var areaFraction = drawSmallCirclePie(drawInfo, percentage, rad(rotation), radius, true);
			$('#areaFraction').text((areaFraction*100).toFixed(0));
		break;

		case 'centered-square':
			var areaFraction = drawCenteredSquarePie(drawInfo, percentage, rad(rotation), radius);
			$('#areaFraction').text((areaFraction*100).toFixed(0));
		break;

		case 'floating-circle':
			var areaFraction = drawSmallCirclePie(drawInfo, percentage, rad(rotation), radius, false);
			$('#areaFraction').text((areaFraction*100).toFixed(0));
		break;
	}
}

function makeSVG() {

	var svg = d3.select('#pie').select('svg');

	return svg;		
}

function init() {
	var drawInfo = {}
	
	drawInfo.svg = makeSVG();
	
	return drawInfo;
}
