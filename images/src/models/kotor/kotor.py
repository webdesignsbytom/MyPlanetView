# A cartoon Bay of Kotor for the country maps, built in the set's shared look (../toon.py) on a tile
# of the bay's water: the steep grey mountains rising straight from the bay, the walled old town of
# Kotor at their foot with its red roofs and the cathedral's twin towers, the town walls zigzagging
# up the mountainside to the fortress of Saint John, and out in the bay the islet of Our Lady of
# the Rocks with its blue-domed church. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kotor.py -- kotor-1024.png 1024 kotor.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'bay': toon('bay', '#2f8fb8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'mountain': toon('mountain', '#8f8f86', shadow_mul=(0.78, 0.78, 0.86)),
    'scrub': toon('scrub', '#6a9a52', shadow_mul=(0.7, 0.78, 0.8)),
    'wall': toon('wall', '#d6ccb4', shadow_mul=(0.8, 0.78, 0.86)),
    'house': toon('house', '#efe6d2', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'houseWarm': toon('houseWarm', '#e8d4a8', shadow_mul=(0.84, 0.76, 0.7)),
    'roof': toon('roof', '#c8573a'),
    'window': flat('window', '#33303d'),
    'dome': toon('dome', '#3c6fc4', shadow_mul=(0.72, 0.72, 0.82)),
    'rock': toon('rock', '#a39d93', shadow_mul=(0.76, 0.76, 0.86)),
    'cypress': toon('cypress', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['bay'])
before = set(bpy.data.objects)
rng = random.Random(251)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the mountains along the back and left ----------
MX, MY = -0.3, 0.6
mtn = loft('mountain', M['mountain'], [ring(MX, MY, 0.85, 0.6, -0.01, 0.02), ring(MX - 0.05, MY + 0.05, 0.62, 0.44, 0.45, 0.04),
                                       ring(MX - 0.1, MY + 0.1, 0.35, 0.24, 0.85, 0.06), ring(MX - 0.12, MY + 0.12, 0.05, 0.04, 1.05, 0.0)], outline=0.035)
mtn.visible_shadow = False
m2 = loft('mountain2', M['mountain'], [ring(0.6, 0.78, 0.4, 0.28, -0.01, 0.04), ring(0.6, 0.81, 0.26, 0.18, 0.4, 0.08), ring(0.61, 0.83, 0.04, 0.04, 0.62, 0.0)],
          outline=0.03)
m2.visible_shadow = False
for k in range(10):
    a = math.radians(rng.uniform(180, 330))
    t = rng.uniform(0.05, 0.3)
    x, y = MX + 0.8 * (1 - t) * math.cos(a), MY + 0.56 * (1 - t) * math.sin(a)
    ball(f'scrub{k}', M['scrub'], x, y, G + t * 0.9 + 0.03, rng.uniform(0.05, 0.08), outline=0.012)


# ---------- the walled old town at the foot of the mountain ----------
TX, TY = -0.45, -0.05
box('townwall', M['wall'], TX, TY - 0.3, G - 0.005, 0.8, 0.05, 0.14, outline=0.016, bevel=0)
for k in range(10):
    box(f'townmerlon{k}', M['wall'], TX - 0.36 + k * 0.08, TY - 0.3, G + 0.13, 0.035, 0.05, 0.03, outline=0.006, bevel=0)
box('quay', M['wall'], TX, TY - 0.42, G - 0.005, 0.95, 0.18, 0.03, outline=0.012, bevel=0)
HOUSES = [(-0.75, -0.2), (-0.6, -0.15), (-0.42, -0.2), (-0.15, -0.18), (-0.7, 0.0), (-0.3, 0.0), (-0.12, 0.05), (-0.55, 0.12)]
for k, (x, y) in enumerate(HOUSES):
    h = rng.uniform(0.14, 0.2)
    box(f'house{k}', M['house' if k % 2 else 'houseWarm'], x, y, G - 0.005, 0.13, 0.12, h, outline=0.014, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.075, y - 0.07, G + h - 0.005), (x + 0.075, y - 0.07, G + h - 0.005), (x + 0.075, y + 0.07, G + h - 0.005),
                                       (x - 0.075, y + 0.07, G + h - 0.005)],
                                      [(x - 0.06, y - 0.004, G + h + 0.06), (x + 0.06, y - 0.004, G + h + 0.06), (x + 0.06, y + 0.004, G + h + 0.06),
                                       (x - 0.06, y + 0.004, G + h + 0.06)]], outline=0.012)
    box(f'housewin{k}', M['window'], x, y - 0.064, G + h * 0.55, 0.025, 0.01, 0.04, outline=0, bevel=0)
