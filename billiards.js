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

// FIXME: Need to move this into an object attribute
var billiardBall_shaderProgram;
// FIXME: Move these attribute handles
var positionAttribute;
var uvAttribute;
var normalAttribute;

// FIXME: Need to move these somewhere
var projectionMatrix;
var modelViewMatrix;
var projectionMatrixUniform;
var modelViewMatrixUniform;

//------------------------------------------------------------
// render()
//------------------------------------------------------------
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  var billiardBall = assets["common/billiard_ball.obj"];

  // TODO: Put this draw call in an object method
  gl.useProgram(billiardBall_shaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, billiardBall.attributesBuffer);
  gl.vertexAttribPointer(positionAttribute,
                         3,         // vec3
                         gl.FLOAT,  // 32bit floating point
                         false,     // Don't normalize values
                         4 * 8,     // Stride for eight 32-bit values per-vertex
                         4 * 0);    // Position starts at the first value stored
/*  gl.vertexAttribPointer(uvAttribute,
                         3,         // vec3
                         gl.FLOAT,  // 32bit floating point
                         false,     // Don't normalize values
                         8 * 4,     // Stride for eight 32-bit values per-vertex
                         4 * 3);    // UV starts at the fourth value stored
  gl.vertexAttribPointer(normalAttribute,
                         3,         // vec3
                         gl.FLOAT,  // 32bit floating point
                         false,     // Don't normalize values
                         8 * 4,     // Stride for eight 32-bit values per-vertex
                         4 * 5);    // Normal starts at the sixth value stored
                         */
//  modelViewMatrix = mult(rotate(0.5, vec3(0.0, 1.0, 0.0)), modelViewMatrix);
  gl.uniformMatrix4fv(billiardBall_shaderProgram.modelViewMatrixUniform, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(billiardBall_shaderProgram.projectionMatrixUniform, false, flatten(projectionMatrix));
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, billiardBall.indicesBuffer);
  gl.bindBuffer(gl.ARRAY_BUFFER, billiardBall.attributesBuffer);
  gl.drawElements(gl.TRIANGLES, billiardBall.numIndices, gl.UNSIGNED_SHORT, 0);
  gl.drawElements(gl.LINES, billiardBall.numIndices, gl.UNSIGNED_SHORT, 0);
  gl.drawArrays(gl.LINES, 0, 6);
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
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  //----------------------------------------
  // TODO: load shaders and initialize attribute
  // buffers
  //----------------------------------------
  // FIXME: Move this into an object method
  billiardBall_shaderProgram = initShaders(gl, "billiardball-vert", "billiardball-frag");
  if (billiardBall_shaderProgram == -1) {
    window.alert("Failed to init shaders.");
  }
  positionAttribute = gl.getAttribLocation(billiardBall_shaderProgram, "vertexPosition");
//  window.alert("vertexPosition index: " + positionAttribute);
  gl.enableVertexAttribArray(positionAttribute);

  /*
  uvAttribute = gl.getAttribLocation(billiardBall_shaderProgram, "thisIsuv");
  window.alert("vertexUV index: " + uvAttribute);
  gl.enableVertexAttribArray(uvAttribute);
  normalAttribute = gl.getAttribLocation(billiardBall_shaderProgram, "vertexNormal");
  window.alert("vertexNormal index: " + normalAttribute);
  gl.enableVertexAttribArray(normalAttribute);
  */
  billiardBall_shaderProgram.modelViewMatrixUniform = gl.getUniformLocation(billiardBall_shaderProgram, "modelViewMatrix");
  billiardBall_shaderProgram.projectionMatrixUniform = gl.getUniformLocation(billiardBall_shaderProgram, "projectionMatrix");
  // TODO: Move the matrix initialization somewhere else
  projectionMatrix = ortho(-2, 2, -2, 2, -10000, 10000);
//  projectionMatrix = ortho(-100, 100, -100, 100, 1, -1);
//  modelViewMatrix = mult(scalem(0.1, 0.1, 0.1), translate(0, 0, 50));
//  projectionMatrix = scalem(1.0, 1.0, 1.0);
  modelViewMatrix = translate(0, 0, 50);
  gl.lineWidth(0.5);

  //----------------------------------------
  // TODO: write event handlers
  //----------------------------------------

  //----------------------------------------
  // Load assets
  // (runs in an asynchronous loop before
  // starting the game loop)
  //----------------------------------------
  loadAssets();
};

var geometryAssets = [ "common/billiard_ball.obj" ];
var textureAssets = [ "common/billiard_ball_10.png" ];
var assetIndex = 0;
var assetHandle = null;
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
      // All assets have been loaded; proceed to the game loop
      tick();
      return;
    }
  }
  var assetFile = assetArray[i];
  // TODO: Load the asset via asynchronous Ajax
  if (assetHandle == null) {
    assetHandle = loadFileAjax(assetFile);
  }
  if (assetHandle.done) {
    if (assetHandle.success) {
      if (assetArray == geometryAssets) {
        // Load the mesh geometry into WebGL
        var lines = assetHandle.text.split(/\n/);
        assets[assetFile] = loadObjMesh(assetHandle.text);
      } else if (assetArray == textureAssets) {
        // TODO: Load the texture into WebGL
      }
    } else {
      // TODO: Make a better error message
      window.alert("Error loading asset file: " + assetFile);
    }
    assetHandle = null;
    assetIndex += 1;
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

function loadGeometry() {
  // TODO: Display progress to the user
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
        mesh.verticies.push({ position: mesh.positions[mesh.positions.length - 1] });
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
          // TODO: Check for conflicting indices that Blender might have exported (unlikely)
          /*
          if (mesh.verticies[positionIndex].uv === mesh.uv[uvIndex])
            window.alert("Error: Conflicting UV coordinate in mesh!");
          if (mesh.verticies[positionIndex].normal === mesh.normals[normalIndex])
            window.alert("Error: Conflicting surface normal in mesh!");
            */
          // Copy values into the verticies array (for easy access later)
          mesh.verticies[positionIndex].position = mesh.positions[positionIndex];
          mesh.verticies[positionIndex].uv = mesh.uv[uvIndex];
          mesh.verticies[positionIndex].normal = mesh.normals[normalIndex];
          // Copy the indices so that we will know the order in which to draw
          // the triangles in this surface 
          mesh.indices.push(positionIndex);
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

  /*
  // XXX Some fake vertex data for debugging
  vertexAttributes = new Float32Array( [
    -3.919802, 0.375929, 0.165147,
    -4.016876, 0.361529, 0.165147,
    -4.112070, 0.337684, 0.165147,
    -4.204469, 0.304624, 0.165147,
    -4.293182, 0.262665, 0.165147,
    -4.377356, 0.212214, 0.165147,

    0.0, 0.0, 0.0, 50.0, 50.0, 0.0, 0.0, 0.0,
    1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    100.0, 100.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    -100.0, -100.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    -100.0, 100.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
  ] );
  vertexIndices = new Int16Array( [
    0, 1, 2,
    1, 2, 3,
    2, 3, 4,
    3, 4, 5,
    4, 5, 6,
    5, 6, 7,
  ]);
  */

  for (var i = 0; i < vertexAttributes.length; i += 8) {
    var msg = "";
    for (var j = 0; j < 8; j++) {
      msg += j + ":" + vertexAttributes[i + j] + "  ";
    }
    console.log(msg);
  }
  for (var i = 0; i < vertexIndices.length; i += 3) {
    var msg = "";
    for (var j = 0; j < 3; j++) {
      msg += j + ":" + vertexIndices[i + j] + "  ";
    }
    console.log(msg);
  }

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
