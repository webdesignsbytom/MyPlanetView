# A cartoon Hegra (Al-Hijr, Madain Salih) for the country maps, built in the set's shared look
# (../toon.py) on a tile of desert sand: Qasr al-Farid, the lone Nabataean tomb cut into a single
# great sandstone boulder: its façade with two pilasters, the doorway under its pediment, the bands
# of cornice and the two flights of steps at the top, the rock left rough below; other outcrops in
# the distance, an acacia, and a visitor for scale.
# Run: blender -b --factory-startup -P hegra.py -- hegra-1024.png 1024 hegra.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#eabf86', shadow_mul=(0.84, 0.74, 0.62), lift=0.25),
    'rock': toon('rock', '#cf8f55', shadow_mul=(0.84, 0.7, 0.66)),
    'rockDark': toon('rockDark', '#b8774a', shadow_mul=(0.84, 0.7, 0.66)),
    'facade': toon('facade', '#e2ac70', shadow_mul=(0.84, 0.72, 0.66)),
    'door': flat('door', '#4a2e22'),
    'acacia': toon('acacia', '#7a9e4e', shadow_mul=(0.72, 0.8, 0.78)),
    'trunk': toon('trunk', '#6b4a33'),
    'robe': toon('robe', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'skin': toon('skin', '#8a5a3c'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(167)

# ---------- the boulder, its front cut flat for the façade ----------
BX, BY = 0.0, 0.2
FRONT = BY - 0.34
SIDES = 24


def boulder_ring(rx, ry, z, jitter, cx=BX, cy=BY, flat_front=None):
    pts = []
    for k in range(SIDES):
        a = 2 * math.pi * k / SIDES
        j = 1 + rng.uniform(-jitter, jitter)
        x, y = cx + rx * j * math.cos(a), cy + ry * j * math.sin(a)
        if flat_front is not None:
            y = max(y, flat_front)
        pts.append((x, y, G + z))
    return pts


rock = loft('boulder', M['rock'], [boulder_ring(0.62, 0.52, -0.01, 0.04, flat_front=FRONT), boulder_ring(0.6, 0.5, 0.35, 0.05, flat_front=FRONT),
                                   boulder_ring(0.56, 0.46, 0.75, 0.05, flat_front=FRONT), boulder_ring(0.5, 0.4, 0.95, 0.06, flat_front=FRONT + 0.03),
                                   boulder_ring(0.34, 0.28, 1.08, 0.08), boulder_ring(0.12, 0.1, 1.13, 0.1)], outline=0.035)
rock.visible_shadow = False

# ---------- the façade on the flat front ----------
Y = FRONT - 0.004
box('facadepanel', M['facade'], 0, Y + 0.002, G + 0.12, 0.62, 0.01, 0.78, outline=0, bevel=0)
for s in (-1, 1):
    box(f'pilaster{s}', M['facade'], s * 0.25, Y - 0.012, G + 0.12, 0.07, 0.025, 0.5, outline=0.01, bevel=0)
    box(f'capital{s}', M['facade'], s * 0.25, Y - 0.016, G + 0.6, 0.09, 0.03, 0.04, outline=0.008, bevel=0)
# the cornice bands
box('cornice1', M['facade'], 0, Y - 0.018, G + 0.64, 0.66, 0.035, 0.04, outline=0.01, bevel=0)
box('frieze', M['facade'], 0, Y - 0.01, G + 0.68, 0.6, 0.02, 0.06, outline=0.008, bevel=0)
box('cornice2', M['facade'], 0, Y - 0.018, G + 0.74, 0.66, 0.035, 0.035, outline=0.01, bevel=0)
# the two flights of steps at the top, rising to the outer edges
for s in (-1, 1):
    for k in range(5):
        box(f'step{s}{k}', M['facade'], s * (0.07 + k * 0.05), Y - 0.012, G + 0.775, 0.05, 0.025, 0.025 * (k + 1), outline=0.008, bevel=0)
# the doorway, its frame and pediment
box('doorframe', M['facade'], 0, Y - 0.012, G + 0.12, 0.2, 0.02, 0.32, outline=0.01, bevel=0)
box('doorway', M['door'], 0, Y - 0.024, G + 0.12, 0.13, 0.01, 0.26, outline=0, bevel=0)
loft('pediment', M['facade'], [[(-0.13, Y - 0.03, G + 0.44), (0.13, Y - 0.03, G + 0.44), (0.0, Y - 0.03, G + 0.52)],
                               [(-0.13, Y - 0.005, G + 0.44), (0.13, Y - 0.005, G + 0.44), (0.0, Y - 0.005, G + 0.52)]], outline=0.01)
# the rough rock left below the façade
for k in range(7):
    x = -0.3 + k * 0.1 + rng.uniform(-0.02, 0.02)
    b = ball(f'rubble{k}', M['rockDark'], 0, 0, 0, rng.uniform(0.05, 0.08), outline=0.012)
    b.scale = (1.2, 0.6, 0.9)
    b.location = (x, FRONT - 0.01, G + 0.04)

# ---------- outcrops in the distance, an acacia, a visitor ----------
for k, (cx, cy, r, h) in enumerate(((-0.9, 0.7, 0.22, 0.42), (0.85, 0.82, 0.18, 0.32), (1.05, 0.2, 0.15, 0.22))):
    o = loft(f'outcrop{k}', M['rockDark'], [boulder_ring(r, r * 0.8, -0.01, 0.06, cx, cy), boulder_ring(r * 0.85, r * 0.7, h * 0.7, 0.1, cx, cy),
                                            boulder_ring(r * 0.4, r * 0.35, h, 0.12, cx, cy)], outline=0.025)
    o.visible_shadow = False
for k, (x, y) in enumerate(((-0.6, -0.95), (0.8, -0.6), (-1.05, -0.2), (0.3, -1.1))):
    s = ball(f'stone{k}', M['rockDark'], 0, 0, 0, rng.uniform(0.04, 0.06), outline=0.01)
    s.scale = (1.3, 1, 0.6)
    s.location = (x, y, G + 0.01)
AX, AY = -0.75, -0.45
rod('acaciatrunk', M['trunk'], (AX, AY, G), (AX + 0.02, AY, G + 0.2), 0.022, r2=0.016, segs=8, outline=0.01)
canopy = ball('acaciacanopy', M['acacia'], 0, 0, 0, 0.18, outline=0.02)
canopy.scale = (1, 1, 0.28)
canopy.location = (AX + 0.02, AY, G + 0.23)
PX, PY = 0.3, -0.55
rod('visitor', M['robe'], (PX, PY, G), (PX, PY, G + 0.1), 0.024, r2=0.016, segs=8, outline=0.006)
ball('visitorhead', M['skin'], PX, PY, G + 0.12, 0.018, outline=0.005)

bpy.context.view_layer.update()
turn(before, -14)
render(G)
