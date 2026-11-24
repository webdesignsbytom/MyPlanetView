# A cartoon Ani for the country maps, built in the set's shared look (../toon.py): the ruined
# medieval Armenian capital on its windswept plateau at the edge of the Akhurian gorge, the red-stone
# cathedral standing roofless with its blind arcades and broken dome, the little round church of St
# Gregory with its conical roof on the cliff's edge, the city walls' towers, and the deep gorge with
# its river below. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ani.py -- ani-1024.png 1024 ani.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'steppe': toon('steppe', '#c8c088', shadow_mul=(0.82, 0.82, 0.8), lift=0.2),
    'cliff': toon('cliff', '#a8885e', shadow_mul=(0.86, 0.8, 0.76)),
    'river': toon('river', '#5a8aa0', lift=0.3),
    'red': toon('red', '#b8604a', shadow_mul=(0.86, 0.78, 0.76), lift=0.08),
    'redDark': toon('redDark', '#985040'),
    'stone': toon('stone', '#c8a888', lift=0.1),
    'dark': flat('dark', '#2e2622'),
})

G = tile(M['steppe'])
before = set(bpy.data.objects)
rng = random.Random(989)


def vstrip(x0, x1, r, z, n=8):
    """The band of the tile's disc between x0 and x1 (counter-clockwise from above)."""
    ya0, ya1 = math.sqrt(r * r - x0 * x0), math.sqrt(r * r - x1 * x1)
    b0, b1 = math.acos(x0 / r), math.acos(x1 / r)
    pts = [(x0, -ya0)]
    pts += [(r * math.cos(-b0 + (b0 - b1) * k / n), r * math.sin(-b0 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x1, -ya1), (x1, ya1)]
    pts += [(r * math.cos(b1 + (b0 - b1) * k / n), r * math.sin(b1 + (b0 - b1) * k / n)) for k in range(1, n)]
    pts += [(x0, ya0)]
    return [(x, y, z) for x, y in pts]


# the plateau, raised, with the gorge cutting down its right side to the river
PZ = G + 0.16
loft('plateau', M['steppe'], [vstrip(-1.41, 0.5, 1.42, G - 0.01), vstrip(-1.39, 0.5, 1.4, PZ)], outline=0.006)
loft('cliffface', M['cliff'], [vstrip(0.48, 0.52, 1.42, G - 0.01), vstrip(0.48, 0.52, 1.42, PZ)], outline=0.002)
loft('river', M['river'], [vstrip(0.75, 1.0, 1.42, G - 0.004), vstrip(0.75, 1.0, 1.42, G + 0.004)], outline=0)
loft('farbank', M['cliff'], [vstrip(1.0, 1.41, 1.42, G - 0.01), vstrip(1.0, 1.39, 1.4, PZ - 0.02)], outline=0.004)

# ---------- the cathedral, roofless, its dome fallen ----------
CX, CY = -0.25, 0.2
W, D, H = 0.42, 0.5, 0.36
box('cathedral', M['red'], CX, CY, PZ - 0.005, W, D, H, outline=0.008, bevel=0)
for face, (nx, ny, length) in enumerate(((0, -1, W), (-1, 0, D))):
    for j in range(6):
        o = -length / 2 + (j + 0.5) * length / 6
        x = CX + nx * (W / 2 + 0.003) + (o if ny else 0)
        y = CY + ny * (D / 2 + 0.003) + (o if nx else 0)
        box(f'blindarch{face}{j}', M['redDark'], x, y, PZ + 0.08, 0.035 if ny else 0.006, 0.006 if ny else 0.035, 0.2, outline=0, bevel=0)
box('cathedraldoor', M['dark'], CX, CY - D / 2 - 0.004, PZ - 0.005, 0.06, 0.006, 0.14, outline=0, bevel=0)
box('cathedralwindow', M['dark'], CX, CY - D / 2 - 0.004, PZ + 0.22, 0.03, 0.006, 0.07, outline=0, bevel=0)
# the broken top: a jagged hole where the drum and dome stood
for k in range(10):
    x, y = CX + rng.uniform(-W / 2 + 0.03, W / 2 - 0.03), CY + rng.uniform(-D / 2 + 0.03, D / 2 - 0.03)
    if abs(x - CX) < 0.12 and abs(y - CY) < 0.12:
        continue
    box(f'brokenblock{k}', M['red'], x, y, PZ + H - 0.01, rng.uniform(0.05, 0.1), rng.uniform(0.05, 0.1), rng.uniform(0.02, 0.07), outline=0.003, bevel=0)
box('hole', M['dark'], CX, CY, PZ + H - 0.004, 0.22, 0.22, 0.006, outline=0, bevel=0)
loft('gable', M['red'], [[(CX - W / 2, CY - D / 2, PZ + H - 0.005), (CX + W / 2, CY - D / 2, PZ + H - 0.005), (CX + W / 2, CY - D / 2 + 0.04, PZ + H - 0.005), (CX - W / 2, CY - D / 2 + 0.04, PZ + H - 0.005)],
                         [(CX - 0.004, CY - D / 2, PZ + H + 0.1), (CX + 0.004, CY - D / 2, PZ + H + 0.1), (CX + 0.004, CY - D / 2 + 0.04, PZ + H + 0.1), (CX - 0.004, CY - D / 2 + 0.04, PZ + H + 0.1)]], outline=0.004)

# ---------- St Gregory of Tigran Honents on the cliff edge ----------
GX, GY = 0.32, -0.25
lathe('stgregory', M['red'], ((0.1, 0), (0.1, 0.22)), PZ - 0.005, GX, GY, segs=12, outline=0.006, smooth=False)
for k in range(6):
    a = -math.pi / 2 + (k - 2.5) * 0.45
    box(f'gregoryarch{k}', M['redDark'], GX + 0.102 * math.cos(a), GY + 0.102 * math.sin(a), PZ + 0.05, 0.03, 0.006, 0.12, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('gregorydrum', M['red'], ((0.06, 0), (0.06, 0.08)), PZ + 0.215, GX, GY, segs=12, outline=0.004, smooth=False)
lathe('gregorycone', M['stone'], ((0.07, 0), (0.003, 0.12)), PZ + 0.29, GX, GY, segs=12, outline=0.004, smooth=False)

# ---------- the city walls' towers along the back ----------
for k, x in enumerate((-0.95, -0.7, -0.45, -0.2, 0.05, 0.3)):
    y = 0.72 + 0.05 * (k % 2)
    if math.hypot(x, y) > 1.2:
        continue
    box(f'walltower{k}', M['stone'], x, y, PZ - 0.005, 0.12, 0.12, 0.22 - 0.04 * (k % 3), outline=0.005, bevel=0)
    if k < 5:
        box(f'wall{k}', M['stone'], x + 0.125, 0.74, PZ - 0.005, 0.14, 0.06, 0.12, outline=0.004, bevel=0)
for k in range(8):
    x, y = rng.uniform(-0.9, 0.3), rng.uniform(-0.85, 0.5)
    if math.hypot(x - CX, y - CY) < 0.4 or math.hypot(x - GX, y - GY) < 0.2:
        continue
    box(f'ruin{k}', M['stone'], x, y, PZ - 0.005, rng.uniform(0.08, 0.16), 0.04, rng.uniform(0.03, 0.07), rot_z=rng.uniform(0, math.pi), outline=0.003, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
