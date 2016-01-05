Loading Screen with Instructions
================================
The game was taking a while to load, so I added a loading screen, and some game
instructions that can be read before starting the game.

Billiard Table Surface Cursor
=============================
A virtual cursor ray is projected from mouse clicks on the screen, through the
perspective transformation, and into world space where it is intersected with
the billiard table surface. This produces a cursor position relative to the
billiard table surface, and allows the user to control the cue stick and cue
ball drop in either orthographic or perspective views.

The math for this should be pretty much the same as when casting a ray from the
screen in ray tracing. I used this excellent guide for reference:
<http://antongerdelan.net/opengl/raycasting.html>

Intuitive Cue Ball Drop
=======================
The cue ball drops wherever you click. It won't let you place the cue ball in
stupid places (inside other balls, inside pockets, etc.)

Intuitive Cue Stick Control
===========================
I experimented with cue stick control, and decided on a single-click control to
activate the cue stick. This allows the user to position the cue stick and
decide on the relative power of the shot before committing to making a shot.

To avoid loss of precision angle control for weak shots, the cursor must be
moved a certain radius away from the cue stick's point before the cue stick is
dragged.

This control method has the drawback of requiring some margin on the edge of
the screen to avoid having loss of control. I use this margin for the HUD.

Orthographic and Perspective Views
==================================
The camera view can be switched between perspective and orthographic views by
pressing the spacebar. While in perspective view, the camera can be controlled
with the arrow keys or with WASD. Camera zoom isn't supported yet. 

Smooth Camera
=============
The smooth camera is a complete accident. I did not know how to derive the
"look at" quaternion rotation, so I made a routine that rotated the current
camera and then corrected the camera roll (the "up" vector). In retrospect, I
should have constructed the orientation without regard to the current camera
orientation. I never got around to that, though, because my flawed "look at"
routine animates the camera rotation with each application, which looks a whole
lot better than the stiff camera that a traditional lookat produces.

I would like to determine exactly how this "look towards" works, and if I can
use it in a cleaner way in the future.

Triangle Mesh Support
=====================
Triangle meshes are loaded from .obj files exported from Blender. The .obj file
format is parsed by a simple Javascript routine and converted into a vertex
array suitable for rendering with glDrawElements(). Some attempt is made to
avoid duplication of verticies in the mesh, but in the interest of time (and
without any external libraries to use) the mesh loading code is not very
sophisticated.

Signed Distance Field Textures
==============================
One of the key features of my billiards game is the sharp textures for the
numbers on the balls. Initially, I used some high resolution textures for the
ball surfaces with a simple shader. I quickly discovered that the mip-mapping
was making the edges of my balls blurry, and the text of the balls was blurry
and unreadable at a distance. I had read about using Signed Distance Fields
(SDF) for sharp textures in Real-Time Rendering (Akenine-Moller 2008) and had
wanted to try it out. I decided to go with SDF rather than something like
anisotropic filtering, and I think it turned out nicely.

I could explain SDF here, but Chris Green's paper
<http://www.valvesoftware.com/publications/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf>
would do a better job. The way I understand it is that distance fields are
easier for the graphics card to interpolate correctly than bitmasks. SDF's are
relatively linear, and the values around each edge spread out over multiple
pixels rather than just one. This prevents the edges from being lost in
sampling, or being blurred by mip-mapping.

SDF Texture Generation
======================
I could probably have found some third party tool to generate SDF textures and
still have remained true to the "no third party libraries" requirement.
However, I wanted to become more familiar with SDF, so I wrote a small C
program that uses libpng and some brute-force loops to generate my SDF
textures. The program is located under ./sdf. It's very small, but the
brute-force method is very expensive. It would take my desktop several hours to
generate all of the SDF textures I use in my game. I also have a Makefile for
automating (and parallelizing) the process of SDF generation. There's obvious
room for improvement, but the end result is the same.

SDF Near and Far Textures
=========================
After using SDF for a short while, I discovered that textures that looked good
for far away balls looked bad on close up balls, and vice versa. I came to the
conclusion that this was due to the limited precision of the 8-bit alpha
channel. The following explaination is an exerpt from billiards.js:

