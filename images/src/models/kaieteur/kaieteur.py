# A cartoon Kaieteur Falls for the country maps, built in the set's shared look (../toon.py): the
# Potaro River, tea-dark with tannin, running across the rainforest plateau to the edge of its
# horseshoe of sandstone cliff and dropping in one great white fall to the gorge below, the spray
# rising from its foot, rainforest above and below, and in front a giant tank bromeliad with the
# tiny golden rocket frog that lives in it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kaieteur.py -- kaieteur-1024.png 1024 kaieteur.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'floor': toon('floor', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'cliff': toon('cliff', '#8a6a52', shadow_mul=(0.8, 0.74, 0.8)),
    'cliffDark': toon('cliffDark', '#6b5040', shadow_mul=(0.8, 0.74, 0.8)),
    'plateau': toon('plateau', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'forestLight': toon('forestLight', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'amber': toon('amber', '#8a5a2a', shadow_mul=(0.8, 0.74, 0.74), lift=0.35),
    'fall': toon('fall', '#f4efe2', shadow_mul=(0.84, 0.82, 0.86), lift=0.15),
    'fallAmber': toon('fallAmber', '#e8cfa0', shadow_mul=(0.84, 0.8, 0.8), lift=0.15),
    'mist': toon('mist', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'bromeliad': toon('bromeliad', '#7ab85a', shadow_mul=(0.7, 0.78, 0.8)),
    'bromeliadRed': toon('bromeliadRed', '#c8503a'),
    'frog': toon('frog', '#f4c83c', shadow_mul=(0.8, 0.68, 0.55), lift=0.35),
    'eye': flat('eye', '#1a161c'),
})

G = tile(M['floor'])
before = set(bpy.data.objects)
rng = random.Random(439)

# ---------- the plateau and its horseshoe of cliff ----------
# the cliff's edge curves round in a horseshoe, its middle (where the river falls) set back
PTS = []
for k in range(21):
    x = -1.25 + k * 0.125
    bay = 0.22 * math.exp(-((x + 0.05) / 0.35) ** 2)        # the horseshoe's bay round the fall
    PTS.append((x, 0.05 + bay + 0.04 * math.sin(k * 1.3)))
BACK = [(x, 1.32 * math.sqrt(max(0.0, 1 - (x / 1.4) ** 2))) for x, _ in reversed(PTS)]
TOP = 0.72
base = [(x, y, G - 0.01) for x, y in PTS] + [(x, max(y, y0 + 0.1), G - 0.01) for (x, y), (_, y0) in zip(BACK, reversed(PTS))]
top = [(x, y + 0.02, G + TOP) for x, y in PTS] + [(x, max(y, y0 + 0.1), G + TOP) for (x, y), (_, y0) in zip(BACK, reversed(PTS))]
cliff = loft('cliff', M['cliff'], [base, top], outline=0.035)
cliff.visible_shadow = False
for k in range(8):
    x = -1.05 + k * 0.3
    if abs(x + 0.05) < 0.2:
        continue
    y = 0.05 + 0.22 * math.exp(-((x + 0.05) / 0.35) ** 2) - 0.005
    box(f'band{k}', M['cliffDark'], x, y, G + 0.05, 0.06, 0.012, TOP - 0.15, outline=0, bevel=0)
plat = loft('plateautop', M['plateau'], [top, [(x, y, z + 0.03) for x, y, z in top]], outline=0.02)
plat.visible_shadow = False
T = G + TOP + 0.03
for k in range(16):
    x = rng.uniform(-1.0, 1.0)
    y = rng.uniform(0.45, 1.15)
    if abs(x + 0.05) < 0.16 or math.hypot(x, y) > 1.28:
        continue
    ball(f'canopy{k}', M['forest' if k % 2 else 'forestLight'], x, y, T + 0.06, rng.uniform(0.09, 0.13), outline=0.016)

# ---------- the river across the plateau, and the fall ----------
RX = -0.05
box('river', M['amber'], RX, 0.75, T - 0.02, 0.24, 1.0, 0.03, outline=0.01, bevel=0)
EDGE_Y = 0.05 + 0.22 - 0.01
for k in range(5):
    t = k / 5
    z1 = TOP + 0.02 - t * TOP
    z0 = TOP + 0.02 - (t + 0.2) * TOP
    w = 0.24 + 0.04 * t
    y = EDGE_Y - 0.03 - 0.04 * t
    loft(f'fall{k}', M['fallAmber' if k == 0 else 'fall'], [[(RX - w / 2, y - 0.03, G + z0), (RX + w / 2, y - 0.03, G + z0), (RX + w / 2, y, G + z0), (RX - w / 2, y, G + z0)],
                                                            [(RX - w / 2, y - 0.03, G + z1), (RX + w / 2, y - 0.03, G + z1), (RX + w / 2, y, G + z1),
                                                             (RX - w / 2, y, G + z1)]], outline=0.01 if k == 0 else 0)
for k, (dx, dz, r) in enumerate(((-0.12, 0.08, 0.11), (0.1, 0.07, 0.1), (0.0, 0.12, 0.13), (-0.05, 0.22, 0.09), (0.08, 0.2, 0.08))):
    ball(f'mist{k}', M['mist'], RX + dx, EDGE_Y - 0.25, G + dz, r, outline=0.016)
# the river runs on through the gorge below
for k, ((x0, y0), (x1, y1)) in enumerate((((RX, EDGE_Y - 0.25), (RX + 0.15, -0.5)), ((RX + 0.15, -0.5), (RX - 0.05, -0.95)), ((RX - 0.05, -0.95), (RX + 0.08, -1.32)))):
    box(f'gorgeriver{k}', M['amber'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.002, math.hypot(x1 - x0, y1 - y0) + 0.14, 0.14, 0.008, rot_z=math.atan2(y1 - y0, x1 - x0),
        outline=0.008, bevel=0)

# ---------- rainforest in the gorge ----------
for k, (x, y) in enumerate(((-0.85, -0.35), (-0.55, -0.7), (0.65, -0.45), (0.95, -0.15), (-1.05, 0.0), (0.45, -0.95), (-0.35, -1.1))):
    ball(f'gorgetree{k}', M['forest' if k % 2 else 'forestLight'], x, y, G + 0.12, rng.uniform(0.11, 0.15), outline=0.018)

# ---------- a giant tank bromeliad, and its golden rocket frog ----------
BX, BY = 0.6, -0.95
for k in range(9):
    a = 2 * math.pi * k / 9
    leaf = ball(f'bromeliadleaf{k}', M['bromeliadRed' if k % 3 == 0 else 'bromeliad'], 0, 0, 0, 0.1, outline=0.01)
    leaf.scale = (1.3, 0.3, 0.25)
    leaf.rotation_euler = (0, -0.8, a)
    leaf.location = (BX + 0.08 * math.cos(a), BY + 0.08 * math.sin(a), G + 0.08)
cyl('bromeliadtank', M['amber'], 0.04, 0.01, segs=12, outline=0, matrix=Matrix.Translation((BX, BY, G + 0.09)))
f = ball('frog', M['frog'], 0, 0, 0, 0.03, outline=0.006)
f.scale = (1.2, 1.0, 0.75)
f.location = (BX - 0.01, BY - 0.04, G + 0.12)
for s in (-1, 1):
    ball(f'frogeye{s}', M['frog'], BX - 0.03, BY - 0.04 + s * 0.016, G + 0.14, 0.011, outline=0.003)
    ball(f'frogpupil{s}', M['eye'], BX - 0.037, BY - 0.04 + s * 0.016, G + 0.144, 0.005, outline=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
