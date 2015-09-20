//------------------------------------------------------------
// Global variables
//------------------------------------------------------------
var gl;

var ENABLE_DEBUG = false

// American-style ball
var BALL_DIAMETER = 57.15E-3;  // 57.15mm
var BALL_RADIUS = BALL_DIAMETER / 2;

// Various billiards physics constants
// See: <http://billiards.colostate.edu/threads/physics.html>
var BALL_CLOTH_COEFFICIENT_OF_ROLLING_RESISTANCE = 0.010  // 0.005 - 0.015
var BALL_VELOCITY_EPSILON = 0.001;  // Arbitrary m/s
var GRAVITY_ACCELERATION = 9.80665;  // m/s^2
var BALL_CLOTH_ROLLING_RESISTANCE_ACCELERATION =
    BALL_CLOTH_COEFFICIENT_OF_ROLLING_RESISTANCE * GRAVITY_ACCELERATION;
var CUE_BALL_MASS = 0.17;  // kg
var NUMBERED_BALL_MASS = 0.16;  // kg
var CUE_STICK_TIME_TO_FADE_IN = 0.1;
var CUE_STICK_TIME_TO_COLLISION = 0.1;  // Determines how fast the cue stick must travel
var CUE_STICK_TIME_AFTER_COLLISION = 0.1;
var CURSOR_RADIUS_EPSILON = 0.4;  // Vectors within this radius are the weakest shot; this allows us to make shots at a greater radius and therefore with more accuracy.
var SHOT_VELOCITY_EPSILON = 0.03;  // The weakest shot that you're allowed to make. This is a little higher than zero to avoid confusing the shot machines.
var MAX_SHOT_VELOCITY = 3.0;  // m/s
var MAX_SHOT_DISTANCE = CURSOR_RADIUS_EPSILON + (BALL_RADIUS + MAX_SHOT_VELOCITY*CUE_STICK_TIME_TO_COLLISION);

// Various billiards dimensions in meters
/*
// Nine-foot table
var TABLE_LENGTH = 254.0E-2;  // 254cm
var TABLE_WIDTH = 127.0E-2;  // 127cm
*/
// Eight-foot table
// NOTE: These are the dimensions of the play area.
var TABLE_LENGTH = 234.0E-2;  // 234cm
var TABLE_WIDTH = 117.0E-2;  // 117cm
var TABLE_MODEL_LENGTH = 2.664032;  // m  // TODO: The width can be computed from the model
var TABLE_MODEL_WIDTH = 1.492389;  // m
// FIXME: The ortho margin should be computed by the worst possible power shot scenario.
var TABLE_EDGE_WIDTH = Math.max(
    (TABLE_MODEL_LENGTH - TABLE_LENGTH)/2,
    (TABLE_MODEL_WIDTH - TABLE_WIDTH)/2);
var BALL_EDGE_EPSILON = TABLE_EDGE_WIDTH + BALL_RADIUS;
var ORTHO_MARGIN = MAX_SHOT_DISTANCE - BALL_EDGE_EPSILON;  // The margin in meters when in orthographic view

// Ball rack positions
// Balls in racks are arranged in a triangular pattern. See:
// <https://en.wikipedia.org/wiki/Circle_packing>
var TRIANGLE_RACK = [];
for (var i = 0; i < 5; ++i) {
  for (var j = 0; j <= i; ++j) {
    TRIANGLE_RACK.push(vec2((TABLE_LENGTH/4) + i*Math.sqrt(3*BALL_RADIUS*BALL_RADIUS),
                            j*(BALL_DIAMETER) - i*(BALL_RADIUS)));
  }
}
var DIAMOND_RACK = [];

// Gameplay modes
var EIGHT_BALL_MODE = 1;
var NINE_BALL_MODE = 2;
var STRAIGHT_POOL_MODE = 3;
// Gameplay constants
var EIGHT_BALL_NUM_BALLS = 16;
var NINE_BALL_NUM_BALLS = 10;
var STRAIGHT_POOL_NUM_BALLS = 16;

// Animation constants
var MAX_DT = 0.01; // XXX: This used to be 0.01  // Arbitrary s  // FIXME: un-marry the animation dt and the simulation dt
var LARGE_DT = MAX_DT * 10;  // Arbitrary limit for frame drop warning
var DETERMINISTIC_DT = true;

// Camera data (copied from Blender)
MAIN_CAMERA_POSITION = vec3(3.01678, -1.58346, 1.5657);
MAIN_CAMERA_ORIENTATION = vec4(0.463, 0.275, 0.437, 0.720);
MAIN_CAMERA_FOV = 49.134/2;  // Degrees
MAIN_CAMERA_NEAR = .1;
MAIN_CAMERA_FAR = 100;
MAIN_CAMERA_ANGULAR_ACCELERATION = 1.0;
MAIN_CAMERA_MAX_ANGULAR_VELOCITY = Math.PI/1.0;

MAIN_ORTHO_CAMERA_POSITION = vec3(0.0, 0.0, 1.0);
MAIN_ORTHO_CAMERA_ORIENTATION = vec4(0.0, 0.0, 0.0, 1.0);

FRONT_SIDE_POCKET_CAMERA_POSITION = vec3(0.0, 0.57724, 0.055582);
FRONT_SIDE_POCKET_CAMERA_ORIENTATION = quat(-0.001, -0.510, -0.860, -0.002);
FRONT_SIDE_POCKET_CAMERA_FOV = 100/2;  // Degrees
FRONT_SIDE_POCKET_CAMERA_NEAR = .01;
FRONT_SIDE_POCKET_CAMERA_FAR = 100;

function animate(dt) {
  // Simulate physics, game state, and cameras in BilliardTable
  billiardTable.tick(dt);
}

var lastTime;
var tooSlow = false;
var totalElapsed = 0.0;
var dt = 0.0;
var initialState;  // XXX
function tick() {
  // Determine the time elapsed
  if (typeof lastTime == 'undefined')
    lastTime = Date.now();
  dt += (Date.now() - lastTime) / 1000.0;
  lastTime = Date.now();
  totalElapsed += dt;
  if (dt > LARGE_DT && !tooSlow && (totalElapsed > 3.0)) {
    // TODO: Avoid displaying this warning when the user changes tabs.
    // TODO: Make a less intrusive warning.
//    window.alert("Your computer might be too slow for this game! Sorry!");
    tooSlow = true;
  }
  // "Pause" the simulation if dt gets too large by capping dt. Without doing
  // this, huge dt can mess up the simulation if, for instance, the user has a
  // slow computer or looks at a different tab and we can't draw a frame for a
  // long time. A lower MAX_DT avoids many physics anomalies, but it can slow
  // down the simulation.
  dt = Math.min(dt, MAX_DT);
  // Detect when dt = MAX_DT and inform the user that their computer might be
  // too slow.

  requestAnimFrame(tick);
  render();

  // XXX: This is a test of replays; this should be moved elsewhere
  // FIXME: Replays probably don't play nice with the table or cue stick state machines
  /*
  if (typeof initialState == 'undefined') {
    initialState = billiardTable.saveState();
  }
  if (totalElapsed > 10.0 && initialState) {
    billiardTable.restoreState(initialState);
    initialState = false;
  }
  */

  if (DETERMINISTIC_DT) {
    if (dt >= MAX_DT) {  // FIXME: This should be a while loop? It doesn't matter since we pause the game anyway.
      animate(MAX_DT);
      dt -= MAX_DT;
    }
  } else {
    animate(dt);
    dt = 0.0;
  }
}

// TODO: Put these inside some sort of game state object
var billiardTable;
var debug;


//------------------------------------------------------------
// render()
//------------------------------------------------------------
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var modelWorld = new TransformationStack();

  var worldView = billiardTable.currentCamera.worldViewTransformation();
//  var projection = billiardTable.currentCamera.projectionTransformation(gl.drawingBufferWidth/gl.drawingBufferHeight);
  var projection = billiardTable.currentCamera.projectionTransformation(canvas.clientWidth/canvas.clientHeight);

  billiardTable.draw(gl, modelWorld, worldView, projection);

  debug.draw(gl, worldView, projection);
}

//------------------------------------------------------------
// Initialization
//------------------------------------------------------------
var canvas;
window.onload = function init() {
  canvas = document.getElementById("gl-canvas");
  canvas.width = document.body.clientWidth;
  canvas.height = document.body.clientHeight;

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  //----------------------------------------
  // Configure WebGL
  //----------------------------------------
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  //----------------------------------------
  // TODO: load shaders and initialize attribute
  // buffers
  //----------------------------------------
  gl.lineWidth(0.5);

  //----------------------------------------
  // TODO: write event handlers
  //----------------------------------------
  window.onresize = function(event) {
    gl.canvas.width = gl.canvas.clientWidth;
    gl.canvas.height = gl.canvas.clientHeight;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  };
  window.onkeydown = function(event) {
    switch (event.keyCode) {
      /*
      case 37:  // Left Arrow
        billiardTable.currentCamera.orientation = normalize(qmult(billiardTable.currentCamera.orientation, quat(0.0, 0.00087, 0.0, 1.0)))
        break;
      case 39:  // Right Arrow
        billiardTable.currentCamera.orientation = normalize(qmult(billiardTable.currentCamera.orientation, quat(0.0, -0.00087, 0.0, 1.0)));
        break;
        */

      /*
      case 33:  // Page Up
        frontSidePocketCamera.position[1] += 0.001
        console.log("frontSidePocketCamera Y: " + frontSidePocketCamera.position[1]);
        break;
      case 34:  // Page Down
        frontSidePocketCamera.position[1] -= 0.001
        console.log("frontSidePocketCamera Y: " + frontSidePocketCamera.position[1]);
        break;
      case 38:  // Up Arrow
        frontSidePocketCamera.position[2] += 0.001
        console.log("frontSidePocketCamera Z: " + frontSidePocketCamera.position[2]);
        break;
      case 40:  // Down Arrow
        frontSidePocketCamera.position[2] -= 0.001
        console.log("frontSidePocketCamera Z: " + frontSidePocketCamera.position[2]);
        break;
        */

      /* Debugging for broken verticies */
      /*
      case 38:  // Up Arrow
        billiardTable.mesh.numIndices += billiardTable.mesh.numIndices/2;
        console.log("billiardTable.mesh.numIndices: " + billiardTable.mesh.numIndices);
        break;
      case 40:  // Down Arrow
        billiardTable.mesh.numIndices -= billiardTable.mesh.numIndices/2;
        console.log("billiardTable.mesh.numIndices: " + billiardTable.mesh.numIndices);
        break;
      */
    }
  }

  //----------------------------------------
  // Load assets
  // (runs in an asynchronous loop before
  // starting the game loop)
  //----------------------------------------
  loadAssets();
};

function startGame() {
  debug = new GraphicsDebug(assets["debug"]);

  //----------------------------------------
  // TODO: Create game objects
  //----------------------------------------
  // TODO: Allow user to select different game modes
  billiardTable = new BilliardTable(EIGHT_BALL_MODE);

  // Start the asynchronous game loop
  tick();
}

