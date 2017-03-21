
var WIDTH = 800;
var HEIGHT = 610;

var arcLengths;

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
	var g = drawInfo.baseG.append('g')
		.attr('transform', 'translate('+WIDTH/2+','+HEIGHT/2+') rotate('+deg(-rotation)+')');

	g.append('circle')
		.attr('cx', 0)
		.attr('cy', 0)
		.attr('r', radius)
		.attr('class', circleClass?circleClass:'grayslice');

	return g;
}

function drawStandardPie(drawInfo, values, rotation, radius) {

	drawInfo.baseG.selectAll('g').remove();

	var angle = Math.PI/50*values[0];

	var g = drawBasePie(drawInfo, 0, radius);

	for (var i = values.length-1; i >= 0; i -= 1) {

		angle = Math.PI/50*values[i];

		x = Math.cos(angle)*radius;
		y = -Math.sin(angle)*radius;

		var points = 'M 0,0 L '+x+','+y+' ';

		points += 'A '+radius+','+radius+' 0 '+(angle<Math.PI?0:1)+',1 '+radius+',0 Z';

		g.append('g')
			.attr('transform', 'rotate('+deg(-rotation)+')')
			.append('path')
				.attr('d', points)
				.attr('class', 'slice-'+i);
		
		rotation += angle;
	}

	return angle;
}

// from http://mathworld.wolfram.com/Circle-CircleIntersection.html, R=r case
function circularLensAreaSameRadius(radius, distance) {
	return 2*radius*radius*Math.acos(distance/(2*radius))-distance/2*Math.sqrt(4*radius*radius-distance*distance);
}

