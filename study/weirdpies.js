
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

function drawPie(drawInfo, angle, rotation, radius, type) {

	drawInfo.svg.selectAll('g').remove();

	var g = drawInfo.svg.append('g')
		.attr('transform', 'translate('+WIDTH/2+','+HEIGHT/2+') rotate('+deg(rotation)+')');

	g.append('circle')
		.attr('cx', 0)
		.attr('cy', 0)
		.attr('r', radius)
		.attr('class', 'grayslice');

	var points = 'M 0,0 L '+radius+',0 ';

	x = Math.cos(angle)*radius;
	y = Math.sin(angle)*radius;

	points += 'A '+radius+','+radius+' 0 '+(angle<Math.PI?0:1)+' 1 '+x+','+y+' Z';

	g.append('path')
		.attr('d', points)
		.attr('class', 'blueslice');

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
