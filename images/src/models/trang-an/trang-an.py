# A cartoon Tràng An for the country maps, built in the set's shared look (../toon.py): Ninh Bình's
# limestone towers rising out of the paddies and the winding river, green jungle on their tops, a
# cave mouth at the water, and rowing boats with their rowers in conical hats. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P trang-an.py -- trang-an-1024.png 1024 trang-an.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paddy': toon('paddy', '#9ac858', shadow_mul=(0.74, 0.82, 0.72), lift=0.2),
    'river': toon('river', '#4a9a8a', lift=0.3),
    'karst': toon('karst', '#8a8a80', shadow_mul=(0.82, 0.84, 0.86)),
    'karstGreen': toon('karstGreen', '#3f7a3a', shadow_mul=(0.72, 0.8, 0.76)),
    'cave': flat('cave', '#1e1a18'),
    'boat': toon('boat', '#8a5a34'),
    'hat': toon('hat', '#e8d8a0', lift=0.2),
    'shirt': toon('shirt', '#2f6ac0'),
})

G = tile(M['paddy'])
before = set(bpy.data.objects)
rng = random.Random(2267)

# ---------- the river ----------
RIV = [(-1.25, -0.3), (-0.7, -0.45), (-0.2, -0.25), (0.25, -0.45), (0.7, -0.3), (1.25, -0.45)]
for k in range(len(RIV) - 1):
    (x0, y0), (x1, y1) = RIV[k], RIV[k + 1]
    a = math.atan2(y1 - y0, x1 - x0) + math.pi / 2
    w = 0.12
    quad = [(x0 - w * math.cos(a), y0 - w * math.sin(a)), (x1 - w * math.cos(a), y1 - w * math.sin(a)), (x1 + w * math.cos(a), y1 + w * math.sin(a)), (x0 + w * math.cos(a), y0 + w * math.sin(a))]
    loft(f'river{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.004) for x, y in quad]], outline=0.003)
    if k:
        lathe(f'riverjoin{k}', M['river'], ((w, 0), (w, 0.008)), G - 0.004, x0, y0, segs=14, outline=0)
for j in range(5):
    box(f'paddyline{j}', M['karstGreen'], -0.2 + j * 0.15, -0.85, G - 0.003, 0.006, 0.35, 0.008, outline=0, bevel=0)

# ---------- the karst towers ----------
TOWERS = ((-0.55, 0.35, 0.22, 0.62), (0.0, 0.55, 0.26, 0.72), (0.55, 0.3, 0.22, 0.6), (-0.95, 0.0, 0.16, 0.42), (0.95, -0.05, 0.16, 0.4), (-0.15, 0.1, 0.15, 0.4), (0.3, 0.85, 0.18, 0.5), (-0.6, 0.85, 0.16, 0.45))
for k, (x, y, r, h) in enumerate(TOWERS):
    prof = ((r, 0), (r * 1.05, h * 0.3), (r * 1.0, h * 0.65), (r * 0.8, h * 0.88), (r * 0.4, h))
    lathe(f'karst{k}', M['karst'], prof, G - 0.01, x, y, segs=10, outline=0.012)
    b = ball(f'jungle{k}', M['karstGreen'], 0, 0, 0, r * 0.9, outline=0.008)
    b.scale = (1.0, 1.0, 0.55)
    b.location = (x, y, G + h * 0.92)
    for j in range(3):
        a = rng.uniform(math.pi * 1.1, math.pi * 1.9)
        ball(f'ledgeplant{k}{j}', M['karstGreen'], x + r * math.cos(a), y + r * math.sin(a), G + h * rng.uniform(0.3, 0.75), r * 0.25, outline=0.004)
# the cave mouth at the water
x, y, r, h = TOWERS[5]
lathe('cavemouth', M['cave'], ((0.07, 0), (0.05, 0.06), (0.004, 0.1)), G + 0.0, x + 0.02, y - r * 0.98, segs=8, outline=0, smooth=False)


# ---------- the rowing boats ----------
def boat(name, x, y, a):
    box(f'{name}hull', M['boat'], x, y, G - 0.002, 0.2, 0.06, 0.03, rot_z=a, outline=0.004, bevel=0)
    for j, off in enumerate((-0.05, 0.05)):
        px, py = x + off * math.cos(a), y + off * math.sin(a)
        lathe(f'{name}person{j}', M['shirt'], ((0.016, 0), (0.012, 0.05)), G + 0.025, px, py, segs=8, outline=0.002)
        lathe(f'{name}hat{j}', M['hat'], ((0.035, 0), (0.004, 0.03)), G + 0.075, px, py, segs=12, outline=0.002)
    bar(f'{name}oar', M['boat'], (x + 0.05 * math.cos(a), y + 0.05 * math.sin(a), G + 0.05), (x + 0.12 * math.cos(a) + 0.06 * math.sin(a), y + 0.12 * math.sin(a) - 0.06 * math.cos(a), G), 0.006, outline=0)


boat('boat0', -0.45, -0.38, -0.2)
boat('boat1', 0.45, -0.37, 0.35)
boat('boat2', 0.05, -0.33, -0.3)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
