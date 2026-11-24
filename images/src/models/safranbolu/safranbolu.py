# A cartoon Safranbolu for the country maps, built in the set's shared look (../toon.py): the
# Ottoman town's timber-framed mansions on the hillside, their white upper storeys with dark beams
# and rows of windows jutting out over stone ground floors under red tiled hip roofs, and the
# mosque's dome and slender minaret at the foot of the slope. Turned a little towards the camera.
# Run: blender -b --factory-startup -P safranbolu.py -- safranbolu-1024.png 1024 safranbolu.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#8ab85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'street': toon('street', '#c8c0b0'),
    'stone': toon('stone', '#b8a888', shadow_mul=(0.84, 0.84, 0.88)),
    'white': toon('white', '#f4efe2', shadow_mul=(0.82, 0.84, 0.9), lift=0.15),
    'beam': toon('beam', '#5a3a28'),
    'roof': toon('roof', '#b85a3e'),
    'window': flat('window', '#3a3a42'),
    'lead': toon('lead', '#8a8e96'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(2551)


def mansion(name, x, y, z, w):
    box(f'{name}ground', M['stone'], x, y, z - 0.005, w * 0.85, 0.14, 0.07, outline=0.004, bevel=0)
    box(f'{name}upper', M['white'], x, y - 0.015, z + 0.065, w, 0.17, 0.12, outline=0.005, bevel=0)
    fy = y - 0.015 - 0.088
    for j in range(5):
        xx = x - w / 2 + j * w / 4
        bar(f'{name}post{j}', M['beam'], (xx, fy, z + 0.068), (xx, fy, z + 0.18), 0.008, outline=0)
    for zz in (z + 0.07, z + 0.125, z + 0.18):
        bar(f'{name}rail{zz}', M['beam'], (x - w / 2, fy, zz), (x + w / 2, fy, zz), 0.008, outline=0)
    for r in range(2):
        for j in range(4):
            box(f'{name}win{r}{j}', M['window'], x - w / 2 + (j + 0.5) * w / 4, fy - 0.001, z + 0.08 + r * 0.055, w / 4 * 0.5, 0.004, 0.035, outline=0, bevel=0)
    for j in range(3):
        bar(f'{name}bracket{j}', M['beam'], (x - w / 3 + j * w / 3, y - 0.07, z + 0.03), (x - w / 3 + j * w / 3, fy, z + 0.068), 0.008, outline=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2 - 0.03, y - 0.13, z + 0.18), (x + w / 2 + 0.03, y - 0.13, z + 0.18), (x + w / 2 + 0.03, y + 0.1, z + 0.18), (x - w / 2 - 0.03, y + 0.1, z + 0.18)],
                                    [(x - w * 0.25, y - 0.015, z + 0.26), (x + w * 0.25, y - 0.015, z + 0.26), (x + w * 0.25, y - 0.01, z + 0.26), (x - w * 0.25, y - 0.01, z + 0.26)]], outline=0.004)


def rrect(cx, cy, hw, hh, z, rad, n=4):
    pts = []
    for ox, oy, a0 in ((cx + hw - rad, cy - hh + rad, -90), (cx + hw - rad, cy + hh - rad, 0), (cx - hw + rad, cy + hh - rad, 90), (cx - hw + rad, cy - hh + rad, 180)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((ox + rad * math.cos(a), oy + rad * math.sin(a), G + z))
    return pts


# ---------- the terraced hillside ----------
for t, (y, z) in enumerate(((0.65, 0.24), (0.35, 0.16), (0.05, 0.08))):
    hl = loft(f'terrace{t}', M['grass'], [rrect(0.0, y + 0.08, 0.95 - t * 0.0, 0.25 + 0.15 * t, -0.01, 0.2), rrect(0.0, y + 0.1, 0.92, 0.2 + 0.15 * t, z, 0.18)], outline=0.006)
    hl.visible_shadow = False
for t, (y, z) in enumerate(((0.62, 0.24), (0.32, 0.16), (0.02, 0.08))):
    for k in range(4):
        x = -0.6 + k * 0.4 + rng.uniform(-0.04, 0.04)
        if math.hypot(x, y) > 0.95:
            continue
        mansion(f'm{t}{k}', x, y, G + z, rng.uniform(0.22, 0.27))
box('street', M['street'], 0.0, -0.32, G - 0.003, 1.6, 0.12, 0.008, outline=0, bevel=0)

# ---------- the mosque ----------
MX, MY = 0.4, -0.55
box('mosque', M['stone'], MX, MY, G - 0.005, 0.24, 0.2, 0.12, outline=0.006, bevel=0)
lathe('mosquedome', M['lead'], ((0.1, 0), (0.09, 0.04), (0.05, 0.08), (0.004, 0.1)), G + 0.115, MX, MY, segs=16, outline=0.004)
lathe('minaret', M['white'], ((0.022, 0), (0.019, 0.36)), G - 0.005, MX + 0.15, MY - 0.06, segs=10, outline=0.003)
lathe('minaretbalcony', M['white'], ((0.032, 0), (0.032, 0.012)), G + 0.28, MX + 0.15, MY - 0.06, segs=10, outline=0.002)
lathe('minaretcap', M['lead'], ((0.022, 0), (0.004, 0.09)), G + 0.355, MX + 0.15, MY - 0.06, segs=10, outline=0.002)
for k, (x, y) in enumerate(((-0.55, -0.6), (-0.25, -0.65), (0.82, -0.3))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.08, 0.08, outline=0.006)

turn(before, -20)
render(G)
