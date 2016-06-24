
function initGL(domContainer, width, height) {
	var glInfo = {};

	glInfo.scene = new THREE.Scene();
	glInfo.camera = new THREE.PerspectiveCamera(25, width/height, 0.1, 1000);

	glInfo.renderer = new THREE.WebGLRenderer();
	glInfo.renderer.setSize(width, height);
	glInfo.renderer.setClearColor(0xffffff);
	glInfo.renderer.context.disable(glInfo.renderer.context.DEPTH_TEST);

	domContainer.appendChild(glInfo.renderer.domElement);

	var geometry = new THREE.CylinderBufferGeometry(1, 1, .02, 100);
	var material = new THREE.MeshBasicMaterial({color: 0xd3d3d3}); // lightgray
	glInfo.baseDisk = new THREE.Mesh(geometry, material);

	geometry = new THREE.CylinderBufferGeometry(1, 1, .02, 100, 1, false, 0, rad(30));

	glInfo.wedgeMaterial = new THREE.MeshBasicMaterial({color: 0x4682b4}); // steelblue

	glInfo.wedge = new THREE.Mesh(geometry, glInfo.wedgeMaterial);
	glInfo.wedge.rotation.y = rad(220+90);

	glInfo.baseDisk.add(glInfo.wedge);

	glInfo.scene.add(glInfo.baseDisk);

	glInfo.camera.position.z = 5;

	return glInfo;
}

function drawGLPie(glInfo, centralAngle, viewAngle, rotation, radius, body) {
	glInfo.baseDisk.rotation.x = viewAngle;
	glInfo.wedge.rotation.y = rotation+Math.PI/2;

	glInfo.renderer.render(glInfo.scene, glInfo.camera);
}