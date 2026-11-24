# A cartoon Port Royal for the country maps, built in the set's shared look (../toon.py): the old
# buccaneers' town at the tip of the Palisadoes in Kingston Harbour, Jamaica, half sunk by the
# earthquake of 1692: Fort Charles's brick walls with cannons along the parapet, the tilted
# Giddy House left leaning by the 1907 earthquake, St Peter's church in red brick, palms, and
# the sea all round. Turned a little towards the camera.
# Run: blender -b --factory-startup -P port-royal.py -- port-royal-1024.png 1024 port-royal.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'water': toon('water', '#3a9ac8', shadow_mul=(0.8, 0.84, 0.9), lift=0.3),
    'sand': toon('sand', '#ead8a8', lift=0.2),
    'brick': toon('brick', '#b8664a', shadow_mul=(0.78, 0.7, 0.74), lift=0.12),
    'brickLight': toon('brickLight', '#cc8060', lift=0.15),
    'white': toon('white', '#f2eee4', lift=0.22),
    'roof': toon('roof', '#5a5a5a'),
    'iron': toon('iron', '#3a3a3e'),
    'dark': flat('dark', '#2e2420'),
    'palm': toon('palm', '#5aa048', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile(M['water'])
before = set(bpy.data.objects)

# ---------- the sandy spit ----------
spit = loft('spit', M['sand'], [[(1.05 * math.cos(a), 0.78 * math.sin(a) + 0.05, G - 0.01) for a in [2 * math.pi * k / 32 for k in range(32)]],
                                [(1.0 * math.cos(a), 0.73 * math.sin(a) + 0.05, G + 0.025) for a in [2 * math.pi * k / 32 for k in range(32)]]], outline=0.004)
spit.visible_shadow = False
SZ = G + 0.025

# ---------- Fort Charles ----------
FX, FY = -0.2, 0.15
fort = [(-0.35, -0.25), (0.25, -0.3), (0.38, 0.0), (0.2, 0.28), (-0.38, 0.25)]
loft('fortwalls', M['brick'], [[(FX + x, FY + y, SZ - 0.005) for x, y in fort], [(FX + x * 0.97, FY + y * 0.97, SZ + 0.14) for x, y in fort]], outline=0.007)
loft('parapet', M['brickLight'], [[(FX + x * 0.98, FY + y * 0.98, SZ + 0.135) for x, y in fort], [(FX + x * 0.98, FY + y * 0.98, SZ + 0.165) for x, y in fort]], outline=0.003)
for k in range(5):
    p0, p1 = fort[k], fort[(k + 1) % 5]
    for j in range(2):
        t = (j + 1) / 3
        x, y = FX + (p0[0] + (p1[0] - p0[0]) * t) * 0.95, FY + (p0[1] + (p1[1] - p0[1]) * t) * 0.95
        nx, ny = x - FX, y - FY
        L = math.hypot(nx, ny)
        rod(f'cannon{k}{j}', M['iron'], (x - 0.04 * nx / L, y - 0.04 * ny / L, SZ + 0.18), (x + 0.07 * nx / L, y + 0.07 * ny / L, SZ + 0.18), 0.014, r2=0.01, segs=8, outline=0.001)
box('fortgate', M['dark'], FX - 0.05, FY - 0.278, SZ - 0.005, 0.06, 0.006, 0.09, rot_z=-0.08, outline=0, bevel=0)
box('flagpole', M['iron'], FX + 0.1, FY + 0.1, SZ + 0.14, 0.008, 0.008, 0.22, outline=0, bevel=0)

# ---------- the Giddy House, tilted ----------
objs = set(bpy.data.objects)
box('giddy', M['brickLight'], 0, 0, 0, 0.18, 0.14, 0.12, outline=0.004, bevel=0)
gable('giddyroof', M['roof'], 0, 0, 0.115, 0.18, 0.14, 0.06, ridge_x=True, over=0.01)
box('giddydoor', M['dark'], -0.03, -0.073, 0, 0.035, 0.006, 0.07, outline=0, bevel=0)
for o in set(bpy.data.objects) - objs:
    o.matrix_world = Matrix.Translation((0.5, -0.3, SZ - 0.02)) @ Matrix.Rotation(-0.3, 4, 'Y') @ o.matrix_world

# ---------- St Peter's church ----------
CX, CY = 0.55, 0.35
box('church', M['brick'], CX, CY, SZ - 0.005, 0.18, 0.3, 0.14, outline=0.005, bevel=0)
gable('churchroof', M['roof'], CX, CY, SZ + 0.135, 0.18, 0.3, 0.08, over=0.01)
box('churchtower', M['white'], CX, CY - 0.18, SZ - 0.005, 0.09, 0.08, 0.22, outline=0.004, bevel=0)
hip('churchtowercap', M['roof'], CX, CY - 0.18, SZ + 0.215, 0.1, 0.09, 0.05)
arch('churchdoor', M['dark'], CX, CY - 0.223, SZ - 0.005, 0.035, 0.07)

for k, (x, y) in enumerate(((-0.7, -0.35), (0.15, -0.5), (0.85, 0.0), (-0.75, 0.5))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, SZ), (x + 0.03, y, SZ + 0.28), 0.012, segs=6, outline=0.002)
    for j in range(6):
        a = 2 * math.pi * j / 6
        bar(f'frond{k}{j}', M['palm'], (x + 0.03, y, SZ + 0.28), (x + 0.03 + 0.13 * math.cos(a), y + 0.13 * math.sin(a), SZ + 0.23), 0.03, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
