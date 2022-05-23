let mixer;
let clock, deltaTime,totalTime;
var scene, camera, renderer;
let arToolkitSource,arToolkitContext,smoothedControls;
var markerNames,markerArray,currentMarkerName;
let model = null;
let sceneGroup;
let globe;
let marker;
initialize();
animate();
//animate();

function initialize(){
  //シーン作成
  scene = new THREE.Scene();
  //ライト作成
  const ambientLight = new THREE.AmbientLight(0xFFFFFF,0.5);
  //シーンにライト追加
  scene.add(ambientLight);
  //カメラ追加
  camera = new THREE.Camera();
  //シーンにカメラ追加
  scene.add(camera);
  //レンダリング生成
  renderer = new THREE.WebGLRenderer({
    antialias:true,
    alpha:true
  });
  //レンダリング設定
  renderer.setClearColor(new THREE.Color('lightgrey'), 0)
	renderer.setSize( 640, 480 );
	renderer.domElement.style.position = 'absolute'
	renderer.domElement.style.top = '0px'
	renderer.domElement.style.left = '0px'
  //ボディにレンダリング適用
	document.body.appendChild( renderer.domElement );
  //時間を生成
  clock = new THREE.Clock();
	deltaTime = 0;
	totalTime = 0;
  //ARToolkitSourceを追加
  arToolkitSource = new THREEx.ArToolkitSource({
		sourceType : 'webcam',
	});
  //リサイズ関数
  function onResize()
	{
		arToolkitSource.onResizeElement();
		arToolkitSource.copyElementSizeTo(renderer.domElement);
		if ( arToolkitContext.arController !== null )
		{
			arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
		}	
	}
  arToolkitSource.init(function onReady(){
		onResize()
	});
  //ハンドルリサイズ関数
  window.addEventListener('resize', function(){
		onResize()
	});
  //ARToolkitCOntextを生成
	arToolkitContext = new THREEx.ArToolkitContext({
		cameraParametersUrl: './lib/datdata/camera_para.dat',
		detectionMode: 'mono'
	});

  arToolkitContext.init( function onCompleted(){
		camera.projectionMatrix.copy( arToolkitContext.getProjectionMatrix() );
	});
  //スムーズ生成
  let smoothedRoot = new THREE.Group();
	scene.add(smoothedRoot);
	smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
		lerpPosition: 0.8,
		lerpQuaternion: 0.8,
		lerpScale: 1,
	});

  markerNames = ["pattern-0","pattern-1","pattern-2","pattern-3"];
	
	markerArray = [];
	
	for (let i = 0; i < markerNames.length; i++)
	{
		marker = new THREE.Group();
		scene.add(marker);
		markerArray.push(marker);
		
		let markerControls = new THREEx.ArMarkerControls(arToolkitContext, marker, {
			type: 'pattern', patternUrl: "./lib/markerpatt/" + markerNames[i] + ".patt",
		});
		
		let markerGroup = new THREE.Group();
		marker.add(markerGroup);
	}


  
	sceneGroup = new THREE.Group();
  const testloader = new THREE.GLTFLoader();
  const url = './lib/modelglb/Object2.glb';
  testloader.load(
    url,
    function(gltf){
      model = gltf.scene;
	  model.scale.set(1, 1, 1);
	  model.position.set(0, 0, 0);
	  smoothedRoot.add(model);
	  sceneGroup.add(model);
    	},
	);
// 	marker.add(gltf.scene);

// let loader = new THREE.TextureLoader();
	
// let geometry1 = new THREE.SphereGeometry(1, 32,32);	
// let texture = loader.load( './lib/img/earth-sphere.jpg' );
// let material1 = new THREE.MeshLambertMaterial( { map: texture, opacity: 0.75 } );
// globe = new THREE.Mesh( geometry1, material1 );
// globe.position.y = 1;
// sceneGroup.add(globe); 
  markerArray[0].children[0].add(sceneGroup);
	currentMarkerName = markerNames[0];
}

function update(){
	//globe.rotation.y += 0.01;
  let anyMarkerVisible = false;
  for (let i = 0; i < markerArray.length; i++)
	{
		if (markerArray[i].visible)
		{
			anyMarkerVisible = true;
			markerArray[i].children[0].add(sceneGroup);
			if (currentMarkerName != markerNames[i])
			{
				currentMarkerName = markerNames[i];
				 console.log("Switching to " + currentMarkerName);
			}
			
			let p = markerArray[i].children[0].getWorldPosition(new THREE.Vector3());
			let q = markerArray[i].children[0].getWorldQuaternion(new THREE.Quaternion());
			let s = markerArray[i].children[0].getWorldScale(new THREE.Vector3());
			let lerpAmount = 0.5;
			
			scene.add(sceneGroup);
			sceneGroup.position.lerp(p, lerpAmount);
			sceneGroup.quaternion.slerp(q, lerpAmount);
			sceneGroup.scale.lerp(s, lerpAmount);

			break;
		}
	}
  let baseMarker = markerArray[0];

  for (var i = 1; i < markerArray.length; i++)
	{
		let currentMarker = markerArray[i];
		let currentGroup  = currentMarker.children[0];
		if ( baseMarker.visible && currentMarker.visible )
		{
			// console.log("updating marker " + i " -> base offset");
			
			let relativePosition = currentMarker.worldToLocal( baseMarker.position.clone() );
			currentGroup.position.copy( relativePosition );
			
			let relativeRotation = currentMarker.quaternion.clone().invert().multiply( baseMarker.quaternion.clone() );
			currentGroup.quaternion.copy( relativeRotation );
		}
	}

  if ( arToolkitSource.ready !== false ){
    arToolkitContext.update(arToolkitSource.domElement);
  }
  smoothedControls.update(marker);
}
function render()
{
	renderer.render( scene, camera );
}
function animate()
{
	requestAnimationFrame(animate);
	deltaTime = clock.getDelta();
	totalTime += deltaTime;
	update();
	render();
}
