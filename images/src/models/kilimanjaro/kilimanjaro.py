# A cartoon Mount Kilimanjaro for the country maps, built in the set's shared look (../toon.py)
# on a tile of savanna: the broad volcano, forest round its foot, grey-blue slopes and its flat
# top patched with snow; an umbrella acacia and a giraffe in front.
# Run: blender -b --factory-startup -P kilimanjaro.py -- kilimanjaro-1024.png 1024 kilimanjaro.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'savanna': toon('savanna', '#cfc576', lift=0.25),
    'mountain': toon('mountain', '#8a8fa6', shadow_mul=(0.74, 0.74, 0.86), lift=0.25),
    'forest': toon('forest', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'snow': toon('snow', '#f7f8fb', shadow_mul=(0.80, 0.84, 0.95), lift=0.15),
    'acacia': toon('acacia', '#6a9a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5238'),
    'giraffe': toon('giraffe', '#e8b94a', shadow_mul=(0.8, 0.68, 0.6)),
    'spots': toon('spots', '#8a5a2b'),
})

G = tile(M['savanna'])
KX, KY = 0.1, 0.32
PROFILE = [(1.12, 0.0), (0.95, 0.2), (0.75, 0.44), (0.56, 0.68), (0.43, 0.84), (0.38, 0.9)]
TOP = PROFILE[-1][1]


def radius_at(z):
    for (r0, z0), (r1, z1) in zip(PROFILE, PROFILE[1:]):
        if z <= z1:
            return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return PROFILE[-1][0]


def skin(name, mat, z_low, z_high, teeth, top_cap=False, n=72):
    """A skin over the mountain from a zigzag edge (z_low to z_low + teeth) up to z_high."""
    rings = []
    for f in (0.0, 0.3, 0.65, 1.0):
        ring = []
        for k in range(n):
            a = 2 * math.pi * k / n
            saw = abs(2 * ((k * 14 / n) % 1) - 1)
            lo = z_low + teeth * saw
            z = lo * (1 - f) + z_high * f
            r = radius_at(z) * 1.012 + 0.006
            ring.append((KX + r * math.cos(a), KY + r * math.sin(a), G + z + (0.008 if top_cap and f == 1.0 else 0)))
        rings.append(ring)
    s = loft(name, mat, rings, outline=0.025, smooth=True)
    s.visible_shadow = False
    return s


body = lathe('kibo', M['mountain'], PROFILE, G - 0.01, KX, KY, segs=48, outline=0.04)
body.visible_shadow = False
# the forest round its foot (its upper edge ragged), the snow on its flat top
rings = []
for f in (0.0, 1.0):
    ring = []
    for k in range(72):
        a = 2 * math.pi * k / 72
        saw = abs(2 * ((k * 14 / 72) % 1) - 1)
        z = (0.16 + 0.07 * saw) * f
        r = radius_at(z) * 1.012 + 0.006
        ring.append((KX + r * math.cos(a), KY + r * math.sin(a), G - 0.008 + z))
    rings.append(ring)
forest = loft('forest', M['forest'], rings, outline=0.025, smooth=True)
forest.visible_shadow = False
skin('snow', M['snow'], 0.74, TOP, 0.09, top_cap=True)

# ---------- an umbrella acacia ----------
AX, AY = -0.88, -0.55
rod('acaciatrunk', M['trunk'], (AX, AY, G), (AX + 0.04, AY, G + 0.28), 0.028, r2=0.02, segs=8, outline=0.016)
rod('acaciabranch', M['trunk'], (AX + 0.03, AY, G + 0.2), (AX - 0.1, AY, G + 0.32), 0.016, segs=6, outline=0.01)
canopy = ball('acacia', M['acacia'], AX, AY, G + 0.36, 0.28, outline=0.025)
canopy.scale = (1, 1, 0.3)
canopy.location = (0, 0, (G + 0.36) * (1 - 0.3))

# ---------- a giraffe, side-on ----------
before = set(bpy.data.objects)
GX, GY = 0.62, -0.72
box('giraffebody', M['giraffe'], GX, GY, G + 0.22, 0.2, 0.08, 0.1, outline=0.015, bevel=0.02)
for dx in (-0.07, 0.07):
    for dy in (-0.025, 0.025):
        rod(f'giraffeleg{dx}{dy}', M['giraffe'], (GX + dx, GY + dy, G), (GX + dx, GY + dy, G + 0.23), 0.012, segs=6, outline=0.008)
rod('giraffeneck', M['giraffe'], (GX - 0.08, GY, G + 0.3), (GX - 0.15, GY, G + 0.56), 0.022, r2=0.016, segs=8, outline=0.012)
box('giraffehead', M['giraffe'], GX - 0.18, GY, G + 0.55, 0.08, 0.04, 0.04, outline=0.012, bevel=0.01)
for dy in (-0.012, 0.012):
    rod(f'ossicone{dy}', M['spots'], (GX - 0.15, GY + dy, G + 0.58), (GX - 0.15, GY + dy, G + 0.62), 0.006, segs=6, outline=0.005)
for k, (dx, dz) in enumerate(((-0.05, 0.27), (0.02, 0.25), (0.06, 0.29), (-0.01, 0.3), (0.08, 0.24))):
    for side in (-1, 1):
        ball(f'spot{k}{side}', M['spots'], GX + dx, GY + side * 0.041, G + dz, 0.013, outline=0)
turn(before, -32, about=(GX, GY))

render(G)
