# A cartoon Euphrasian Basilica for the country maps, built in the set's shared look (../toon.py): the
# sixth-century basilica in Poreč on the Istrian coast, its tall nave and lower aisles under red
# tiled roofs, the round apse, the front's gable glittering with its golden mosaic, the atrium with
# its colonnade in front, the octagonal baptistery and the square stone bell tower, by the blue
# Adriatic. Turned a little towards the camera.
# Run: blender -b --factory-startup -P euphrasian.py -- euphrasian-1024.png 1024 euphrasian.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#ddd4c2', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'stone': toon('stone', '#e8dcc2', shadow_mul=(0.84, 0.84, 0.88), lift=0.18),
    'stoneDark': toon('stoneDark', '#cbbc9c'),
    'roof': toon('roof', '#c0643e'),
    'gold': toon('gold', '#e8b848', lift=0.3),
    'mosaicBlue': toon('mosaicBlue', '#3a6aa8', lift=0.2),
    'water': toon('water', '#3a92c8', lift=0.3),
    'dark': flat('dark', '#2e2a2a'),
    'pine': toon('pine', '#4a7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def vstrip(x0, x1, r, z):
    """The part of a disc of radius r between x0 and x1, counter-clockwise from above."""
    a0, a1 = math.acos(x1 / r), math.acos(x0 / r)
    top = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    bottom = [(r * math.cos(-a1 + (a1 - a0) * k / 12), r * math.sin(-a1 + (a1 - a0) * k / 12), z) for k in range(13)]
    return bottom + top


def gable(name, mat, cx, cy, z0, hx, hy, z1):
    loft(name, mat, [[(cx - hx, cy - hy, z0), (cx + hx, cy - hy, z0), (cx + hx, cy + hy, z0), (cx - hx, cy + hy, z0)],
                     [(cx - 0.004, cy - hy, z1), (cx + 0.004, cy - hy, z1), (cx + 0.004, cy + hy, z1), (cx - 0.004, cy + hy, z1)]], outline=0.004)


# ---------- the sea on the right ----------
loft('sea', M['water'], [vstrip(0.72, 1.31, 1.32, G - 0.004), vstrip(0.72, 1.31, 1.32, G + 0.008)], outline=0.002)

# ---------- the basilica: nave, aisles and apse ----------
CX, Y0, Y1 = 0.0, -0.08, 0.5
CY, LEN = (Y0 + Y1) / 2, Y1 - Y0
box('nave', M['stone'], CX, CY, G - 0.005, 0.26, LEN, 0.3, outline=0.007, bevel=0)
for s in (-1, 1):
    box(f'aisle{s}', M['stone'], CX + s * 0.18, CY, G - 0.005, 0.1, LEN, 0.17, outline=0.005, bevel=0)
    xin, xout = CX + s * 0.13, CX + s * 0.24
    xa, xb = sorted((xin, xout))
    ta, tb = sorted((xin, xin + s * 0.004))
    loft(f'aisleroof{s}', M['roof'], [[(xa, Y0 - 0.01, G + 0.165), (xb, Y0 - 0.01, G + 0.165), (xb, Y1 + 0.01, G + 0.165), (xa, Y1 + 0.01, G + 0.165)],
                                      [(ta, Y0 - 0.01, G + 0.22), (tb, Y0 - 0.01, G + 0.22), (tb, Y1 + 0.01, G + 0.22), (ta, Y1 + 0.01, G + 0.22)]], outline=0.003)
    for k in range(5):
        box(f'navewin{s}{k}', M['dark'], CX + s * 0.131, Y0 + 0.08 + k * 0.1, G + 0.235, 0.006, 0.03, 0.045, outline=0, bevel=0)
gable('naveroof', M['roof'], CX, CY, G + 0.295, 0.15, LEN / 2 + 0.01, G + 0.39)
lathe('apse', M['stone'], ((0.12, 0), (0.12, 0.22)), G - 0.005, CX, Y1, segs=16, outline=0.005)
lathe('apseroof', M['roof'], ((0.135, 0), (0.003, 0.08)), G + 0.215, CX, Y1, segs=16, outline=0.003, smooth=False)
# the front: the portal, and the golden mosaic in the gable
box('portal', M['dark'], CX, Y0 - 0.003, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
box('mosaic', M['gold'], CX, Y0 - 0.004, G + 0.15, 0.22, 0.006, 0.14, outline=0.001, bevel=0)
for j in range(3):
    box(f'mosaicfigure{j}', M['mosaicBlue'], CX - 0.06 + j * 0.06, Y0 - 0.007, G + 0.17, 0.03, 0.006, 0.09, outline=0, bevel=0)
loft('gablemosaic', M['gold'], [[(CX - 0.14, Y0 - 0.012, G + 0.295), (CX + 0.14, Y0 - 0.012, G + 0.295), (CX + 0.004, Y0 - 0.012, G + 0.385), (CX - 0.004, Y0 - 0.012, G + 0.385)],
                                [(CX - 0.14, Y0 - 0.004, G + 0.295), (CX + 0.14, Y0 - 0.004, G + 0.295), (CX + 0.004, Y0 - 0.004, G + 0.385), (CX - 0.004, Y0 - 0.004, G + 0.385)]], outline=0.002)

# ---------- the atrium's colonnade ----------
AY0, AY1 = -0.42, Y0
for s in (-1, 1):
    box(f'atriumwall{s}', M['stone'], CX + s * 0.2, (AY0 + AY1) / 2, G - 0.005, 0.03, AY1 - AY0, 0.13, outline=0.003, bevel=0)
    for k in range(4):
        y = AY0 + 0.04 + k * 0.08
        rod(f'atriumcol{s}{k}', M['stoneDark'], (CX + s * 0.15, y, G), (CX + s * 0.15, y, G + 0.1), 0.009, segs=8, outline=0.001)
    loft(f'atriumroof{s}', M['roof'], [[(CX + s * 0.215 - 0.04, AY0, G + 0.1), (CX + s * 0.215 + 0.04, AY0, G + 0.1), (CX + s * 0.215 + 0.04, AY1, G + 0.1), (CX + s * 0.215 - 0.04, AY1, G + 0.1)],
                                       [(CX + s * 0.215 - 0.035, AY0, G + 0.13), (CX + s * 0.215 + 0.035, AY0, G + 0.13), (CX + s * 0.215 + 0.035, AY1, G + 0.13), (CX + s * 0.215 - 0.035, AY1, G + 0.13)]], outline=0.002)
box('atriumfront', M['stone'], CX, AY0, G - 0.005, 0.43, 0.03, 0.13, outline=0.003, bevel=0)
box('atriumgate', M['dark'], CX, AY0 - 0.016, G - 0.005, 0.07, 0.006, 0.09, outline=0, bevel=0)

# ---------- the baptistery and the bell tower ----------
lathe('baptistery', M['stone'], ((0.1, 0), (0.1, 0.15)), G - 0.005, CX, -0.62, segs=8, outline=0.004, smooth=False)
lathe('baptisteryroof', M['roof'], ((0.11, 0), (0.003, 0.08)), G + 0.145, CX, -0.62, segs=8, outline=0.003, smooth=False)
TX, TY = -0.36, -0.55
box('belltower', M['stone'], TX, TY, G - 0.005, 0.14, 0.14, 0.52, outline=0.006, bevel=0)
for k in range(3):
    box(f'towerwin{k}', M['dark'], TX, TY - 0.073, G + 0.18 + k * 0.11, 0.03 + 0.01 * k, 0.006, 0.06, outline=0, bevel=0)
pyramid('towerroof', M['roof'], TX, TY, G + 0.515, 0.16, 0.1)

# ---------- umbrella pines ----------
for k, (x, y) in enumerate(((-0.75, 0.25), (-0.7, -0.15), (-0.45, 0.75), (0.45, 0.75))):
    rod(f'pinetrunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.16), 0.014, segs=6, outline=0.002)
    b = ball(f'pine{k}', M['pine'], 0, 0, 0, 0.14, outline=0.01)
    b.scale = (1.0, 1.0, 0.45)
    b.location = (x, y, G + 0.2)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
