//------------------------------------------------------------
// Global variables
//------------------------------------------------------------
var gl;

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

// Ball rack positions
// Balls in racks are arranged in a triangular pattern. See:
// <https://en.wikipedia.org/wiki/Circle_packing>
var TRIANGLE_RACK = [];
for (var i = 0; i < 5; ++i) {
  for (var j = 0; j <= i; ++j) {
    TRIANGLE_RACK.push(vec2((TABLE_LENGTH/4) + i*Math.sqrt(3*BALL_RADIUS*BALL_RADIUS),
                            j*(BALL_DIAMETER) - i*(BALL_RADIUS)));
    console.log("Pushed ball to triangle rack (" + TRIANGLE_RACK[TRIANGLE_RACK.length - 1][0] + "," + TRIANGLE_RACK[TRIANGLE_RACK.length - 1][1] + ")");
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
var MAX_DT = 0.01;  // Arbitrary s
var LARGE_DT = MAX_DT * 10;  // Arbitrary limit for frame drop warning
var DETERMINISTIC_DT = true;

// Camera data (copied from Blender)
MAIN_CAMERA_POSITION = vec3(3.01678, -1.58346, 1.5657);
MAIN_CAMERA_ORIENTATION = vec4(0.463, 0.275, 0.437, 0.720);
MAIN_CAMERA_FOV = 49.134/2;  // Degrees
MAIN_CAMERA_NEAR = .1;
MAIN_CAMERA_FAR = 100;

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
  if (typeof initialState == 'undefined') {
    initialState = billiardTable.saveState();
  }
  if (totalElapsed > 10.0 && initialState) {
    billiardTable.restoreState(initialState);
    initialState = false;
  }

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
var mainCamera;  // TODO: Move this inside the billiardTable object, so that it is always relative to the table surface


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
  gl.disable(gl.CULL_FACE);
//  gl.cullFace(gl.FRONT);

  //----------------------------------------
  // TODO: load shaders and initialize attribute
  // buffers
  //----------------------------------------
  gl.lineWidth(0.5);

  //----------------------------------------
  // TODO: write event handlers
  //----------------------------------------
  window.onresize = function(event) {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  };
  window.onkeydown = function(event) {
    switch (event.keyCode) {
      case 37:  // Left Arrow
        billiardTable.currentCamera.orientation = normalize(qmult(billiardTable.currentCamera.orientation, quat(0.0, 0.00087, 0.0, 1.0)))
        break;
      case 39:  // Right Arrow
        billiardTable.currentCamera.orientation = normalize(qmult(billiardTable.currentCamera.orientation, quat(0.0, -0.00087, 0.0, 1.0)));
        break;

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
  "common/billiard_table.obj"
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
  "common/test.png"
];
var shaderAssets = [ { name: "billiardball", vert: "billiardball-vert", frag: "billiardball-frag",
                       attributes: { vertexPosition: -1, vertexUV: -1, vertexNormal: -1 },
                       uniforms: { modelViewMatrix: null, projectionMatrix: null } } ];
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
    shaderProgram.attributes = {
      vertexPosition: gl.getAttribLocation(shaderProgram, "vertexPosition"),
      vertexUV: gl.getAttribLocation(shaderProgram, "vertexUV"),
      vertexNormal: gl.getAttribLocation(shaderProgram, "vertexNormal")
    };
    // Get shader uniform locations
    shaderProgram.uniforms = {
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "modelViewMatrix"),
      projectionMatrix: gl.getUniformLocation(shaderProgram, "projectionMatrix"),
      textureSampler: gl.getUniformLocation(shaderProgram, "textureSampler")
    };
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
    // TODO: Determine the line type by its first entry
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
          // TODO: 
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
  // TODO: Pass the model-view matrix and the projection matrix from the camera
  // The camera is defined by a position, orientation, aspect, and focal
  // length. Each model to be rendered needs to be transformed from model space
  // to world space, and from world space to eye space (the space in which the
  // camera's position at the origin). It is enough to transform the model into
  // the space of its parent model and then multiply that transform by the
  // parent's model-view matrix. There is no need to compute a model-world
  // matrix, unless a shader needs it for lighting. The projection matrix is
  // provided by the camera and determines the aspect and focal length
  // (including orthogonal versus perspective projection) for the rendered
  // scene.
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
var BilliardBall = function(number, position, orientation) {
  this.number = number;

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
      "common/unit_billiard_ball.obj", textureFile, "billiardball",
      position, orientation);

  // Initial physical properties
  this.velocity = vec3(0.0, 0.0, 0.0);
  this.scale = BALL_RADIUS;  // The mesh has unit 1m radius
};
BilliardBall.prototype = Object.create(MeshObject.prototype);
BilliardBall.prototype.constructor = BilliardBall;
BilliardBall.prototype.tick = function(dt) {
  this.velocity[2] = 0.0;  // Make sure the ball does not leave the billiard table surface
  // TODO: Implement 3-dimensional velocity for balls falling in pockets
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
    // FIXME: I can probably avoid computing the length twice here
    var rotationAxis = normalize(cross(vec3(0.0, 0.0, 1.0), displacement));
    var angularDisplacement = length(displacement) / BALL_RADIUS;
    this.orientation = qmult(quat(rotationAxis, angularDisplacement), this.orientation);
    // Displace the ball
    this.position = add(this.position, displacement);
  }
  }
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
      this.balls.push(new BilliardBall(0, vec3((-3/8) * TABLE_LENGTH, 0.0, BALL_RADIUS)));
      for (var i = 1; i < this.numBalls; ++i) {
        // Position the balls in a diamond rack
        this.balls.push(new BilliardBall(i, vec3(TRIANGLE_RACK[i-1][0], TRIANGLE_RACK[i-1][1], BALL_RADIUS)));
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

  // Structures for broad-phase collision detection
  this.xBalls = this.balls.slice();
  this.yBalls = this.balls.slice();

  // Collection of camera views for quick access to different camera angles 
  this.cameras = {
    main: new Camera(
            { projection: 'perspective',
              fov: MAIN_CAMERA_FOV,
              near: MAIN_CAMERA_NEAR,
              far: MAIN_CAMERA_FAR },
            MAIN_CAMERA_POSITION,
            MAIN_CAMERA_ORIENTATION),
    frontSidePocket: new Camera(
            { projection: 'perspective',
              fov: FRONT_SIDE_POCKET_CAMERA_FOV,
              near: FRONT_SIDE_POCKET_CAMERA_NEAR,
              far: FRONT_SIDE_POCKET_CAMERA_FAR },
            FRONT_SIDE_POCKET_CAMERA_POSITION,
            FRONT_SIDE_POCKET_CAMERA_ORIENTATION)
  }
  this.currentCamera = this.cameras.main;

  // Register events
  var billiardTable = this;
  canvas.onmousedown = function(event) {
    billiardTable.mouseDownEvent(event);
  }
  canvas.onmouseup = function(event) {
    billiardTable.mouseUpEvent(event);
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

  // Return the model-world transformation stack to its original state
  modelWorld.unwind(initialSize);
}
BilliardTable.prototype.tick = function(dt) {
  this.tickSimulation(dt);
  this.tickGameLogic(dt);
  this.tickCameras(dt);
}
BilliardTable.prototype.tickSimulation = function(dt) {
  // Advance all balls by their velocities
  // FIXME: Don't loop through balls that have already been pocketed
  for (var i = 0; i < this.numBalls; ++i) {
    this.balls[i].tick(dt);
  }

  // TODO: Simulate the effect of the cue stick on the cue ball

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

  // Determine ball-wall collisions
  // Consider westmost balls
  for (var i = 0; i < this.xBalls.length; ++i) {
    if (this.xBalls[i].position[0] < -(TABLE_LENGTH/2 - BALL_RADIUS)) {
      // Get the ball out of the wall
      this.xBalls[i].position[0] = -(TABLE_LENGTH/2 - BALL_RADIUS);  // TODO: Recursively correct collision moves
      // Compute the reflection for the velocity
      this.xBalls[i].velocity = reflection(this.xBalls[i].velocity, vec3(1.0, 0.0, 0.0));
    } else break;
  }
  // Consider eastmost balls
  for (var i = this.xBalls.length - 1; i >= 0; --i) {
    if (this.xBalls[i].position[0] > TABLE_LENGTH/2 - BALL_RADIUS) {
      // Get the ball out of the wall
      this.xBalls[i].position[0] = TABLE_LENGTH/2 - BALL_RADIUS;  // TODO: Recursively correct collision moves
      // Compute the reflection for the velocity
      this.xBalls[i].velocity = reflection(this.xBalls[i].velocity, vec3(-1.0, 0.0, 0.0));
    } else break;
  }
  // Consider southmost balls
  for (var i = 0; i < this.yBalls.length; ++i) {
    if (this.yBalls[i].position[1] < -(TABLE_WIDTH/2 - BALL_RADIUS)) {
      // Get the ball out of the wall
      this.yBalls[i].position[1] = -(TABLE_WIDTH/2 - BALL_RADIUS);  // TODO: Recursively correct collision moves
      // Compute the reflection for the velocity
      this.yBalls[i].velocity = reflection(this.yBalls[i].velocity, vec3(0.0, 1.0, 0.0));
    } else break;
  }
  // Consider northmost balls
  for (var i = this.xBalls.length - 1; i >= 0; --i) {
    if (this.yBalls[i].position[1] > TABLE_WIDTH/2 - BALL_RADIUS) {
      // Get the ball out of the wall
      this.yBalls[i].position[1] = TABLE_WIDTH/2 - BALL_RADIUS;  // TODO: Recursively correct collision moves
      // Compute the reflection for the velocity
      this.yBalls[i].velocity = reflection(this.yBalls[i].velocity, vec3(0.0, -1.0, 0.0));
    } else break;
  }

  // TODO: Determine ball-pocket collisions
}
BilliardTable.prototype.tickGameLogic = function(dt) {
  // TODO: Choose cameras that are most appropriate/interesting by using the game state and Camera.isInView()
//  this.currentCamera.follow(billiardTable.balls[8]);
  this.currentCamera.rotateAbout(billiardTable, vec3(0.0, 0.0, 1.0), 2*Math.PI / 10.0);
  // TODO: Determine the camera to draw (e.g. are we idling (rotate around the
  // table with perspective view)? Is the user dragging the cue stick(top ortho
  // view)?  Was the que ball just struck? Is the target ball close to a pocket
  // (pocket view)?
}
BilliardTable.prototype.tickCameras = function(dt) {
  this.currentCamera.tick(dt);
}
// Various user input event handlers for BilliardTable (most user interaction
// is processed here)
BilliardTable.prototype.mouseDownEvent = function(event) {
  this.mouseStart = vec2(event.clientX, event.clientY);
  console.log("click location: " + event.clientX + "," + event.clientY);
  // Find the point that the ray from the click intersects the billiard table
  var ray = this.currentCamera.screenPointToWorldRay(
      vec2(event.clientX, event.clientY),
      canvas.clientWidth, canvas.clientHeight);
  console.log("ray: " + ray);
  var intersectionPoint = linePlaneIntersection(
      vec4(this.currentCamera.getWorldPosition()), ray,
      vec4(this.getWorldPosition()), mult(vec4(0.0, 0.0, 1.0, 0.0), quatToMatrix(qinverse(this.getWorldOrientation()))));  // FIXME: This is in world coordinates; we probably want this is billiard table coordinates
  console.log("intersectionPoint: " + intersectionPoint);
}
BilliardTable.prototype.mouseUpEvent = function(event) {
  this.mouseEnd = vec2(event.clientX, event.clientY);
  if (typeof this.mouseStart != 'undefined') {
    // FIXME: I should consider the total size of the screen when computing the drag vector
    var mouseDragVector = subtract(this.mouseEnd, this.mouseStart);
    console.log("Mouse drag vector: (" + mouseDragVector[0] + "," + mouseDragVector[1] + ")");
    this.mouseStart = undefined;
    // TODO: Consider the game state before moving the cue ball; I should probably add a BilliardTable.startCueStick() function
    this.balls[0].velocity = vec3(mouseDragVector[0], mouseDragVector[1], 0.0);
  }
}

//------------------------------------------------------------
// Prototype for cameras
//------------------------------------------------------------
var Camera = function (properties, position, orientation) {
  // Iherit from SceneObject
  SceneObject.call(this, position, orientation);
  this.projection = properties.projection;
  switch (properties.projection) {
    case 'orthographic':
      this.left = properties.left;
      this.right = properties.right;
      this.bottom = properties.bottom;
      this.top = properties.top;
      this.near = properties.near;
      this.far = properties.far;
      break;
    case 'perspective':
      this.fov = properties.fov;
      this.near = properties.near;
      this.far = properties.far;
      break;
  }
}
Camera.prototype = Object.create(SceneObject.prototype);
Camera.prototype.setParentObject = function(parentObject) {
  this.parentObject = parentObject;
}
Camera.prototype.worldViewTransformation = function() {
  var worldView = new TransformationStack();
  var cameraWorldCoordinates = this.position;
  // The camera can be positioned relative to the origin or relative to some
  // other object (e.g. the billiard table). In either case, we need to
  // transform the camera into world space before computing the modelView
  // matrix. In the latter case, we need to apply the transform from the parent
  // object.
  if (typeof parentObject != 'undefined') {
    // FIXME: This parent-child object hierarchy has not been implemented yet...
    // Transform the camera by its parent's transform
    // NOTE: vec4() converts vectors in R^3 to points in affine space, i.e. the
    // w component is set to 1.0
    cameraWorldCoordinates = mult(vec4(this.position), parentObject.getTransformation());
    /* FIXME: I don't even consider the parent's rotation here; ugh */
    /* TODO: What I really need is a getWorldPosition() and getWorldOrientation() function that recursively determines the position and orientations of these objects */
  }
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

  switch (this.projection) {
    case 'orthographic':
      // TODO: Avoid changing aspect when projecting orthographic views
      break;
    case 'perspective':
      projection.push(perspective(this.fov, aspect, this.near, this.far));
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
    console.log("rollAngle: " + rollAngle);
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

  console.log("point: " + printVector(point));
  console.log("width: " +width + "  height: " + height);
  console.log("screenTransform matrix: " + printMatrix(screenTransform));
  var deviceSpaceRay = mult(vec4(point), screenTransform);
  console.log("deviceSpaceRay: " + printVector(deviceSpaceRay));

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
  console.log("inverseProjectionMatrix: " + printMatrix(inverseProjectionMatrix));
  var eyeSpaceRay = mult(deviceSpaceRay, inverseProjectionMatrix);
  eyeSpaceRay[2] = -1;
  eyeSpaceRay[3] = 0;
  console.log("eyeSpaceRay: " + printVector(eyeSpaceRay));

  /*
   * ...which, after being rotated by the inverse of the camera's orientation,
   * are rays relative to the global origin in world space.
   */
  // NOTE: I have no idea why this.getWorldOrientation() doesn't need to be
  // inverted. I should investigate.
  var worldSpaceRay = normalize(mult(eyeSpaceRay, quatToMatrix(this.getWorldOrientation())));
  console.log("worldSpaceRay: " + printVector(worldSpaceRay));

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
Camera.prototype.transitionTo = function(camera, stepFunction, callback) {
  // TODO
}
Camera.prototype.stopAnimation = function() {
  this.animation = undefined;
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
// Prototype for polygons (for use with SAT algorithm)
//------------------------------------------------------------


// TODO: Implement algorithm for Separating Axis Theorem collision detection

function linePlaneIntersection(linePoint, lineVector, planePoint, planeNormal) {
  var denominator = dot(lineVector, planeNormal);
  if (denominator == 0.0) {
    return undefined;  // The line is parallel to the plane
  }
  console.log("denominator: " + denominator);
  var intersectionPoint = add(scale(dot(subtract(linePoint, planePoint), planeNormal)/denominator, lineVector), linePoint);
  console.log("dot(subtract(linePoint, planePoint), planeNormal): " + dot(subtract(linePoint, planePoint), planeNormal));
  intersectionPoint[3] = 1.0;

  return intersectionPoint;
}