var geometryAssets = [
  "common/unit_billiard_ball.obj",
  "common/billiard_table.obj",
  "common/cue_stick.obj"
];
var textureAssets = [
  "common/cue_ball.png",
  "common/billiard_ball_1.png",
  "common/billiard_ball_2.png",
  "common/billiard_ball_3.png",
  "common/billiard_ball_4.png",
  "common/billiard_ball_5.png",
  "common/billiard_ball_6.png",
  "common/billiard_ball_7.png",
  "common/billiard_ball_8.png",
  "common/billiard_ball_9.png",
  "common/billiard_ball_10.png",
  "common/billiard_ball_11.png",
  "common/billiard_ball_12.png",
  "common/billiard_ball_13.png",
  "common/billiard_ball_14.png",
  "common/billiard_ball_15.png",
  "common/billiard_table_simple_colors.png",
  "common/cue_stick.png",
  "common/test.png"
];
var shaderAssets = [ { name: "billiardball", vert: "billiardball-vert", frag: "billiardball-frag",
                       attributes: [ "vertexPosition", "vertexUV", "vertexNormal" ],
                       uniforms: [ "modelViewMatrix", "projectionMatrix" ] },
                     { name: "cuestick", vert: "cuestick-vert", frag: "cuestick-frag",
                       attributes: [ "vertexPosition", "vertexUV", "vertexNormal" ],
                       uniforms: [ "modelViewMatrix", "projectionMatrix", "fadeAlpha" ] },
                     { name: "debug", vert: "debug-vert", frag: "debug-frag",
                       attributes: [ "vertexPosition" ],
                       uniforms: [ "modelViewMatrix", "projectionMatrix" ] }
];
var assetIndex = 0;
var assetHandle = null;
var textureImage = null;
var assets = {};
function loadAssets() {
  var i = assetIndex;
  var message = "Loading...";
  var assetArray;
  // Determine which asset we are loading
  if (i < geometryAssets.length) {
    message = "Loading geometry...";
    assetArray = geometryAssets;
  } else {
    i -= geometryAssets.length;
    if (i < textureAssets.length) {
      message = "Loading textures...";
      assetArray = textureAssets;
    } else {
      i -= textureAssets.length;
      if (i < shaderAssets.length) {
        message = "Loading shaders...";
        assetArray = shaderAssets;
      } else {
        i -= shaderAssets.length;
        // All assets have been loaded; proceed to the game loop
        startGame();
        return;
      }
    }
  }
  if (assetArray === shaderAssets) {
    // Load both the vertex and fragment shaders from the DOM (no need
    // for Ajax)
    // TODO: There's really no reason to load shaders from the DOM. It might be
    // more kosher to use Ajax here as well.
    var shaderProgram =
      initShaders(gl, shaderAssets[i].vert, shaderAssets[i].frag);
    // Get shader attribute locations
    shaderProgram.attributes = {};
    for (var j = 0; j < shaderAssets[i].attributes.length; ++j) {
      shaderProgram.attributes[shaderAssets[i].attributes[j]] =
        gl.getAttribLocation(shaderProgram, shaderAssets[i].attributes[j]);
    }
    // Get shader uniform locations
    shaderProgram.uniforms = {};
    for (var j = 0; j < shaderAssets[i].uniforms.length; ++j) {
      shaderProgram.uniforms[shaderAssets[i].uniforms[j]] =
        gl.getUniformLocation(shaderProgram, shaderAssets[i].uniforms[j]);
    }
    assets[shaderAssets[i].name] = shaderProgram;
    assetIndex += 1;
  } else if (assetArray === textureAssets) {
    // Load textures using Image() objects
    // FIXME: Need an error dialog when images can't be loaded
    var imageFile = assetArray[i];
    if (textureImage == null) {
      textureImage = new Image();
      textureImage.onload = function() {
        assets[imageFile] = loadTexture(textureImage);
        assetIndex += 1;
        textureImage = null;
      };
      textureImage.src = imageFile;
    }
  } else {
    // Load all other assets via asynchronous Ajax
    var assetFile = assetArray[i];
    if (assetHandle == null) {
      assetHandle = loadFileAjax(assetFile);
    }
    if (assetHandle.done) {
      if (assetHandle.success) {
        if (assetArray === geometryAssets) {
          // Load the mesh geometry into WebGL
          var lines = assetHandle.text.split(/\n/);
          assets[assetFile] = loadObjMesh(assetHandle.text);
        } else if (assetArray === textureAssets) {
          // TODO: Load the texture into WebGL
          // TODO: Load the texture with Image().onload instead, instead of ajax (ugh). See: https://developer.mozilla.org/en/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
          assets[assetFile] = loadTexture(assetHandle.text);
        }
      } else {
        // TODO: Make a better error message
        window.alert("Error loading asset file: " + assetFile);
      }
      assetHandle = null;
      assetIndex += 1;
    }
  }
  
  // Loop with a timeout while everything is being loaded
  window.setTimeout(loadAssets, 50);
}

function loadFileAjax(path) {
  var client = new XMLHttpRequest();
  var handle = {};
  handle.done = false;
  handle.client = client;
  client.open('GET', path);
  client.onreadystatechange = function() {
    if (client.readyState === 4) {
      handle.done = true;
      if (client.status === 200
          // Chrome indicates zero status for "downloads" from "file:///" urls
          || client.status === 0) {
        handle.success = true;
        handle.text = client.responseText; 
      } else {
        handle.success = false;
      }
    }
  }
  client.send();
  return handle;
}

//------------------------------------------------------------
// Routine to read mesh verticies from a Wavefront .obj file
//------------------------------------------------------------
function loadObjMesh(text) {
  var mesh = {
    positions: [],
    uv: [],
    normals: [],
    faces: [],
    verticies: [],
    indices: [],
  };
  var lines = text.split(/\n/);
  var reIndexedVerticies = [];

  // Iterate through each line, collecting all data
  for (var i = 0; i < lines.length; ++i) {
    var line = lines[i];
    // TODO: Chomp leading whitespace
    if ((line.length <= 0) || (line[0] == '#'))
      continue;  // Skip blanks and comments
    var fields = line.split(/ /);
    if (fields.length <= 0)
      continue;  // Skip blanks
    // Determine the line type by its first entry
    switch (fields[0]) {
      case 'o': 
        // Geometric object declaration
        // TODO: Support multiple objects (for now, we assume one object)
        break;
      case 'v':
        // Vertex point position
        if (fields.length != 4)
          window.alert("Error: Unknown vertex position format!");
        // TODO: Check for invalid floating point strings
        mesh.positions.push(vec3(
              parseFloat(fields[1]),
              parseFloat(fields[2]),
              parseFloat(fields[3])));
        break;
      case 'vt':
        // Vertex texture (UV) position
        if (fields.length != 3)
          window.alert("Error: Unknown UV map format!");
        // TODO: Check for invalid floating point strings
        mesh.uv.push(vec2(
              parseFloat(fields[1]),
              parseFloat(fields[2])));
        break;
      case 'vn':
        // Vertex normal
        if (fields.length != 4)
          window.alert("Error: Unknown surface normal format!");
        // TODO: Check for invalid floating point strings
        mesh.normals.push(vec3(
              parseFloat(fields[1]),
              parseFloat(fields[2]),
              parseFloat(fields[3])));
        break;
      case 's':
        // Geometric surface declaration
        // TODO: Support multiple surfaces (for now, we assume one surface)
        break;
      case 'f':
        // Surface face (vertex/uv/normal indices)
        if (fields.length != 4)
          window.alert("Error: Only surfaces made of triangles are supported!");
        mesh.faces.push(fields.slice(1, 4));
        for (var j = 1; j < fields.length; ++j) {
          vertexFields = fields[j].split(/\//);
          if (vertexFields.length != 3)
            window.alert("Error: Unknown vertex format!");
          // Compute indices (OBJ files are indexed from 1)
          // TODO: Check for invalid integer strings
          var positionIndex = parseInt(vertexFields[0]) - 1;
          var uvIndex = parseInt(vertexFields[1]) - 1;
          var normalIndex = parseInt(vertexFields[2]) - 1;
          if (mesh.positions.length <= positionIndex)
            window.alert("Error: Missing vertex position in mesh!");
          if (mesh.uv.length <= uvIndex)
            window.alert("Error: Missing vertex UV coordinate in mesh!");
          if (mesh.normals.length <= normalIndex)
            window.alert("Error: Missing vertex normal in mesh!");
          /*
          if (mesh.verticies[positionIndex] === undefined)
            mesh.verticies[positionIndex] = {};
            */
          // Build the vertex
          var vertex = {
            position: mesh.positions[positionIndex],
            uv: mesh.uv[uvIndex],
            normal: mesh.normals[normalIndex] };
          // Assume the position index for the first vertex we encounter
          var vertexIndex = positionIndex;
          // Check for conflicting indices that Blender might have exported
          // (e.g. texture coordinate seams or cusps in the surface normals)
          // FIXME: We could check for texture coordinates AND normals here in
          // one go, but Javascript object comparison kind of sucks.
          if ((typeof mesh.verticies[vertexIndex] != 'undefined')
              && (mesh.verticies[vertexIndex].uv != vertex.uv)) {
              // NOTE: Some verticies have different texture coordinates for each
              // face, especially along seams. We simply duplicate these verticies
              // in the representation we send to WebGL. The difficulty with these
              // verticies is that we must re-index some of the faces.

              // Look for identical verticies that we may have already re-indexed
              // FIXME: Indexing a map by arbitrary objects in Javascript is
              // not trivial, so I'm using a linear search here for now.
              var k;
              for (k = 0; k < reIndexedVerticies.length; ++k) {
                if (reIndexedVerticies[k].uv == vertex.uv) {
                  // We found the vertex; use its existing index
                  vertexIndex = mesh.positions.length + k;
                  // TODO: Investigate why re-indexing is not working.
//                  break;  // FIXME: Uncomment this line to reveal huge bug.
                }
              }
              if (k == reIndexedVerticies.length) {
                // We haven't encountered this vertex yet; re-index the vertex
                reIndexedVerticies.push(vertex);
                vertexIndex = mesh.positions.length + (reIndexedVerticies.length - 1);
              }
          }
          // Copy values into the verticies array (for easy access when we
          // build an array for OpenGL later)
          mesh.verticies[vertexIndex] = vertex;
          // Copy the indices so that we will know the order in which to draw
          // the triangles in this surface 
          mesh.indices.push(vertexIndex);
        }
        break;
    }
  }

  // Iterate through all verticies, packing them into a format suitable for
  // representation as WebGL vertex attributes.
  //
  // The format for each vertex is
  //
  //    _____ _____ _____ _____ _____ _____ _____ _____
  //   | p_x | p_y | p_z | t_u | t_v | n_x | n_y | n_z |  ... 
  //   '-----'-----'-----'-----'-----'-----'-----'-----'
  //         position       texture         normal
  //
  // where p is the position, t is the UV texture coordinate, and n is the
  // surface normal. Verticies are assumed to have the same surface texture
  // position and surface normal among different triangles, which reduces some
  // duplication.
  var vertexAttributes = new Float32Array(mesh.verticies.length * 8);
  for (var i = 0; i < mesh.verticies.length; ++i) {
    var vertex = mesh.verticies[i];
    // FIXME: Clearly this isn't optimal. I have been using Javascript
    // attributes for clarity, but this could be moved into the loop that reads
    // the OBJ file. The lack of memcpy() does not help. Not a huge problem;
    // just increases loading time.
    vertexAttributes[i*8] = vertex.position[0];
    vertexAttributes[i*8 + 1] = vertex.position[1];
    vertexAttributes[i*8 + 2] = vertex.position[2];
    vertexAttributes[i*8 + 3] = vertex.uv[0];
    vertexAttributes[i*8 + 4] = vertex.uv[1];
    vertexAttributes[i*8 + 5] = vertex.normal[0];
    vertexAttributes[i*8 + 6] = vertex.normal[1];
    vertexAttributes[i*8 + 7] = vertex.normal[2];
  }

  // TODO: Iterate over every face and put their verticies into an array of
  // indices (an array that can be drawn later with GL_TRIANGLES)
  var vertexIndices = new Int16Array(mesh.indices.length);
  for (var i = 0; i < mesh.indices.length; ++i) {
    // For the time being, we're using a triangle mesh. These are much simpler
    // to export from Blender.
    // TODO: Use triangle strips and triangle fans
    // FIXME: This... really doesn't do much
    vertexIndices[i] = mesh.indices[i];
  }

  // Uncomment to debug vertex data
  /*
  for (var i = 0; i < vertexAttributes.length; i += 8) {
    var msg = "i=" + i + ": ";
    for (var j = 0; j < 8; j++) {
      msg += j + ":" + vertexAttributes[i + j] + "  ";
    }
    console.log(msg);
  }
  for (var i = 0; i < vertexIndices.length; i += 3) {
    var msg = "i=" + i + ": ";
    for (var j = 0; j < 3; j++) {
      msg += j + ":" + vertexIndices[i + j] + "  ";
    }
    console.log(msg);
  }
  */

  // Create a WebGL buffer and upload our vertex attributes to the GPU
  var vertexAttributesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexAttributesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertexAttributes, gl.STATIC_DRAW);

  // Create a WebGL buffer and upload our vertex indices to the GPU
  var vertexIndicesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vertexIndicesBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vertexIndices, gl.STATIC_DRAW);

  var result = {
    attributesBuffer: vertexAttributesBuffer,
    indicesBuffer: vertexIndicesBuffer,
    numIndices: vertexIndices.length
  };

  return result;
}

function loadTexture(image) {
  var texture = gl.createTexture();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  /*
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  */
  // FIXME: Get mipmap working (i.e. make texture dimensions a power of 2)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);  // FIXME: Move this wrap assumption out of here
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);  // FIXME: Move this wrap assumption out of here
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}


//------------------------------------------------------------
// Prototype for scene objects
// (objects with position and orientation in the scene)
//------------------------------------------------------------
var SceneObject = function(position, orientation) {
  if (typeof position == 'undefined') {
    this.position = vec3(0.0, 0.0, 0.0);
  } else if (!Array.isArray(position) || position.length != 3) {
    throw "SceneObject(): position must be vec3";
  } else {
    this.position = position;
  }
  if (typeof orientation == 'undefined') {
    this.orientation = quat(0.0, 0.0, 0.0, 1.0);
  }
  else if (!Array.isArray(orientation) || orientation.length != 4) {
    throw "SceneObject(): orientation must be vec4";
  } else {
    this.orientation = orientation;
  }
}
SceneObject.prototype.setParent = function(object) {
  this.parentObject = object;
}
SceneObject.prototype.getWorldPosition = function(object) {
  if (typeof this.parentObject != 'undefined')
    return mult(this.position, translate(this.parentObject.getWorldPosition()));
  return this.position;
}
SceneObject.prototype.getWorldOrientation = function(object) {
  /*
  if (typeof this.parentObject != 'undefined')
    return qmult(this.orientation, this.parentObject.orientation);  // FIXME: This is totally untested (and confusing!)
    */
  return this.orientation;
}

