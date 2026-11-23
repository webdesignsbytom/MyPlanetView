# A cartoon Amalfi Coast for the country maps, built in the set's shared look (../toon.py):
# Positano's houses in pastel colours tumbling down the steep green cliff to the sea, the church's
# majolica-tiled dome, terraces of lemon trees, the beach's rows of umbrellas, and boats in the bay.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P amalfi-coast.py -- amalfi-coast-1024.png 1024 amalfi-coast.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2a8ac0', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'cliff': toon('cliff', '#7a9a58', shadow_mul=(0.72, 0.8, 0.74)),
    'rock': toon('rock', '#a8a094', shadow_mul=(0.84, 0.84, 0.9)),
    'sand': toon('sand', '#9a8e80', lift=0.15),
    'h0': toon('h0', '#f4d890'), 'h1': toon('h1', '#f2c0b0'), 'h2': toon('h2', '#f8f4ea', lift=0.2), 'h3': toon('h3', '#e8a070'), 'h4': toon('h4', '#d8e0b8'),
    'majolica': toon('majolica', '#3a9a6a', lift=0.25),
    'majolicaYellow': toon('majolicaYellow', '#f0c030', lift=0.3),
    'window': flat('window', '#3a3640'),
    'lemon': toon('lemonTree', '#5a9a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'fruit': toon('fruit', '#f8e040', lift=0.35),
    'u0': toon('u0', '#f08a2a'), 'u1': toon('u1', '#2f8ac0'),
    'boat': toon('boat', '#f6f3ec', lift=0.2),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(1637)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


# ---------- the beach, then the steep cliff in stepped tiers ----------
beach = loft('beach', M['sand'], [segment(-0.35, 1.41, -0.01), segment(-0.33, 1.4, 0.02)], outline=0.008)
beach.visible_shadow = False
TIERS = [(-0.2, 0.1), (0.0, 0.22), (0.2, 0.36), (0.4, 0.5), (0.6, 0.62)]
for i, (c, z) in enumerate(TIERS):
    t = loft(f'tier{i}', M['cliff'], [segment(c, 1.39 - i * 0.03, -0.01), segment(c + 0.02, 1.385 - i * 0.03, z)], outline=0.012)
    t.visible_shadow = False
rock = loft('rocktop', M['rock'], [segment(0.6, 1.26, 0.6), segment(0.8, 1.1, 0.75)], outline=0.012, smooth=True)
rock.visible_shadow = False

# ---------- the houses tumbling down the tiers ----------
for i, (c, z) in enumerate(TIERS[:-1]):
    n = 7 - i
    half = math.sqrt(max(0.0, (1.3 - i * 0.03) ** 2 - (c + 0.05) ** 2)) - 0.18
    for j in range(n):
        x = -half + (j + 0.5) * 2 * half / n + rng.uniform(-0.02, 0.02)
        if i == 1 and abs(x + 0.1) < 0.12:
            continue
        y = c + 0.08
        w = rng.uniform(0.11, 0.14)
        box(f'house{i}{j}', M[f'h{(i + j) % 5}'], x, y, G + z - 0.005, w, 0.1, 0.09, outline=0.007, bevel=0)
        box(f'housewin{i}{j}', M['window'], x, y - 0.052, G + z + 0.03, 0.025, 0.006, 0.035, outline=0, bevel=0)
# the church of Santa Maria Assunta and its dome
CX, CY, CZ = -0.1, TIERS[1][0] + 0.1, G + TIERS[1][1]
box('church', M['h2'], CX, CY, CZ - 0.005, 0.18, 0.14, 0.12, outline=0.008, bevel=0)
lathe('churchdome', M['majolica'], ((0.07, 0), (0.065, 0.04), (0.04, 0.08), (0.004, 0.1)), CZ + 0.115, CX, CY, segs=12, outline=0.006)
for j in range(4):
    a = j * math.pi / 2
    rod(f'domestripe{j}', M['majolicaYellow'], (CX + 0.07 * math.cos(a), CY + 0.07 * math.sin(a), CZ + 0.12), (CX + 0.01 * math.cos(a), CY + 0.01 * math.sin(a), CZ + 0.21), 0.01,
        segs=5, outline=0)
# lemon terraces on the top tier
for j in range(5):
    x = -0.5 + j * 0.25
    ball(f'lemon{j}', M['lemon'], x, 0.7, G + 0.67, 0.06, outline=0.008)
    ball(f'lemonfruit{j}', M['fruit'], x + 0.03, 0.66, G + 0.68, 0.014, outline=0)

# ---------- the beach's umbrellas, boats in the bay ----------
for j in range(7):
    x = -0.75 + j * 0.25
    y = -0.33 + 0.02
    if math.hypot(x, y) > 1.25:
        continue
    rod(f'umbrellapole{j}', M['h2'], (x, y - 0.03, G + 0.02), (x, y - 0.03, G + 0.12), 0.004, segs=5, outline=0)
    lathe(f'umbrella{j}', M[f'u{j % 2}'], ((0.055, 0), (0.035, 0.02), (0.004, 0.03)), G + 0.11, x, y - 0.03, segs=10, outline=0.004)
for k, (x, y) in enumerate(((-0.4, -0.75), (0.2, -0.85), (0.6, -0.65))):
    loft(f'boat{k}', M['boat'], [[(x - 0.08, y, G), (x + 0.05, y - 0.025, G), (x + 0.09, y, G), (x + 0.05, y + 0.025, G)],
                                 [(x - 0.09, y, G + 0.03), (x + 0.05, y - 0.03, G + 0.03), (x + 0.11, y, G + 0.035), (x + 0.05, y + 0.03, G + 0.03)]], outline=0.006)

turn(before, -20)
render(G)
