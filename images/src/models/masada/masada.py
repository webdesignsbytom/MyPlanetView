# A cartoon Masada for the country maps, built in the set's shared look (../toon.py): Herod's
# fortress on its flat-topped rock above the Judaean desert, the sheer cliffs, the ruined walls and
# store-houses on top, the northern palace's terraces at its tip, the snake path zigzagging up, the
# cable car, and the Dead Sea's pale water and salt beyond. Turned a little towards the camera.
# Run: blender -b --factory-startup -P masada.py -- masada-1024.png 1024 masada.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'desert': toon('desert', '#e0c08a', shadow_mul=(0.86, 0.78, 0.72), lift=0.25),
    'rock': toon('rock', '#c8a074', shadow_mul=(0.86, 0.76, 0.7)),
    'rockDark': toon('rockDark', '#a8805a', shadow_mul=(0.86, 0.76, 0.7)),
    'top': toon('top', '#d8b888', shadow_mul=(0.86, 0.78, 0.72), lift=0.2),
    'ruin': toon('ruin', '#c8aa80', shadow_mul=(0.86, 0.8, 0.76)),
    'path': toon('path2', '#f0dcb0', lift=0.25),
    'deadsea': toon('deadsea', '#7ac8c8', shadow_mul=(0.76, 0.86, 0.88), lift=0.35),
    'salt': toon('salt', '#fbf8f0', lift=0.2),
    'cable': flat('cable', '#4a4650'),
    'car': toon('car', '#e8402c'),
})

G = tile(M['desert'])
before = set(bpy.data.objects)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the Dead Sea at the side ----------
flat_face('salt', M['salt'], [(1.41 * math.cos(math.radians(a)), 1.41 * math.sin(math.radians(a))) for a in range(-80, 71, 4)], G + 0.003, outline=0.006)
flat_face('deadsea', M['deadsea'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(-62, 53, 4)], G + 0.006, outline=0.008)

# ---------- the rock: a mesa, its flat top ----------
FOOT = [(-0.75, -0.25), (-0.3, -0.42), (0.35, -0.32), (0.55, 0.05), (0.3, 0.55), (-0.35, 0.62), (-0.8, 0.3)]
CEN = (-0.15, 0.12)


def shrink(f, z):
    return [(CEN[0] + (x - CEN[0]) * f, CEN[1] + (y - CEN[1]) * f, G + z) for x, y in FOOT]


rock = loft('mesa', M['rock'], [shrink(1.0, -0.01), shrink(0.9, 0.1), shrink(0.8, 0.42)], outline=0.018)
rock.visible_shadow = False
top = loft('mesatop', M['top'], [shrink(0.8, 0.415), shrink(0.78, 0.43)], outline=0.006)
top.visible_shadow = False
T = G + 0.43
for k in range(6):
    x = -0.55 + k * 0.17
    bar(f'gully{k}', M['rockDark'], (x, -0.4 + 0.02 * k, G + 0.02), (x * 0.82 - 0.02, -0.28 + 0.02 * k, G + 0.4), 0.03, outline=0.002)

# ---------- the ruins on top ----------
for k, (x, y, w, d) in enumerate(((-0.35, 0.15, 0.2, 0.08), (-0.1, 0.25, 0.25, 0.06), (0.05, 0.0, 0.14, 0.14), (-0.35, -0.1, 0.12, 0.1), (0.15, 0.25, 0.1, 0.08))):
    box(f'ruin{k}', M['ruin'], x, y, T - 0.005, w, d, 0.06, outline=0.005, bevel=0)
    box(f'ruininner{k}', M['top'], x, y, T + 0.02, w - 0.03, d - 0.03, 0.045, outline=0, bevel=0)
# the northern palace's terraces at the tip
for i in range(3):
    box(f'palace{i}', M['ruin'], -0.3, 0.52 - i * 0.03, T - 0.04 - i * 0.07, 0.18 - i * 0.03, 0.08, 0.05, outline=0.005, bevel=0)

# ---------- the snake path and the cable car ----------
ZIG = [(0.7, -0.55, 0.0), (0.42, -0.42, 0.08), (0.62, -0.32, 0.16), (0.38, -0.25, 0.25), (0.5, -0.15, 0.33), (0.3, -0.1, 0.43)]
for k in range(len(ZIG) - 1):
    (x0, y0, z0), (x1, y1, z1) = ZIG[k], ZIG[k + 1]
    bar(f'snakepath{k}', M['path'], (x0, y0, G + z0 + 0.01), (x1, y1, G + z1 + 0.01), 0.025, outline=0.002)
bar('cable', M['cable'], (0.95, -0.2, G + 0.05), (0.42, 0.05, T + 0.02), 0.005, outline=0)
box('cablecar', M['car'], 0.7, -0.08, G + 0.19, 0.06, 0.04, 0.04, outline=0.004, bevel=0)

turn(before, -20)
render(G)