//------------------------------------------------------------
// Prototype for mesh objects
//------------------------------------------------------------
var MeshObject = function(
    meshAsset, textureAsset, shaderAsset,
    position, orientation, scale) {
  // Iherit from SceneObject
  SceneObject.call(this, position, orientation);

  if (typeof scale == 'undefined') {
    this.scale = 1.0;
  } else {
    this.scale = scale;
  }

  this.mesh = assets[meshAsset];
  this.texture = assets[textureAsset];
  this.shaderProgram = assets[shaderAsset];
};
MeshObject.prototype = Object.create(SceneObject.prototype);
MeshObject.prototype.useShaderProgram = function(gl) {
  gl.useProgram(this.shaderProgram);
}
MeshObject.prototype.prepareVertexBuffers = function(gl) {
  // NOTE: WebGL does not support VBO's, so we must prepare the vertex buffers
  // ourselves every frame
  for (var attribute in this.shaderProgram.attributes) {
    var attributeLocation = this.shaderProgram.attributes[attribute];
    if (attributeLocation >= 0) {  // Ignore unused attributes
      // Enable all of the vertex attributes we are using
      // NOTE: We should disable these vertex attributes later, but WebGL does
      // not actually require us to do this
      gl.enableVertexAttribArray(attributeLocation);
    }
  }
  // Bind our buffers to the WebGL state
  gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.attributesBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indicesBuffer);
  // Configure the vertex attributes for position/uv/normal verticies
  gl.vertexAttribPointer(this.shaderProgram.attributes.vertexPosition,
                         3,         // vec3
                         gl.FLOAT,  // 32bit floating point
                         false,     // Don't normalize values
                         4 * 8,     // Stride for eight 32-bit values per-vertex
                         4 * 0);    // Position starts at the first value stored
  if (this.shaderProgram.attributes.vertexUV >= 0)
    gl.vertexAttribPointer(this.shaderProgram.attributes.vertexUV,
                           2,         // vec2
                           gl.FLOAT,  // 32bit floating point
                           false,     // Don't normalize values
                           4 * 8,     // Stride for eight 32-bit values per-vertex
                           4 * 3);    // UV starts at the fourth value stored
  if (this.shaderProgram.attributes.vertexNormal >= 0)
    gl.vertexAttribPointer(this.shaderProgram.attributes.vertexNormal,
                           3,         // vec3
                           gl.FLOAT,  // 32bit floating point
                           false,     // Don't normalize values
                           4 * 8,     // Stride for eight 32-bit values per-vertex
                           4 * 5);    // Normal starts at the sixth value stored
}
MeshObject.prototype.setMatrixUniforms = function(gl, modelWorld, worldView, projection) {
  gl.uniformMatrix4fv(this.shaderProgram.uniforms.modelViewMatrix, false, flatten(mult(worldView.peek(), modelWorld.peek())));
  gl.uniformMatrix4fv(this.shaderProgram.uniforms.projectionMatrix, false, flatten(projection.peek()));
}
MeshObject.prototype.drawElements = function(gl) {
  gl.drawElements(gl.TRIANGLES, this.mesh.numIndices, gl.UNSIGNED_SHORT, 0);
}
MeshObject.prototype.bindTextures = function(gl) {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.uniform1i(this.shaderProgram.uniforms.textureSampler, 0);
}
MeshObject.prototype.draw = function(gl, modelWorld, worldView, projection) {
  var initialSize = modelWorld.size();
  // Translate the object into its position
  modelWorld.push(translate(this.position));
  // Rotate the object with respect to the model's origin
  modelWorld.push(quatToMatrix(this.orientation));
  // Scale the object proportionally
  modelWorld.push(scalem(this.scale, this.scale, this.scale));

  // Breaking the draw method up into subroutines facilitates some flexibility
  // in the implementation of objects derived from MeshObject
  this.useShaderProgram(gl);
  this.prepareVertexBuffers(gl);
  this.setMatrixUniforms(gl, modelWorld, worldView, projection);
  this.bindTextures(gl);
  this.drawElements(gl);

  // Draw our children (if we have them) relative to ourselves
  if (typeof this.drawChildren != 'undefined')
    this.drawChildren(gl, modelWorld, worldView, projection);

  // Return the model-world transformation stack to its original state
  modelWorld.unwind(initialSize);
}

//------------------------------------------------------------
// Prototype for billiard ball objects
//------------------------------------------------------------
var BilliardBall = function(number, initialPosition) {
  this.number = number;
  this.initialPosition = initialPosition;

  // Determine the ball texture to use
  var textureFile;
  switch (number) {
    case 0:
      // White
      textureFile = "common/cue_ball.png";
      break;
    case 1:
      // Yellow solid
      textureFile = "common/billiard_ball_1.png";
      break;
    case 2:
      // Blue solid
      textureFile = "common/billiard_ball_2.png";
      break;
    case 3:
      // Red solid
      textureFile = "common/billiard_ball_3.png";
      break;
    case 4:
      // Purple solid
      textureFile = "common/billiard_ball_4.png";
      break;
    case 5:
      // Orange solid
      textureFile = "common/billiard_ball_5.png";
      break;
    case 6:
      // Green solid
      textureFile = "common/billiard_ball_6.png";
      break;
    case 7:
      // Brown or maroon solid
      textureFile = "common/billiard_ball_7.png";
      break;
    case 8:
      // Black solid
      textureFile = "common/billiard_ball_8.png";
      break;
    case 9:
      // Yellow stripe
      textureFile = "common/billiard_ball_9.png";
      break;
    case 10:
      // Blue stripe
      textureFile = "common/billiard_ball_10.png";
      break;
    case 11:
      // Red stripe
      textureFile = "common/billiard_ball_11.png";
      break;
    case 12:
      // Purple stripe
      textureFile = "common/billiard_ball_12.png";
      break;
    case 13:
      // Orange stripe
      textureFile = "common/billiard_ball_13.png";
      break;
    case 14:
      // Green stripe
      textureFile = "common/billiard_ball_14.png";
      break;
    case 15:
      // Brown or maroon stripe
      textureFile = "common/billiard_ball_15.png";
      break;
  }

  // Iherit from mesh object
  MeshObject.call(this,
      "common/unit_billiard_ball.obj", textureFile, "billiardball");

  // Initial physical properties
  this.velocity = vec3(0.0, 0.0, 0.0);
  this.scale = BALL_RADIUS;  // The mesh has unit 1m radius

  this.state = 'idle';
};
BilliardBall.prototype = Object.create(MeshObject.prototype);
BilliardBall.prototype.constructor = BilliardBall;
BilliardBall.prototype.putInPlay = function(position) {
  if (typeof position == 'undefined') {
    // Place the ball in its rack position on the table
    this.position = vec3(this.initialPosition[0], this.initialPosition[1], BALL_RADIUS);
  } else {
    this.position = vec3(position[0], position[1], BALL_RADIUS);
  }
  this.state = 'startInPlay';
}
BilliardBall.prototype.setPocket = function(pocket) {
  this.state = 'startPocketed';
}
BilliardBall.prototype.tick = function(dt) {
  switch (this.state) {
    case 'idle':
      break;
    case 'startInPlay':
    case 'inPlay':
      this.state = 'inPlay';
      this.tickPhysics(dt);
      break;
    case 'startPocketed':
      break;
    case 'animatePocketed':
      // TODO: Animate the ball rolling towards the center of the pocket
      break;
    case 'pocketed':
      break;
    default:
      throw "Unknown billiard ball state '" + this.state + "'!";
  }
}
BilliardBall.prototype.tickPhysics = function(dt) {
  // Physics for balls on the table
  this.velocity[2] = 0.0;  // Make sure the ball does not leave the billiard table surface
  if (length(this.velocity) < BALL_VELOCITY_EPSILON) {
    this.velocity = vec3(0.0, 0.0, 0.0);
  } else {
    // Account for rolling resistance, i.e. friction
    this.velocity = add(this.velocity, scale(-dt*BALL_CLOTH_ROLLING_RESISTANCE_ACCELERATION, normalize(this.velocity)));
    // Compute the displacement due to velocity
    var displacement = scale(dt, this.velocity);
    if (length(displacement) > 0) {   // NOTE: This check is needed for the rotation code to work
      // Rotate the ball
      // NOTE: The rotation axis for the ball is perpendicular to the velocity
      // vector and the table normal (+Z axis). The angular displacement Theta is
      // related to the linear displacement of the ball r and the radius of the
      // ball R by the equation Theta=r/R. Quaternions can be easily calculated
      // from a rotational axis and an angle. In short: find the rotation axis
      // and angular displacement to make a quaternion.
      // TODO: I can probably avoid computing the length twice here
      var rotationAxis = normalize(cross(vec3(0.0, 0.0, 1.0), displacement));
      var angularDisplacement = length(displacement) / BALL_RADIUS;
      this.orientation = qmult(quat(rotationAxis, angularDisplacement), this.orientation);
      // Displace the ball
      this.position = add(this.position, displacement);
    }
  }
}
BilliardBall.prototype.project = function(normal) {
  // This routine is used in the Separating Axis Theorem algorithm to detect
  // collisions between ball and cushion

  // Rotate our center point such that it is in the space where the given
  // normal is parallel to the X-axis
  var angle = Math.atan2(normal[1], normal[0]);
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  var rotated = mult(vec2(this.position), mat2( c, s,      // Rotate
                                               -s, c));

  // NOTE: We don't actually need to project here. We do so anyway for clarity.
  var projected = mult(vec2(this.position), mult(mat2(1.0, 0.0,   // Project
                                                      0.0, 0.0),
                                                 mat2( c, s,      // Rotate
                                                      -s, c)));

  // Return the projection our circle, leveraging the fact that the edge of our
  // circle is at most one ball radius away from the center point.
  return vec2(projected[0] - BALL_RADIUS, projected[0] + BALL_RADIUS);
}

