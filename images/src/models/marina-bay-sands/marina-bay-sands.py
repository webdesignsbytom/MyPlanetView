# A cartoon Marina Bay Sands for the country maps, built in the set's shared look (../toon.py):
# the three hotel towers, each a pair of legs leaning together, with their bands of windows,
# the long ship-shaped SkyPark across their tops (trees and the infinity pool on it, its bow
# reaching out past the last tower), the bay in front and the ArtScience Museum's white lotus.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P marina-bay-sands.py -- marina-bay-sands-1024.png 1024 marina-bay-sands.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'tower': toon('tower', '#eceff2', shadow_mul=(0.78, 0.8, 0.9), lift=0.2),
    'band': toon('band', '#9ab8d0', shadow_mul=(0.74, 0.78, 0.88)),
    'deck': toon('deck', '#dfe3e8', shadow_mul=(0.78, 0.8, 0.9)),
    'pool': toon('pool', '#5cc6ea', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'tree': toon('tree', '#5fa04a', shadow_mul=(0.7, 0.78, 0.8)),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'lotus': toon('lotus', '#f6f3ee', shadow_mul=(0.82, 0.82, 0.92)),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the bay along the front ----------
EDGE, R = -0.42, 1.43
a0 = math.asin(-EDGE / R)
arc = [(R * math.cos(a), R * math.sin(a)) for a in (math.pi + a0 + (math.pi - 2 * a0) * k / 40 for k in range(41))]
bm = bmesh.new()
bm.faces.new([bm.verts.new((x, y, G + 0.003)) for x, y in arc])
finish('bay', bm, M['water'], outline=0)

# ---------- the three towers: two legs leaning together, bands of windows ----------
H = 1.45
Y0 = 0.18
for k, x in enumerate((-0.45, 0.0, 0.45)):
    for side in (-1, 1):
        # each leg leans in towards the other as it rises
        foot, top = Y0 + side * 0.13, Y0 + side * 0.06
        loft(f'leg{k}{side}', M['tower'],
             [[(x - 0.13, foot - 0.05, G), (x + 0.13, foot - 0.05, G), (x + 0.13, foot + 0.05, G), (x - 0.13, foot + 0.05, G)],
              [(x - 0.13, top - 0.05, G + H), (x + 0.13, top - 0.05, G + H), (x + 0.13, top + 0.05, G + H),
               (x - 0.13, top + 0.05, G + H)]],
             outline=0.025)
    # bands of windows across the front leg
    for j in range(8):
        z = G + 0.12 + j * 0.16
        f = (z - G) / H
        y = Y0 - 0.13 + 0.07 * f - 0.05 - 0.004
        box(f'band{k}{j}', M['band'], x, y, z, 0.24, 0.02, 0.045, outline=0, bevel=0)

# ---------- the SkyPark across the tops, its bow reaching out past the last tower ----------
Z = G + H
hull = []
for x, half in ((-0.66, 0.06), (-0.55, 0.13), (0.4, 0.13), (0.75, 0.1), (0.98, 0.03)):
    hull.append((x, half))
top_ring = [(x, Y0 - half, Z) for x, half in hull] + [(x, Y0 + half, Z) for x, half in reversed(hull)]
under_ring = [(x, Y0 - half, Z - 0.06) for x, half in hull] + [(x, Y0 + half, Z - 0.06) for x, half in reversed(hull)]
loft('skypark', M['deck'], [under_ring, top_ring], outline=0.025)
box('pool', M['pool'], 0.05, Y0 - 0.06, Z, 0.95, 0.06, 0.012, outline=0.008, bevel=0)
for k in range(6):
    ball(f'tree{k}', M['tree'], -0.5 + k * 0.2, Y0 + 0.06, Z + 0.035, 0.04, outline=0.012)

# ---------- the ArtScience Museum: a white lotus on the water ----------
LX, LY = -0.62, -0.72
lathe('lotusbase', M['lotus'], ((0.12, 0), (0.1, 0.06)), G, LX, LY, segs=16, outline=0.02)
for k in range(7):
    a = math.radians(-90 + (k - 3) * 26)
    tip = Vector((LX + 0.22 * math.cos(a), LY + 0.22 * math.sin(a) * 0.6, G + 0.25 - abs(k - 3) * 0.03))
    rod(f'petal{k}', M['lotus'], (LX, LY, G + 0.04), tip, 0.05, r2=0.012, segs=8, outline=0.016)

turn(before, -20)
render(G)