// We need two textures for SDF; one for shots close to the balls, and one
// for shots far away. For far away shots, the frequency of details in the
// ball numbers is very high. For these shots we need to set the spread of
// distance values very high, lest our sharp number edges be interpolated
// into nothing. On the flip side, setting the spread very high increases
// banding in the alpha channel (just look at the far sdf textures) which
// severely reduces the accuracy of edges on close shots. This is due to
// the limited precision of the 8-bit alpha channel.
// 
// So the pratical solution to have the best of both worlds is to include
// both textures, one with a high spread (the far texture), and one with a
// low spread (the near texture). We need to bind these textures ourselves,
// since the generic MeshObject prototype won't do that for us.

So I generate and include two SDF textures for each ball, one for near balls
and one for far balls.

In the shader, I needed to choose between near and far textures, but the value
of gl_FragCoord.z has already been scaled by the projection matrix. I used the
derivation of the projection matrix on page 114 of "Mathematics for 3D Game
Programming and Computer Graphics" (Lengyel 2012) to derive for myself the
inverse operation and get the Z depth in meters (that was fun).

Rotating Balls
==============
For the rotating ball orientations, I used quaternions rather than Euler
angles, with the hope that that the orientations would stay numerically stable.
After writing the ball rotation code, I ended up using quaternions for pretty
much everything else. I used "Quaternions and Rotation Sequences" (Kuipers
1999) and "Mathematics for 3D Game Programming and Computer Graphics"
(Lengyel 2012) as references while making the quaternion math routines.

Ball-Cushion Collisions
=======================
The cushions are represented in the physics simulation as trapezoids (see the
debugging lines feature at the bottom if you're curious). The physics
simulation supports collisions between balls and arbitrary polygons using the
Separating Axis Theorem algorithm, breifly mentioned on Wikipedia here:
<https://en.wikipedia.org/wiki/Hyperplane_separation_theorem#Use_in_collision_detection>
The algorithm is relatively intuative; the only material I used was that
article. One of the more difficult aspects of implementing the algorithm was
getting the correct normals (with correct polygon winding). The debugging lines
show these normals.

Ball-Cushion Corner Collision
=============================
In addition to supporting relatively simple ball-ball and ball-wall collisions,
the physics simulation also approximates ball-corner collisions. This was
the most difficult problem I faced at one point.

To approximate corner collisions, the physics simulation first identifies states in the Separating Axis Theorem algorithm that might indicate that the ball is colliding with a corner. If the ball is colliding with a corner, the intersected lengths of the edges that intersect the ball need to be measured. The normals of each edge are then weighted by their intersected lengths, and the resulting normal is used for the corner collision.

Solving this problem involved line-circle intersection, which is practically
the same as ray-sphere interaction used in ray tracing. Once again, I used
"Mathematics for 3D Game Programming and Computer Graphics" (Lengyel 2012) as a
reference while solving this problem.

Sound
=====
Some rudimentary sound support is included. A single ball-to-ball sound effect
with a CC license was included from
<https://www.freesound.org/people/juskiddink/sounds/108615/>. I would have
wanted to include other sound effects (ball-cushion, ball-stick, rolling ball)
but I did not have the time or equipment to record them myself.

Debugging Lines
===============
Some of the lines drawn to debug the ball physics and the table surface cursor
routines are retained in a debug object. Debugging can be enabled by changing
the ENABLE_DEBUG variable to true at the top of billiards.js.

Replays
=======
Replays are implemented by using deterministic timesteps for the physics
simulation. The cameras construct a list of pockets to watch for balls.

I figure this is so easy, it should also be easy to do some sort of
online multiplayer.

Simplistic Nine Ball rules
==========================
The game logic state machine implements simple Nine Ball rules (rules from my head). 

P.S. I was using Closure Linter for some time, but it wanted so badly to
rearrange the columns in my matrices that I gave up on it. There are too many
false positives to wade through for something written in a two-week timeframe.
I found myself wasting a lot of time with it and I decided whatever it was
worth to you, it wasn't worth it to me. I'm sorry.