//------------------------------------------------------------
// Prototype for billiard tables
//------------------------------------------------------------
var BilliardTable = function(gamemode, position, orientation) {
  // Iherit from SceneObject
  MeshObject.call(this,
      "common/billiard_table.obj", "common/billiard_table_simple_colors.png", "billiardball",
      position, orientation);

  this.gamemode = gamemode;
  // Set game parameters based on the selected game mode
  switch (gamemode) {
    case EIGHT_BALL_MODE:
      this.numBalls = EIGHT_BALL_NUM_BALLS;
      // Make objects for each ball
      this.balls = [];
      // Place the cue ball somewhere in "the kitchen"
      // FIXME: The cue ball should be placed by the player
      this.balls.push(new BilliardBall(0, vec3((-3/8) * TABLE_LENGTH, 0.0)));
      for (var i = 1; i < this.numBalls; ++i) {
        // Position the balls in a triangle rack
        this.balls.push(new BilliardBall(i, vec3(TRIANGLE_RACK[i-1][0], TRIANGLE_RACK[i-1][1])));
      }
      break;
    case NINE_BALL_MODE:
      this.numBalls = NINE_BALL_NUM_BALLS;
      break;
    case STRAIGHT_POOL_MODE:
      this.numBalls = STRAIGHT_POOL_NUM_BALLS;
      break;
    default:
      window.alert("Unknown game mode!");
  }
  // All balls positions are relative to the surface of the table
  for (var i = 0; i < this.balls.length; ++i) {
    this.balls[i].setParent(this);
  }

  // We need a cue stick to play
  this.cueStick = new CueStick();
  this.cueStick.setParent(this);

  // Structures for broad-phase collision detection
  this.xBalls = this.balls.slice();
  this.yBalls = this.balls.slice();

  // Collection of camera views for quick access to different camera angles 
  this.cameras = {
    mainPerspective: new Camera(
            { type: 'perspective',
              fov: MAIN_CAMERA_FOV,
              near: MAIN_CAMERA_NEAR,
              far: MAIN_CAMERA_FAR },
            MAIN_CAMERA_POSITION,
            MAIN_CAMERA_ORIENTATION),
    mainOrthographic: new Camera(
            { type: 'orthographic',
              left: -(TABLE_MODEL_LENGTH/2 + ORTHO_MARGIN),
              right: TABLE_MODEL_LENGTH/2 + ORTHO_MARGIN,
              bottom: -(TABLE_MODEL_WIDTH/2 + ORTHO_MARGIN),
              top: TABLE_MODEL_WIDTH/2 + ORTHO_MARGIN,
              near: MAIN_CAMERA_NEAR,
              far: MAIN_CAMERA_FAR },
            MAIN_ORTHO_CAMERA_POSITION,
            MAIN_ORTHO_CAMERA_ORIENTATION),
    frontSidePocket: new Camera(
            { type: 'perspective',
              fov: FRONT_SIDE_POCKET_CAMERA_FOV,
              near: FRONT_SIDE_POCKET_CAMERA_NEAR,
              far: FRONT_SIDE_POCKET_CAMERA_FAR },
            FRONT_SIDE_POCKET_CAMERA_POSITION,
            FRONT_SIDE_POCKET_CAMERA_ORIENTATION)
  }
  this.cameras.mainPerspective.interactiveRotate(
      this, vec3(0.0, 0.0, 1.0),
      MAIN_CAMERA_ANGULAR_ACCELERATION,
      MAIN_CAMERA_ANGULAR_ACCELERATION,  // friction
      MAIN_CAMERA_MAX_ANGULAR_VELOCITY);
  this.currentCamera = this.cameras.mainOrthographic;
  this.currentCameraAngle = 'orthographic';
  this.cameraState = 'interaction';  // XXX: Change this to "pre-game" or "idle"

  // Register events
  var billiardTable = this;
  canvas.onmousedown = function(event) {
    billiardTable.mouseDownEvent(event);
  }
  canvas.onmousemove = function(event) {
    billiardTable.mouseMoveEvent(event);
  }
  canvas.onmouseleave = function(event) {
    billiardTable.mouseLeaveEvent(event);
  }
  canvas.onmouseup = function(event) {
    billiardTable.mouseUpEvent(event);
  }
  // NOTE: The HTML5 canvas doesn't get keyboard focus very easily
  this.keysDepressed = {};
  window.onkeydown = function(event) {
    billiardTable.keyDownEvent(event);
  }
  window.onkeyup = function(event) {
    billiardTable.keyUpEvent(event);
  }

  // Initialize the billiard table state machines
  this.state = 'start';
  this.simulationState = 'stopped';

  // TODO: Draw some lines for debugging cushion collision
  for (var i = 0; i < CUSHIONS.length; ++i) {
    CUSHIONS[i].drawDebug();
  }
}
BilliardTable.prototype = Object.create(MeshObject.prototype);
BilliardTable.prototype.setCurrentCamera = function(camera) {
  this.currentCamera = camera;
}
BilliardTable.prototype.saveState = function() {
  // This method essentially performs a deep-ish copy of the BilliardTable
  // object, especially the simulation state. Javascript doesn't really provide
  // a deep copy idiom for objects, so we do it manually. Combined with
  // DETERMINISTIC_DT, this method implements replay functionality.
  var state = {};
  // TODO: Save the state of the cue stick (presumably either at rest or just
  // before striking the cue ball)
  // Save the state (initial positions and pocketed status) of all of the
  // balls)
  state.balls = [];
  for (var i = 0; i < this.balls.length; ++i) {
    var ball = {
      position: this.balls[i].position.slice(),
      orientation: this.balls[i].orientation.slice(),
      velocity: this.balls[i].velocity.slice()
      // TODO: Also store pocketed status
    };
    state.balls.push(ball);
  }

  return state;
}
BilliardTable.prototype.restoreState = function(state) {
  // This method perfoms the reverse operation of saveState

  // TODO: Restore the state of the cue stick
  // Save the state (initial positions and pocketed status) of all of the
  // balls)
  for (var i = 0; i < state.balls.length; ++i) {
    this.balls[i].position = state.balls[i].position.slice();
    this.balls[i].orientation = state.balls[i].orientation.slice();
    this.balls[i].velocity = state.balls[i].velocity.slice();
  }
}
BilliardTable.prototype.drawChildren = function(gl, modelWorld, worldView, projection) {
  var initialSize = modelWorld.size();

  // FIXME: Don't draw balls that have already been pocketed
  for (var i = 0; i < this.numBalls; ++i) {
    // Draw each ball
    this.balls[i].draw(gl, modelWorld, worldView, projection);
  }

  // The cue stick is drawn above everything
  this.cueStick.draw(gl, modelWorld, worldView, projection);

  // Return the model-world transformation stack to its original state
  modelWorld.unwind(initialSize);
}
BilliardTable.prototype.tick = function(dt) {
  // TODO: Choose cameras that are most appropriate/interesting by using the game state and Camera.isInView()
//  this.currentCamera.follow(billiardTable.balls[8]);
//  this.currentCamera.rotateAbout(billiardTable, vec3(0.0, 0.0, 1.0), 2*Math.PI / 10.0);
  // TODO: Determine the camera to draw (e.g. are we idling (rotate around the
  // table with perspective view)? Is the user dragging the cue stick(top ortho
  // view)?  Was the que ball just struck? Is the target ball close to a pocket
  // (pocket view)?
  switch (this.state) {
    case 'start':
    case 'placeBalls':
      this.xBalls = [];
      this.yBalls = [];
      for (var i = 1; i < this.balls.length; ++i) {
        this.balls[i].putInPlay();
        this.xBalls.push(this.balls[i]);
        this.yBalls.push(this.balls[i]);
      }
    case 'initialDropCueBall':
      // TODO
      this.balls[0].putInPlay();
      this.xBalls.push(this.balls[0]);
      this.yBalls.push(this.balls[0]);
    case 'startSetupShot':
      this.cueStick.setCueBallPosition(this.balls[0].position);
      this.cueStick.startSetupShot();
    case 'setupShot':
      this.state = 'setupShot';
      this.cueStick.setCursorPosition(this.mousePos);
      if (typeof this.mouseStart == 'undefined') {
        break;  // No clicks yet
      }
      // The user clicked; release the cue stick
      this.cueStick.release();
    case 'cueStickRelease':
      this.state = 'cueStickRelease';
      // The user has released the cue stick and now the cue stick will animate
      // to the point where it strikes the cue ball.
      // Wait until the cue stick strikes the cue ball.
      if (this.cueStick.releasedTimeElapsed < CUE_STICK_TIME_TO_COLLISION) {
        break;
      }
    case 'cueStickCollision':
      this.balls[0].velocity = add(this.balls[0].velocity, this.cueStick.collisionVelocity);
      // TODO: Save a replay
      this.startSimulation();
    case 'postCollision':
      // FIXME: The cue stick/ball physics is clearly broken (the stick moves faster than the ball)
      this.state = 'postCollision';
    case 'simulation':
      this.state = 'simulation';
      // TODO: Wait for all of the balls to settle down
      var done = true;
      for (var i = 0; i < this.balls.length; ++i) {
        if (length(this.balls[i].velocity) > 0.0) {  // FIXME: Also consider pocketed balls
          done = false;
          break;
        }
      }
      if (!this.cueStick.isIdle()) {
        done = false;  // Synchronize the billiard table state machine and the cue stick state machine
      }
      if (!done) { 
        break;  // Keep waiting
      }
    case 'postSimulation':
      this.state = 'postSimulation';
      // TODO: Play replays (if we have any pocketed balls)
      // TODO: Determine what turn is next (i.e. cue shot, cue ball drop, or break shot)
      // TODO: Start the next turn
      this.state = 'startSetupShot';
      break;
    default:
      throw "Unknown billiard table state '" + this.state + "'!";
  }

  this.cueStick.tick(dt);
  this.tickCameras(dt);
  this.tickSimulation(dt);
}
BilliardTable.prototype.startSimulation = function() {
  this.simulationState = 'startSimulation';
}
BilliardTable.prototype.stopSimulation = function() {
  this.simulationState = 'stopSimulation';
}
BilliardTable.prototype.tickSimulation = function(dt) {
  switch (this.simulationState) {
    case 'stopSimulation':
    case 'stopped':
      break;
    case 'startSimulation':
    case 'running':
      this.simulationState = 'running';
      // Advance all balls by their velocities
      // FIXME: Don't loop through balls that have already been pocketed
      for (var i = 0; i < this.numBalls; ++i) {
        this.balls[i].tick(dt);
      }

      // Simulate the collision physics of the billiard balls in 2D

      // Detect ball-ball collisions
      // First, broad-phase collision detection with sweep and prune algorithm
      // NOTE: Insertion sort could be used here because (1) we need to iterate to
      // find all potential collisions anyway and (2) insertion sort has an
      // amortized running time of O(n) for nearly-sorted lists such as these. I'm
      // guessing Javascript's quicksort implementation is faster (because it would
      // be implemented in C), but I don't have any benchmarks yet.
      var xCollisions = [];
      // Sort xBalls by x position
      this.xBalls.sort(function(a, b) {
        return a.position[0] - b.position[0];
      });
      // Iterate forwards (positive-x direction) through all balls
      for (var i = 1; i < this.xBalls.length; ++i) {
        // Search backwards (negative-x direction) for collisions
        for (var j = i - 1; j >= 0; --j) {
          if (this.xBalls[i].position[0] - this.xBalls[j].position[0] >= BALL_DIAMETER)
            break;
          // Potential collision between xBalls[i] and xBalls[j]
          var lesserNumber = this.xBalls[j].number;
          var greaterNumber;
          if (this.xBalls[i].number < lesserNumber) {
            greaterNumber = lesserNumber;
            lesserNumber = this.xBalls[i].number;
          } else {
            greaterNumber = this.xBalls[i].number;
          }
          xCollisions[lesserNumber + greaterNumber * this.numBalls] = true;
        }
      }
      // Sort yBalls by y position
      this.yBalls.sort(function(a, b) {
        return a.position[1] - b.position[1];
      });
      // Iterate forwards (positive-y direction) through all balls
      for (var i = 1; i < this.yBalls.length; ++i) {
        // Search backwards (negative-y direction) for collisions
        for (var j = i - 1; j >= 0; --j) {
          if (this.yBalls[i].position[1] - this.yBalls[j].position[1] >= BALL_DIAMETER)
            break;
          // Potential collision between yBalls[i] and yBalls[j]
          var lesserNumber = this.yBalls[j].number;
          var greaterNumber;
          if (this.yBalls[i].number < lesserNumber) {
            greaterNumber = lesserNumber;
            lesserNumber = this.yBalls[i].number;
          } else {
            greaterNumber = this.yBalls[i].number;
          }
          if (typeof xCollisions[lesserNumber + greaterNumber * this.numBalls] != 'undefined') {
    //        window.alert("Broad-phase collision between " + lesserNumber + " and " + greaterNumber + " distance: " + length(subtract(this.yBalls[i].position, this.yBalls[j].position)));
            // Exact collision detection
            if (length(subtract(this.yBalls[i].position, this.yBalls[j].position)) < BALL_DIAMETER) {
    //          window.alert("Collision between " + lesserNumber + " and " + greaterNumber);
              // Reflection of balls
              var iVelocity = elasticCollisionReflection(
                  this.yBalls[i].velocity, this.yBalls[j].velocity,
                  this.yBalls[i].position, this.yBalls[j].position);
              var jVelocity = elasticCollisionReflection(
                  this.yBalls[j].velocity, this.yBalls[i].velocity,
                  this.yBalls[j].position, this.yBalls[i].position);
              this.yBalls[i].velocity = iVelocity;
              this.yBalls[j].velocity = jVelocity;
              // Displace the balls so that they are no longer colliding
              var iDisplacement = collisionDisplacement(this.yBalls[i].position, this.yBalls[j].position, BALL_RADIUS);
              var jDisplacement = collisionDisplacement(this.yBalls[j].position, this.yBalls[i].position, BALL_RADIUS);
              this.yBalls[i].position = add(this.yBalls[i].position, scale(1.01, iDisplacement));
              this.yBalls[j].position = add(this.yBalls[j].position, scale(1.01, jDisplacement));
              // TODO: Recursive resolution of collision
            }
          }
        }
      }

      // Determine ball-wall collisions by first considering the outlier balls in a
      // "broad-phase" before testing for collisions with the actual cushions
      // Consider westmost balls
      for (var i = 0; i < this.xBalls.length; ++i) {
        if (this.xBalls[i].position[0] < -(TABLE_LENGTH/2 - BALL_RADIUS)) {
          // This ball is beyond the western wall; look for cushion collisions
          this.handleCushionCollisions(this.xBalls[i], WESTERN_CUSHIONS);
        } else break;
      }
      // Consider eastmost balls
      for (var i = this.xBalls.length - 1; i >= 0; --i) {
        if (this.xBalls[i].position[0] > TABLE_LENGTH/2 - BALL_RADIUS) {
          // This ball is beyond the eastern wall; look for cushion collisions
          this.handleCushionCollisions(this.xBalls[i], EASTERN_CUSHIONS);
        } else break;
      }
      // Consider southmost balls
      for (var i = 0; i < this.yBalls.length; ++i) {
        if (this.yBalls[i].position[1] < -(TABLE_WIDTH/2 - BALL_RADIUS)) {
          // This ball is beyond the southern wall; look for cushion collisions
          this.handleCushionCollisions(this.yBalls[i], SOUTHERN_CUSHIONS);
        } else break;
      }
      // Consider northmost balls
      for (var i = this.xBalls.length - 1; i >= 0; --i) {
        if (this.yBalls[i].position[1] > TABLE_WIDTH/2 - BALL_RADIUS) {
          // This ball is beyond the northern wall; look for cushion collisions
          this.handleCushionCollisions(this.yBalls[i], NORTHERN_CUSHIONS);
        } else break;
      }

      // Determine ball-pocket collisions by first examining each pocket
      // neighborhood in broad-phase collision detection
      // Scan from east to west to determine the east pocket neighborhood
      var eastPocketNeighborhood = new Set();
      for (var i = this.xBalls.length - 1; i >= 0; --i) {
        if (this.xBalls[i].position[0] > SOUTHEAST_POCKET[0] - POCKET_RADIUS) {
          eastPocketNeighborhood.add(this.xBalls[i].number);
          console.log("Found ball " + this.xBalls[i].number + " in east pocket neighborhood");
          continue;
        }
        break;
      }
      // TODO: Scan from west to east to determine the west pocket neighborhood
      var westPocketNeighborhood = new Set();
      for (var i = 0; i < this.xBalls.length; ++i) {
        if (this.xBalls[i].position[0] < SOUTHWEST_POCKET[0] + POCKET_RADIUS) {
          westPocketNeighborhood.add(this.xBalls[i].number);
          console.log("Found ball " + this.xBalls[i].number + " in west pocket neighborhood");
          continue;
        }
        break;
      }
      // TODO: Scan from south to north to determine the south pocket neighborhood
      var southPocketNeighborhood = new Set();
      for (var i = 0; i < this.yBalls.length; ++i) {
        if (this.yBalls[i].position[1] < Math.max(SOUTH_POCKET[1], SOUTHEAST_POCKET[1]) + POCKET_RADIUS) {
          southPocketNeighborhood.add(this.yBalls[i].number);
          console.log("Found ball " + this.yBalls[i].number + " in south pocket neighborhood");
          continue;
        }
        break;
      }
      // TODO: Scan from north to south to determine the north pocket neighborhood
      var northPocketNeighborhood = new Set();
      for (var i = this.yBalls.length - 1; i >= 0; --i) {
        if (this.yBalls[i].position[1] > Math.min(NORTH_POCKET[1], NORTHEAST_POCKET[1]) - POCKET_RADIUS) {
          northPocketNeighborhood.add(this.yBalls[i].number);
          console.log("Found ball " + this.yBalls[i].number + " in north pocket neighborhood");
          continue;
        }
        break;
      }

      var setUnion = function(a, b) {
        var result = new Set();
        a.forEach(function(item) {
          if (b.has(item)) {
            result.add(item);
          }
        });
        return result;
      }
      // Cross-reference each pocket neighborhood (set union) to see if we have a
      // potential collision
      var southeastPocketNeighborhood = setUnion(southPocketNeighborhood, eastPocketNeighborhood);
      var southwestPocketNeighborhood = setUnion(southPocketNeighborhood, westPocketNeighborhood);
      var northeastPocketNeighborhood = setUnion(northPocketNeighborhood, eastPocketNeighborhood);
      var northwestPocketNeighborhood = setUnion(northPocketNeighborhood, westPocketNeighborhood);
      var billiardTable = this;
      // Check for collisions in each pocket
      southeastPocketNeighborhood.forEach(function(ball) {
        if (length(subtract(SOUTHEAST_POCKET, vec2(billiardTable.balls[ball].position))) < POCKET_RADIUS) {
          window.alert("Pocketed ball in southeast pocket: " + ball);
          billiardTable.balls[ball].pocketed(SOUTHEAST_POCKET);
        }
      });
      southwestPocketNeighborhood.forEach(function(ball) {
        if (length(subtract(SOUTHWEST_POCKET, vec2(billiardTable.balls[ball].position))) < POCKET_RADIUS) {
          window.alert("Pocketed ball in southwest pocket: " + ball);
          billiardTable.balls[ball].pocketed(SOUTHWEST_POCKET);
        }
      });
      northeastPocketNeighborhood.forEach(function(ball) {
        if (length(subtract(NORTHEAST_POCKET, vec2(billiardTable.balls[ball].position))) < POCKET_RADIUS) {
          window.alert("Pocketed ball in northeast pocket: " + ball);
          billiardTable.balls[ball].pocketed(NORTHEAST_POCKET);
        }
      });
      northwestPocketNeighborhood.forEach(function(ball) {
        if (length(subtract(NORTHWEST_POCKET, vec2(billiardTable.balls[ball].position))) < POCKET_RADIUS) {
          window.alert("Pocketed ball in northwest pocket: " + ball);
          billiardTable.balls[ball].pocketed(NORTHWEST_POCKET);
        }
      });
      southPocketNeighborhood.forEach(function(ball) {
        if (length(subtract(SOUTH_POCKET, vec2(billiardTable.balls[ball].position))) < POCKET_RADIUS) {
          window.alert("Pocketed ball in south pocket: " + ball);
          billiardTable.balls[ball].pocketed(SOUTH_POCKET);
        }
      });
      northPocketNeighborhood.forEach(function(ball) {
        if (length(subtract(NORTH_POCKET, vec2(billiardTable.balls[ball].position))) < POCKET_RADIUS) {
          window.alert("Pocketed ball in north pocket: " + ball);
          billiardTable.balls[ball].pocketed(NORTH_POCKET);
        }
      });

      var msg = "Balls in southeast pocket neighborhood: ";
      var foundSome = false;
      southeastPocketNeighborhood.forEach(function(ball) {
        msg += "  " + ball;
        foundSome = true;
      });
      msg += "\n";
      msg += "Balls in southwest pocket neighborhood: ";
      southwestPocketNeighborhood.forEach(function(ball) {
        msg += "  " + ball;
        foundSome = true;
      });
      msg += "\n";
      msg += "Balls in northeast pocket neighborhood: ";
      northeastPocketNeighborhood.forEach(function(ball) {
        msg += "  " + ball;
        foundSome = true;
      });
      msg += "\n";
      msg += "Balls in northwest pocket neighborhood: ";
      northwestPocketNeighborhood.forEach(function(ball) {
        msg += "  " + ball;
        foundSome = true;
      });
      msg += "\n";
      if (foundSome) {
    //    window.alert(msg);
      }
      break;
    default:
      throw "Unknown simulation state '" + this.simulationState + "'!";
  }
}
BilliardTable.prototype.handleCushionCollisions = function(ball, cushions) {
  var collidedEdges = false;
  for (var i = 0; i < cushions.length; ++i) {
    collidedEdges = cushions[i].checkCollision(ball);
    if (collidedEdges) {
      break;  // NOTE: We do not consider collisions on multiple cushions
    }
  }
  if (!collidedEdges) {
    return;
  }
  if (collidedEdges.length == 1) {
    this.handleEdgeCollision(ball, collidedEdges[0]);
    return;
  } else if (collidedEdges.length == 2) {
    // Find the corner that we might be colliding with
    var corner;
    for (var i = 0; i < collidedEdges[0].length; ++i) {
      for (var j = 0; j < collidedEdges[1].length; ++j) {
        if ((collidedEdges[0][i][0] == collidedEdges[1][j][0]) &&
            (collidedEdges[0][i][1] == collidedEdges[1][j][1])) {
          corner = collidedEdges[0][i];
        }
      }
    }
    if (typeof corner == 'undefined') {
      msg = "Fishy edges: \n";
      for (var i = 0; i < collidedEdges.length; ++i) {
        msg += "(" + collidedEdges[i][0] + "), (" + collidedEdges[i][1] + ")\n";
      }
      console.log(msg);
      throw "Could not find a corner; there must be something fishy with the cushion polygons";
    }

    // The ball might have collided with a corner, but the Separating Axis
    // Theorem algorithm might have missed an axis. This is because it does not
    // consider the normals of the "faces" on our circle. This is clear when
    // you draw a near-corner collision on paper.
    // Thus, we must first check if the ball is within BALL_RADIUS of the
    // corner.

    // The ball (might have) collided with a corner; we need to interpolate the
    // normals of the two edges, weighted by how much of each edge is
    // intersecting the ball's circle
    var collidedEdgeWeights = [];
    var collidedEdgeLengthsSum = 0.0;
    for (var i = 0; i < collidedEdges.length; ++i) {
      // Find the intersection of the edge line with the ball circle to
      // determine the collided length (which will determine the weight)
      var intersectedEdgeSegment = lineCircleIntersection(collidedEdges[i], vec2(ball.position), BALL_RADIUS);
      if (!Array.isArray(intersectedEdgeSegment)) {
        // The Separating Axis Theorem algorithm can pick up two edges when
        // only one of them is actually collided. We just weight the
        // non-colliding edge to zero
        collidedEdgeWeights.push(0.0);
        continue;
      }
      var intersectionLength = length(subtract(intersectedEdgeSegment[1], intersectedEdgeSegment[0]));
      collidedEdgeWeights.push(intersectionLength);
      collidedEdgeLengthsSum += intersectionLength;
    }
    if (collidedEdgeLengthsSum == 0.0) {
      // None of the edges intersected; we don't have a collision
      return;
    }
    // Adjust the weights so that they sum to one
    collidedEdgeWeights = scale(1/collidedEdgeLengthsSum, collidedEdgeWeights);
    // Combine the edge normals by their weights
    var collisionNormal = vec2(0.0, 0.0);
    for (var i = 0; i < collidedEdges.length; ++i) {
      var edgeNormal = normalize(vec2(cross(vec3(subtract(collidedEdges[i][1], collidedEdges[i][0])), vec3(0.0, 0.0, 1.0))));
      collisionNormal = add(collisionNormal, scale(collidedEdgeWeights[i], edgeNormal));
    }
    collisionNormal = normalize(collisionNormal);
    this.handleCornerCollision(ball, corner, collisionNormal);
    return;
  } else {
    msg = "Fishy edges: \n";
    for (var i = 0; i < collidedEdges.length; ++i) {
      msg += "(" + collidedEdges[i][0] + "), (" + collidedEdges[i][1] + ")\n";
    }
    console.log(msg);
    throw "We can't handle more than two edge collisions at a time";
  }
}
BilliardTable.prototype.handleEdgeCollision = function(ball, edge) {
  // The ball collided with an edge. We just need to reflect the velocity and
  // get it out of the wall.
  // Only one edge to consider; the normal is perpendicular to the wall
  var collisionNormal = normalize(cross(vec3(subtract(edge[1], edge[0])), vec3(0.0, 0.0, 1.0)).slice(0,2));
  // Compute the reflection for the velocity
  ball.velocity = reflection(ball.velocity, vec3(collisionNormal, 0.0));
  // Get the ball out of the wall
  // NOTE: We could probably try harder at this approximation and account for
  // how far the ball has moved in the last dt, but this is good enough
  // good enough
  ball.position = add(ball.position, scale(MAX_DT, ball.velocity));
}
BilliardTable.prototype.handleCornerCollision = function(ball, corner, collisionNormal) {
  // Compute the reflection for the velocity
  ball.velocity = reflection(ball.velocity, vec3(collisionNormal, 0.0));
  // Get the ball out of the corner
  var cornerToBallCenter = subtract(vec2(ball.position), corner);
//  ball.position = add(ball.position, vec3(scale(BALL_RADIUS-length(cornerToBallCenter), normalize(cornerToBallCenter))));
}
BilliardTable.prototype.tickGameLogic = function(dt) {
}
BilliardTable.prototype.tickCameras = function(dt) {
  // Determine which camera we should be using
  switch (this.cameraState) {
    case 'interaction':
      switch (this.currentCameraAngle) {
        case 'perspective':
          this.currentCamera = this.cameras.mainPerspective;
          // The arrow keys control the perpective camera
          if ((this.keysDepressed.leftArrow == true) &&
              (this.keysDepressed.rightArrow == false)) {
            this.currentCamera.rotateClockwise();
          } else if (this.keysDepressed.leftArrow == false &&
                     this.keysDepressed.rightArrow == true) {
            this.currentCamera.rotateClockwise();
          } else {
          }
        break;
        case 'orthographic':
          this.currentCamera = this.cameras.mainOrthographic;
        break;
        default:
          throw "Unknown camera angle '" + this.currentCameraAngle + "'!";
      }
      break;
  }

  // Let the camera animate
  this.currentCamera.tick(dt);
}
// Various user input event handlers for BilliardTable (most user interaction
// is processed here)
BilliardTable.prototype.tableCoordinatesFromMouseClick = function(x, y) {
  // Find the point that the ray from the click intersects the billiard table
  var ray = this.currentCamera.screenPointToWorldRay(
      vec2(x, y),
      canvas.clientWidth, canvas.clientHeight);
  var intersectionPoint = linePlaneIntersection(
      vec4(this.currentCamera.getWorldPosition()), ray,
      vec4(this.getWorldPosition()), mult(vec4(0.0, 0.0, 1.0, 0.0), quatToMatrix(qinverse(this.getWorldOrientation()))));  // FIXME: This is in world coordinates; we probably want this is billiard table coordinates
  return intersectionPoint;
}
BilliardTable.prototype.mouseDownEvent = function(event) {
  this.mouseStart = this.tableCoordinatesFromMouseClick(event.clientX, event.clientY);
}
BilliardTable.prototype.mouseMoveEvent = function(event) {
  this.mousePos = this.tableCoordinatesFromMouseClick(event.clientX, event.clientY);
}
BilliardTable.prototype.mouseLeaveEvent = function(event) {
  this.mouseStart = undefined;
  this.mousePos = undefined;
  this.mouseDown = undefined;
//  this.keysDepressed = {};  // Dead man's switch for camera controls, etc.
}
BilliardTable.prototype.mouseUpEvent = function(event) {
  this.mouseEnd = this.tableCoordinatesFromMouseClick(event.clientX, event.clientY);
  if (typeof this.mouseStart != 'undefined') {
    // FIXME: I should consider the total size of the table when computing the drag vector
    this.mouseDragVector = subtract(this.mouseEnd, this.mouseStart);
//    debug.drawLine(vec3(this.mouseStart[0], this.mouseStart[1], 0.01), vec3(this.mouseEnd[0], this.mouseEnd[1], 0.01));
    this.mouseStart = undefined;
    // TODO: Consider the game state before moving the cue ball; I should probably add a BilliardTable.startCueStick() function
    // TODO: Scale the velocity to something that feels good
    // TODO: Clamp the maximum velocity
  }
}
BilliardTable.prototype.keyDownEvent = function(event) {
  switch (event.keyCode) {
    case 0x20:  // Spacebar
      // Toggle between perspective and orthographic view
      if (this.currentCameraAngle != 'orthographic') {
        this.currentCameraAngle = 'orthographic';
      } else {
        this.currentCameraAngle = 'perspective';
      }
      break;
    // Arrow keys are used for camera controls, with most of the logic inside
    // tickCameras()
    case 0x25:  // Left Arrow
      this.keysDepressed.leftArrow = true;
      break;
    case 0x25:  // Right Arrow
      this.keysDepressed.rightArrow = true;
      break;
  }
}
BilliardTable.prototype.keyUpEvent = function(event) {
  switch (event.keyCode) {
    case 0x25:  // Left Arrow
      this.keysDepressed.leftArrow = false;
      break;
    case 0x25:  // Right Arrow
      this.keysDepressed.rightArrow = false;
      break;
  }
}