# the cathedral of Saint Tryphon and its twin towers
CX, CY = -0.4, -0.12
box('cathedral', M['house'], CX, CY, G - 0.005, 0.2, 0.18, 0.2, outline=0.016, bevel=0)
for s in (-1, 1):
    box(f'cathtower{s}', M['house'], CX + s * 0.075, CY - 0.1, G - 0.005, 0.07, 0.07, 0.36, outline=0.014, bevel=0)
    pyramid(f'cathspire{s}', M['roof'], CX + s * 0.075, CY - 0.1, G + 0.355, 0.08, 0.1, outline=0.01)
box('rosewindow', M['window'], CX, CY - 0.091, G + 0.12, 0.04, 0.01, 0.04, outline=0, bevel=0)

# ---------- the walls zigzagging up to the fortress of Saint John ----------
def slope_z(y):
    """The mountain's face at y, near its middle: from its rings' front edges, (y, height)."""
    pts = ((0.0, 0.0), (0.21, 0.45), (0.46, 0.85), (0.72, 1.05))
    for (y0, z0), (y1, z1) in zip(pts, pts[1:]):
        if y <= y1:
            return z0 + (z1 - z0) * (y - y0) / (y1 - y0)
    return pts[-1][1]


ZIG = [(x, y, slope_z(y) + 0.01) for x, y in ((-0.12, 0.08), (-0.4, 0.15), (-0.14, 0.22), (-0.38, 0.3), (-0.22, 0.38))]
for k, ((x0, y0, z0), (x1, y1, z1)) in enumerate(zip(ZIG, ZIG[1:])):
    bar(f'zigwall{k}', M['wall'], (x0, y0, G + z0 + 0.03), (x1, y1, G + z1 + 0.03), 0.035, outline=0.01)
FX, FY, FZ = ZIG[-1]
box('fortress', M['wall'], FX, FY, G + FZ - 0.04, 0.16, 0.12, 0.14, outline=0.016, bevel=0)
for k in range(4):
    box(f'fortmerlon{k}', M['wall'], FX - 0.06 + k * 0.04, FY - 0.06, G + FZ + 0.1, 0.022, 0.03, 0.03, outline=0.005, bevel=0)

# ---------- Our Lady of the Rocks, out in the bay ----------
IX, IY = 0.55, -0.35
islet = loft('islet', M['rock'], [ring(IX, IY, 0.28, 0.2, -0.01, 0.06), ring(IX, IY, 0.25, 0.17, 0.05, 0.05)], outline=0.02)
islet.visible_shadow = False
box('church', M['house'], IX - 0.02, IY, G + 0.045, 0.2, 0.12, 0.12, outline=0.014, bevel=0)
lathe('drum', M['house'], ((0.045, 0), (0.045, 0.05)), G + 0.16, IX - 0.02, IY, segs=12, outline=0.01)
lathe('dome', M['dome'], ((0.05, 0), (0.046, 0.025), (0.03, 0.045), (0.004, 0.06)), G + 0.205, IX - 0.02, IY, segs=16, outline=0.01)
box('belltower', M['house'], IX + 0.12, IY + 0.02, G + 0.045, 0.06, 0.06, 0.2, outline=0.012, bevel=0)
lathe('bellcap', M['dome'], ((0.04, 0), (0.004, 0.06)), G + 0.245, IX + 0.12, IY + 0.02, segs=8, outline=0.008, smooth=False)
rod('islandcypress', M['cypress'], (IX - 0.17, IY + 0.05, G + 0.05), (IX - 0.17, IY + 0.05, G + 0.2), 0.035, r2=0.0, segs=8, outline=0.01)

turn(before, -20)
render(G)
