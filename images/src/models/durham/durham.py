# A cartoon Durham for the country maps, built in the set's shared look (../toon.py): the Norman
# cathedral on its wooded peninsula, its great central tower and the two west towers over the
# gorge, the castle's octagonal keep beside it, the River Wear looping round below, and the
# Prebends Bridge. Turned a little towards the camera.
# Run: blender -b --factory-startup -P durham.py -- durham-1024.png 1024 durham.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'river': toon('river', '#4a7a9a', lift=0.3),
    'wood': toon('wood', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#c8b088', shadow_mul=(0.86, 0.82, 0.78), lift=0.1),
    'stoneDark': toon('stoneDark', '#a89070', shadow_mul=(0.86, 0.82, 0.78)),
    'roof': toon('roof', '#5a5a62'),
    'window': flat('window', '#3a3430'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2341)

# ---------- the river's loop ----------
for k in range(24):
    a0, a1 = math.radians(190 + k * 6.6), math.radians(190 + (k + 1) * 6.6)
    r = 0.95
    p0 = (r * math.cos(a0), 0.15 + r * math.sin(a0))
    p1 = (r * math.cos(a1), 0.15 + r * math.sin(a1))
    w = 0.09
    quad = [(p0[0] - w * math.cos(a0), p0[1] - w * math.sin(a0)), (p1[0] - w * math.cos(a1), p1[1] - w * math.sin(a1)), (p1[0] + w * math.cos(a1), p1[1] + w * math.sin(a1)), (p0[0] + w * math.cos(a0), p0[1] + w * math.sin(a0))]
    loft(f'river{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.006) for x, y in quad]], outline=0)

# ---------- the wooded peninsula ----------
pen = lathe('peninsula', M['grass'], ((0.8, 0), (0.62, 0.12), (0.5, 0.16)), G - 0.01, 0.0, 0.15, segs=28, outline=0.01)
pen.visible_shadow = False
def ground(rr):
    if rr >= 0.62:
        return G - 0.01 + 0.12 * (0.8 - rr) / 0.18
    if rr >= 0.5:
        return G - 0.01 + 0.12 + 0.04 * (0.62 - rr) / 0.12
    return G + 0.15


for k in range(26):
    a = rng.uniform(math.pi * 0.95, math.pi * 2.05)
    r = rng.uniform(0.56, 0.74)
    x, y = r * math.cos(a), 0.15 + r * math.sin(a)
    rad = rng.uniform(0.05, 0.07)
    ball(f'tree{k}', M['wood'], x, y, ground(r) + rad * 0.6, rad, outline=0.006)
T = G + 0.155

# ---------- the cathedral ----------
CX, CY = -0.05, 0.2
box('nave', M['stone'], CX, CY, T - 0.005, 0.62, 0.18, 0.2, outline=0.01, bevel=0)
for j in range(6):
    box(f'navewin{j}', M['window'], CX - 0.25 + j * 0.1, CY - 0.092, T + 0.07, 0.03, 0.006, 0.08, outline=0, bevel=0)
loft('naveroof', M['roof'], [[(CX - 0.31, CY - 0.09, T + 0.195), (CX + 0.31, CY - 0.09, T + 0.195), (CX + 0.31, CY + 0.09, T + 0.195), (CX - 0.31, CY + 0.09, T + 0.195)],
                             [(CX - 0.31, CY - 0.004, T + 0.26), (CX + 0.31, CY - 0.004, T + 0.26), (CX + 0.31, CY + 0.004, T + 0.26), (CX - 0.31, CY + 0.004, T + 0.26)]], outline=0.006)
box('transept', M['stone'], CX + 0.05, CY, T - 0.005, 0.14, 0.36, 0.2, outline=0.008, bevel=0)
box('centraltower', M['stone'], CX + 0.05, CY, T + 0.19, 0.16, 0.16, 0.3, outline=0.009, bevel=0)
for j in range(2):
    box(f'centraltowerwin{j}', M['window'], CX + 0.01 + j * 0.08, CY - 0.082, T + 0.27, 0.03, 0.006, 0.14, outline=0, bevel=0)
for j in range(5):
    box(f'centralcrenel{j}', M['stoneDark'], CX - 0.02 + j * 0.035, CY - 0.07, T + 0.485, 0.02, 0.02, 0.03, outline=0.001, bevel=0)
for s in (-1, 1):
    box(f'westtower{s}', M['stone'], CX - 0.33, CY + s * 0.07, T - 0.005, 0.1, 0.1, 0.4, outline=0.007, bevel=0)
    for j in range(3):
        box(f'westcrenel{s}{j}', M['stoneDark'], CX - 0.36 + j * 0.03, CY + s * 0.07 - 0.04, T + 0.395, 0.018, 0.02, 0.025, outline=0.001, bevel=0)
box('apse', M['stone'], CX + 0.34, CY, T - 0.005, 0.08, 0.16, 0.18, outline=0.006, bevel=0)

# ---------- the castle ----------
KX, KY = 0.1, 0.5
box('castlerange', M['stoneDark'], KX, KY, T - 0.005, 0.3, 0.14, 0.14, outline=0.007, bevel=0)
lathe('keep', M['stone'], ((0.09, 0), (0.09, 0.26)), T - 0.005, KX + 0.12, KY - 0.02, segs=8, outline=0.007, smooth=False)
for j in range(8):
    a = 2 * math.pi * j / 8
    box(f'keepcrenel{j}', M['stoneDark'], KX + 0.12 + 0.09 * math.cos(a), KY - 0.02 + 0.09 * math.sin(a), T + 0.25, 0.03, 0.03, 0.03, rot_z=a, outline=0.001, bevel=0)

# ---------- the Prebends Bridge ----------
a = math.radians(250)
bx, by = 0.95 * math.cos(a), 0.15 + 0.95 * math.sin(a)
for j in range(3):
    t0, t1 = -0.12 + j * 0.08, -0.04 + j * 0.08
    pts = [(bx + (t0 + (t1 - t0) * i / 6) * math.cos(a), by + (t0 + (t1 - t0) * i / 6) * math.sin(a), G + 0.02 + 0.04 * math.sin(math.pi * i / 6)) for i in range(7)]
    for i in range(6):
        bar(f'bridge{j}{i}', M['stone'], pts[i], pts[i + 1], 0.05, outline=0.003)

turn(before, -20)
render(G)