//------------------------------------------------------------
// Prototype for the cue stick
//------------------------------------------------------------
var CueStick = function(position, orientation) {
  // Iherit from mesh object
  MeshObject.call(this,
      "common/cue_stick.obj", "common/cue_stick.png", "cuestick",
      position, orientation);

  // Start our state machine idle
  this.state = 'idle';

  // The billiard table references this value, so we'd better keep it valid
  this.releasedTimeElapsed = 0.0;
}
CueStick.prototype = Object.create(MeshObject.prototype);
CueStick.prototype.startSetupShot = function() {
  if (this.state != 'idle') {
    throw 'The cue stick is in a bad state!';
  }
  this.state = 'startSetupShot';
}
CueStick.prototype.setCueBallPosition = function(pos) {
  this.cueBallPosition = pos;
}
CueStick.prototype.setCursorPosition = function(pos) {
  this.cursorPosition = pos;
}
CueStick.prototype.release = function() {
  this.state = 'startReleased';
}
CueStick.prototype.isIdle = function() {
  return this.state == 'idle';
}
CueStick.prototype.tick = function(dt) {
  // Consider the state of the cue stick and animate accordingly
  switch (this.state) {
    case 'idle':
      // Wait for the cue stick to be needed
      break;
    case 'startSetupShot':
      // Set the initial position of the cue stick to something reasonable
      this.position = add(vec3(-2*BALL_DIAMETER, 0.0, 0.0), this.cueBallPosition);
      this.orientation = quat(vec3(0.0, 0.0, 1.0), Math.atan2(0.0, 1.0));
      // Set the initial alpha
      this.fadeAlpha = 0.0;
      this.setupTimeElapsed = -dt;  // -dt + dt = 0.0
    case 'setupShot':
      this.state = 'setupShot';
      this.setupTimeElapsed += dt;
      // Interpolate the alpha to fade in the cue stick
      this.fadeAlpha = Math.min(this.setupTimeElapsed/CUE_STICK_TIME_TO_FADE_IN, 1.0);
      if (typeof this.cursorPosition == 'undefined') {
        break;  // No cursor to work with
      }
      // Determine where the mouse cursor is relative to the cue ball and draw
      // the cue stick
      var stickTransformation = new TransformationStack();
      var cueBallVector = subtract(this.cueBallPosition, vec3(this.cursorPosition[0], this.cursorPosition[1], this.cueBallPosition[2]));
      var cueBallDistance = length(cueBallVector);
      var cueBallDirection = scale(1/cueBallDistance, cueBallVector);

      // Rotate the cue stick so that it's pointing from the cursor position to the
      // cue ball
      // FIXME: We should rotate about our parent's Z axis...
      this.orientation = quat(vec3(0.0, 0.0, 1.0), Math.atan2(cueBallDirection[1], cueBallDirection[0]));

      if (cueBallDistance < CURSOR_RADIUS_EPSILON) {
        // Clamp the magnitude of any shots within CURSOR_RADIUS_EPSILON of the
        // ball to the weakest shot.
        this.position = add(scale(-(BALL_RADIUS + SHOT_VELOCITY_EPSILON*CUE_STICK_TIME_TO_COLLISION), cueBallDirection), this.cueBallPosition);
        // FIXME: Ignore any shots from this distance
      } else if (cueBallDistance > CURSOR_RADIUS_EPSILON + (BALL_RADIUS + MAX_SHOT_VELOCITY*CUE_STICK_TIME_TO_COLLISION)) {
        this.position = add(scale(-(BALL_RADIUS + MAX_SHOT_VELOCITY*CUE_STICK_TIME_TO_COLLISION), cueBallDirection), this.cueBallPosition);
        // TODO: Smooth the transition from near-max to max velocity (it looks a little stiff)
      } else {
        // Subtract the CURSOR_RADIUS_EPSILON from our radius so we gain more
        // accuracy even for weak shots (i.e. the cursor can tranverse more
        // pixels for better angles with a large radius).
        this.position = add(scale(-(cueBallDistance - CURSOR_RADIUS_EPSILON), cueBallDirection), this.cueBallPosition);
      }

      // FIXME: This might look better if we translated the stick along its local Z axis. It might also look much worse, since the tip of the cue stick would be much further from the table. For now it looks fine.
      break;
    case 'startReleased': 
      // Store the time elapsed since release
      this.releasedTimeElapsed = 0.0;  // -dt + dt = 0.0   // FIXME: use -dt
      // FIXME: If the tip of the cue stick is inside the ball, go back to shot setup
      // Store our current position and the computed position of the collision with the cue ball
      this.initialPosition = this.position;
      this.collisionPosition = add(this.position, add(subtract(this.cueBallPosition, this.position), scale(BALL_RADIUS, normalize(subtract(this.position, this.cueBallPosition)))));
      this.collisionVelocity = scale(1/CUE_STICK_TIME_TO_COLLISION, subtract(this.collisionPosition, this.initialPosition));
    case 'released':
      this.state = 'released';
      // Update the time elapsed since release
      this.releasedTimeElapsed += dt;
      // Interpolate between the initial position and the collision position to
      // determine our position
      this.position = add(  // TODO: Use a formula with some stick acceleration rather than just zero
          scale(1.0 - this.releasedTimeElapsed/CUE_STICK_TIME_TO_COLLISION, this.initialPosition),
          scale(this.releasedTimeElapsed/CUE_STICK_TIME_TO_COLLISION, this.collisionPosition));
      if (this.releasedTimeElapsed < CUE_STICK_TIME_TO_COLLISION) {
        break;
      }
    case 'postCollision': 
      this.state = 'postCollision';
      // TODO: Some cleanup here? I don't know.
    case 'followThrough':
      this.state = 'followThrough';
      // Update the time elapsed since release
      this.releasedTimeElapsed += dt;
      // Continue moving for a bit while we fade out
      this.position = this.collisionPosition;  // TODO: Use a formula with some acceleration
      // Interpolate the cue stick's alpha
      this.fadeAlpha = 1.0 - ((this.releasedTimeElapsed - CUE_STICK_TIME_TO_COLLISION) / CUE_STICK_TIME_AFTER_COLLISION);
      // Wait until we are fully disappeared
      if (this.releasedTimeElapsed < CUE_STICK_TIME_TO_COLLISION + CUE_STICK_TIME_AFTER_COLLISION) {
        break;
      }
    case 'postFollowThrough':
      this.fadeAlpha = 0.0;
      // Reset the cue stick state for the next shot
      this.releasedTimeElapsed = 0.0;
      this.initialPosition = undefined;
      this.collisionPosition = undefined;
      this.collisionVelocity = undefined;
      // Wait for the next shot
      this.state = 'idle';
      break;
    default:
      throw "Unknown cue stick state '" + this.state + "'!";
  }
};
CueStick.prototype.draw = function(gl, modelWorld, worldView, projection) {
  // Don't bother drawing the cue stick while it's not being used
  if (this.state == 'idle') {
    return;
  }

  // We need to use our shader program in order to set its state
  this.useShaderProgram(gl);

  if (this.fadeAlpha < 1.0) {
    // Pass alpha to the shader
    gl.uniform1f(this.shaderProgram.uniforms.fadeAlpha, this.fadeAlpha);

    // Enable alpha blending for fade in/out
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);
  }

  // Disable depth test; the cue stick is always drawn on top
  gl.disable(gl.DEPTH_TEST);

  // TODO: Draw a line to the cue ball (especially for perspective shots)

  MeshObject.prototype.draw.call(this, gl, modelWorld, worldView, projection);

  // Clean up
  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
}

