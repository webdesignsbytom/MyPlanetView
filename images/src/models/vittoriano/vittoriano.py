# A cartoon Vittoriano for the country maps, built in the set's shared look (../toon.py): Rome's
# great white marble monument to Victor Emmanuel II on the Piazza Venezia, its long curved colonnade
# of Corinthian columns on the top, the two propylaea at its ends crowned by bronze winged Victories
# in their chariots, the gilded equestrian statue of the king in the middle, the Altar of the
# Fatherland and the broad stairs climbing to it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P vittoriano.py -- vittoriano-1024.png 1024 vittoriano.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d0c4ae', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'marble': toon('marble', '#f6f3ea', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'marbleDark': toon('marbleDark', '#dcd6c8'),
    'bronze': toon('bronze', '#3a5a4a', lift=0.12),
    'gold': toon('gold', '#e8b830', lift=0.25),
    'dark': flat('dark', '#3a3a40'),
    'lawn': toon('lawn', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'flame': flat('flame', '#ffb030'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

# ---------- the stepped terraces and stairs ----------
Z = G - 0.005
for k, (w, d, h, y) in enumerate(((1.5, 1.15, 0.06, 0.25), (1.3, 0.98, 0.07, 0.32), (1.15, 0.8, 0.08, 0.4))):
    box(f'terrace{k}', M['marble'], 0, y, Z, w, d, h, outline=0.007, bevel=0)
    Z += h
TZ = Z
for i in range(8):
    box(f'stair{i}', M['marbleDark'], 0, -0.3 - (7 - i) * 0.03, G - 0.005, 0.36, 0.032, (TZ - G) * (i + 1) / 8 + 0.005, outline=0.002, bevel=0)
# the Altar of the Fatherland with the eternal flame and the goddess Roma above it
box('altar', M['marble'], 0, 0.05, TZ - 0.005, 0.3, 0.08, 0.14, outline=0.005, bevel=0)
box('romaniche', M['gold'], 0, 0.008, TZ + 0.04, 0.08, 0.006, 0.09, outline=0, bevel=0)
rod('roma', M['marble'], (0, 0.005, TZ + 0.045), (0, 0.005, TZ + 0.12), 0.016, r2=0.012, segs=8, outline=0.002)
for s in (-1, 1):
    lathe(f'brazier{s}', M['bronze'], ((0.02, 0), (0.03, 0.03), (0.03, 0.035)), TZ - 0.005, s * 0.2, -0.05, segs=10, outline=0.002)
    ball(f'flame{s}', M['flame'], s * 0.2, -0.05, TZ + 0.04, 0.014, outline=0)
# the king on horseback, gilded, on his tall pedestal
box('kingpedestal', M['marble'], 0, 0.18, TZ - 0.005, 0.14, 0.18, 0.16, outline=0.004, bevel=0)
KZ = TZ + 0.155
horse = ball('horse', M['gold'], 0, 0, 0, 0.04, outline=0.004)
horse.scale = (0.75, 1.6, 0.9)
horse.location = (0, 0.18, KZ + 0.07)
for fy in (-0.04, 0.04):
    for fx in (-0.018, 0.018):
        rod(f'horseleg{fy}{fx}', M['gold'], (fx, 0.18 + fy, KZ), (fx, 0.18 + fy, KZ + 0.05), 0.008, segs=5, outline=0.001)
rod('horseneck', M['gold'], (0, 0.13, KZ + 0.08), (0, 0.1, KZ + 0.13), 0.016, segs=6, outline=0.002)
ball('horsehead', M['gold'], 0, 0.09, KZ + 0.14, 0.016, outline=0.002)
rod('king', M['gold'], (0, 0.18, KZ + 0.09), (0, 0.18, KZ + 0.17), 0.02, r2=0.014, segs=8, outline=0.002)
ball('kinghead', M['gold'], 0, 0.18, KZ + 0.185, 0.013, outline=0.002)

# ---------- the curved colonnade along the top ----------
R = 0.75                  # the colonnade's curve: its ends forward, its middle further back
CZ = TZ + 0.12
N = 16
A_END = math.pi * 0.22
pts = []
for k in range(N + 1):
    a = math.pi * (0.5 + 0.28 * (2 * k / N - 1))
    pts.append((R * math.cos(a), 0.45 + R * (math.sin(a) - math.sin(A_END))))
for k, (x, y) in enumerate(pts):
    box(f'colonnadeplinth{k}', M['marble'], x, y, TZ - 0.005, 0.1, 0.12, 0.125, outline=0.003, bevel=0)
for k, (x, y) in enumerate(pts):
    rod(f'column{k}', M['marble'], (x, y, CZ), (x, y, CZ + 0.24), 0.017, segs=10, outline=0.002)
    lathe(f'capital{k}', M['marbleDark'], ((0.017, 0), (0.026, 0.02)), CZ + 0.225, x, y, segs=10, outline=0.001)
for k in range(N):
    (x0, y0), (x1, y1) = pts[k], pts[k + 1]
    bar(f'entablature{k}', M['marble'], (x0, y0, CZ + 0.26), (x1, y1, CZ + 0.26), 0.05, outline=0.003)
    bar(f'attic{k}', M['marble'], (x0, y0 + 0.01, CZ + 0.3), (x1, y1 + 0.01, CZ + 0.3), 0.04, outline=0.002)
    bar(f'colonnadewall{k}', M['marbleDark'], (x0, y0 + 0.05, CZ + 0.12), (x1, y1 + 0.05, CZ + 0.12), 0.03, outline=0)
# the two propylaea at the ends with their quadrigas of winged Victory
for s in (-1, 1):
    x, y = pts[-1 if s < 0 else 0]
    px = x + s * 0.06
    box(f'propylaeum{s}', M['marble'], px, y, CZ - 0.005, 0.18, 0.16, 0.36, outline=0.007, bevel=0)
    for j in range(2):
        rod(f'propcol{s}{j}', M['marble'], (px - 0.04 + j * 0.08, y - 0.085, CZ), (px - 0.04 + j * 0.08, y - 0.085, CZ + 0.3), 0.016, segs=8, outline=0.002)
    QZ = CZ + 0.355
    box(f'quadrigabase{s}', M['marbleDark'], px, y, QZ, 0.16, 0.12, 0.02, outline=0.002, bevel=0)
    for k in range(4):
        hb = ball(f'qhorse{s}{k}', M['bronze'], 0, 0, 0, 0.018, outline=0.002)
        hb.scale = (0.7, 1.5, 0.9)
        hb.location = (px - 0.05 + k * 0.033, y - 0.02, QZ + 0.05)
    box(f'chariot{s}', M['bronze'], px, y + 0.03, QZ + 0.02, 0.06, 0.04, 0.04, outline=0.002, bevel=0)
    rod(f'victory{s}', M['bronze'], (px, y + 0.035, QZ + 0.05), (px, y + 0.035, QZ + 0.13), 0.012, segs=6, outline=0.002)
    for w in (-1, 1):
        bar(f'victorywing{s}{w}', M['bronze'], (px, y + 0.04, QZ + 0.11), (px + w * 0.04, y + 0.05, QZ + 0.16), 0.01, outline=0.001)

# ---------- the lawns and trees of the piazza ----------
for s in (-1, 1):
    box(f'lawn{s}', M['lawn'], s * 0.55, -0.62, G - 0.004, 0.4, 0.3, 0.012, outline=0.002, bevel=0)
    ball(f'tree{s}', M['tree'], s * 0.95, -0.35, G + 0.13, 0.11, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
