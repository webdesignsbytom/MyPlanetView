# A cartoon Guilin for the country maps, built in the set's shared look (../toon.py): the tall green
# karst peaks rising straight out of the plain along the Li river, the river winding between them,
# a fisherman on his bamboo raft with a lantern and his cormorants, and a wisp of mist.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P guilin.py -- guilin-1024.png 1024 guilin.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'plain': toon('plain', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'river': toon('river', '#4aa8a0', shadow_mul=(0.74, 0.84, 0.86), lift=0.3),
    'karst': toon('karst', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'karstDark': toon('karstDark', '#3f8a46', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#9a968e', shadow_mul=(0.84, 0.84, 0.9)),
    'bamboo': toon('bamboo', '#c8b070', shadow_mul=(0.86, 0.8, 0.74)),
    'hat': toon('hat', '#e0c88a', lift=0.2),
    'coat': toon('coat', '#2f4a6a'),
    'lantern': toon('lantern', '#e8402c', lift=0.3),
    'bird': toon('bird', '#2e2a30'),
    'mist': toon('mist', '#ffffff', shadow_mul=(0.88, 0.9, 0.96), lift=0.1),
})

G = tile(M['plain'])
before = set(bpy.data.objects)
rng = random.Random(1423)

# ---------- the Li river winding through ----------
RIV = [(-1.25, -0.5), (-0.8, -0.35), (-0.35, -0.5), (0.1, -0.3), (0.45, 0.05), (0.75, 0.35), (1.05, 0.6)]
for k in range(len(RIV) - 1):
    (x0, y0), (x1, y1) = RIV[k], RIV[k + 1]
    a = math.atan2(y1 - y0, x1 - x0) + math.pi / 2
    w = 0.15
    quad = [(x0 - w * math.cos(a), y0 - w * math.sin(a)), (x1 - w * math.cos(a), y1 - w * math.sin(a)), (x1 + w * math.cos(a), y1 + w * math.sin(a)),
            (x0 + w * math.cos(a), y0 + w * math.sin(a))]
    loft(f'river{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.003) for x, y in quad]], outline=0.004)
    cyl(f'riverjoin{k}', M['river'], w, 0.007, segs=16, outline=0, matrix=Matrix.Translation((x1, y1, G - 0.004)))

# ---------- the karst peaks ----------
PEAKS = [(-0.75, 0.25, 0.2, 0.62), (-0.4, 0.55, 0.22, 0.78), (-0.95, 0.65, 0.17, 0.5), (0.05, 0.55, 0.19, 0.66), (0.4, 0.85, 0.2, 0.72), (-0.15, 0.92, 0.16, 0.55),
         (0.95, -0.1, 0.18, 0.58), (0.6, -0.45, 0.17, 0.5), (-0.25, 0.05, 0.15, 0.44), (1.05, 0.95, 0.12, 0.42), (0.1, -0.8, 0.14, 0.38)]
for k, (x, y, r, h) in enumerate(PEAKS):
    prof = ((r, 0), (r * 1.05, h * 0.25), (r * 0.95, h * 0.55), (r * 0.7, h * 0.82), (r * 0.35, h * 0.96), (0.004, h))
    lathe(f'peak{k}', M['karst' if k % 2 else 'karstDark'], prof, G - 0.01, x, y, segs=14, outline=0.014)
    bar(f'cliff{k}', M['rock'], (x - r * 0.3, y - r * 0.98, G + h * 0.2), (x - r * 0.2, y - r * 0.9, G + h * 0.6), 0.04, outline=0.003)

# ---------- a fisherman on his bamboo raft, with cormorants ----------
RX, RY, RA = -0.3, -0.45, 0.25
c, s = math.cos(RA), math.sin(RA)
for j in range(6):
    v = -0.05 + j * 0.02
    rod(f'bamboo{j}', M['bamboo'], (RX - 0.16 * c - v * s, RY - 0.16 * s + v * c, G + 0.012), (RX + 0.16 * c - v * s, RY + 0.16 * s + v * c, G + 0.022), 0.01, segs=6,
        outline=0.002)
rod('fisher', M['coat'], (RX - 0.04 * c, RY - 0.04 * s, G + 0.02), (RX - 0.04 * c, RY - 0.04 * s, G + 0.12), 0.018, segs=8, outline=0.003)
lathe('hat', M['hat'], ((0.05, 0), (0.004, 0.03)), G + 0.125, RX - 0.04 * c, RY - 0.04 * s, segs=12, outline=0.004)
rod('pole', M['bamboo'], (RX - 0.04 * c, RY - 0.04 * s, G + 0.08), (RX + 0.18 * c, RY + 0.18 * s, G + 0.16), 0.005, segs=5, outline=0)
ball('lantern', M['lantern'], RX + 0.17 * c, RY + 0.17 * s, G + 0.14, 0.016, outline=0.003)
for k, u in enumerate((0.07, 0.12)):
    x, y = RX + u * c, RY + u * s
    b = ball(f'cormorant{k}', M['bird'], 0, 0, 0, 0.018, outline=0.003)
    b.scale = (1.0, 1.0, 1.6)
    b.location = (x, y, G + 0.05)
    ball(f'cormoranthead{k}', M['bird'], x + 0.01, y, G + 0.085, 0.01, outline=0.002)

# ---------- a wisp of mist between the peaks ----------
for k, (dx, r) in enumerate(((0.0, 0.07), (0.09, 0.06), (-0.08, 0.055), (0.16, 0.05))):
    b = ball(f'mist{k}', M['mist'], 0, 0, 0, r, outline=0.008)
    b.scale = (1.8, 1.0, 0.6)
    b.location = (-0.55 + dx, 0.42, G + 0.32)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