//------------------------------------------------------------
// Prototype for cameras
//------------------------------------------------------------
var Camera = function (properties, position, orientation) {
  // Iherit from SceneObject
  SceneObject.call(this, position, orientation);
  this.projection = properties;
}
Camera.prototype = Object.create(SceneObject.prototype);
Camera.prototype.worldViewTransformation = function() {
  var worldView = new TransformationStack();
  var cameraWorldCoordinates = this.position;
  // The camera can be positioned relative to the origin or relative to some
  // other object (e.g. the billiard table). In either case, we need to
  // transform the camera into world space before computing the modelView
  // matrix. The getWorldPosition() and getWorldOrientation() methods do the
  // work of finding the world coordinates, even if the parent-child hierarchy
  // gets complicated.
  // Rotate the world so that the camera is oriented facing down the -z axis
  // and has the correct roll. This amounts to rotating everything in the world
  // by inverse of our camera's orientation.
  worldView.push(quatToMatrix(qinverse(this.getWorldOrientation())));
  // Translate the world so that the camera is at the origin
  worldView.push(translate(scale(-1,cameraWorldCoordinates.slice(0,3))));

  return worldView;
}
// TODO: Write a Camera.isInView(object) function. This is done by first getting the world coordinates of the object, and then projecting those coordinates with the projection transformation (don't forget the perspective divide!). Finally, check if the resulting point is within the unit 2x2x2 cube.
Camera.prototype.projectionTransformation = function(aspect) {
  var projection = new TransformationStack();

  switch (this.projection.type) {
    case 'orthographic':
      var width = this.projection.right - this.projection.left;
      var height = this.projection.top - this.projection.bottom;
      // Avoid changing aspect when projecting orthographic views. To do this,
      // we "fudge" the table model size with some "letterbox" margins.
      if (width / height > aspect) {
        // The area we're projecting is wider than the screen is wide
        var fudge = width / aspect - height;
        projection.push(ortho(this.projection.left, this.projection.right,
                              this.projection.bottom - fudge/2, this.projection.top + fudge/2,
                              this.projection.near, this.projection.far));
      } else {
        // The table is taller than the screen is tall
        var fudge = height * aspect - width;
        projection.push(ortho(this.projection.left - fudge/2, this.projection.right + fudge/2,
                              this.projection.bottom, this.projection.top,
                              this.projection.near, this.projection.far));
      }
      break;
    case 'perspective':
      projection.push(perspective(this.projection.fov, aspect, this.projection.near, this.projection.far));
      break;
    default:
      throw "projectionTransformation(): unknown projection type for camera";
  }

  return projection;
}
// TODO: Change lookAt into a utility function that returns a quaternion rotation
Camera.prototype.lookAt = function(object, preserveRoll) {
  if (typeof preserveRoll == 'undefined')
    preserveRoll = false;

  var rollAngle;
  if (preserveRoll) {
    // TODO: Test this code
    // TODO: Store the "Roll" of the camera as an angle between the world's
    // Z-axis and the camera's Y-axis. The roll is lost in the next step.
    var zAxisCameraSpace = mult(vec4(0.0, 0.0, 1.0, 0.0), quatToMatrix(qinverse(this.getWorldOrientation())));
    zAxisCameraSpace[2] = 0.0;  // Project onto xy-plane in camera space
    zAxisCameraSpace = normalize(zAxisCameraSpace);
    // NOTE: We treat the camera's Y-axis as the X-axis argument to atan2(y,x)
    rollAngle = Math.atan2(zAxisCameraSpace[0], zAxisCameraSpace[1]);
  } else {
    rollAngle = 0.0;
  }

  // Rotate the camera to look at the object by calculating the angle between
  // the current camera direction and the desired direction and constructing a
  // quaternion rotation.
  var cameraDirection = vec4(0.0, 0.0, -1.0, 0.0);
  var objectDirection = vec4(subtract(object.getWorldPosition(), this.getWorldPosition()));
  objectDirection[3] = 0.0;
  objectDirection = mult(objectDirection, quatToMatrix(qinverse(this.getWorldOrientation())));
  objectDirection = normalize(objectDirection);
  var rotationAxis = cross(cameraDirection, objectDirection);
  var angle = Math.acos(dot(cameraDirection, objectDirection));
  this.orientation = qmult(this.orientation, quat(rotationAxis, angle));

  // TODO: Correct the roll of the camera orientation, as that information was
  // lost by converting the quaternion orientation to a vector. We rotate the
  // camera so that the camera's Y-axis aligns with the Z axis in world space.
  // To do this we first need to compute the camera roll after rotation. Then
  // we rotate the camera by the difference between the initial camera roll and
  // the roll after rotation.
  var zAxisCameraSpace = mult(vec4(0.0, 0.0, 1.0, 0.0), quatToMatrix(qinverse(this.getWorldOrientation())));
  zAxisCameraSpace[2] = 0.0;  // Project onto xy-plane in camera space
  zAxisCameraSpace = normalize(zAxisCameraSpace);  // NOTE: atan2 doesn't require normalization
  // NOTE: We treat the camera's Y-axis as the X-axis argument to atan2(y,x)
  rollAnglePostRotation = -Math.atan2(-zAxisCameraSpace[0], zAxisCameraSpace[1]);
  var cameraYAxis = vec4(0.0, 1.0, 0.0, 0.0);
  this.orientation = qmult(this.orientation, quat(vec3(0.0, 0.0, 1.0), rollAngle - rollAnglePostRotation));
  this.orientation = normalize(this.orientation);  // Be nice to our quaternion

  // TODO: Add some assertions to make sure I didn't screw up the camera roll

  // FIXME: This implementation is close, but it doesn't work instantly
}
Camera.prototype.screenPointToWorldRay = function(point, width, height) {
  // NOTE: A ray has a direction and a reference point. As much as makes sense,
  // we use the origin of the given space as the implicit reference point.

  /*
   *  Sceen points are lines parallel to the Z-axis in normalized device space...
   */
  // Translate origin into the center of the screen
  var screenTransform = mult(mat4(), translate(-1.0, 1.0, 0.0));
  // Flip the y-axis coordinates
  screenTransform = mult(screenTransform, scalem(1.0, -1.0, 1.0));
  // Scale the pixel coordinates to be within 0.0 and 2.0
  var screenScale = mat4(2/width,        0, 0, 0,
                               0, 2/height, 0, 0,
                               0,        0, 1, 0,
                               0,        0, 0, 1);
  screenTransform = mult(screenTransform, screenScale);

  var deviceSpaceRay = mult(vec4(point), screenTransform);

  /*
   * ...which, after crossing back over the perspective divide, are rays not
   * necessarily parallel to the Z-axis in homogeneous clip space...  // FIXME: this probably isn't accurate
   */
  // The perspective divide does not apply to our ray because it is pointing
  // through the focal point and straight out of the camera. We just need a 1.0
  // for w so that it's a point, and -1.0 for z so that it points down the -z
  // axis. Easy!
  var clipSpaceRay = deviceSpaceRay.slice();
  clipSpaceRay[2] = -1.0;
  clipSpaceRay[3] = 1.0;

  /*
   * ...which, after being transformed by the inverse projection matrix, are
   * rays relative to the camera's local origin in eye space...
   */
  var inverseProjectionMatrix = inverse(this.projectionTransformation(width/height).peek());
  var eyeSpaceRay = mult(deviceSpaceRay, inverseProjectionMatrix);
  eyeSpaceRay[2] = -1;
  eyeSpaceRay[3] = 0;

  /*
   * ...which, after being rotated by the inverse of the camera's orientation,
   * are rays relative to the global origin in world space.
   */
  // NOTE: I have no idea why this.getWorldOrientation() doesn't need to be
  // inverted. I should investigate.
  var worldSpaceRay = normalize(mult(eyeSpaceRay, quatToMatrix(this.getWorldOrientation())));

  // TODO: Take a breather.
  return worldSpaceRay;
}
Camera.prototype.follow = function(object) {
  // Look at and follow the object (in tick())
  this.animation = {
    type: "follow",
    object: object
  }
}
Camera.prototype.rotateAbout = function(object, axis, angularVelocity) {
  // Rotate about the object (in tick())
  this.animation = {
    type: "rotateAbout",
    object: object,
    axis: axis.slice(),
    angularVelocity: angularVelocity
  }
}
Camera.prototype.interactiveRotate = function(object, axis, angularAcceleration, angularFrictionAcceleration, maxAngularVelocity) {
  this.animation = {
    type: "interactiveRotate",
    object: object,
    axis: axis.slice(),
    angularAcceleration: angularAcceleration,
    angularFrictionAcceleration: angularFrictionAcceleration,
    maxAngularVelocity: maxAngularVelocity,
    angularVelocity: 0.0,
    angularDisplacement: 0.0,
    initialPosition: this.position,
  }
}
Camera.prototype.transitionTo = function(camera, stepFunction, callback) {
  // TODO
}
Camera.prototype.stopAnimation = function() {
  this.animation = undefined;
}
Camera.prototype.rotateCounterClockwise = function() {
  // Have the camera rotate left for the next tick
  this.animation.rotateCounterClockwise = true;
}
Camera.prototype.rotateClockwise = function() {
  // Have the camera rotate left for the next tick
  this.animation.rotateClockwise = true;
}
Camera.prototype.tick = function(dt) {
  if (typeof this.animation == 'undefined') {
    return;
  }
  // Animate the camera
  switch (this.animation.type) {
    case 'follow':
      this.lookAt(this.animation.object);
      break;
    case 'rotateAbout':
      // FIXME: Don't forget the position; we don't want any rounding errors
      // here. Store an initial position and rotate that about the axis to
      // compute the current position.
      // Calculate the angle to rotate
      var angularDisplacement = this.animation.angularVelocity * dt;
      var transformationStack = new TransformationStack();
      // Rotate the camera's position around the given axis (in the object's
      // space)
      transformationStack.push(quatToMatrix(quat(this.animation.axis, angularDisplacement)));
      // Translate the origin to the object's space
      transformationStack.push(translate(scale(-1, this.animation.object.getWorldPosition())));

      // Apply the transformations to the camera position
      this.position = vec3(mult(vec4(this.position), transformationStack.peek()));

      // Look at the object
      this.lookAt(this.animation.object);

      break;
    case 'interactiveRotate':
      if (this.animation.rotateCounterClockwise) {
        // Apply positive angular acceleration (from the user)
        this.animation.angularVelocity = Math.min(
            this.animation.angularVelocity + this.animation.angularAcceleration*dt,
            this.animation.maxAngularVelocity);
      } else if (this.animation.rotateClockwise) {
        this.animation.angularVelocity = Math.max(
            // Apply negative angular acceleration (from the user)
            this.animation.angularVelocity - this.animation.angularAcceleration*dt,
            -this.animation.maxAngularVelocity);
      } else {
        // Apply angular acceleration due to "friction"
        if (this.animation.angularVelocity > 0.0) {
          this.animation.angularVelocity = Math.max(
              this.animation.angularVelocity - this.animation.angularFrictionAcceleration*dt,
              0.0);
        } else if (this.animation.angularVelocity < 0.0) {
          this.animation.angularVelocity = Math.min(
              this.animation.angularVelocity + this.animation.angularFrictionAcceleration*dt,
              0.0);
        }
      }
      // TODO: Update the angular displacement from the calculated angular velocity
      this.animation.angularDisplacement += this.animation.angularVelocity*dt;
      // TODO: Wrap the angular displacement aronud 2 PI
      // FIXME: The math in here only works in world space; it probably breaks
      // for nested objects
      // FIXME: I'm not even bothering to translate into the object's space...
      // TODO: Compute the current position from the angular displacement
      this.position = vec3(mult(vec4(this.animation.initialPosition), quatToMatrix(quat(this.animation.axis, this.animation.angularDisplacement))));

      this.lookAt(this.animation.object);
      break;
  }
}

