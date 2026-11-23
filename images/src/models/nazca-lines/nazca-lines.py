# A cartoon Nazca Lines for the country maps, built in the set's shared look (../toon.py): the
# hummingbird geoglyph drawn in pale lines across the dark pebbly desert, its long beak and fanned
# wings and tail, long straight lines running off to the horizon, the steel viewing tower by the
# Pan-American Highway, and a little sightseeing plane overhead. Turned a little towards the camera.
# Run: blender -b --factory-startup -P nazca-lines.py -- nazca-lines-1024.png 1024 nazca-lines.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'desert': toon('desert', '#a8785a', shadow_mul=(0.86, 0.78, 0.74), lift=0.2),
    'line': toon('nazcaLine', '#ecdcc0', lift=0.25),
    'road': toon('road', '#5a5654', lift=0.15),
    'paint': flat('paint', '#f0d050'),
    'steel': toon('steel', '#8a8e96', shadow_mul=(0.8, 0.8, 0.88)),
    'plane': toon('plane', '#f8f6f0', lift=0.2),
    'planeRed': toon('planeRed', '#c8302a'),
    'hill': toon('hill', '#8a6a50', shadow_mul=(0.86, 0.8, 0.78)),
})

G = tile(M['desert'])
before = set(bpy.data.objects)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


hills = loft('hills', M['hill'], [segment(0.85, 1.3, -0.01), segment(0.95, 1.15, 0.14), segment(1.02, 1.05, 0.17)], outline=0.012, smooth=True)
hills.visible_shadow = False


def line(name, pts, w=0.025):
    for j in range(len(pts) - 1):
        bar(f'{name}{j}', M['line'], (pts[j][0], pts[j][1], G + 0.001), (pts[j + 1][0], pts[j + 1][1], G + 0.001), w, outline=0)


# ---------- the hummingbird ----------
HX, HY, S = -0.1, 0.05, 1.0
line('beak', [(HX + 0.0, HY + 0.25), (HX + 0.02, HY + 0.7)])
line('head', [(HX - 0.05, HY + 0.18), (HX + 0.0, HY + 0.27), (HX + 0.05, HY + 0.18)])
line('bodyL', [(HX - 0.05, HY + 0.18), (HX - 0.06, HY - 0.15), (HX - 0.02, HY - 0.3)])
line('bodyR', [(HX + 0.05, HY + 0.18), (HX + 0.06, HY - 0.15), (HX + 0.02, HY - 0.3)])
for s in (-1, 1):
    wing = [(HX + s * 0.06, HY + 0.1), (HX + s * 0.3, HY + 0.25), (HX + s * 0.55, HY + 0.2)]
    for k in range(4):
        wing.append((HX + s * (0.55 - k * 0.07), HY + 0.2 - (k % 2) * 0.09 - k * 0.02))
    wing.append((HX + s * 0.06, HY + 0.0))
    line(f'wing{s}', wing)
tail = [(HX - 0.02, HY - 0.3)]
for k in range(5):
    tail += [(HX - 0.1 + k * 0.05, HY - 0.5), (HX - 0.075 + k * 0.05, HY - 0.32)]
tail.append((HX + 0.02, HY - 0.3))
line('tail', tail)
for k, (a, L) in enumerate(((0.3, 0.7), (-0.4, 0.55), (2.4, 0.8))):
    line(f'ray{k}', [(0.6, -0.4), (0.6 + L * math.cos(a), -0.4 + L * math.sin(a))], w=0.02)

# ---------- the Pan-American Highway and the viewing tower ----------
box('highway', M['road'], 0.75, 0.0, G - 0.004, 0.14, 2.2, 0.008, rot_z=0.15, outline=0.003, bevel=0)
for k in range(8):
    box(f'roadpaint{k}', M['paint'], 0.75 - 0.15 * math.sin(0.15) * (k - 3.5) * 0.3, -0.85 + k * 0.24, G + 0.005, 0.01, 0.12, 0.004, rot_z=0.15, outline=0, bevel=0)
TX, TY = 0.95, 0.35
for u in (-0.04, 0.04):
    for v in (-0.04, 0.04):
        rod(f'towerleg{u}{v}', M['steel'], (TX + u * 1.4, TY + v * 1.4, G), (TX + u, TY + v, G + 0.3), 0.006, segs=5, outline=0.002)
box('towerdeck', M['steel'], TX, TY, G + 0.3, 0.12, 0.12, 0.015, outline=0.004, bevel=0)
for k in range(4):
    a = k * math.pi / 2
    bar(f'towerrail{k}', M['steel'], (TX + 0.06 * math.cos(a) - 0.06 * math.sin(a), TY + 0.06 * math.sin(a) + 0.06 * math.cos(a), G + 0.35),
        (TX + 0.06 * math.cos(a) + 0.06 * math.sin(a), TY + 0.06 * math.sin(a) - 0.06 * math.cos(a), G + 0.35), 0.006, outline=0)

# ---------- a sightseeing plane ----------
PX, PY, PZ = -0.55, -0.45, G + 0.55
rod('fuselage', M['plane'], (PX - 0.12, PY, PZ), (PX + 0.12, PY, PZ), 0.025, r2=0.015, segs=10, outline=0.004)
box('wings', M['plane'], PX + 0.02, PY, PZ + 0.015, 0.06, 0.34, 0.01, outline=0.003, bevel=0)
box('stripe', M['planeRed'], PX + 0.02, PY, PZ + 0.026, 0.02, 0.34, 0.002, outline=0, bevel=0)
box('tailfin', M['planeRed'], PX - 0.11, PY, PZ + 0.01, 0.04, 0.008, 0.06, outline=0.002, bevel=0)

turn(before, -20)
render(G)
