# A cartoon boat lift of the Canal du Centre for the country maps, built in the set's shared look
# (../toon.py): one of the old hydraulic lifts at Houdeng in Belgium, its two great iron caissons
# full of water side by side in their riveted steel frame towers, one up and one down, each on its
# giant piston, the machine house between them with its brick front, a barge riding up in a caisson,
# and the canal at its two levels. Turned a little towards the camera.
# Run: blender -b --factory-startup -P boat-lifts.py -- boat-lifts-1024.png 1024 boat-lifts.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'canal': toon('canal', '#4a8a9a', lift=0.3),
    'steel': toon('steel', '#4a5a6a', shadow_mul=(0.84, 0.86, 0.92), lift=0.1),
    'steelLight': toon('steelLight', '#7a8a9a'),
    'brick': toon('brick', '#b86a4a', lift=0.06),
    'stone': toon('stone', '#c8c0b0', lift=0.12),
    'roof': toon('roof', '#5a5e66'),
    'window': flat('window', '#2e3238'),
    'barge': toon('barge', '#2a2a30'),
    'red': toon('red', '#c83a30'),
    'white': toon('white', '#f6f4ee'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

UZ = G + 0.4    # the upper level of the canal
# ---------- the upper reach on its embankment at the back, the lower reach in front ----------
box('embankment', M['stone'], 0, 0.62, G - 0.005, 1.3, 0.5, UZ - G, outline=0.007, bevel=0)
box('upperwater', M['canal'], 0, 0.62, UZ - 0.006, 1.2, 0.36, 0.012, outline=0, bevel=0)
box('lowerwater', M['canal'], 0, -0.62, G - 0.004, 1.6, 0.36, 0.012, outline=0, bevel=0)

# ---------- the two caissons in their towers ----------
for k, (x, up) in enumerate(((-0.25, True), (0.25, False))):
    z = UZ - 0.1 if up else G + 0.02
    # the steel guide tower: four corner posts with lattice bracing
    for sx in (-1, 1):
        for sy in (-1, 1):
            bar(f'post{k}{sx}{sy}', M['steel'], (x + sx * 0.12, sy * 0.24, G), (x + sx * 0.12, sy * 0.24, UZ + 0.25), 0.025, outline=0.003)
    for lv in range(5):
        zz = G + 0.05 + lv * (UZ + 0.2 - G) / 4
        for sy in (-1, 1):
            bar(f'tie{k}{lv}{sy}', M['steel'], (x - 0.12, sy * 0.24, zz), (x + 0.12, sy * 0.24, zz), 0.012, outline=0)
        if lv < 4:
            zn = G + 0.05 + (lv + 1) * (UZ + 0.2 - G) / 4
            bar(f'brace{k}{lv}', M['steelLight'], (x - 0.12, -0.24, zz), (x + 0.12, -0.24, zn), 0.008, outline=0)
    bar(f'topbeam{k}', M['steel'], (x, -0.24, UZ + 0.25), (x, 0.24, UZ + 0.25), 0.04, outline=0.003)
    # the caisson: a long iron tank full of water, on its piston
    box(f'caisson{k}', M['steel'], x, 0, z, 0.2, 0.44, 0.1, outline=0.005, bevel=0)
    box(f'caissonwater{k}', M['canal'], x, 0, z + 0.092, 0.17, 0.41, 0.01, outline=0, bevel=0)
    rod(f'piston{k}', M['steelLight'], (x, 0, G - 0.005), (x, 0, z), 0.05, segs=14, outline=0.004)
    for j in range(5):
        box(f'rivets{k}{j}', M['steelLight'], x, -0.223, z + 0.02 + j * 0.016, 0.19, 0.006, 0.004, outline=0, bevel=0)
# the barge riding up in the raised caisson
box('barge', M['barge'], -0.25, 0, UZ - 0.0, 0.12, 0.34, 0.05, outline=0.004, bevel=0)
box('bargecabin', M['white'], -0.25, 0.12, UZ + 0.05, 0.1, 0.07, 0.05, outline=0.003, bevel=0)
box('bargestripe', M['red'], -0.25, 0, UZ + 0.04, 0.122, 0.3, 0.008, outline=0, bevel=0)

# ---------- the machine house in the middle ----------
box('machinehouse', M['brick'], 0, -0.35, G - 0.005, 0.24, 0.16, 0.24, outline=0.006, bevel=0)
for j in range(2):
    box(f'mhwin{j}', M['window'], -0.05 + j * 0.1, -0.433, G + 0.08, 0.05, 0.006, 0.1, outline=0, bevel=0)
loft('mhroof', M['roof'], [[(-0.13, -0.44, G + 0.235), (0.13, -0.44, G + 0.235), (0.13, -0.26, G + 0.235), (-0.13, -0.26, G + 0.235)],
                           [(-0.13, -0.352, G + 0.3), (0.13, -0.352, G + 0.3), (0.13, -0.348, G + 0.3), (-0.13, -0.348, G + 0.3)]], outline=0.003)
for k, (x, y) in enumerate(((-0.85, -0.25), (0.85, -0.25), (-0.75, 0.15), (0.75, 0.15))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.13, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
