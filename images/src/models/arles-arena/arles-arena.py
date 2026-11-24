# A cartoon Arles Amphitheatre for the country maps, built in the set's shared look (../toon.py):
# the Roman arena's oval of honey stone, its two storeys of arches all the way round, the stepped
# seating falling to the sandy floor inside, and the three square medieval towers still standing
# on its rim from the days when it was a fortress. Turned a little towards the camera.
# Run: blender -b --factory-startup -P arles-arena.py -- arles-arena-1024.png 1024 arles-arena.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8ccb0', shadow_mul=(0.84, 0.82, 0.86), lift=0.2),
    'stone': toon('stone', '#d8c49a', shadow_mul=(0.86, 0.82, 0.76), lift=0.08),
    'stoneDark': toon('stoneDark', '#b8a070'),
    'sand': toon('sand', '#e8d4a0'),
    'dark': flat('dark', '#3a3028'),
    'roof': toon('roof', '#c4603e'),
    'cream': toon('cream', '#f0e6cc', lift=0.1),
    'window': flat('window', '#3a3430'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)
rng = random.Random(2479)

CX, CY, RO, RI, H, SY = 0.0, 0.0, 0.6, 0.28, 0.27, 0.78
mark = set(bpy.data.objects)
lathe('arena', M['stone'], ((RO, 0), (RO, H), (RO - 0.06, H), (RO - 0.12, H * 0.78), (RO - 0.2, H * 0.52), (RI + 0.04, H * 0.22), (RI, 0.03), (RI, 0.012)), G - 0.005, CX, CY, segs=48, outline=0.009)
lathe('floor', M['sand'], ((RI - 0.002, 0), (RI - 0.002, 0.02)), G - 0.005, CX, CY, segs=48, outline=0)
for k in range(1, 4):
    rr = RI + 0.04 + k * 0.07
    zz = H * (0.22 + 0.19 * k)
    lathe(f'seatline{k}', M['stoneDark'], ((rr, 0), (rr + 0.01, 0.006)), G + zz - 0.02, CX, CY, segs=48, outline=0)
bpy.context.view_layer.update()
for o in [o for o in bpy.data.objects if o not in mark]:
    o.scale = (1.0, SY, 1.0)
bpy.context.view_layer.update()

# arches round the outside, two storeys
n = 30
for k in range(n):
    a = 2 * math.pi * (k + 0.5) / n
    if math.sin(a) > 0.55:
        continue
    x, y = CX + (RO + 0.002) * math.cos(a), CY + (RO + 0.002) * SY * math.sin(a)
    tang = math.atan2(SY * math.cos(a), -math.sin(a))
    for z in (0.03, 0.15):
        box(f'arch{k}{z}', M['dark'], x, y, G + z, 0.05, 0.006, 0.07, rot_z=tang, outline=0, bevel=0)
        cyl(f'archtop{k}{z}', M['dark'], 0.025, 0.006, segs=10, outline=0, matrix=Matrix.Translation((x, y, G + z + 0.07)) @ Matrix.Rotation(tang, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for z in (0.125, 0.25):
    lathe(f'cornice{z}', M['stoneDark'], ((RO + 0.008, 0), (RO + 0.008, 0.014)), G + z, CX, CY, segs=48, outline=0.001)
mark2 = [o for o in bpy.data.objects if o.name.startswith('cornice')]
for o in mark2:
    o.scale = (1.0, SY, 1.0)

# ---------- the medieval towers ----------
for k, a in enumerate((math.radians(205), math.radians(270), math.radians(320))):
    x, y = CX + (RO - 0.05) * math.cos(a), CY + (RO - 0.05) * SY * math.sin(a)
    box(f'tower{k}', M['stone'], x, y, G - 0.005, 0.11, 0.11, H + 0.18, rot_z=a, outline=0.006, bevel=0)
    box(f'towerwin{k}', M['window'], x + 0.056 * math.cos(a), y + 0.056 * math.sin(a), G + H + 0.08, 0.025, 0.006, 0.05, rot_z=a + math.pi / 2, outline=0, bevel=0)
    for j in range(4):
        b = a + math.pi / 4 + j * math.pi / 2
        box(f'towermerlon{k}{j}', M['stoneDark'], x + 0.045 * math.cos(b), y + 0.045 * math.sin(b), G + H + 0.17, 0.025, 0.025, 0.03, outline=0.001, bevel=0)

# ---------- houses round about ----------
for k, (x, y) in enumerate(((-0.85, -0.35), (0.85, -0.3), (-0.75, 0.55), (0.78, 0.55))):
    box(f'house{k}', M['cream'], x, y, G - 0.005, 0.18, 0.16, 0.14, outline=0.005, bevel=0)
    box(f'housewin{k}', M['window'], x, y - 0.083, G + 0.06, 0.1, 0.006, 0.025, outline=0, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + 0.135, 0.19, 0.06, outline=0.003)

turn(before, -20)
render(G)
