# A cartoon Pitch Lake for the country maps, built in the set's shared look (../toon.py): Trinidad's
# lake of natural asphalt at La Brea, its dark wrinkled surface with pools of rainwater lying in the
# folds, a worker digging pitch into a cart, the edge's grass and palms, and the old works' shed.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P pitch-lake.py -- pitch-lake-1024.png 1024 pitch-lake.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'pitch': toon('pitch', '#3e3a3c', shadow_mul=(0.86, 0.86, 0.9)),
    'pitchLight': toon('pitchLight', '#5a5456', shadow_mul=(0.86, 0.86, 0.9)),
    'pool': toon('pool', '#5aa0b8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'reed': toon('reed', '#8ab85a', shadow_mul=(0.72, 0.78, 0.76)),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'shed': toon('shed', '#c8b8a0', shadow_mul=(0.82, 0.8, 0.86)),
    'tin': toon('tin', '#a83a2e'),
    'cart': toon('cart', '#8a6448'),
    'shirt': toon('shirt', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)), 'skin': toon('skin', '#6b4430'),
    'window': flat('window', '#3a3640'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(991)

# ---------- the lake of pitch, with its folds and pools ----------
LX, LY = 0.0, 0.1
cyl('pitchlake', M['pitch'], 1.0, 0.02, segs=36, outline=0.008, matrix=Matrix.Translation((LX, LY, G + 0.005)) @ Matrix.Scale(0.95, 4, (1, 0, 0)) @ Matrix.Scale(0.72, 4, (0, 1, 0)))
for k in range(16):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.1, 0.75)
    x, y = LX + r * math.cos(a), LY + r * 0.72 * math.sin(a)
    b = rng.uniform(0, math.pi)
    L = rng.uniform(0.1, 0.22)
    bar(f'fold{k}', M['pitchLight'], (x - L / 2 * math.cos(b), y - L / 2 * math.sin(b), G + 0.018), (x + L / 2 * math.cos(b), y + L / 2 * math.sin(b), G + 0.018), 0.02,
        outline=0.003)
for k, (x, y, rx, ry) in enumerate(((-0.35, 0.25, 0.14, 0.07), (0.3, 0.35, 0.1, 0.05), (0.15, -0.15, 0.12, 0.06), (-0.5, -0.1, 0.08, 0.04), (0.55, 0.0, 0.09, 0.05))):
    cyl(f'pool{k}', M['pool'], 1.0, 0.006, segs=16, outline=0.004, matrix=Matrix.Translation((x, y, G + 0.017)) @ Matrix.Scale(rx, 4, (1, 0, 0)) @ Matrix.Scale(ry, 4, (0, 1, 0)))
    for j in range(3):
        rod(f'reed{k}{j}', M['reed'], (x + rx * 0.8 * math.cos(j * 2), y + ry * 0.8 * math.sin(j * 2), G + 0.015), (x + rx * 0.8 * math.cos(j * 2), y + ry * 0.8 * math.sin(j * 2), G + 0.08),
            0.004, segs=4, outline=0.001)

# ---------- a worker digging pitch into a cart ----------
WX, WY = -0.15, -0.4
rod('workerlegs', M['pitch'], (WX, WY, G + 0.02), (WX, WY, G + 0.07), 0.012, segs=6, outline=0.002)
rod('workerbody', M['shirt'], (WX, WY, G + 0.07), (WX + 0.01, WY, G + 0.12), 0.018, segs=8, outline=0.003)
ball('workerhead', M['skin'], WX + 0.012, WY, G + 0.14, 0.016, outline=0.003)
bar('pick', M['cart'], (WX + 0.02, WY - 0.01, G + 0.12), (WX + 0.08, WY - 0.03, G + 0.03), 0.008, outline=0.002)
CX, CY = WX + 0.18, WY - 0.02
box('cart', M['cart'], CX, CY, G + 0.04, 0.12, 0.08, 0.05, outline=0.006, bevel=0)
box('cartload', M['pitchLight'], CX, CY, G + 0.085, 0.1, 0.06, 0.02, outline=0.003, bevel=0.008)
for s in (-1, 1):
    cyl(f'cartwheel{s}', M['pitch'], 0.03, 0.012, segs=12, outline=0.003, matrix=Matrix.Translation((CX, CY + s * 0.046, G + 0.03)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- the edge: grass, palms and the old works' shed ----------
for k, (x, y) in enumerate(((-1.05, 0.2), (-0.85, -0.6), (0.95, -0.45), (1.05, 0.35), (0.3, 0.98), (-0.45, 0.95))):
    h = rng.uniform(0.24, 0.3)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.013, r2=0.01, segs=8, outline=0.005)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.019, outline=0.005)
SX, SY = 0.65, -0.85
box('shed', M['shed'], SX, SY, G - 0.005, 0.28, 0.16, 0.12, outline=0.01, bevel=0)
loft('shedroof', M['tin'], [[(SX - 0.16, SY - 0.1, G + 0.115), (SX + 0.16, SY - 0.1, G + 0.115), (SX + 0.16, SY + 0.1, G + 0.115), (SX - 0.16, SY + 0.1, G + 0.115)],
                            [(SX - 0.16, SY - 0.004, G + 0.17), (SX + 0.16, SY - 0.004, G + 0.17), (SX + 0.16, SY + 0.004, G + 0.17), (SX - 0.16, SY + 0.004, G + 0.17)]],
     outline=0.008)
box('sheddoor', M['window'], SX, SY - 0.084, G, 0.06, 0.01, 0.08, outline=0, bevel=0)

turn(before, -20)
render(G)
