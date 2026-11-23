# A cartoon Vaduz Castle for the country maps, built in the set's shared look (../toon.py): the
# princes' castle on its ledge high above the town, its tall white keep and walls, red-and-white
# shutters and the round bastion at its front, the forested mountainside rising behind it to the
# snowy Alps, the Prince's vineyard in rows on the slope below, and the town's cathedral spire.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P vaduz-castle.py -- vaduz-castle-1024.png 1024 vaduz-castle.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'meadow': toon('meadow', '#8cc163', shadow_mul=(0.72, 0.8, 0.76), lift=0.25),
    'slope': toon('slope', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#9a948a', shadow_mul=(0.8, 0.8, 0.88)),
    'mountain': toon('mountain', '#7f8a96', shadow_mul=(0.75, 0.76, 0.86)),
    'snow': toon('snow', '#f7f8fb', shadow_mul=(0.80, 0.84, 0.95), lift=0.15),
    'white': toon('white', '#f3efe6', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'roof': toon('roof', '#8f4a3a'),
    'shutterRed': flat('shutterRed', '#c8302a'),
    'shutterWhite': flat('shutterWhite', '#ffffff'),
    'window': flat('window', '#3a3640'),
    'vine': toon('vine', '#6aa452', shadow_mul=(0.7, 0.78, 0.8)),
    'earth': toon('earth', '#a88660'),
    'stone': toon('stone', '#c9bea6', shadow_mul=(0.8, 0.78, 0.86)),
    'slate': toon('slate', '#4f5560', shadow_mul=(0.75, 0.75, 0.85)),
})

G = tile(M['meadow'])
before = set(bpy.data.objects)
rng = random.Random(431)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the Alps behind ----------
for k, (cx, cy, r, h) in enumerate(((-0.5, 1.0, 0.4, 1.15), (0.3, 1.05, 0.38, 1.0), (0.95, 0.65, 0.28, 0.8))):
    body = loft(f'alp{k}', M['mountain'], [ring(cx, cy, r, r * 0.55, -0.01, 0.0), ring(cx, cy, r * 0.62, r * 0.34, h * 0.5, 0.12),
                                           ring(cx, cy, r * 0.28, r * 0.16, h * 0.82, 0.12), ring(cx, cy, 0.02, 0.02, h, 0.0)], outline=0.035)
    cap = loft(f'alpsnow{k}', M['snow'], [ring(cx, cy, r * 0.4, r * 0.23, h * 0.7, 0.14), ring(cx, cy, 0.02, 0.02, h + 0.01, 0.0)], outline=0.02)
    body.visible_shadow = cap.visible_shadow = False

# ---------- the forested mountainside and the castle's ledge ----------
HX, HY = 0.05, 0.42
hill = loft('hill', M['slope'], [ring(HX, HY, 1.05, 0.6, -0.01, 0.03), ring(HX + 0.05, HY + 0.1, 0.8, 0.42, 0.3, 0.05), ring(HX + 0.08, HY + 0.18, 0.55, 0.28, 0.5, 0.05)],
            outline=0.035)
hill.visible_shadow = False
LX, LY, LZ = 0.05, 0.38, G + 0.34
ledge = loft('ledge', M['rock'], [ring(LX, LY, 0.34, 0.24, 0.12, 0.06), ring(LX, LY, 0.32, 0.22, 0.34, 0.04)], outline=0.025)
ledge.visible_shadow = False
for k in range(14):
    a = math.radians(rng.uniform(0, 360))
    r = rng.uniform(0.55, 0.85)
    x, y = HX + r * math.cos(a), HY + 0.08 + r * 0.55 * math.sin(a)
    if abs(x - LX) < 0.38 and abs(y - LY) < 0.28:
        continue
    rod(f'fir{k}', M['forest'], (x, y, G + 0.12), (x, y, G + 0.12 + rng.uniform(0.18, 0.26)), 0.06, r2=0.0, segs=8, outline=0.012)

# ---------- the castle ----------
box('castlewall', M['white'], LX + 0.05, LY + 0.02, LZ - 0.005, 0.42, 0.26, 0.16, outline=0.018, bevel=0)
loft('castleroof', M['roof'], [[(LX - 0.17, LY - 0.12, LZ + 0.15), (LX + 0.27, LY - 0.12, LZ + 0.15), (LX + 0.27, LY + 0.16, LZ + 0.15), (LX - 0.17, LY + 0.16, LZ + 0.15)],
                               [(LX - 0.12, LY + 0.016, LZ + 0.24), (LX + 0.22, LY + 0.016, LZ + 0.24), (LX + 0.22, LY + 0.024, LZ + 0.24), (LX - 0.12, LY + 0.024, LZ + 0.24)]],
     outline=0.014)
KX, KY = LX - 0.08, LY + 0.04
box('keep', M['white'], KX, KY, LZ - 0.005, 0.15, 0.15, 0.38, outline=0.018, bevel=0)
pyramid('keeproof', M['roof'], KX, KY, LZ + 0.375, 0.18, 0.12, outline=0.012)
lathe('bastion', M['white'], ((0.1, 0), (0.1, 0.13)), LZ - 0.005, LX + 0.2, LY - 0.1, segs=20, outline=0.016)
lathe('bastionroof', M['roof'], ((0.11, 0), (0.004, 0.1)), LZ + 0.125, LX + 0.2, LY - 0.1, segs=20, outline=0.012)
# windows with the red-and-white shutters
for k, (x, y, z) in enumerate(((KX, KY - 0.077, LZ + 0.22), (KX, KY - 0.077, LZ + 0.3), (LX + 0.0, LY - 0.112, LZ + 0.06), (LX + 0.1, LY - 0.112, LZ + 0.06))):
    box(f'win{k}', M['window'], x, y, z, 0.025, 0.01, 0.04, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'shutter{k}{s}', M['shutterRed' if s < 0 else 'shutterWhite'], x + s * 0.022, y, z, 0.016, 0.01, 0.04, outline=0, bevel=0)

# ---------- the Prince's vineyard in rows on the slope below ----------
for k in range(7):
    y = -0.3 - k * 0.09
    box(f'vinerow{k}', M['vine'], 0.15, y, G - 0.005, 0.7 - k * 0.04, 0.035, 0.05, outline=0.006, bevel=0)
    box(f'vineearth{k}', M['earth'], 0.15, y - 0.045, G - 0.004, 0.7 - k * 0.04, 0.035, 0.01, outline=0, bevel=0)

# ---------- the town below: the cathedral's spire and a few houses ----------
CX, CY = -0.65, -0.55
box('cathedral', M['stone'], CX, CY, G - 0.005, 0.14, 0.26, 0.16, outline=0.014, bevel=0)
box('cathedraltower', M['stone'], CX, CY - 0.16, G - 0.005, 0.08, 0.08, 0.3, outline=0.012, bevel=0)
lathe('cathedralspire', M['slate'], ((0.05, 0), (0.004, 0.22)), G + 0.295, CX, CY - 0.16, segs=8, outline=0.01, smooth=False)
for k, (x, y) in enumerate(((-0.95, -0.3), (-0.4, -0.85), (-0.9, -0.7), (0.65, -0.85), (0.9, -0.55))):
    box(f'house{k}', M['white'], x, y, G - 0.005, 0.12, 0.1, 0.1, outline=0.01, bevel=0)
    pyramid(f'houseroof{k}', M['roof'], x, y, G + 0.095, 0.14, 0.07, outline=0.008)

turn(before, -20)
render(G)
