# A cartoon Morne Trois Pitons National Park for the country maps, built in the set's shared look
# (../toon.py): Dominica's volcanic rainforest, the three green peaks of the Morne, the Boiling Lake
# steaming grey-blue in its crater, Trafalgar Falls' twin waterfalls dropping into their pool, and
# tree ferns. Turned a little towards the camera.
# Run: blender -b --factory-startup -P morne-trois-pitons.py -- morne-trois-pitons-1024.png 1024 morne-trois-pitons.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'forestFloor': toon('forestFloor', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'peak': toon('peak', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'peakDark': toon('peakDark', '#2f6e40', shadow_mul=(0.7, 0.78, 0.8)),
    'crater': toon('crater', '#9a8e84', shadow_mul=(0.8, 0.8, 0.88)),
    'boiling': toon('boiling', '#9ab8c0', shadow_mul=(0.78, 0.84, 0.9), lift=0.3),
    'steam': toon('steam', '#f2f2f6', shadow_mul=(0.84, 0.84, 0.92), lift=0.15),
    'cliff': toon('cliff', '#7a7068', shadow_mul=(0.8, 0.8, 0.88)),
    'falls': toon('falls', '#eaf6fa', shadow_mul=(0.8, 0.86, 0.94), lift=0.15),
    'pool': toon('pool', '#4aa6c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'fern': toon('fern', '#6aaa4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['forestFloor'])
before = set(bpy.data.objects)
rng = random.Random(727)


def ring(cx, cy, rx, ry, z, k, sides=18):
    return [(cx + rx * math.cos(t) * (1 + 0.06 * math.sin(3 * t + k)), cy + ry * math.sin(t) * (1 + 0.06 * math.cos(2 * t + k)), G + z) for t in (2 * math.pi * j / sides for j in range(sides))]


# ---------- the three peaks at the back ----------
for k, (cx, cy, r, h) in enumerate(((-0.55, 0.75, 0.42, 0.62), (0.05, 0.92, 0.4, 0.72), (0.6, 0.72, 0.38, 0.58))):
    p = loft(f'piton{k}', M['peak' if k % 2 == 0 else 'peakDark'], [ring(cx, cy, r, r * 0.7, -0.01, k), ring(cx, cy, r * 0.55, r * 0.4, h * 0.55, k),
                                                                    ring(cx, cy, r * 0.12, r * 0.1, h, k)], outline=0.025, smooth=True)
    p.visible_shadow = False

# ---------- the Boiling Lake in its crater ----------
LX, LY = -0.25, 0.05
crater = loft('crater', M['crater'], [ring(LX, LY, 0.36, 0.24, -0.01, 5), ring(LX, LY, 0.3, 0.2, 0.08, 5), ring(LX, LY, 0.22, 0.14, 0.06, 5)], outline=0.016)
crater.visible_shadow = False
cyl('boilinglake', M['boiling'], 1.0, 0.01, segs=24, outline=0, matrix=Matrix.Translation((LX, LY, G + 0.06)) @ Matrix.Scale(0.2, 4, (1, 0, 0)) @ Matrix.Scale(0.13, 4, (0, 1, 0)))
for k in range(5):
    ball(f'bubble{k}', M['steam'], LX + rng.uniform(-0.12, 0.12), LY + rng.uniform(-0.07, 0.07), G + 0.065, 0.018, outline=0.003)
for k, (dx, dz, r) in enumerate(((0.0, 0.18, 0.08), (0.05, 0.3, 0.1), (-0.03, 0.42, 0.11), (0.06, 0.52, 0.09))):
    ball(f'steam{k}', M['steam'], LX + dx, LY + 0.02, G + dz, r, outline=0.01)

# ---------- Trafalgar Falls: a cliff, two falls and their pool ----------
FX, FY = 0.55, -0.15
cliff = loft('cliff', M['cliff'], [ring(FX, FY + 0.12, 0.34, 0.16, -0.01, 3), ring(FX, FY + 0.14, 0.3, 0.13, 0.34, 3)], outline=0.02)
cliff.visible_shadow = False
for k, (dx, w) in enumerate(((-0.12, 0.07), (0.1, 0.05))):
    bar(f'fall{k}', M['falls'], (FX + dx, FY + 0.0, G + 0.34), (FX + dx, FY - 0.04, G + 0.02), w, outline=0.004)
cyl('fallpool', M['pool'], 1.0, 0.01, segs=20, outline=0.006, matrix=Matrix.Translation((FX, FY - 0.16, G + 0.004)) @ Matrix.Scale(0.26, 4, (1, 0, 0)) @ Matrix.Scale(0.12, 4, (0, 1, 0)))
for k in range(4):
    ball(f'spray{k}', M['steam'], FX - 0.12 + k * 0.08, FY - 0.08, G + 0.03, 0.025, outline=0.003)

# ---------- tree ferns and forest ----------
for k, (x, y) in enumerate(((-0.75, -0.35), (-0.4, -0.6), (0.05, -0.45), (0.25, -0.85), (-0.85, 0.2), (0.95, -0.4), (-0.15, -0.95), (0.95, 0.15))):
    h = rng.uniform(0.18, 0.26)
    rod(f'fernstem{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.004)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['fern'], (x, y, G + h), (x + 0.11 * math.cos(b), y + 0.11 * math.sin(b), G + h - 0.04), 0.022, outline=0.004)
for k in range(12):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(1.05, 1.22)
    x, y = r * math.cos(a), r * 0.95 * math.sin(a)
    if y > 0.4 or (-0.6 < x < 0.4 and y < -0.6):
        continue
    ball(f'tree{k}', M['forest'], x, y, G + 0.1, rng.uniform(0.09, 0.12), outline=0.014)

turn(before, -20)
render(G)
