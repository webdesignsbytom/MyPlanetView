# A cartoon Ajanta for the country maps, built in the set's shared look (../toon.py): the Buddhist
# caves carved round the horseshoe bend of the Waghora gorge, their pillared fronts and the great
# horseshoe windows of the prayer halls in a row along the cliff, the river below and the wooded
# plateau above. Turned a little towards the camera.
# Run: blender -b --factory-startup -P ajanta.py -- ajanta-1024.png 1024 ajanta.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'valley': toon('valley', '#8ab860', shadow_mul=(0.72, 0.8, 0.74), lift=0.2),
    'river': toon('river', '#4a8ab0', lift=0.3),
    'basalt': toon('basalt', '#9a8068', shadow_mul=(0.86, 0.82, 0.82)),
    'carved': toon('carved', '#b89a78', shadow_mul=(0.86, 0.8, 0.78), lift=0.08),
    'cave': flat('cave', '#2e2620'),
    'top': toon('top', '#6a9a48', shadow_mul=(0.72, 0.8, 0.74)),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['valley'])
before = set(bpy.data.objects)
rng = random.Random(2261)

# ---------- the horseshoe cliff: a curve of wall sections ----------
CX, CY, R = 0.0, -0.35, 1.0
H = 0.45
N = 12
for k in range(N):
    a0 = math.radians(20 + k * 140 / N)
    a1 = math.radians(20 + (k + 1) * 140 / N)
    inner = [(CX + R * math.cos(a), CY + R * math.sin(a)) for a in (a0, a1)]
    outer = [(CX + (R + 0.32) * math.cos(a), CY + (R + 0.32) * math.sin(a)) for a in (a0, a1)]
    foot = [inner[0], inner[1], outer[1], outer[0]]
    if any(math.hypot(x, y) > 1.36 for x, y in foot):
        foot = [(x * min(1.0, 1.34 / max(math.hypot(x, y), 1e-6)), y * min(1.0, 1.34 / max(math.hypot(x, y), 1e-6))) for x, y in foot]
    c = loft(f'cliff{k}', M['basalt'], [[(x, y, G - 0.01) for x, y in foot], [(x, y, G + H) for x, y in foot]], outline=0.012)
    c.visible_shadow = False
    loft(f'clifftop{k}', M['top'], [[(x, y, G + H - 0.005) for x, y in foot], [(x, y, G + H + 0.025) for x, y in foot]], outline=0.005)
    am = (a0 + a1) / 2
    fx, fy = CX + (R - 0.004) * math.cos(am), CY + (R - 0.004) * math.sin(am)
    rot = am + math.pi / 2
    if k % 3 == 1:
        # a prayer hall: its horseshoe window over the door
        box(f'hallfront{k}', M['carved'], fx, fy, G + 0.12, 0.16, 0.01, 0.24, rot_z=rot, outline=0.003, bevel=0)
        lathe(f'hallwindow{k}', M['cave'], ((0.05, 0), (0.035, 0.05), (0.004, 0.08)), G + 0.23, fx - 0.006 * math.cos(am), fy - 0.006 * math.sin(am), segs=10, outline=0, smooth=False)
        box(f'halldoor{k}', M['cave'], fx - 0.008 * math.cos(am), fy - 0.008 * math.sin(am), G + 0.12, 0.05, 0.004, 0.08, rot_z=rot, outline=0, bevel=0)
    else:
        box(f'cavefront{k}', M['carved'], fx, fy, G + 0.13, 0.17, 0.01, 0.12, rot_z=rot, outline=0.003, bevel=0)
        box(f'cave{k}', M['cave'], fx - 0.008 * math.cos(am), fy - 0.008 * math.sin(am), G + 0.14, 0.13, 0.004, 0.08, rot_z=rot, outline=0, bevel=0)
        for j in range(4):
            t = -0.05 + j * 0.033
            rod(f'pillar{k}{j}', M['carved'], (fx + t * math.cos(rot) - 0.012 * math.cos(am), fy + t * math.sin(rot) - 0.012 * math.sin(am), G + 0.14),
                (fx + t * math.cos(rot) - 0.012 * math.cos(am), fy + t * math.sin(rot) - 0.012 * math.sin(am), G + 0.22), 0.006, segs=5, outline=0.001)
    for j in range(2):
        tx, ty = CX + (R + 0.15) * math.cos(am + 0.05 * j), CY + (R + 0.15) * math.sin(am + 0.05 * j)
        if math.hypot(tx, ty) < 1.28:
            ball(f'toptree{k}{j}', M['tree'], tx, ty, G + H + 0.06, 0.05, outline=0.005)
# the ledge path along the caves
for k in range(N):
    a = math.radians(20 + (k + 0.5) * 140 / N)
    box(f'ledge{k}', M['carved'], CX + (R - 0.04) * math.cos(a), CY + (R - 0.04) * math.sin(a), G + 0.1, 0.2, 0.08, 0.03, rot_z=a + math.pi / 2, outline=0.003, bevel=0)

# ---------- the river ----------
RIV = [(-1.2, -0.25), (-0.6, -0.5), (0.0, -0.55), (0.6, -0.5), (1.2, -0.25)]
for k in range(len(RIV) - 1):
    (x0, y0), (x1, y1) = RIV[k], RIV[k + 1]
    a = math.atan2(y1 - y0, x1 - x0) + math.pi / 2
    w = 0.07
    quad = [(x0 - w * math.cos(a), y0 - w * math.sin(a)), (x1 - w * math.cos(a), y1 - w * math.sin(a)), (x1 + w * math.cos(a), y1 + w * math.sin(a)), (x0 + w * math.cos(a), y0 + w * math.sin(a))]
    loft(f'river{k}', M['river'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.004) for x, y in quad]], outline=0.003)
    if k:
        lathe(f'riverjoin{k}', M['river'], ((w, 0), (w, 0.008)), G - 0.004, x0, y0, segs=12, outline=0)

turn(before, -20)
render(G)
