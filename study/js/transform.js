// Functions to generate transformation matrices
// Loosely based on https://github.com/heygrady/transform/wiki/Calculating-2d-Matrices
// but adapted to generate 4x4 matrices and generally remodeled to work in a 3D world

var Transform = {
	rotateX: function(rad) {
		var	cos = Math.cos(rad),
			sin = Math.sin(rad);

		return $M([[1,   0,    0, 0],
				   [0, cos, -sin, 0],
				   [0, sin,  cos, 0],
				   [0,   0,    0, 1]]);
	},

	rotateY: function(rad) {
		var cos = Math.cos(rad),
			sin = Math.sin(rad);

		return $M([[ cos, 0, sin, 0],
				   [   0, 1,   0, 0],
				   [-sin, 0, cos, 0],
				   [   0, 0,   0, 1]]);
	},

	rotateZ: function(rad) {
		var cos = Math.cos(rad),
			sin = Math.sin(rad);

		return $M([[cos, -sin, 0, 0],
				   [sin,  cos, 0, 0],
				   [  0,    0, 1, 0],
				   [  0,    0, 0, 1]]);
	},

	scale: function (s) {
		return $M([
			[s, 0, 0, 0],
			[0,	s, 0, 0],
			[0, 0, s, 0],
			[0,	0, 0, 1]
		]);
	},

	translate: function (tx, ty, tz) {
		return $M([
			[1, 0, 0, tx],
			[0, 1, 0, ty],
			[0, 0, 1, tz],
			[0, 0, 0,  1]
		]);
	},
};