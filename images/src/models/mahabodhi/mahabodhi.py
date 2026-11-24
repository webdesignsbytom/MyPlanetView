# A cartoon Mahabodhi Temple for the country maps, built in the set's shared look (../toon.py): the
# temple at Bodh Gaya where the Buddha became enlightened, its tall straight-sided pyramid tower
# carved in tiers of niches with the four small towers at its corners, the stone railing round it,
# the great Bodhi tree behind hung with prayer flags, and the lotus pond. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P mahabodhi.py -- mahabodhi-1024.png 1024 mahabodhi.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'paving': toon('paving', '#e0d8c8', lift=0.15),
    'stone': toon('stone', '#d8c49a', shadow_mul=(0.86, 0.82, 0.78), lift=0.1),
    'stoneDark': toon('stoneDark', '#b8a078', shadow_mul=(0.86, 0.82, 0.78)),
    'niche': flat('niche', '#7a6448'),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a5a4a'),
    'pond': toon('pond', '#4a8ab0', lift=0.3),
    'lotus': toon('lotus', '#f07ab0', lift=0.25),
    'pad': toon('pad', '#4f9a4a'),
    'f0': toon('f0', '#2f6fc0'), 'f1': toon('f1', '#f8f6f0', lift=0.2), 'f2': toon('f2', '#d83a2c'), 'f3': toon('f3', '#3f9a4a'), 'f4': toon('f4', '#f0c030', lift=0.2),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

box('courtyard', M['paving'], 0.0, 0.1, G - 0.004, 1.2, 1.0, 0.012, outline=0.003, bevel=0)


def tower(name, x, y, base, h, tiers):
    z = G + 0.06
    w = base
    for t in range(tiers):
        hh = h / tiers
        w1 = base - (base * 0.55) * (t + 1) / tiers
        loft(f'{name}tier{t}', M['stone' if t % 2 == 0 else 'stoneDark'], [[(x - w / 2, y - w / 2, z), (x + w / 2, y - w / 2, z), (x + w / 2, y + w / 2, z), (x - w / 2, y + w / 2, z)],
                                                                           [(x - w1 / 2, y - w1 / 2, z + hh), (x + w1 / 2, y - w1 / 2, z + hh), (x + w1 / 2, y + w1 / 2, z + hh), (x - w1 / 2, y + w1 / 2, z + hh)]], outline=0.005)
        for j in range(3):
            box(f'{name}niche{t}{j}', M['niche'], x - w * 0.3 + j * w * 0.3, y - (w + w1) / 4 - 0.004, z + hh * 0.3, w * 0.12, 0.006, hh * 0.45, outline=0, bevel=0)
        z += hh
        w = w1
    lathe(f'{name}amalaka', M['stone'], ((w * 0.6, 0), (w * 0.75, 0.02), (w * 0.6, 0.04)), z, x, y, segs=12, outline=0.003)
    lathe(f'{name}finial', M['gold'], ((w * 0.3, 0), (0.004, 0.06 + base * 0.15)), z + 0.04, x, y, segs=8, outline=0.002)


TX, TY = 0.0, 0.2
box('platform', M['stoneDark'], TX, TY, G - 0.005, 0.56, 0.56, 0.065, outline=0.006, bevel=0)
tower('main', TX, TY, 0.3, 0.72, 8)
for sx in (-1, 1):
    for sy in (-1, 1):
        tower(f'corner{sx}{sy}', TX + sx * 0.22, TY + sy * 0.22, 0.09, 0.22, 4)
box('shrinefront', M['stone'], TX, TY - 0.2, G + 0.06, 0.16, 0.1, 0.14, outline=0.005, bevel=0)
box('shrinedoor', M['niche'], TX, TY - 0.252, G + 0.06, 0.06, 0.006, 0.09, outline=0, bevel=0)
for j in range(16):
    t = j / 16 * 2 * math.pi
    rod(f'rail{j}', M['stoneDark'], (TX + 0.4 * math.cos(t), TY + 0.4 * math.sin(t), G), (TX + 0.4 * math.cos(t), TY + 0.4 * math.sin(t), G + 0.06), 0.012, segs=5, outline=0.002)

# ---------- the Bodhi tree and its prayer flags ----------
BX, BY = 0.7, 0.55
rod('bodhitrunk', M['trunk'], (BX, BY, G), (BX, BY, G + 0.22), 0.04, r2=0.03, segs=8, outline=0.005)
for j, (dx, dy, dz, r) in enumerate(((0, 0, 0.32, 0.18), (0.12, 0.05, 0.27, 0.13), (-0.12, 0.02, 0.28, 0.13), (0.02, -0.1, 0.3, 0.12))):
    ball(f'bodhi{j}', M['tree'], BX + dx, BY + dy, G + dz, r, outline=0.01)
for k in range(9):
    t = k / 8
    x = BX - 0.45 + 0.45 * t
    y = BY - 0.2 * t
    z = G + 0.22 - 0.06 * math.sin(math.pi * t)
    box(f'flag{k}', M[f'f{k % 5}'], x, y, z - 0.04, 0.035, 0.006, 0.04, rot_z=-0.4, outline=0, bevel=0)

# ---------- the lotus pond ----------
loft('pond', M['pond'], [[(-0.55 + 0.32 * math.cos(t), -0.6 + 0.16 * math.sin(t), G - 0.004) for t in (2 * math.pi * j / 20 for j in range(20))],
                         [(-0.55 + 0.32 * math.cos(t), -0.6 + 0.16 * math.sin(t), G + 0.008) for t in (2 * math.pi * j / 20 for j in range(20))]], outline=0.004, smooth=True)
for k, (x, y) in enumerate(((-0.7, -0.6), (-0.55, -0.55), (-0.4, -0.65))):
    lathe(f'pad{k}', M['pad'], ((0.035, 0), (0.035, 0.005)), G + 0.007, x, y, segs=10, outline=0.001)
    lathe(f'lotus{k}', M['lotus'], ((0.01, 0), (0.025, 0.02), (0.004, 0.04)), G + 0.01, x, y, segs=6, outline=0.002, smooth=False)

turn(before, -20)
render(G)
