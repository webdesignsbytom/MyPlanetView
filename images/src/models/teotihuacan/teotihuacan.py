# A cartoon Teotihuacan for the country maps, built in the set's shared look (../toon.py): the great
# stepped Pyramid of the Sun with its stairway up the front, the Avenue of the Dead running past it
# to the Pyramid of the Moon, the low platforms along the avenue, the dry grass and agaves of the
# valley, and Cerro Gordo behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P teotihuacan.py -- teotihuacan-1024.png 1024 teotihuacan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('dryGrass', '#b8b070', shadow_mul=(0.82, 0.8, 0.72), lift=0.2),
    'stone': toon('stone', '#a8907a', shadow_mul=(0.86, 0.8, 0.8)),
    'stoneLight': toon('stoneLight', '#c0a890', shadow_mul=(0.86, 0.8, 0.8)),
    'avenue': toon('avenue', '#c8b8a0', lift=0.2),
    'mountain': toon('mountain', '#7a8a58', shadow_mul=(0.74, 0.8, 0.74)),
    'agave': toon('agave', '#6a9a7a', shadow_mul=(0.74, 0.82, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(1811)


def segment(c, r, z, n=26):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


mt = loft('cerrogordo', M['mountain'], [segment(0.75, 1.3, -0.01), segment(0.88, 1.16, 0.3), segment(0.98, 1.02, 0.36)], outline=0.014, smooth=True)
mt.visible_shadow = False


def pyramid_stepped(name, x, y, base, tiers, th, shrink):
    z = G - 0.005
    w = base
    for i in range(tiers):
        loft(f'{name}tier{i}', M['stone' if i % 2 == 0 else 'stoneLight'],
             [[(x - w / 2, y - w / 2, z), (x + w / 2, y - w / 2, z), (x + w / 2, y + w / 2, z), (x - w / 2, y + w / 2, z)],
              [(x - w / 2 + 0.02, y - w / 2 + 0.02, z + th), (x + w / 2 - 0.02, y - w / 2 + 0.02, z + th), (x + w / 2 - 0.02, y + w / 2 - 0.02, z + th),
               (x - w / 2 + 0.02, y + w / 2 - 0.02, z + th)]], outline=0.01)
        z += th
        w -= shrink
    return z, w


# ---------- the Avenue of the Dead ----------
box('avenue', M['avenue'], -0.45, 0.0, G - 0.004, 0.18, 2.4, 0.008, outline=0.003, bevel=0)
for k in range(6):
    for s in (-1, 1):
        box(f'platform{k}{s}', M['stoneLight'], -0.45 + s * 0.17, -0.8 + k * 0.3, G - 0.005, 0.12, 0.16, 0.06, outline=0.006, bevel=0)

# ---------- the Pyramid of the Sun ----------
SX, SY = 0.25, 0.0
top, w = pyramid_stepped('sun', SX, SY, 0.85, 5, 0.09, 0.14)
box('suntemple', M['stoneLight'], SX, SY, top - 0.005, w * 0.6, w * 0.6, 0.03, outline=0.006, bevel=0)
for i in range(18):
    box(f'sunstair{i}', M['stoneLight'], SX - 0.43 + i * 0.012, SY, G - 0.005, 0.03, 0.1, 0.025 * (i + 1), outline=0.002, bevel=0)

# ---------- the Pyramid of the Moon at the end of the avenue ----------
pyramid_stepped('moon', -0.45, 0.85, 0.45, 4, 0.075, 0.09)
for k in range(12):
    a = rng.uniform(math.radians(190), math.radians(350))
    r = rng.uniform(0.7, 1.2)
    x, y = r * math.cos(a), r * math.sin(a)
    if abs(x + 0.45) < 0.3:
        continue
    for j in range(6):
        b = 2 * math.pi * j / 6 + k
        bar(f'agave{k}{j}', M['agave'], (x, y, G), (x + 0.04 * math.cos(b), y + 0.04 * math.sin(b), G + 0.06), 0.014, outline=0.002)

turn(before, -20)
render(G)