//------------------------------------------------------------
// Prototype for transformation stacks
//------------------------------------------------------------
/* NOTE: This object is used in lieu of using the call stack to remember
 * transformations. Instead of passing matricies, we pass a reference to this
 * stack. The advantages of this approach are probably just a matter of taste.
 *
 * Javascript doesn't have very good support for the RAII idiom, so pairing
 * matrix push with pop is a PITA. Oh well?
 */
var TransformationStack = function() {

  this.stack = [ scalem(1.0, 1.0, 1.0) ];  // There should be an ident()
}
TransformationStack.prototype.push = function(transform) {
  var newTransform = mult(this.peek(), transform);
  this.stack.push(newTransform);
}
TransformationStack.prototype.peek = function() {
  return this.stack[this.stack.length - 1];
}
TransformationStack.prototype.pop = function() {
  return this.stack.pop();
}
TransformationStack.prototype.size = function() {
  return this.stack.length;
}
TransformationStack.prototype.unwind = function(size) {
  while (this.stack.length > size)
    this.stack.pop();
}

//------------------------------------------------------------
// Prototype for quaternions
//------------------------------------------------------------
// TODO: Get a better geometry library
function quat(axis, angle) {
  if (Array.isArray(axis)) {
    if (axis.length == 3) {
      // Build the quaternion from axis and angle
      return vec4(
          axis[0] * Math.sin(angle / 2),
          axis[1] * Math.sin(angle / 2),
          axis[2] * Math.sin(angle / 2),
          Math.cos(angle / 2));
    } else {
      throw "Quat(): quaternion axis must be a vec3";
    }
  } else {
    // NOTE: I stole this clever bit from Edward Angel's geometry library...
    var result = _argumentsToArray( arguments );
    switch (result.length) {
      case 0: result.push(0.0);
      case 1: result.push(0.0);
      case 2: result.push(0.0);
      case 3: result.push(1.0);
    }
    return result;
  }
}
function qmult(q, r) {
  return quat(
      q[3]*r[0] + q[0]*r[3] + q[1]*r[2] - q[2]*r[1],
      q[3]*r[1] - q[0]*r[2] + q[1]*r[3] + q[2]*r[0],
      q[3]*r[2] + q[0]*r[1] - q[1]*r[0] + q[2]*r[3],
      q[3]*r[3] - q[0]*r[0] - q[1]*r[1] - q[2]*r[2]
      );
}
function qconjugate(q) {
  if (!Array.isArray(q) || q.length != 4)
    throw "qconjugate(): the quaternion parameter must be a vec4";

  var result = q.slice();  // Deep copy

  for (var i = 0; i <= 2; ++i) {
    result[i] = -result[i];  // Conjugate simply negates the vector part
  }

  return result;
}
function qinverse(q) {
  if (!Array.isArray(q) || q.length != 4)
    throw "qinverse(): the quaternion parameter must be a vec4";

  return scale(1/dot(q,q),qconjugate(q));
}
function quatToMatrix(q) {
  var result = mat4(
      1-2*q[1]*q[1]-2*q[2]*q[2], 2*q[0]*q[1]-2*q[3]*q[2], 2*q[0]*q[2]+2*q[3]*q[1], 0,
      2*q[0]*q[1]+2*q[3]*q[2], 1-2*q[0]*q[0]-2*q[2]*q[2], 2*q[1]*q[2]-2*q[3]*q[0], 0,
      2*q[0]*q[2]-2*q[3]*q[1], 2*q[1]*q[2]+2*q[3]*q[0], 1-2*q[0]*q[0]-2*q[1]*q[1], 0,
      0, 0, 0, 1
      );
  result.matrix = true;

  return result;
}

function reflection(v, n) {
  if (dot(v,n) > 0) {
    // Don't reflect if the vector and normal are already in the same direction
    return v;
  }
  return subtract(v, scale(2*dot(v,n),n));
}

function elasticCollisionReflection(u, v, p, q) {
  // TODO: Account for ball mass.
  var displacement = subtract(p, q);
  return subtract(u, scale(dot(subtract(u, v), displacement)/dot(displacement, displacement), displacement));
}
function collisionDisplacement(p, q, r) {
  var displacementVector = subtract(p, q);
  var displacement = length(displacementVector);
  return scale((2*r - displacement)/(2*displacement), displacementVector);
}

//------------------------------------------------------------
// Prototype for polygons (for use with the Separating Axis
// Theorem algorithm)
// See: <https://en.wikipedia.org/wiki/Hyperplane_separation_theorem#Use_in_collision_detection>
//------------------------------------------------------------

