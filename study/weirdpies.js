
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

	// drawInfo.svg.selectAll('path').remove();
	// drawInfo.svg.selectAll('line').remove();

	var g = drawBasePie(drawInfo, rotation, radius);

	g.append('path')
		.attr('d', path)
		.attr('class', 'blueslice');

	// var data = d3.range(0, radius*2).map(optFunc);

	// var xScale = d3.scale.linear()
	// 	.domain([0, data.length])
	// 	.range([0, WIDTH]);

	// var yScale = d3.scale.linear()
	// 	.domain(d3.extent(data))
	// 	.range([HEIGHT, 0]);

	// var line = d3.svg.line()
	// 	.x(function(d, i) { return xScale(i); })
	// 	.y(function(d) { return yScale(d); } );
	
	// drawInfo.svg.append('path')
	// 	.datum(data)
	// 	.attr('d', line)
	// 	.attr('class', 'blueline');

	// drawInfo.svg.append('line')
	// 	.attr('x1', 0)
	// 	.attr('y1', yScale(0))
	// 	.attr('x2', WIDTH)
	// 	.attr('y2', yScale(0))
	// 	.attr('class', 'blueline');

	// drawInfo.svg.append('line')
	// 	.attr('x1', xScale(distance))
	// 	.attr('y1', 0)
	// 	.attr('x2', xScale(distance))
	// 	.attr('y2', HEIGHT)
	// 	.attr('class', 'blueline');

	return {areaFraction: areaFraction, distance: distance};
}

// from http://mathworld.wolfram.com/Circle-CircleIntersection.html, with r=d, distance = radius2
function circularLensAreaRadiusEqualsDistance(radius1, radius2) {
	return radius2*radius2*Math.acos((2*radius2*radius2-radius1*radius1)/(2*radius2*radius2)) + 
			radius1*radius1*Math.acos(radius1/(2*radius2)) -
			Math.sqrt(radius1*(radius2+radius2-radius1)*radius1*(radius2+radius2+radius1))/2;
}

function binaryZeroSearch(func, min, max, minVal, maxVal) {
	var mid = (min+max)/2;

	if (max-min < 1) {
		return mid;
	} else {
		var midVal = func(mid);
		if (Math.sign(minVal) != Math.sign(midVal)) {
			return binaryZeroSearch(func, min, mid, minVal, midVal);
		} else {
			return binaryZeroSearch(func, mid, max, midVal, maxVal);
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

	if (percentage <= 25) {
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

function makeSVG() {

	var svg = d3.select('#pie').select('svg');

	return svg;		
}

function init() {
	var drawInfo = {}
	
	drawInfo.svg = makeSVG();
	
	return drawInfo;
}
