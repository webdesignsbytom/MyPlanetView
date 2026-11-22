# A cartoon Mount Fuji for the country maps, built in the set's shared look (../toon.py): the
# blue cone with its concave slopes and flat top, its snowcap ending in a zigzag, and in front
# the five-storey Chureito Pagoda and cherry trees in blossom, the postcard view.
# Run: blender -b --factory-startup -P mount-fuji.py -- mount-fuji-1024.png 1024 mount-fuji.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'fuji': toon('fuji', '#6f87bf', shadow_mul=(0.72, 0.74, 0.86), lift=0.25),
    'snow': toon('snow', '#f7f8fb', shadow_mul=(0.80, 0.84, 0.95), lift=0.15),
    'pagoda': toon('pagoda', '#cf4433'),
    'roofDark': toon('roofDark', '#45495a', shadow_mul=(0.75, 0.75, 0.85), lift=0.25),
    'blossom': toon('blossom', '#f5a9c6', shadow_mul=(0.85, 0.75, 0.85), lift=0.3),
    'trunk': toon('trunk', '#8a5a3c'),
    'stone': toon('stone', '#cbbfa8'),
})

G = tile()

# ---------- the mountain ----------
FX, FY = 0.12, 0.3
PROFILE = [(1.1, 0.0), (0.9, 0.16), (0.69, 0.38), (0.5, 0.64), (0.34, 0.9), (0.22, 1.1), (0.17, 1.17)]
TOP = PROFILE[-1][1]


def radius_at(z):
    for (r0, z0), (r1, z1) in zip(PROFILE, PROFILE[1:]):
        if z <= z1:
            return r0 + (r1 - r0) * (z - z0) / (z1 - z0)
    return PROFILE[-1][0]


fuji = lathe('fuji', M['fuji'], PROFILE, G - 0.01, FX, FY, segs=48, outline=0.04)
fuji.visible_shadow = False  # its own slopes shadowing themselves speckled

# The snowcap: a skin over the top, its lower edge a zigzag of twelve points
N, TEETH = 72, 12
snow_rings = []
for f in (0.0, 0.2, 0.45, 0.7, 1.0):
    ring = []
    for k in range(N):
        a = 2 * math.pi * k / N
        saw = abs(2 * ((k * TEETH / N) % 1) - 1)
        z = (0.6 + 0.17 * saw) * (1 - f) + TOP * f
        r = radius_at(z) * 1.012 + 0.006
        ring.append((FX + r * math.cos(a), FY + r * math.sin(a), G + z + (0.008 if f == 1.0 else 0)))
    snow_rings.append(ring)
snow = loft('snow', M['snow'], snow_rings, outline=0.03, smooth=True)
snow.visible_shadow = False

# ---------- the Chureito Pagoda: five storeys, red, with dark roofs and a gold spire ----------
PX, PY = -0.7, -0.62
box('pagodabase', M['stone'], PX, PY, G - 0.005, 0.34, 0.34, 0.05, outline=0.025, bevel=0.008)
z = G + 0.045
for k in range(5):
    w = 0.21 - k * 0.025
    box(f'storey{k}', M['pagoda'], PX, PY, z, w, w, 0.1, outline=0.022, bevel=0.006)
    z += 0.1
    pyramid(f'roof{k}', M['roofDark'], PX, PY, z - 0.012, w + 0.15, 0.065, outline=0.022)
    z += 0.03
rod('spire', M['gold'], (PX, PY, z), (PX, PY, z + 0.2), 0.012, outline=0.012)
for k in range(4):
    ball(f'spirering{k}', M['gold'], PX, PY, z + 0.04 + k * 0.035, 0.022, outline=0.01)

# ---------- cherry trees in blossom ----------
for k, (x, y) in enumerate(((0.58, -0.8), (0.95, -0.32), (-0.22, -1.02))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.2), 0.03, r2=0.022, segs=8, outline=0.018)
    for j, (dx, dy, dz, r) in enumerate(((0, 0, 0.26, 0.12), (0.08, 0.03, 0.22, 0.09), (-0.07, -0.02, 0.21, 0.09))):
        ball(f'blossom{k}{j}', M['blossom'], x + dx, y + dy, G + dz, r, outline=0.022)

render(G)
