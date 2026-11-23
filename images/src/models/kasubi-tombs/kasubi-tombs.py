# Cartoon Kasubi Tombs for the country maps, built in the set's shared look (../toon.py): the
# Buganda kings' tombs on Kasubi hill in Kampala, Uganda, Muzibu Azaala Mpanga's great thatched dome
# reaching the ground with its dark doorway, the thatched gatehouse, the red-earth courtyard ringed
# by smaller houses and a reed fence, and bark-cloth fig trees. Turned a little towards the camera.
# Run: blender -b --factory-startup -P kasubi-tombs.py -- kasubi-tombs-1024.png 1024 kasubi-tombs.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'earth': toon('earth', '#b86a40', lift=0.2),
    'thatch': toon('thatch', '#c9a85a', shadow_mul=(0.84, 0.76, 0.62)),
    'thatchDark': toon('thatchDark', '#a88a44', shadow_mul=(0.84, 0.76, 0.62)),
    'window': flat('window', '#2e2622'),
    'reed': toon('reed', '#d8c49a'),
    'wall': toon('wall', '#c48a5a'),
    'fig': toon('fig', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6b5040'),
    'barkcloth': toon('barkcloth', '#a8643a'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(1009)

# ---------- the courtyard of red earth ----------
cyl('courtyard', M['earth'], 1.0, 0.008, segs=36, outline=0.004, matrix=Matrix.Translation((0, 0.05, G)) @ Matrix.Scale(0.9, 4, (1, 0, 0)) @ Matrix.Scale(0.72, 4, (0, 1, 0)))

# ---------- Muzibu Azaala Mpanga: the great thatched dome ----------
TX, TY = 0.0, 0.3
lathe('tomb', M['thatch'], ((0.42, 0), (0.42, 0.05), (0.4, 0.15), (0.34, 0.28), (0.24, 0.38), (0.12, 0.45), (0.04, 0.48), (0.004, 0.5)), G - 0.005, TX, TY, segs=28, outline=0.02)
for k in range(5):
    z = 0.08 + k * 0.08
    r = {0: 0.415, 1: 0.39, 2: 0.33, 3: 0.24, 4: 0.13}[k]
    lathe(f'thatchband{k}', M['thatchDark'], ((r + 0.006, 0), (r + 0.002, 0.012)), G + z, TX, TY, segs=28, outline=0.003)
pts = [(TX - 0.08, 0.0), (TX + 0.08, 0.0)] + [(TX + 0.08 * math.cos(t), 0.12 + 0.08 * math.sin(t)) for t in (math.pi * j / 10 for j in range(11))]
loft('tombdoor', M['window'], [[(px, TY - 0.43, G + pz) for px, pz in pts], [(px, TY - 0.4, G + pz) for px, pz in pts]], outline=0)
box('porch', M['thatchDark'], TX, TY - 0.45, G + 0.18, 0.24, 0.08, 0.03, outline=0.006, bevel=0)

# ---------- the gatehouse at the front ----------
GX, GY = 0.0, -0.55
lathe('gatehouse', M['thatch'], ((0.15, 0), (0.15, 0.04), (0.12, 0.12), (0.06, 0.18), (0.004, 0.2)), G - 0.005, GX, GY, segs=20, outline=0.012)
box('gatehousedoor', M['window'], GX, GY - 0.13, G, 0.07, 0.04, 0.08, outline=0, bevel=0)

# ---------- smaller houses round the courtyard and the reed fence ----------
for k, a in enumerate((150, 175, 200, 340, 5, 30)):
    t = math.radians(a)
    x, y = 0.78 * math.cos(t), 0.05 + 0.6 * math.sin(t)
    box(f'house{k}', M['wall'], x, y, G - 0.005, 0.14, 0.12, 0.08, rot_z=t + math.pi / 2, outline=0.008, bevel=0)
    pyramid(f'houseroof{k}', M['thatch'], x, y, G + 0.075, 0.18, 0.09, outline=0.008)
for k in range(44):
    t = 2 * math.pi * k / 44
    if 4.55 < t < 4.88:
        continue
    x, y = 0.95 * math.cos(t), 0.05 + 0.78 * math.sin(t)
    rod(f'reed{k}', M['reed'], (x, y, G), (x, y, G + 0.08), 0.008, segs=4, outline=0.002)

# ---------- bark-cloth fig trees ----------
for k, (x, y) in enumerate(((-1.1, -0.15), (1.1, -0.1), (-0.9, 0.75), (0.95, 0.7), (0.5, -1.0))):
    h = rng.uniform(0.12, 0.16)
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + h), 0.02, segs=8, outline=0.006)
    box(f'barkcloth{k}', M['barkcloth'], x, y - 0.02, G + 0.04, 0.03, 0.01, 0.05, outline=0.002, bevel=0)
    ball(f'fig{k}', M['fig'], x, y, G + h + 0.07, rng.uniform(0.11, 0.13), outline=0.014)

turn(before, -20)
render(G)