function drawCircularSegmentPie(drawInfo, values, rotation, radius) {

	var circleArea = radius*radius*Math.PI;

	var makeOptFunc = function(fraction) {
		return function(distance) {
			return circularLensAreaSameRadius(radius, distance)/circleArea - fraction;
		}
	}

	drawInfo.baseG.selectAll('g').remove();

	var g = drawBasePie(drawInfo, rotation, radius);

	var percentSum = 0;
	var segments = [];
	for (var i = 0; i < values.length; i += 1) {
		var cumulativePercent = percentSum+values[i];

		var optFunc = makeOptFunc(cumulativePercent/100);
		
		var distance = binaryZeroSearch(optFunc, 0, radius*2, optFunc(0), optFunc(radius*2));

		var x = distance/2;

		var y = Math.sqrt(radius*radius-x*x);

		// theta is half the angle, since it's symmetrical around the x axis
		var theta = Math.atan2(y, x);

		var path = 'M '+x+','+y+' A '+radius+','+radius+' 0,0 0 '+x+','+(-y)+' ';

		path += 'A '+radius+','+radius+' 0,0 0 '+x+','+y+' Z';

		segments.push(path);

		percentSum += values[i];
	}

	for (var i = values.length-1; i >= 0; i -= 1) {
		var d = segments.pop();

		g.append('path')
			.attr('d', d)
			.attr('class', 'slice-'+i);
	}

	return {};
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

	drawInfo.baseG.selectAll('g').remove();

	var g = drawBasePie(drawInfo, greaterThan50?(Math.PI+rotation):rotation, radius, greaterThan50?'blueslice':'grayslice');

	var areaFraction = 0;

	if (percentage == 50) {
		drawStandardPie(drawInfo, percentage, rotation, radius);
		arcLengths.push({
			percent: percentage,
			variation: 'circular-center',
			arcPercentage: .5
		});
	} else if (percentage <= 25) {
		var smallRadius = Math.sqrt(radius*radius*percentage/100);

		g.append('circle')
			.attr('cx', smallRadius)
			.attr('cy', 0)
			.attr('r', smallRadius)
			.attr('class', greaterThan50?'grayslice':'blueslice');

		areaFraction = smallRadius*smallRadius/(radius*radius);

		arcLengths.push({
			percent: greaterThan50?(100-percentage):percentage,
			variation: 'circular-center',
			arcPercentage: greaterThan50?1:0
		});
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

		var theta = Math.atan2(y, x);
		arcLengths.push({
			percent: greaterThan50?(100-percentage):percentage,
			variation: 'circular-center',
			arcPercentage: greaterThan50?(1-theta/Math.PI):theta/Math.PI
		});

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

	drawInfo.baseG.selectAll('g').remove();

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

	drawInfo.baseG.selectAll('g').remove();

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

	drawInfo.baseG.selectAll('g').remove();

	var g = drawBasePie(drawInfo, rotation, largeRadius);

	var x = largeRadius*Math.cos(angle/2);
	var y = largeRadius*Math.sin(angle/2);

	var theta = Math.atan2(y, x);
	arcLengths.push({
		percent: percentage,
		variation: 'off-center',
		arcPercentage: theta/Math.PI
	});

	var d = 'M '+smallRadius+',0 L '+x+','+y+
			' A '+largeRadius+','+largeRadius+' 0,'+(angle<Math.PI?'0':'1')+' 0 '+x+','+(-y)+
			' L '+smallRadius+',0 Z';

	g.append('path')
		.attr('d', d)
		.attr('class', 'blueslice');

	return offCenterSliceArea(largeRadius, smallRadius, angle)/circleArea;

}

// formula from http://mathworld.wolfram.com/CircularSegment.html
function circleSegmentArea(radius, theta) {
	return radius*radius*(theta-Math.sin(theta))/2;
}

function drawStraightLinePie(drawInfo, values, rotation, radius) {
	var circleArea = radius*radius*Math.PI;

	var makeOptFunc = function(fraction) {
		if (fraction <= .5) {
			return function(angle) {
				return circleSegmentArea(radius, angle)/circleArea - fraction;
			}
		} else {
			return function(angle) {
				return (1 - circleSegmentArea(radius, angle)/circleArea) - fraction;
			}
		}
	}

	drawInfo.baseG.selectAll('g').remove();

	var g = drawBasePie(drawInfo, rotation, radius);

	var percentSum = 0;
	var segments = [];
	for (var i = 0; i < values.length; i += 1) {
		var cumulativePercent = percentSum+values[i];

		var optFunc = makeOptFunc(cumulativePercent/100);
		
		var angle = binaryZeroSearch(optFunc, 0, Math.PI, optFunc(0), optFunc(Math.PI), .01);

		if (cumulativePercent > 50) {
			angle = Math.PI*2-angle;
		}

		var x = radius*Math.cos(angle/2);
		var y = radius*Math.sin(angle/2);

		segments.push('M '+x+','+y+' A '+radius+','+radius+' 0,'+(angle<Math.PI?'0':'1')+' 0 '+x+','+(-y)+' Z');

		percentSum += values[i];
	}

	for (var i = values.length-1; i >= 0; i -= 1) {
		var d = segments.pop();

		g.append('path')
			.attr('d', d)
			.attr('class', 'slice-'+i);
	}
}

function drawTreeMap(drawInfo, values, rotation, radius) {
	var tree = {'children': values.map(function(v) { return {'size': v}; })};

	var root = d3.hierarchy(tree);
	root.sum(function(n) {return n.size; });

	var size = Math.sqrt(radius*radius*Math.PI);

	var treemap = d3.treemap()
		.tile(d3.treemapSquarify)
		.size([size, size])
		.round(true);

	treemap(root);

	drawInfo.baseG.selectAll('g').remove();

	var vertical = Math.floor(rotation/(Math.PI/2)) % 2 == 1;

	drawInfo.baseG.append('g')
		.attr('transform', 'translate('+(WIDTH-size)/2+','+(HEIGHT-size)/2+')')
		.selectAll('rect')
		.data(root.leaves())
		.enter().append('rect')
		.attr('x', function(d) { return vertical?d.y0:d.x0; })
		.attr('y', function(d) { return vertical?d.x0:d.y0; })
		.attr('width', function(d) { return vertical?(d.y1 - d.y0):(d.x1 - d.x0); })
		.attr('height', function(d) { return vertical?(d.x1 - d.x0):(d.y1 - d.y0); })
		.attr('class', function(d, i) { return 'slice-'+i; });
}


function drawStackedBars(drawInfo, values, rotation, length) {
	drawInfo.baseG.selectAll('g').remove();

	var g = drawInfo.baseG.append('g');
	
	var height = length/10;
	var y = (length-height)/2;
	var x = (WIDTH-length)/2;

	var vertical = Math.floor(rotation/(Math.PI/2)) % 2 == 1;

	if (vertical) {
		x = (HEIGHT-length)/2;
		y = (WIDTH-height)/2;
		g.attr('transform', 'translate(0, '+HEIGHT+') scale(1, -1)');
	}

	for (var i = 0; i < values.length; i += 1) {
		var width = values[i]/100*length;

		g.append('rect')
			.attr('x', vertical?y:x)
			.attr('y', vertical?x:y)
			.attr('width', vertical?height:width)
			.attr('height', vertical?width:height)
			.attr('class', 'slice-'+i);

		x += width;
	}
}

function drawWeirdPie(drawInfo, radius, rotation, values, chartType) {

	// console.log(values);
	// console.log(values.reduce(function(s, a) { return s+a; }));

	switch(chartType) {
		case 'baseline':
			var centralAngle = drawStandardPie(drawInfo, values, rad(rotation), radius);
			$('#angle').text(deg(centralAngle).toFixed(0));
		break;

		case 'circular':
			var params = drawCircularSegmentPie(drawInfo, values, rad(rotation), radius);
		break;

		case 'circular-straight':
			drawStraightLinePie(drawInfo, values, rad(rotation), radius);
		break;

		case 'treemap':
			drawTreeMap(drawInfo, values, rad(rotation), radius);
		break;

		case 'stacked-bars':
			drawStackedBars(drawInfo, values, rad(rotation), radius*2);
		break;

		case 'circular-center':
			var areaFraction = drawCenteredCircularSegmentPie(drawInfo, values[0], rad(rotation), radius);
			$('#areaFraction').text((areaFraction*100).toFixed(0));
		break;

		case 'off-center':
			var areaFraction = drawOffCenterPie(drawInfo, values[0], rad(rotation), radius, radius/3);
			$('#areaFraction').text((areaFraction*100).toFixed(0));
		break;

		case 'centered-circle':
			var areaFraction = drawSmallCirclePie(drawInfo, values[0], rad(rotation), radius, true);
			$('#areaFraction').text((areaFraction*100).toFixed(0));
		break;

		case 'centered-square':
			var areaFraction = drawCenteredSquarePie(drawInfo, values[0], rad(rotation), radius);
			$('#areaFraction').text((areaFraction*100).toFixed(0));
		break;

		case 'floating-circle':
			var areaFraction = drawSmallCirclePie(drawInfo, values[0], rad(rotation), radius, false);
			$('#areaFraction').text((areaFraction*100).toFixed(0));
		break;
	}
}

function drawGrid(drawInfo, rotation) {

	var padding = 7;

	var size = (HEIGHT-(VARIATIONS.length-1)*padding)/VARIATIONS.length;

	var VALUES = [3, 10, 33, 50, 66, 90, 97];

	var baseG = drawInfo.baseG;

	baseG.selectAll('g').remove();

	for (var i = 0; i < VARIATIONS.length; i++) {

		for (var j = 0; j < VALUES.length; j++) {

			var g = baseG.append('g')
				.attr('transform', 'translate ('+(j*(size+padding)-WIDTH/2+size/2)+','+(i*(size+padding)-HEIGHT/2+size/2)+')');
			
			drawInfo.baseG = g;

			drawWeirdPie(drawInfo, size/2, rotation, [VALUES[j]], VARIATIONS[i]);
		}
	}

	drawInfo.baseG = baseG;
}

function init() {
	var svg = d3.select('#pie').select('svg');
	
	var baseG = svg.append('g')
		.attr('class', 'base');

	arcLengths = d3.range(100).map(function(percent) {
		return {
			percent: percent,
			variation: 'baseline',
			arcPercentage: percent/100
		};
	});

	return {svg: svg, baseG: baseG};
}

function calculateArcLengths() {
	d3.range(100).forEach(function(p) {
		drawCircularSegmentPie(drawInfo, p, 0, HEIGHT/2-5, false);
		drawCenteredCircularSegmentPie(drawInfo, p, 0, HEIGHT/2-5);
		drawOffCenterPie(drawInfo, p, 0, HEIGHT/2-5, (HEIGHT/2-5)/3);
	});

	var csvString = d3.csv.format(arcLengths, ['percentage', 'variation', 'arcPercentage']);
	console.log(csvString);
}
