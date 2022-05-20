let mixer;
let scene, camera, renderer,hemisphereLight,markerRoot;
let arToolkitSource,arToolkitContext;
const clock = new THREE.Clock();
init();
function init() {
  //シーン追加
   scene = new THREE.Scene();
  //カメラ追加
   camera = new THREE.Camera();
  scene.add(camera);
  hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x4169e1, 1.8);

scene.add(hemisphereLight);

  //レンダリング設定
 renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(new THREE.Color('lightgrey'), 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0px';
  renderer.domElement.style.left = '0px';
  document.body.appendChild(renderer.domElement);

  ///ARToolkitContext
   arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: './lib/datdata/camera_para.dat',
    detectionMode: 'mono',

  });
  arToolkitContext.init(() => {
    camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
  });
  ///ARToolkitSource
  arToolkitSource= new THREEx.ArToolkitSource({
    sourceType: 'webcam'
  });
  //ハンドルリサイズ
  function handleResize(){
    arToolkitSource.onResizeElement();
    arToolkitSource.copyElementSizeTo(renderer.domElement);
    if (arToolkitContext.arController!==null) {
      arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
    }
  }
  arToolkitSource.init(() => {
    setTimeout(() => {
      tick();
      handleResize();
      [].slice.call(document.querySelectorAll('.invisible')).forEach((elm) => {
        elm.classList.remove('invisible');
      });
    }, 200);
  });

  window.addEventListener('resize', handleResize, {
    passive: true
  });

   markerRoot = new THREE.Group;
  scene.add(markerRoot);
  const arMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
    type: 'pattern',
    patternUrl: './lib/markerpatt/pattern-0.patt',
    minConfidence: 0.1,
  });
  let smoothedRoot = new THREE.Group();
scene.add(smoothedRoot);
smoothedControls = new THREEx.ArSmoothedControls(smoothedRoot, {
  lerpPosition: 0.4,
  lerpQuaternion: 0.3,
  lerpScale: 1,
});

const loader = new THREE.GLTFLoader();
const url = './lib/modelglb/Object2.glb';
loader.load(
  url,
  (gltf) => {
    const animations = gltf.animations;
    const model = gltf.scene;

    if (animations && animations.length) {
      mixer = new THREE.AnimationMixer(model);

      for (let i = 0; i < animations.length; i++) {
        const animation = animations[i];
        const action = mixer.clipAction(animation);

        action.play();
      }
    }
    model.scale.set(1, 1, 1);
    model.position.set(0, 0, 0);
    markerRoot.add(gltf.scene);
  },
  (err) => {
    console.log(err);
  }
);
}
function update() {
  if (arToolkitSource.ready) {
    arToolkitContext.update(arToolkitSource.domElement);
  }
  if(smoothedControls){
  smoothedControls.update(markerRoot);
  }
  if (mixer) {
    mixer.update(clock.getDelta());
  }
}
function render() {
  renderer.render(scene, camera);
}

function tick() {
  update();
  render();
  requestAnimationFrame(tick);
}