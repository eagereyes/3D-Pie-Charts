
function initGL(domContainer, width, height) {
	var glInfo = {};

	glInfo.scene = new THREE.Scene();
	glInfo.camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);

	glInfo.renderer = new THREE.WebGLRenderer();
	glInfo.renderer.setSize(width, height);
	domContainer.appendChild(glInfo.renderer.domElement);

	var geometry = new THREE.BoxGeometry( 1, 1, 1 );
	var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
	var cube = new THREE.Mesh(geometry, material);

	glInfo.scene.add(cube);
	glInfo.camera.position.z = 5;

	return glInfo;
}

function renderGL(glInfo) {
	glInfo.renderer.render(glInfo.scene, glInfo.camera);
}