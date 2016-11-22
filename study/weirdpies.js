
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

function drawBasePie(drawInfo, rotation, radius) {
	var g = drawInfo.svg.append('g')
		.attr('transform', 'translate('+WIDTH/2+','+HEIGHT/2+') rotate('+deg(-rotation)+')');

	g.append('circle')
		.attr('cx', 0)
		.attr('cy', 0)
		.attr('r', radius)
		.attr('class', 'grayslice');

	return g;
}

function drawStandardPie(drawInfo, percentage, rotation, radius) {

	drawInfo.svg.selectAll('g').remove();

	var g = drawBasePie(drawInfo, rotation, radius);

	var angle = Math.PI/50*percentage;

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

	drawInfo.svg.selectAll('g').remove();

	var g = drawBasePie(drawInfo, rotation, radius);

	var distance = (100-percentage)/100*radius*2; // just for now

	var areaFraction = circularLensAreaSameRadius(radius, distance) / (radius*radius*Math.PI);

	var x = distance/2;

	var y = Math.sqrt(radius*radius-x*x);

	var path = 'M '+x+','+y+' A '+radius+','+radius+' 0,0 0 '+x+','+(-y)+' ';

	path += 'A '+radius+','+radius+' 0,0 0 '+x+','+y+' Z';

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

function drawCenteredCircularSegmentPie(drawInfo, percentage, rotation, radius) {
	drawInfo.svg.selectAll('g').remove();

	var g = drawBasePie(drawInfo, rotation, radius);

	var areaFraction = 0;

	if (percentage <= 25) {
		var smallRadius = Math.sqrt(radius*radius*percentage/100);

		g.append('circle')
			.attr('cx', smallRadius)
			.attr('cy', 0)
			.attr('r', smallRadius)
			.attr('class', 'blueslice');

		areaFraction = smallRadius*smallRadius/(radius*radius);
	} else {
		
	}

	return areaFraction;
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
