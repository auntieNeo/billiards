Orthographic and Perspective Views
==================================
The camera view can be switched between perspective and orthographic views by
pressing the spacebar. While in perspective view, the camera can be controlled
with the arrow keys. 

Debugging Lines
===============
Some of the lines drawn to debug the physics and 

Triangle Mesh Support
=====================
Triangle meshes are loaded from .obj files exported from Blender. The .obj file
format is parsed by a simple Javascript routine and converted into a vertex
array suitable for rendering with glDrawElements(). Some attempt is made to
avoid duplication of verticies in the mesh, but in the 

Billiard Table Surface Cursor
============================
A virtual cursor ray is projected from mouse clicks on the screen, through the
perspective transformation, and into world space where it is intersected with
the billiard table surface. This to get cursor position relative to the billiard table surface.