var Polygon = function(points) {
  this.points = points.slice();
}
Polygon.prototype.checkCollision = function(other) {
  // Iterate through all of our faces in order to try to find a separating axis
  // between these two objects
  var collision = true;
  var collidedEdges = [];
  for (var i = 0; i < this.points.length; ++i) {
    var a = this.points[i];
    var b = this.points[(i+1)%this.points.length];
    // Project all of the points (for both shapes) onto the normal for
    // this face to get the end points
    var abPerp = normalize(cross(vec3(subtract(b, a)), vec3(0.0, 0.0, 1.0)).slice(0,2));
    // Draw abPerp for debugging
    var midpoint = add(scale(0.5, a), scale(0.5, b));
    debug.drawLine(vec3(midpoint[0], midpoint[1], BALL_RADIUS+0.005),
              add(vec3(midpoint[0], midpoint[1], BALL_RADIUS+0.005), vec3(abPerp[0], abPerp[1], 0.0)));
    var selfProject = this.project(abPerp);  // TODO: I can cache this result for the cushions
    var otherProject = other.project(abPerp);
    // TODO: Examine the projections to see if we found a separating axis
    if (selfProject[1] < otherProject[0]) {
      // We found a separating axis; the objects do not collide
      collision = false;
      break;
    } else if (otherProject[1] < selfProject[0]) {
      // We found a separating axis; the objects do not collide
      collision = false;
      break;
    }
    // Now we must determine which edges are actually collided with
    // NOTE: The edge we are considering is always selfProject[1], because the
    // normal is rotated to point in the positive X direction and our normals
    // should always point outwards (as long as our polygons are wound
    // properly).
    if ((otherProject[0] < selfProject[1]) && (otherProject[1] > selfProject[1])) {
      // Assuming that we do not find a separating axis, this edge must collide
      // with the object
      collidedEdges.push([a, b]);
    }
  }
  if (!collision) {
    return false;
  }
  // We could not find any separating axis, so the objects must collide
  return collidedEdges;
}
Polygon.prototype.project = function(normal) {
  // roject all of our points onto the given normal and return the resulting
  // line (in one-dimensional space)

  // Rotate our points so that the line corresponds with the X-axis. We could
  // use dot products to project our points, but we want them to align with an
  // axis for easy output.
  var angle = Math.atan2(normal[1], normal[0]);
  var c = Math.cos(angle);
  var s = Math.sin(angle);

  // NOTE: We don't actually need to project here. We do so anyway for clarity.
  var projected = this.mult(mult(mat2(1.0, 0.0,  // Project
                                      0.0, 0.0),
                                 mat2( c, s,     // Rotate 
                                      -s, c)));

  var result = vec2();
  // Find the min and max points of the projection
  result[0] = projected.points[0][0];
  result[1] = projected.points[0][0];
  for (var i = 1; i < projected.points.length; ++i) {
    if (projected.points[i][0] < result[0]) {
      result[0] = projected.points[i][0];  // New minimum found
    } else if (projected.points[i][0] > result[1]) {
      result[1] = projected.points[i][0];  // New maximum found
    }
  }

  return result;
}
Polygon.prototype.mult = function(matrix) {
  // Apply a matrix transformation to our points and return the resulting polygon
  var transformedPoints = [];
  for (var i = 0; i < this.points.length; ++i) {
    transformedPoints.push(mult(this.points[i], matrix));
  }
  if (det(matrix) < 0.0) {
    // The transformation changed the polygon edge winding; we must reverse the
    // array to correct it
    transformedPoints = transformedPoints.reverse();
  }
  return new Polygon(transformedPoints);
}
Polygon.prototype.drawDebug = function() {
  // Draw the polygon hovering over the billiard table (for debugging only)
    for (var i = 0; i < this.points.length; ++i) {
      debug.drawLine(
          vec3(this.points[i][0], this.points[i][1], BALL_RADIUS+0.005),
          vec3(this.points[(i+1)%this.points.length][0], this.points[(i+1)%this.points.length][1], BALL_RADIUS+0.005));
    }
}
var Circle = function(point, radius) {
}

// Table cushin positions for collision detection (values from the model)
var CUSHIONS = [];
var NORTHERN_CUSHIONS = [];
var SOUTHERN_CUSHIONS = [];
var EASTERN_CUSHIONS = [];
var WESTERN_CUSHIONS = [];
// The test cushion is very useful
/*
var TEST_CUSHION = new Polygon( [ vec2(-2.5, 0.0), vec2(-2.0, -0.5), vec2(-1.5, 0.0), vec2(-2.0, 0.5) ] );
TEST_CUSHION = TEST_CUSHION.mult(mat2(1.0,  0.0,
                                      0.0, -1.0));
CUSHIONS.push(TEST_CUSHION);
WESTERN_CUSHIONS.push(TEST_CUSHION);
*/
var SOUTHEAST_CUSHION_RIGHT_BACK = vec2(1.3362, -83.0000E-2);
var SOUTHEAST_CUSHION_RIGHT_CORNER = vec2(1.08992, -58.50002E-2);
var SOUTHEAST_CUSHION_LEFT_CORNER = vec2(7.45926E-2, -58.50002E-2);
var SOUTHEAST_CUSHION_LEFT_BACK = vec2(0.0, -83.0000E-2);
var SOUTHEAST_CUSHION = new Polygon( [ SOUTHEAST_CUSHION_RIGHT_BACK,
                                       SOUTHEAST_CUSHION_RIGHT_CORNER,
                                       SOUTHEAST_CUSHION_LEFT_CORNER,
                                       SOUTHEAST_CUSHION_LEFT_BACK ] );
CUSHIONS.push(SOUTHEAST_CUSHION);
SOUTHERN_CUSHIONS.push(SOUTHEAST_CUSHION);

// The right cushion is mirrored about the Y-axis
var EAST_CUSHION_BOTTOM_BACK = vec2(1.4365, -76.8976E-2);
var EAST_CUSHION_BOTTOM_CORNER = vec2(1.17074, -50.41774E-2);
var EAST_CUSHION_TOP_CORNER = mult(EAST_CUSHION_BOTTOM_CORNER,
                                    mat2(1.0,  0.0,
                                         0.0, -1.0));
var EAST_CUSHION_TOP_BACK = mult(EAST_CUSHION_BOTTOM_BACK,
                                  mat2(1.0,  0.0,
                                       0.0, -1.0));
var EAST_CUSHION = new Polygon( [ EAST_CUSHION_TOP_BACK,
                                  EAST_CUSHION_TOP_CORNER,
                                  EAST_CUSHION_BOTTOM_CORNER,
                                  EAST_CUSHION_BOTTOM_BACK ] );
CUSHIONS.push(EAST_CUSHION);
EASTERN_CUSHIONS.push(EAST_CUSHION);

// All other cushins are mirrors of the preceding cushins
var SOUTHWEST_CUSHION = SOUTHEAST_CUSHION.mult(mat2(-1.0, 0.0,
                                                     0.0, 1.0));
CUSHIONS.push(SOUTHWEST_CUSHION);
SOUTHERN_CUSHIONS.push(SOUTHWEST_CUSHION);
var NORTHEAST_CUSHION = SOUTHEAST_CUSHION.mult(mat2(1.0,  0.0,
                                                    0.0, -1.0));
NORTHERN_CUSHIONS.push(NORTHEAST_CUSHION);
CUSHIONS.push(NORTHEAST_CUSHION);
var NORTHWEST_CUSHION = SOUTHEAST_CUSHION.mult(mat2(-1.0,  0.0,
                                                     0.0, -1.0));
NORTHERN_CUSHIONS.push(NORTHWEST_CUSHION);
CUSHIONS.push(NORTHWEST_CUSHION);
var WEST_CUSHION = EAST_CUSHION.mult(mat2(-1.0,  0.0,
                                           0.0,  1.0));
CUSHIONS.push(WEST_CUSHION);
WESTERN_CUSHIONS.push(WEST_CUSHION);

// Table pocket positions for collision detection (values from the model)
POCKET_DIAMETER = 19.377E-2;
POCKET_RADIUS = POCKET_DIAMETER/2;
POCKETS = [];
SOUTHEAST_POCKET = vec2(1.20688 ,-62.29423E-2);
SOUTH_POCKET = vec2(0.0, -67.94704E-2);
// The rest of the pockets are mirrored from these two pockets
var SOUTHWEST_POCKET = mult(SOUTHEAST_POCKET,
                            mat2(-1.0, 0.0,
                                  0.0, 1.0));
var NORTHEAST_POCKET = mult(SOUTHEAST_POCKET,
                            mat2(1.0,  0.0,
                                 0.0, -1.0));
var NORTHWEST_POCKET = mult(SOUTHEAST_POCKET,
                            mat2(-1.0,  0.0,
                                  0.0, -1.0));
var NORTH_POCKET = mult(SOUTH_POCKET,
                        mat2(-1.0,  0.0,
                              0.0, -1.0));

function linePlaneIntersection(linePoint, lineVector, planePoint, planeNormal) {
  var denominator = dot(lineVector, planeNormal);
  if (denominator == 0.0) {
    return undefined;  // The line is parallel to the plane
  }
  var intersectionPoint = add(scale(dot(subtract(planePoint, linePoint), planeNormal)/denominator, lineVector), linePoint);
  intersectionPoint[3] = 1.0;

  return intersectionPoint;
}
function lineCircleIntersection(line, center, radius)
{
  // First, determine which points on the line are already inside the circle,
  // and handle the case where they're both inside the circle.
  var insidePoint;
  var outsidePoint;
  if (length(subtract(center, line[0])) < radius) {
    insidePoint = line[0];
    outsidePoint = line[1];
  }
  if (length(subtract(center, line[1])) < radius) {
    if (typeof insidePoint != 'undefined') {
      return line.slice();  // That was easy; the line is entirely within the circle
    }
    insidePoint = line[1];
    outsidePoint = line[0];
  }
  var bothOutside = typeof insidePoint == 'undefined';

  var v = normalize(subtract(line[1], line[0]));
  var v_x = v[0];
  var v_y = v[1];
  var s = line[0];
  var s_x = s[0];
  var s_y = s[1];
  var r = radius;
  var c_x = center[0];
  var c_y = center[1];

  // We first find the roots for the ray intersecting the circle by solving the
  // quadratic equation that arises from the circle-ray intersection problem.
  var a = v_x*v_x + v_y*v_y;
  var b = 2 * (s_x*v_x + s_y*v_y - c_x*v_x - c_y*v_y);
  var c = s_x*s_x + s_y*s_y - 2*(c_x*s_x + c_y*s_y) + c_x*c_x + c_y*c_y - r*r;
  var discriminant = b*b - 4*a*c;
  if (discriminant < 0.0) {
    return undefined;
  } else if (discriminant == 0.0) {
    // TODO: Grazing hits aren't very interesting for us either...
    return undefined;
  }
  // The discriminant is negative, so we have two intersecting points along
  // the array
  var t_0 = (-b + Math.sqrt(discriminant))/(2*a);
  var t_1 = (-b - Math.sqrt(discriminant))/(2*a);

  var p_0 = add(s, scale(t_0, v));
  var p_1 = add(s, scale(t_1, v));

  if (bothOutside) {
    return [p_0, p_1];  // The line goes in one side and out the other
  }
  // To determine which point on the circle is between our line points,
  // consider that such a point must be closest to the outside point on our
  // line
  if (length(subtract(p_0, outsidePoint)) < length(subtract(p_1, outsidePoint))) {
    return [p_0, insidePoint];
  } else {
    return [p_1, insidePoint];
  }
}
// Poor man's unit tests
// window.alert("lineCircleIntersection test: " + printVector(lineCircleIntersection([[-1.0, 0.0], [0.5, 0.0]], [0.5, 0.0], 0.5)));

//------------------------------------------------------------
// Prototype for tool to draw shapes for debugging graphics
//------------------------------------------------------------
var GraphicsDebug = function(shader) {
  if (!ENABLE_DEBUG)
    return;
  this.lines = [];
  this.linesUpdated = false;

  this.shaderProgram = shader;
}
GraphicsDebug.prototype.drawLine = function(a, b) {
  if (!ENABLE_DEBUG)
    return;
  // FIXME: This should use a set to avoid slowing everything down when adding
  // too many lines.
  this.lines.push(a);
  this.lines.push(b);
  this.linesUpdated = true;
  if (typeof this.vertexBuffer == 'undefined') {
    this.vertexBuffer = gl.createBuffer();
  }
}
GraphicsDebug.prototype.draw = function(gl, worldView, projection) {
  if (!ENABLE_DEBUG)
    return;
  if (this.lines.length <= 0) {
    return;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  if (this.linesUpdated) {
    // Upload the new line data to the vertex buffer
    var data = new Float32Array(this.lines.length * 3);
    for (var i = 0; i < this.lines.length; ++i) {
      data[i*3 + 0] = this.lines[i][0];
      data[i*3 + 1] = this.lines[i][1];
      data[i*3 + 2] = this.lines[i][2];
    }
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  }

  gl.useProgram(this.shaderProgram);
  gl.uniformMatrix4fv(this.shaderProgram.uniforms.modelViewMatrix, false, flatten(worldView.peek()));
  gl.uniformMatrix4fv(this.shaderProgram.uniforms.projectionMatrix, false, flatten(projection.peek()));
  gl.vertexAttribPointer(this.shaderProgram.attributes.vertexPosition,
                         3,         // vec3
                         gl.FLOAT,  // 32bit floating point
                         false,     // Don't normalize values
                         0,         // Tightly packed
                         0);        // Position starts at the first value stored
  gl.drawArrays(gl.LINES, 0, this.lines.length);
}
