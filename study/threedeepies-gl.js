var squareVerticesBuffer;
var squareVerticesColorBuffer;
var mvMatrix;
var shaderProgram;
var vertexPositionAttribute;
var vertexColorAttribute;
var perspectiveMatrix;

// init code largely based on Mozilla webGL tutorial:
function initGL() {
	var canvas = document.getElementById('glcanvas');

	// Initialize the GL context
	gl = initWebGL(canvas);
	
	// Only continue if WebGL is available and working
	if (gl) {
		// Set clear color to black, fully opaque
		gl.clearColor(1, 1, 1, 1.0);
		// Enable depth testing
		gl.enable(gl.DEPTH_TEST);
		// Near things obscure far things
		gl.depthFunc(gl.LEQUAL);
		// Clear the color as well as the depth buffer.
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}
	
	initShaders(gl);
	
	return gl;
}

function initWebGL(canvas) {
	var gl = null;
	
	try {
		// Try to grab the standard context. If it fails, fallback to experimental.
		gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
	}
	catch(e) {}
	
	// If we don't have a GL context, give up now
	if (!gl) {
		alert('Unable to initialize WebGL. Your browser may not support it.');
		gl = null;
	}
	
	return gl;
}

function initShaders(gl) {
	var fragmentShader = getShader(gl, 'shader-fs');
	var vertexShader = getShader(gl, 'shader-vs');
	
	// Create the shader program
	
	shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	
	// If creating the shader program failed, alert
	
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shader));
	}
	
	gl.useProgram(shaderProgram);
	
	vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
	gl.enableVertexAttribArray(vertexPositionAttribute);
	
	// vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	// gl.enableVertexAttribArray(vertexColorAttribute);
}

function getShader(gl, id) {
	var shaderScript, theSource, currentChild, shader;
	
	shaderScript = document.getElementById(id);
	
	if (!shaderScript) {
		return null;
	}
	
	theSource = '';
	currentChild = shaderScript.firstChild;
	
	while(currentChild) {
		if (currentChild.nodeType == currentChild.TEXT_NODE) {
			theSource += currentChild.textContent;
		}
		
		currentChild = currentChild.nextSibling;
	}
	
	if (shaderScript.type == 'x-shader/x-fragment') {
		shader = gl.createShader(gl.FRAGMENT_SHADER);
	} else if (shaderScript.type == 'x-shader/x-vertex') {
		shader = gl.createShader(gl.VERTEX_SHADER);
	} else {
		 // Unknown shader type
		 return null;
	}

	gl.shaderSource(shader, theSource);
		
	// Compile the shader program
	gl.compileShader(shader);	
		
	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {	
			alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));	
			return null;	
	}
		
	return shader;
}

function makeCircleVertices() {
	var vertices = [0, 0, 0]; // start with the center
	for (var theta = 0; theta < 360; theta += 1) {
		vertices.push(Math.cos(rad(theta)), Math.sin(rad(theta)), 0);
	}
	
	vertices.push(1, 0, 0); // add final point that's the same as the first so circle closes

	return vertices;
}

function initBuffers(gl) {
	var squareVerticesBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

	var vertices = makeCircleVertices();

	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	// var colors = [
	// 	1.0,  1.0,  1.0,  1.0,    // white
	// 	1.0,  0.0,  0.0,  1.0,    // red
	// 	0.0,  1.0,  0.0,  1.0,    // green
	// 	0.0,  0.0,  1.0,  1.0     // blue
	// ];

	// squareVerticesColorBuffer = gl.createBuffer();
	// gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
	// gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
	
	return squareVerticesBuffer;
}

function drawGLScene(gl, squareVerticesBuffer) {
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	perspectiveMatrix = makePerspective(45, 800./600., 0.1, 100.0);

	loadIdentity();
	mvTranslate([-0.0, 0.0, -6.0]);
	mvMatrix = mvMatrix.multiply(Transform.scale(2));

	gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
	gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);
	// gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
	// gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
	setMatrixUniforms();
	gl.drawArrays(gl.TRIANGLE_FAN, 0, 362);
}
