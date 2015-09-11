//------------------------------------------------------------
// Global variables
//------------------------------------------------------------
var gl;

function animate() {
  // TODO: compute elapsed time from last render and update the balls'
  // positions and velocities accordingly.
}

function tick() {
  requestAnimFrame(tick);
  render();
  animate();
}

//------------------------------------------------------------
// render()
//------------------------------------------------------------
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
}

//------------------------------------------------------------
// Initialization
//------------------------------------------------------------
window.onload = function init() {
  var canvas = document.getElementById("gl-canvas");
  var canvasWidth = canvas.width;
  var canvasHeight = canvas.height;

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  //----------------------------------------
  // Configure WebGL
  //----------------------------------------
  gl.viewport(0, 0, canvasWidth, canvasHeight);
  gl.clearColor(0.0, 0.7, 0.0, 1.0);

  //----------------------------------------
  // TODO: load shaders and initialize attribute
  // buffers
  //----------------------------------------

  //----------------------------------------
  // TODO: write event handlers
  //----------------------------------------

  tick();
};
