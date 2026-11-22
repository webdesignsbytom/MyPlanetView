# Cartoon Petronas Towers for the country maps, built in the set's shared look (../toon.py):
# the twin silver towers, each on an eight-pointed star plan, stepping back in tiers to their
# pinnacles and spires, joined by the skybridge on its two legs; the podium at their feet and
# the lake of KLCC Park in front.
# Run: blender -b --factory-startup -P petronas-towers.py -- petronas-towers-1024.png 1024 petronas-towers.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'steel': toon('steel', '#c9d0d8', shadow_mul=(0.76, 0.78, 0.88), lift=0.35),
    'steelDark': toon('steelDark', '#9eabb8', shadow_mul=(0.76, 0.78, 0.88), lift=0.3),
    'bridge': toon('bridge', '#7f8c9a', shadow_mul=(0.76, 0.78, 0.88)),
    'podium': toon('podium', '#d8cfbf'),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'tree': toon('tree', '#5fa04a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
box('lake', M['water'], 0, -0.98, G - 0.004, 1.3, 0.42, 0.02, outline=0.012, bevel=0)
box('podium', M['podium'], 0, 0.16, G - 0.005, 1.3, 0.62, 0.12, outline=0.03, bevel=0.01)
B = G + 0.115


def star_tier(name, mat, x, y, z0, r0, r1, h):
    """A tier on an eight-pointed star plan, its points r out, its notches a little in."""
    def ring(r, z):
        return [(x + r * (1.0 if k % 2 == 0 else 0.84) * math.cos(math.pi * k / 8),
                 y + r * (1.0 if k % 2 == 0 else 0.84) * math.sin(math.pi * k / 8), z) for k in range(16)]
    return loft(name, mat, [ring(r0, z0), ring(r1, z0 + h)], outline=0.022)


TIERS = ((0.2, 0.18, 2.1), (0.16, 0.15, 0.55), (0.13, 0.12, 0.4), (0.1, 0.09, 0.3), (0.075, 0.065, 0.22))
for t, x in enumerate((-0.34, 0.34)):
    z = B
    for k, (r0, r1, h) in enumerate(TIERS):
        star_tier(f'tower{t}{k}', M['steel'] if k % 2 == 0 else M['steelDark'], x, 0.16, z, r0, r1, h)
        z += h
    lathe(f'pinnacle{t}', M['steel'], ((0.06, 0), (0.035, 0.18), (0.012, 0.3)), z, x, 0.16, segs=16, outline=0.016)
    rod(f'spire{t}', M['steel'], (x, 0.16, z + 0.28), (x, 0.16, z + 0.75), 0.016, r2=0.004, segs=8, outline=0.01)
    for k in range(6):
        box(f'band{t}{k}', M['steelDark'], x, 0.16 - 0.19, B + 0.25 + k * 0.3, 0.14, 0.02, 0.03, outline=0, bevel=0)

# ---------- the skybridge on its two legs ----------
BRIDGE = B + 1.15
box('skybridge', M['bridge'], 0, 0.16, BRIDGE, 0.36, 0.08, 0.07, outline=0.016, bevel=0)
for side in (-1, 1):
    bar(f'bridgeleg{side}', M['bridge'], (0, 0.16, BRIDGE), (side * 0.2, 0.16, BRIDGE - 0.4), 0.03, outline=0.012)

# ---------- trees round the lake ----------
for k, (x, y) in enumerate(((-0.85, -0.68), (0.85, -0.7), (-1.0, -1.0 + 0.3), (1.02, -0.28))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.1, outline=0.02)

render(G)
