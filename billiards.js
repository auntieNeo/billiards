//------------------------------------------------------------
// Global variables
//------------------------------------------------------------
var gl;

function animate() {
  // TODO: compute elapsed time from last render and update the balls'
  // positions and velocities accordingly.
  modelViewMatrix = mult(rotate(0.5, vec3(0.0, 1.0, 0.0)), modelViewMatrix);
}

function tick() {
  requestAnimFrame(tick);
  render();
  animate();
}

// FIXME: Need to move these somewhere
var projectionMatrix;
var modelViewMatrix;

// TODO: Put this inside some sort of game state object
var billiardTable;


//------------------------------------------------------------
// render()
//------------------------------------------------------------
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  billiardTable.draw(gl);
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
  gl.clearColor(0.7, 0.7, 0.7, 1.0);
  gl.enable(gl.DEPTH_TEST);

  //----------------------------------------
  // TODO: load shaders and initialize attribute
  // buffers
  //----------------------------------------
  // TODO: Move the matrix initialization somewhere else
  projectionMatrix = ortho(-2, 2, -2, 2, -10000, 10000);
//  projectionMatrix = ortho(-100, 100, -100, 100, 1, -1);
//  modelViewMatrix = mult(scalem(0.1, 0.1, 0.1), translate(0, 0, 50));
//  projectionMatrix = scalem(1.0, 1.0, 1.0);
//  modelViewMatrix = translate(0, 0, 50);
  modelViewMatrix = scalem(1.0, 1.0, 1.0);
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

function startGame() {
  //----------------------------------------
  // TODO: Create game objects
  //----------------------------------------
  billiardTable = new BilliardTable();

  // Start the asynchronous game loop
  tick();
}

var geometryAssets = [ "common/billiard_ball.obj" ];
var textureAssets = [ "common/billiard_ball_10.png" ];
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
              window.alert("Error: Conflicting texture coordinate in mesh! ("
                  + mesh.verticies[positionIndex].uv[0] + "," + mesh.verticies[positionIndex].uv[1] + ") != ("
                  + mesh.uv[uvIndex][0] + "," + mesh.uv[uvIndex][1] + ")");
              // Look for identical verticies that we may have already re-indexed
              // FIXME: Indexing a map by arbitrary objects in Javascript is
              // not trivial, so I'm using a linear search here for now.
              var k;
              for (k = 0; k < reIndexedVerticies.length; ++k) {
                if (reIndexedVerticies[k].uv == vertex.uv) {
                  // We found the vertex; use its existing index
                  vertexIndex = mesh.positions.length + k;
                  break;
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
// Prototype for mesh objects
//------------------------------------------------------------
var MeshObject = function(meshAsset, textureAsset, shaderAsset) {
  this.mesh = assets[meshAsset];
  this.texture = assets[textureAsset];
  this.shaderProgram = assets[shaderAsset];
};
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
MeshObject.prototype.setMatrixUniforms = function(gl) {
  // TODO: Pass the model-view matrix and the projection matrix from the camera
  gl.uniformMatrix4fv(this.shaderProgram.uniforms.modelViewMatrix, false, flatten(this.modelViewMatrix));
  gl.uniformMatrix4fv(this.shaderProgram.uniforms.projectionMatrix, false, flatten(projectionMatrix));
}
MeshObject.prototype.drawElements = function(gl) {
  gl.drawElements(gl.TRIANGLES, this.mesh.numIndices, gl.UNSIGNED_SHORT, 0);
}
MeshObject.prototype.bindTextures = function(gl) {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.uniform1i(this.shaderProgram.uniforms.textureSampler, 0);
}
MeshObject.prototype.draw = function(gl) {  // TODO: Take the camera as an argument
  // Breaking the draw method up into subroutines facilitates some flexibility
  // in the implementation of objects derived from MeshObject
  this.useShaderProgram(gl);
  this.prepareVertexBuffers(gl);
  this.setMatrixUniforms(gl);
  this.bindTextures(gl);
  this.drawElements(gl);
}

//------------------------------------------------------------
// Prototype for billiard ball objects
//------------------------------------------------------------
var BilliardBall = function(number) {
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
  MeshObject.call(this, "common/billiard_ball.obj", textureFile, "billiardball");

  // Initial physical properties
  this.position = vec2(0.0, 0.0);
  this.velocity = vec2(0.0, 0.0);
  this.radius = 1.0;
  // TODO: 
  // TODO: Determine the textures that need 
};
BilliardBall.prototype = Object.create(MeshObject.prototype);
BilliardBall.prototype.constructor = BilliardBall;
BilliardBall.prototype.draw = function(gl) {
  this.modelViewMatrix = scalem(1.0, 1.0, 1.0);
  // Translate the ball into its position
  this.modelViewMatrix = mult(translate(this.position[0], this.position[1], 0.0), this.modelViewMatrix);
  // TODO: Translate the ball in front of the camera (with the world-view matrix)

  MeshObject.prototype.draw.call(this, gl);
}
BilliardBall.prototype.tick = function(dt) {
  // position += velocity * dt
  this.position = add(this.position, scale(dt, this.velocity));
}

//------------------------------------------------------------
// Prototype for billiard tables
//------------------------------------------------------------
var BilliardTable = function() {
  this.balls = [];
  for (var i = 0; i <= 15; ++i) {
    this.balls.push(new BilliardBall(i));
  }

  // TODO: Arrange balls in a billiards pattern
  var offset = vec2(0.1, 0.1);
  for (var i = 0; i <= 15; ++i) {
    this.balls[i].position = add(this.balls[i].position, scale(i, offset));
  }
}
BilliardTable.prototype.draw = function(gl) {
  // TODO: Transform table to its position
  for (var i = 0; i < 15; ++i) {
    this.balls[i].draw(gl);
  }
  // TODO: Transform balls to one ball-radius away from the table surface
}
BilliardTable.prototype.tick = function() {
  // TODO: Simulate the physics of billiards in 2D
  // TODO: Determine ball-ball collisions
  // TODO: Determine ball-wall collisions
  // TODO: Determine ball-hole collisions
}

//------------------------------------------------------------
// Prototype for cameras
//------------------------------------------------------------
var Camera = function() {
}
