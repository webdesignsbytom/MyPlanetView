# A cartoon Toledo for the country maps, built in the set's shared look (../toon.py): the old city on
# its hill in the Tagus's bend, the Alcázar's great square block with its four corner towers and
# slate spires on the top, the cathedral's Gothic spire, the roofs of the town climbing between,
# and the Alcántara bridge over the river. Turned a little towards the camera.
# Run: blender -b --factory-startup -P toledo.py -- toledo-1024.png 1024 toledo.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'land': toon('land', '#b8a870', shadow_mul=(0.84, 0.82, 0.74), lift=0.2),
    'river': toon('river', '#5a8a9a', lift=0.25),
    'hill': toon('hill', '#c8b080', shadow_mul=(0.86, 0.82, 0.74)),
    'stone': toon('stone', '#e0d0a8', shadow_mul=(0.86, 0.82, 0.78), lift=0.12),
    'stoneDark': toon('stoneDark', '#c0aa80', shadow_mul=(0.86, 0.82, 0.78)),
    'slate': toon('slate', '#4a5058'),
    'roof': toon('roof', '#c4704a'),
    'h0': toon('h0', '#ecdcc0'), 'h1': toon('h1', '#d8c09a'), 'h2': toon('h2', '#e8d4b0'),
    'window': flat('window', '#2e2a28'),
})

G = tile(M['land'])
before = set(bpy.data.objects)
rng = random.Random(2287)

# ---------- the river's bend round the front ----------
for k in range(20):
    a0, a1 = math.radians(195 + k * 7.5), math.radians(195 + (k + 1) * 7.5)
    r = 0.88
    p0 = (r * math.cos(a0), 0.15 + r * 0.85 * math.sin(a0))
    p1 = (r * math.cos(a1), 0.15 + r * 0.85 * math.sin(a1))
    w = 0.1
    nx0, ny0 = math.cos(a0), math.sin(a0)
    nx1, ny1 = math.cos(a1), math.sin(a1)
    quad = [(p0[0] - w * nx0, p0[1] - w * ny0), (p1[0] - w * nx1, p1[1] - w * ny1), (p1[0] + w * nx1, p1[1] + w * ny1), (p0[0] + w * nx0, p0[1] + w * ny0)]
    loft(f'river{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.006) for x, y in quad]], outline=0.0)

# ---------- the hill and the town ----------
hl = lathe('hill', M['hill'], ((0.76, 0), (0.6, 0.1), (0.42, 0.18)), G - 0.01, 0.0, 0.15, segs=24, outline=0.01)
hl.visible_shadow = False
for k in range(22):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.25, 0.62)
    x, y = r * math.cos(a), 0.15 + r * 0.85 * math.sin(a)
    z = G + 0.18 * max(0.0, min(1.0, (0.76 - r) / 0.34)) - 0.01
    h = rng.uniform(0.05, 0.08)
    box(f'house{k}', M[f'h{k % 3}'], x, y, z, 0.09, 0.08, h, rot_z=a, outline=0.004, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, z + h, 0.1, 0.04, outline=0.003)
T = G + 0.17

# ---------- the Alcázar ----------
AX, AY = 0.25, 0.2
box('alcazar', M['stone'], AX, AY, T - 0.005, 0.34, 0.34, 0.2, outline=0.01, bevel=0)
for r in range(2):
    for j in range(5):
        box(f'alcwin{r}{j}', M['window'], AX - 0.12 + j * 0.06, AY - 0.172, T + 0.05 + r * 0.08, 0.025, 0.006, 0.04, outline=0, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f'alctower{sx}{sy}', M['stone'], AX + sx * 0.17, AY + sy * 0.17, T - 0.005, 0.08, 0.08, 0.27, outline=0.006, bevel=0)
        pyramid(f'alcspire{sx}{sy}', M['slate'], AX + sx * 0.17, AY + sy * 0.17, T + 0.265, 0.09, 0.12, outline=0.005)

# ---------- the cathedral ----------
CX, CY = -0.25, 0.25
box('cathedral', M['stoneDark'], CX, CY, T - 0.005, 0.2, 0.36, 0.18, outline=0.008, bevel=0)
loft('cathroof', M['slate'], [[(CX - 0.1, CY - 0.18, T + 0.175), (CX + 0.1, CY - 0.18, T + 0.175), (CX + 0.1, CY + 0.18, T + 0.175), (CX - 0.1, CY + 0.18, T + 0.175)],
                              [(CX - 0.004, CY - 0.18, T + 0.24), (CX + 0.004, CY - 0.18, T + 0.24), (CX + 0.004, CY + 0.18, T + 0.24), (CX - 0.004, CY + 0.18, T + 0.24)]], outline=0.005)
box('cathtower', M['stone'], CX - 0.12, CY - 0.15, T - 0.005, 0.09, 0.09, 0.34, outline=0.006, bevel=0)
for t, (r, h) in enumerate(((0.05, 0.06), (0.04, 0.05))):
    lathe(f'cathtier{t}', M['stone'], ((r, 0), (r, h)), T + 0.335 + t * 0.06, CX - 0.12, CY - 0.15, segs=8, outline=0.004, smooth=False)
lathe('cathspire', M['slate'], ((0.035, 0), (0.004, 0.18)), T + 0.445, CX - 0.12, CY - 0.15, segs=8, outline=0.004, smooth=False)

# ---------- the Alcántara bridge ----------
BX, BY = 0.75, -0.25
ang = math.radians(-40)
for j in range(2):
    t0, t1 = -0.1 + j * 0.1, 0.0 + j * 0.1
    pts = [(BX + (t0 + (t1 - t0) * i / 6) * math.cos(ang), BY + (t0 + (t1 - t0) * i / 6) * math.sin(ang), G + 0.02 + 0.05 * math.sin(math.pi * i / 6)) for i in range(7)]
    for i in range(6):
        bar(f'bridge{j}{i}', M['stone'], pts[i], pts[i + 1], 0.06, outline=0.004)
box('bridgedeck', M['stoneDark'], BX, BY, G + 0.06, 0.24, 0.06, 0.02, rot_z=ang, outline=0.003, bevel=0)
box('bridgegate', M['stone'], BX + 0.13 * math.cos(ang), BY + 0.13 * math.sin(ang), G - 0.005, 0.07, 0.07, 0.14, rot_z=ang, outline=0.004, bevel=0)

turn(before, -20)
render(G)
