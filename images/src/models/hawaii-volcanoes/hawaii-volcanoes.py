# A cartoon Hawaiʻi Volcanoes for the country maps, built in the set's shared look (../toon.py):
# Kīlauea's caldera on the black lava fields, its crater glowing with a lake of molten lava under a
# plume of steam, a river of lava running down to the sea and steaming where it meets the waves,
# and the ʻōhiʻa forest with its red lehua blossom on the green slopes behind. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P hawaii-volcanoes.py -- hawaii-volcanoes-1024.png 1024 hawaii-volcanoes.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'basalt': toon('basalt', '#3e3a3c', shadow_mul=(0.84, 0.84, 0.9), lift=0.1),
    'basaltLight': toon('basaltLight', '#5a5456', shadow_mul=(0.84, 0.84, 0.9)),
    'lava': toon('lava', '#f0602c', lift=0.45),
    'glow': toon('glow', '#f8c040', lift=0.5),
    'crust': toon('crust', '#7a2a1e'),
    'sea': toon('sea', '#2f7ab8', lift=0.3),
    'steam': toon('steam', '#ffffff', shadow_mul=(0.88, 0.9, 0.97), lift=0.1),
    'forest': toon('forest', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'lehua': toon('lehua', '#e8402c', lift=0.25),
    'slope': toon('slope', '#5a8a48', shadow_mul=(0.72, 0.8, 0.76)),
})

G = tile(M['basalt'])
before = set(bpy.data.objects)
rng = random.Random(2271)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


def front(c, r, z, n=26):
    return [(x, -y, zz) for x, y, zz in reversed(segment(c, r, z, n))]


# ---------- the sea in front, the green slopes behind ----------
loft('sea', M['sea'], [front(0.8, 1.4, -0.004), front(0.8, 1.4, 0.006)], outline=0.004)
sl = loft('slopes', M['slope'], [segment(0.55, 1.36, -0.01), segment(0.65, 1.3, 0.18), segment(0.85, 1.15, 0.28)], outline=0.012, smooth=True)
sl.visible_shadow = False
for k in range(14):
    a = rng.uniform(0.35, math.pi - 0.35)
    r = rng.uniform(0.95, 1.22)
    x, y = r * math.cos(a), r * math.sin(a)
    if y < 0.75:
        continue
    ball(f'ohia{k}', M['forest'], x, y, G + 0.25, 0.07, outline=0.007)
    ball(f'lehua{k}', M['lehua'], x + 0.03, y - 0.04, G + 0.3, 0.022, outline=0.002)

# ---------- the caldera and its lava lake ----------
CX, CY = -0.15, 0.2
lathe('caldera', M['basaltLight'], ((0.6, 0), (0.5, 0.12), (0.42, 0.14), (0.36, 0.08), (0.32, 0.03)), G - 0.01, CX, CY, segs=32, outline=0.012)
lathe('lavalake', M['lava'], ((0.33, 0), (0.33, 0.03)), G - 0.005, CX, CY, segs=28, outline=0.003)
for k in range(6):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.05, 0.22)
    b = ball(f'crust{k}', M['crust'], 0, 0, 0, rng.uniform(0.04, 0.07), outline=0.003)
    b.scale = (1.4, 1.0, 0.2)
    b.location = (CX + r * math.cos(a), CY + r * math.sin(a), G + 0.028)
lathe('fountain', M['glow'], ((0.04, 0), (0.02, 0.1), (0.004, 0.14)), G + 0.02, CX + 0.05, CY, segs=10, outline=0.003)
for k, (dx, dz, r) in enumerate(((0.0, 0.25, 0.1), (0.08, 0.35, 0.11), (0.18, 0.45, 0.12), (-0.05, 0.4, 0.09))):
    b = ball(f'plume{k}', M['steam'], 0, 0, 0, r, outline=0.007)
    b.scale = (1.4, 1.0, 0.85)
    b.location = (CX + dx, CY + 0.05, G + dz)

# ---------- the lava flow to the sea ----------
FLOW = [(CX + 0.3, CY - 0.2), (0.35, -0.2), (0.45, -0.5), (0.55, -0.85)]
for k in range(len(FLOW) - 1):
    (x0, y0), (x1, y1) = FLOW[k], FLOW[k + 1]
    a = math.atan2(y1 - y0, x1 - x0) + math.pi / 2
    w = 0.07
    quad = [(x0 - w * math.cos(a), y0 - w * math.sin(a)), (x1 - w * math.cos(a), y1 - w * math.sin(a)), (x1 + w * math.cos(a), y1 + w * math.sin(a)), (x0 + w * math.cos(a), y0 + w * math.sin(a))]
    loft(f'flow{k}', M['lava'], [[(x, y, G - 0.004) for x, y in quad], [(x, y, G + 0.014) for x, y in quad]], outline=0.003)
    if k:
        lathe(f'flowjoin{k}', M['lava'], ((w, 0), (w, 0.018)), G - 0.004, x0, y0, segs=12, outline=0)
for k, (dx, dz, r) in enumerate(((0.0, 0.08, 0.09), (0.06, 0.16, 0.1), (-0.05, 0.2, 0.08))):
    b = ball(f'seasteam{k}', M['steam'], 0, 0, 0, r, outline=0.006)
    b.scale = (1.4, 1.0, 0.8)
    b.location = (0.58 + dx, -0.92, G + dz)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
