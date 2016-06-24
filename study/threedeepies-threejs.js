
function makeDisk(radius, body, color, thetaLength) {
	var geometry = new THREE.CylinderBufferGeometry(radius, radius, body, 100, 1, false, 0, thetaLength);
	var material = new THREE.MeshBasicMaterial({color: color});
	return new THREE.Mesh(geometry, material);
}

function initGL(domContainer, width, height) {
	var glInfo = {};

	glInfo.scene = new THREE.Scene();
	glInfo.camera = new THREE.OrthographicCamera(-width/2, width/2, height/2, -height/2, 10, 2000)
//	glInfo.camera = new THREE.PerspectiveCamera(30, width/height, 1, 4000);
	glInfo.camera.position.z = 2*width;

	glInfo.renderer = new THREE.WebGLRenderer({antialias: true});
	glInfo.renderer.setSize(width, height);
	glInfo.renderer.setClearColor(0xffffff);
	glInfo.renderer.context.disable(glInfo.renderer.context.DEPTH_TEST);

	domContainer.appendChild(glInfo.renderer.domElement);

	glInfo.baseDisk = makeDisk(height/2, 10, 0xd3d3d3, Math.PI*2);

	glInfo.wedge = makeDisk(height/2, 10, 0x4682b4, rad(30));
	glInfo.wedge.rotation.y = rad(220+90);

	glInfo.baseDisk.add(glInfo.wedge);

	glInfo.scene.add(glInfo.baseDisk);

	glInfo.radius = height/2;
	glInfo.centralAngle = rad(30);
	glInfo.body = 10;

	return glInfo;
}

function drawGLPie(glInfo, centralAngle, viewAngle, rotation, radius, body) {
	if (centralAngle != glInfo.centralAngle || body != glInfo.body) {
		glInfo.baseDisk.remove(glInfo.wedge);

		if (body != glInfo.body) {
			glInfo.scene.remove(glInfo.baseDisk);
			glInfo.baseDisk = makeDisk(glInfo.radius, body, 0xd3d3d3, Math.PI*2);
			glInfo.scene.add(glInfo.baseDisk);
		}
		
		glInfo.wedge = makeDisk(glInfo.radius, body, 0x4682b4, centralAngle);
		glInfo.baseDisk.add(glInfo.wedge);
	}

	glInfo.baseDisk.rotation.x = viewAngle;
	glInfo.wedge.rotation.y = rotation+Math.PI/2;

	glInfo.renderer.render(glInfo.scene, glInfo.camera);
}