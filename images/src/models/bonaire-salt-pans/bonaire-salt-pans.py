# A cartoon of the salt pans of Bonaire for the country maps, built in the set's shared look
# (../toon.py): the pink salt pans of the Pekelmeer, the white salt piles with their conveyor, the
# low slave huts by the shore and the red obelisk that told ships where to load, flamingos wading in
# the pans, and the sea. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bonaire-salt-pans.py -- bonaire-salt-pans-1024.png 1024 bonaire-salt-pans.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#e6dcc4', shadow_mul=(0.84, 0.8, 0.84), lift=0.25),
    'pan': toon('pan', '#f2a6bc', shadow_mul=(0.84, 0.78, 0.86), lift=0.3),
    'sea': toon('sea', '#2fa8c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'salt': toon('salt', '#fbfaf6', shadow_mul=(0.8, 0.84, 0.94), lift=0.2),
    'conveyor': toon('conveyor', '#8a8e96', shadow_mul=(0.8, 0.8, 0.88)),
    'hut': toon('hut', '#f4efe4', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#c4703a'),
    'door': flat('door', '#3a3640'),
    'obelisk': toon('obelisk', '#c8382c'),
    'flamingo': toon('flamingo', '#f06a7e', lift=0.25),
    'beak': flat('beak', '#2e2a30'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1087)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


def squashed(name, mat, x, y, z, r, sx, sy, sz, outline=0.02):
    b = ball(name, mat, 0, 0, 0, r, outline=outline)
    b.scale = (sx, sy, sz)
    b.location = (x, y, z)
    return b


# ---------- the sea along the front left ----------
flat_face('sea', M['sea'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(190, 266, 5)], G + 0.005, outline=0.01)

# ---------- the pink pans, with the dikes between them ----------
for i, x in enumerate((-0.62, -0.14, 0.34)):
    for j, y in enumerate((-0.12, 0.3)):
        box(f'pan{i}{j}', M['pan'], x, y, G - 0.004, 0.44, 0.38, 0.012, outline=0.006, bevel=0)

# ---------- the salt piles and the conveyor ----------
for k, (x, y, s) in enumerate(((0.55, 0.78, 1.0), (0.05, 0.92, 0.8))):
    lathe(f'saltpile{k}', M['salt'], ((0.34 * s, 0), (0.29 * s, 0.1 * s), (0.18 * s, 0.25 * s), (0.06 * s, 0.33 * s), (0.004, 0.35 * s)), G - 0.01, x, y, segs=22,
          outline=0.016)
bar('conveyor', M['conveyor'], (0.95, 0.35, G + 0.05), (0.62, 0.72, G + 0.38), 0.035, outline=0.006)
for k, f in enumerate((0.25, 0.6)):
    x, y, z = 0.95 + (0.62 - 0.95) * f, 0.35 + (0.72 - 0.35) * f, G + 0.05 + 0.33 * f
    rod(f'conveyorleg{k}', M['conveyor'], (x, y, G), (x, y, z), 0.008, segs=6, outline=0.003)

# ---------- the slave huts by the shore, and the red obelisk ----------
for k in range(5):
    x, y = -0.62 + k * 0.13, -0.62 + k * 0.015
    box(f'hut{k}', M['hut'], x, y, G - 0.005, 0.1, 0.09, 0.055, outline=0.006, bevel=0)
    loft(f'hutroof{k}', M['roof'], [[(x - 0.058, y - 0.052, G + 0.05), (x + 0.058, y - 0.052, G + 0.05), (x + 0.058, y + 0.052, G + 0.05), (x - 0.058, y + 0.052, G + 0.05)],
                                    [(x - 0.058, y - 0.002, G + 0.1), (x + 0.058, y - 0.002, G + 0.1), (x + 0.058, y + 0.002, G + 0.1), (x - 0.058, y + 0.002, G + 0.1)]],
         outline=0.005)
    box(f'hutdoor{k}', M['door'], x, y - 0.046, G + 0.0, 0.03, 0.006, 0.04, outline=0, bevel=0)
lathe('obelisk', M['obelisk'], ((0.045, 0), (0.032, 0.34), (0.004, 0.4)), G - 0.005, 0.12, -0.55, segs=4, outline=0.008)

# ---------- flamingos wading in the pans ----------
for k, (x, y, a) in enumerate(((-0.6, -0.1, 0.3), (-0.48, 0.0, -0.4), (-0.2, 0.32, 0.2), (0.3, -0.15, 2.6), (0.42, 0.25, 3.0))):
    c, s = math.cos(a), math.sin(a)
    for side in (-1, 1):
        lx, ly = x - s * side * 0.012, y + c * side * 0.012
        rod(f'flamingoleg{k}{side}', M['flamingo'], (lx, ly, G + 0.008), (lx, ly, G + 0.1), 0.004, segs=5, outline=0.002)
    squashed(f'flamingobody{k}', M['flamingo'], x, y, G + 0.115, 0.04, 1.45, 0.85, 0.8, outline=0.008)
    nx, ny = x + 0.045 * c, y + 0.045 * s
    rod(f'flamingoneck{k}', M['flamingo'], (nx, ny, G + 0.125), (nx + 0.02 * c, ny + 0.02 * s, G + 0.2), 0.008, segs=6, outline=0.003)
    hx, hy = nx + 0.03 * c, ny + 0.03 * s
    ball(f'flamingohead{k}', M['flamingo'], hx, hy, G + 0.21, 0.016, outline=0.004)
    bar(f'flamingobeak{k}', M['beak'], (hx + 0.012 * c, hy + 0.012 * s, G + 0.207), (hx + 0.03 * c, hy + 0.03 * s, G + 0.19), 0.008, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
