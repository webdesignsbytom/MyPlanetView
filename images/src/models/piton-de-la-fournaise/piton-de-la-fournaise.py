# A cartoon Piton de la Fournaise for the country maps, built in the set's shared look
# (../toon.py): Réunion's volcano in its great caldera, the Enclos, its rust-brown cone with the
# glowing Dolomieu crater and a red lava flow down its side, the little red cone of Formica Leo, the
# caldera's sheer green ramparts curving round behind, and hikers on the path. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P piton-de-la-fournaise.py -- piton-de-la-fournaise-1024.png 1024 piton-de-la-fournaise.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'floor': toon('floor', '#7a5e50', shadow_mul=(0.84, 0.8, 0.84), lift=0.2),
    'cone': toon('cone', '#8a5a48', shadow_mul=(0.84, 0.76, 0.8)),
    'coneTop': toon('coneTop', '#6a4a40', shadow_mul=(0.84, 0.78, 0.82)),
    'crater': toon('crater', '#3e3436', shadow_mul=(0.84, 0.84, 0.9)),
    'lava': flat('lava', '#ff6a2a'),
    'glow': flat('glow', '#ffc040'),
    'rampart': toon('rampart', '#4f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'rampartRock': toon('rampartRock', '#7a6e64', shadow_mul=(0.82, 0.8, 0.86)),
    'leo': toon('leo', '#b8503a'),
    'path': toon('path2', '#c8b08a', lift=0.25),
    'shirt': toon('shirt', '#3f7fc0'), 'shirt2': toon('shirt2', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)), 'skin': toon('skin', '#e0b090'),
})

G = tile(M['floor'])
before = set(bpy.data.objects)
rng = random.Random(919)

# ---------- the Enclos' ramparts curving round the back: a horseshoe of cliffs, in pieces ----------
for k in range(14):
    a0, a1 = math.radians(15 + k * 11), math.radians(26 + k * 11)
    quad = [(1.0 * math.cos(a0), 0.95 * math.sin(a0)), (1.34 * math.cos(a0), 1.3 * math.sin(a0)), (1.34 * math.cos(a1), 1.3 * math.sin(a1)), (1.0 * math.cos(a1), 0.95 * math.sin(a1))]
    rock = loft(f'rampartcliff{k}', M['rampartRock'], [[(x, y, G - 0.01) for x, y in quad], [(x, y, G + 0.32) for x, y in quad]], outline=0.012)
    rock.visible_shadow = False
    top = loft(f'rampartforest{k}', M['rampart'], [[(x, y, G + 0.31) for x, y in quad], [(x, y, G + 0.36) for x, y in quad]], outline=0.008)
    top.visible_shadow = False

# ---------- the cone, the crater, the lava ----------
CX, CY = 0.05, 0.15
cone = loft('cone', M['cone'], [[(CX + 0.6 * math.cos(t), CY + 0.42 * math.sin(t), G - 0.01) for t in (2 * math.pi * j / 24 for j in range(24))],
                                [(CX + 0.3 * math.cos(t), CY + 0.22 * math.sin(t), G + 0.3) for t in (2 * math.pi * j / 24 for j in range(24))],
                                [(CX + 0.2 * math.cos(t), CY + 0.15 * math.sin(t), G + 0.38) for t in (2 * math.pi * j / 24 for j in range(24))]], outline=0.022, smooth=True)
cone.visible_shadow = False
crater = loft('crater', M['crater'], [[(CX + 0.2 * math.cos(t), CY + 0.15 * math.sin(t), G + 0.38) for t in (2 * math.pi * j / 24 for j in range(24))],
                                     [(CX + 0.14 * math.cos(t), CY + 0.1 * math.sin(t), G + 0.32) for t in (2 * math.pi * j / 24 for j in range(24))]], outline=0.01)
crater.visible_shadow = False
cyl('lavapool', M['lava'], 1.0, 0.01, segs=20, outline=0, matrix=Matrix.Translation((CX, CY, G + 0.325)) @ Matrix.Scale(0.13, 4, (1, 0, 0)) @ Matrix.Scale(0.09, 4, (0, 1, 0)))
cyl('lavaglow', M['glow'], 1.0, 0.012, segs=20, outline=0, matrix=Matrix.Translation((CX + 0.02, CY, G + 0.326)) @ Matrix.Scale(0.06, 4, (1, 0, 0)) @ Matrix.Scale(0.04, 4, (0, 1, 0)))
# a lava flow down the front of the cone and out over the floor
FLOW = [(CX + 0.05, CY - 0.15, 0.37), (CX + 0.08, CY - 0.28, 0.24), (CX + 0.1, CY - 0.4, 0.06), (CX + 0.15, CY - 0.55, 0.01), (CX + 0.25, CY - 0.75, 0.008)]
bm = bmesh.new()
verts = []
for i, (x, y, z) in enumerate(FLOW):
    w = 0.03 + 0.03 * i / len(FLOW)
    verts.append((bm.verts.new((x - w, y, G + z + 0.008)), bm.verts.new((x + w, y, G + z + 0.008))))
for (a0, a1), (b0, b1) in zip(verts, verts[1:]):
    bm.faces.new((a0, a1, b1, b0))
finish('lavaflow', bm, M['lava'], outline=0.004)

# ---------- Formica Leo, the path and hikers ----------
lathe('formicaleo', M['leo'], ((0.1, 0), (0.06, 0.06), (0.04, 0.08), (0.03, 0.05)), G - 0.005, -0.55, -0.35, segs=14, outline=0.01)
box('path', M['path'], -0.45, -0.75, G - 0.004, 0.08, 0.75, 0.008, rot_z=0.5, outline=0.003, bevel=0)
for k, (x, y, mat) in enumerate(((-0.35, -0.6, 'shirt'), (-0.42, -0.72, 'shirt2'))):
    rod(f'hikerlegs{k}', M['crater'], (x, y, G), (x, y, G + 0.05), 0.01, segs=6, outline=0.002)
    rod(f'hikerbody{k}', M[mat], (x, y, G + 0.05), (x, y, G + 0.1), 0.016, segs=8, outline=0.003)
    ball(f'hikerhead{k}', M['skin'], x, y, G + 0.12, 0.015, outline=0.003)

turn(before, -20)
render(G)
