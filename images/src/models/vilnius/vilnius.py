# A cartoon Vilnius for the country maps, built in the set's shared look (../toon.py): the white
# neoclassical cathedral with its portico of columns and statues on the roof, its tall bell tower
# standing apart in the square, and Gediminas Tower in red brick on its green castle hill behind,
# the flag flying. Turned a little towards the camera.
# Run: blender -b --factory-startup -P vilnius.py -- vilnius-1024.png 1024 vilnius.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8ccb4', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'hill': toon('hill', '#5a9a48', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f6f3ea', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'roof': toon('roof', '#7a7e88', shadow_mul=(0.8, 0.82, 0.9)),
    'brick': toon('brick', '#b8603e', shadow_mul=(0.86, 0.76, 0.72)),
    'window': flat('window', '#3a3640'),
    'y': toon('flagYellow', '#f0c030', lift=0.3), 'g': toon('flagGreen', '#2a8a3a'), 'r': toon('flagRed', '#c8302a'),
    'pole': toon('pole', '#d8d4cc'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(1777)


def ring(cx, cy, rx, ry, z, k, sides=22):
    return [(cx + rx * math.cos(t) * (1 + 0.05 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.05 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the castle hill and Gediminas Tower ----------
HX, HY = 0.45, 0.7
hill = loft('hill', M['hill'], [ring(HX, HY, 0.65, 0.45, -0.01, 1), ring(HX, HY + 0.03, 0.4, 0.28, 0.22, 1), ring(HX, HY + 0.04, 0.24, 0.17, 0.3, 1)], outline=0.016, smooth=True)
hill.visible_shadow = False
lathe('gediminas', M['brick'], ((0.1, 0), (0.1, 0.18), (0.085, 0.19), (0.085, 0.3)), G + 0.29, HX, HY + 0.04, segs=8, outline=0.012, smooth=False)
for j in range(8):
    a = math.pi / 8 + j * math.pi / 4
    box(f'gedwin{j}', M['window'], HX + 0.087 * math.cos(a), HY + 0.04 + 0.087 * math.sin(a), G + 0.5, 0.02, 0.006, 0.04, rot_z=a + math.pi / 2, outline=0, bevel=0)
rod('flagpole', M['pole'], (HX, HY + 0.04, G + 0.59), (HX, HY + 0.04, G + 0.78), 0.005, segs=6, outline=0.002)
for k, c in enumerate(('y', 'g', 'r')):
    box(f'flag{k}', M[c], HX + 0.05, HY + 0.04, G + 0.74 - k * 0.025, 0.09, 0.006, 0.025, outline=0.002, bevel=0)
for k in range(6):
    a = math.radians(200 + k * 25)
    ball(f'hilltree{k}', M['tree'], HX + 0.55 * math.cos(a), HY + 0.38 * math.sin(a), G + 0.07, 0.06, outline=0.01)

# ---------- the cathedral ----------
CX, CY = -0.25, 0.05
box('cathedral', M['white'], CX, CY, G - 0.005, 0.6, 0.36, 0.22, outline=0.014, bevel=0)
box('cathroof', M['roof'], CX, CY + 0.02, G + 0.215, 0.58, 0.3, 0.04, outline=0.006, bevel=0)
for j in range(6):
    rod(f'column{j}', M['white'], (CX - 0.2 + j * 0.08, CY - 0.22, G - 0.005), (CX - 0.2 + j * 0.08, CY - 0.22, G + 0.2), 0.017, segs=10, outline=0.004)
box('entablature', M['white'], CX, CY - 0.2, G + 0.2, 0.46, 0.08, 0.035, outline=0.006, bevel=0)
loft('pediment', M['white'], [[(CX - 0.24, CY - 0.24, G + 0.235), (CX + 0.24, CY - 0.24, G + 0.235), (CX + 0.24, CY - 0.16, G + 0.235), (CX - 0.24, CY - 0.16, G + 0.235)],
                              [(CX - 0.004, CY - 0.24, G + 0.31), (CX + 0.004, CY - 0.24, G + 0.31), (CX + 0.004, CY - 0.16, G + 0.31), (CX - 0.004, CY - 0.16, G + 0.31)]],
     outline=0.008)
for k, dx in enumerate((-0.24, 0.0, 0.24)):
    z = G + 0.31 if k == 1 else G + 0.235
    rod(f'statue{k}', M['white'], (CX + dx, CY - 0.2, z), (CX + dx, CY - 0.2, z + 0.07), 0.012, segs=6, outline=0.003)
    ball(f'statuehead{k}', M['white'], CX + dx, CY - 0.2, z + 0.08, 0.011, outline=0.002)
for j in range(4):
    box(f'cathwin{j}', M['window'], CX - 0.302, CY - 0.1 + j * 0.07, G + 0.07, 0.006, 0.03, 0.07, outline=0, bevel=0)

# ---------- the bell tower apart in the square ----------
BX, BY = 0.3, -0.25
for i, (w, h) in enumerate(((0.14, 0.2), (0.12, 0.12), (0.1, 0.1), (0.08, 0.08))):
    z = G - 0.005 + sum(hh for _, hh in ((0.14, 0.2), (0.12, 0.12), (0.1, 0.1), (0.08, 0.08))[:i])
    box(f'belltower{i}', M['white'], BX, BY, z, w, w, h, outline=0.008, bevel=0)
    box(f'belltowerwin{i}', M['window'], BX, BY - w / 2 - 0.004, z + h * 0.3, 0.025, 0.006, h * 0.45, outline=0, bevel=0)
lathe('belltowerspire', M['roof'], ((0.04, 0), (0.004, 0.12)), G + 0.495, BX, BY, segs=8, outline=0.005)

turn(before, -20)
render(G)
