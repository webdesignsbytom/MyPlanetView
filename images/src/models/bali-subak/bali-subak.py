# A cartoon of Bali's subak landscape for the country maps, built in the set's shared look
# (../toon.py): Jatiluwih's rice terraces stepping down the hillside in bright green, the water
# glinting between them, a temple's meru tower with its stacked black thatched roofs, the split
# gate, coconut palms, and Batukaru's slope behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bali-subak.py -- bali-subak-1024.png 1024 bali-subak.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paddy': toon('paddy', '#8ad050', shadow_mul=(0.72, 0.8, 0.72), lift=0.2),
    'paddyDark': toon('paddyDark', '#6ab840', shadow_mul=(0.72, 0.8, 0.72)),
    'water': toon('water', '#8ac8d8', lift=0.3),
    'mountain': toon('mountain', '#3f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'stone': toon('stone', '#8a7e70', shadow_mul=(0.84, 0.82, 0.86)),
    'thatch': toon('thatch', '#3a3430'),
    'brick': toon('brick', '#b8603e'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['paddy'])
before = set(bpy.data.objects)
rng = random.Random(1607)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- Batukaru's slope ----------
mt = loft('batukaru', M['mountain'], [segment(0.6, 1.36, 0.25), segment(0.75, 1.22, 0.55), segment(0.92, 1.0, 0.68)], outline=0.016, smooth=True)
mt.visible_shadow = False

# ---------- the terraces: stepped curving bands, each a little higher ----------
for k in range(7):
    c0 = -0.9 + k * 0.22
    z = 0.035 * k
    step = loft(f'terrace{k}', M['paddy' if k % 2 else 'paddyDark'], [segment(max(c0, -1.3), 1.37, -0.01), segment(max(c0 + 0.01, -1.29), 1.365, z + 0.035)], outline=0.008)
    step.visible_shadow = False
    pts = segment(max(c0 + 0.02, -1.28), 1.36, z + 0.036)
    for j in range(0, len(pts) - 1, 3):
        bar(f'glint{k}{j}', M['water'], pts[j], pts[min(j + 2, len(pts) - 1)], 0.012, outline=0)

# ---------- the temple: a meru tower, a split gate ----------
TX, TY, TZ = -0.45, 0.35, G + 0.21
box('merubase', M['stone'], TX, TY, TZ - 0.01, 0.18, 0.18, 0.1, outline=0.008, bevel=0)
z = TZ + 0.09
for i in range(5):
    w = 0.26 - i * 0.04
    loft(f'meruroof{i}', M['thatch'], [[(TX - w / 2, TY - w / 2, z), (TX + w / 2, TY - w / 2, z), (TX + w / 2, TY + w / 2, z), (TX - w / 2, TY + w / 2, z)],
                                       [(TX - w * 0.2, TY - w * 0.2, z + 0.06), (TX + w * 0.2, TY - w * 0.2, z + 0.06), (TX + w * 0.2, TY + w * 0.2, z + 0.06),
                                        (TX - w * 0.2, TY + w * 0.2, z + 0.06)]], outline=0.007)
    rod(f'merupost{i}', M['stone'], (TX, TY, z + 0.055), (TX, TY, z + 0.075), 0.02, segs=8, outline=0.003)
    z += 0.075
lathe('merutop', M['thatch'], ((0.025, 0), (0.004, 0.06)), z, TX, TY, segs=8, outline=0.003)
GX, GY = -0.1, 0.15
for s in (-1, 1):
    loft(f'gate{s}', M['brick'], [[(GX + s * 0.04, GY - 0.04, G + 0.14), (GX + s * 0.16, GY - 0.04, G + 0.14), (GX + s * 0.16, GY + 0.04, G + 0.14), (GX + s * 0.04, GY + 0.04, G + 0.14)],
                                  [(GX + s * 0.04, GY - 0.02, G + 0.42), (GX + s * 0.06, GY - 0.02, G + 0.42), (GX + s * 0.06, GY + 0.02, G + 0.42),
                                   (GX + s * 0.04, GY + 0.02, G + 0.42)]], outline=0.008)

# ---------- coconut palms along the terraces ----------
for k, (x, y, z) in enumerate(((0.55, -0.2, 0.12), (0.85, 0.15, 0.17), (-0.85, -0.25, 0.1), (0.3, 0.45, 0.22), (-0.95, 0.3, 0.2))):
    h = 0.32
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G + z), (x + 0.03, y, G + z + h), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + z + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + z + h - 0.05), 0.019, outline=0.005)

turn(before, -20)
render(G)
