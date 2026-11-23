# A cartoon Studenica Monastery for the country maps, built in the set's shared look (../toon.py):
# the Serbian monastery in its oval of white walls in the wooded hills, the Church of the Virgin in
# white marble with its tall drum and grey lead dome and the carved portal, the little King's Church
# beside it, the monks' quarters with their wooden galleries under tiled roofs, and the forest round
# about. Turned a little towards the camera.
# Run: blender -b --factory-startup -P studenica.py -- studenica-1024.png 1024 studenica.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#86c464', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'hill': toon('hill', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'forest': toon('forest', '#2f7a46', shadow_mul=(0.7, 0.78, 0.8)),
    'marble': toon('marble', '#f4f0e6', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'marbleDark': toon('marbleDark', '#d8d2c4', shadow_mul=(0.8, 0.8, 0.9)),
    'lead': toon('lead', '#8a929a', shadow_mul=(0.78, 0.8, 0.88)),
    'roofTile': toon('roofTile', '#c4573a'),
    'stone': toon('stone', '#e0d8c4', shadow_mul=(0.8, 0.8, 0.88)),
    'wood': toon('wood', '#6b4a33'),
    'window': flat('window', '#3a3640'),
    'path': toon('path2', '#d9c9a8', lift=0.25),
})

G = tile(M['grass'])
before = set(bpy.data.objects)
rng = random.Random(547)


def ring(cx, cy, rx, ry, z, jitter, sides=16):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


def gable_roof(name, mat, x, y, z, w, d, h, along_x=True):
    top = ([(x - w / 2, y - 0.004), (x + w / 2, y - 0.004), (x + w / 2, y + 0.004), (x - w / 2, y + 0.004)] if along_x else
           [(x - 0.004, y - d / 2), (x + 0.004, y - d / 2), (x + 0.004, y + d / 2), (x - 0.004, y + d / 2)])
    loft(name, M[mat], [[(x - w / 2 - 0.012, y - d / 2 - 0.012, z), (x + w / 2 + 0.012, y - d / 2 - 0.012, z), (x + w / 2 + 0.012, y + d / 2 + 0.012, z),
                         (x - w / 2 - 0.012, y + d / 2 + 0.012, z)], [(px, py, z + h) for px, py in top]], outline=0.012)


# ---------- the wooded hills behind ----------
for k, (cx, cy, r, h) in enumerate(((-0.55, 1.0, 0.45, 0.5), (0.4, 1.02, 0.42, 0.42))):
    hl = loft(f'hill{k}', M['hill'], [ring(cx, cy, r, r * 0.5, -0.01, 0.03), ring(cx, cy, r * 0.62, r * 0.32, h * 0.6, 0.06), ring(cx, cy, r * 0.22, r * 0.12, h, 0.06)],
              outline=0.03)
    hl.visible_shadow = False
    for j in range(5):
        a = math.radians(rng.uniform(180, 360))
        ball(f'hillforest{k}{j}', M['forest'], cx + r * 0.7 * math.cos(a), cy + r * 0.35 * math.sin(a), G + h * 0.3, rng.uniform(0.07, 0.1), outline=0.014)

# ---------- the oval of white walls ----------
WX, WY, WA, WB = 0.0, 0.1, 0.85, 0.62
N = 36
for k in range(N):
    t0, t1 = 2 * math.pi * k / N, 2 * math.pi * (k + 1) / N
    if 4.55 < (t0 + t1) / 2 < 4.85:
        continue    # the gate
    x0, y0 = WX + WA * math.cos(t0), WY + WB * math.sin(t0)
    x1, y1 = WX + WA * math.cos(t1), WY + WB * math.sin(t1)
    length = math.hypot(x1 - x0, y1 - y0)
    a = math.atan2(y1 - y0, x1 - x0)
    box(f'wall{k}', M['stone'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, length + 0.01, 0.045, 0.12, rot_z=a, outline=0.01, bevel=0)
    box(f'wallcap{k}', M['roofTile'], (x0 + x1) / 2, (y0 + y1) / 2, G + 0.115, length + 0.012, 0.06, 0.02, rot_z=a, outline=0.005, bevel=0)
gx, gy = WX + WA * math.cos(4.7), WY + WB * math.sin(4.7)
box('gatehouse', M['stone'], gx, gy, G - 0.005, 0.14, 0.1, 0.2, outline=0.012, bevel=0)
gable_roof('gatehouseroof', 'roofTile', gx, gy, G + 0.195, 0.14, 0.1, 0.06)
box('gateway', M['window'], gx, gy - 0.052, G, 0.05, 0.01, 0.09, outline=0, bevel=0)
box('path', M['path'], gx, gy - 0.35, G - 0.005, 0.12, 0.55, 0.01, outline=0.005, bevel=0)

# ---------- the Church of the Virgin ----------
CX, CY = -0.05, 0.12
box('nave', M['marble'], CX, CY, G - 0.005, 0.2, 0.46, 0.26, outline=0.02, bevel=0)
gable_roof('naveroof', 'lead', CX, CY, G + 0.255, 0.2, 0.46, 0.07, along_x=False)
box('transept', M['marble'], CX, CY + 0.03, G - 0.005, 0.36, 0.14, 0.24, outline=0.018, bevel=0)
gable_roof('transeptroof', 'lead', CX, CY + 0.03, G + 0.235, 0.36, 0.14, 0.06)
lathe('apse', M['marble'], ((0.08, 0), (0.08, 0.2)), G - 0.005, CX, CY + 0.23, segs=16, outline=0.014)
lathe('apseroof', M['lead'], ((0.09, 0), (0.004, 0.06)), G + 0.195, CX, CY + 0.23, segs=16, outline=0.01)
box('narthex', M['marbleDark'], CX, CY - 0.28, G - 0.005, 0.24, 0.12, 0.22, outline=0.016, bevel=0)
gable_roof('narthexroof', 'lead', CX, CY - 0.28, G + 0.215, 0.24, 0.12, 0.05, along_x=False)
box('portal', M['marbleDark'], CX, CY - 0.345, G, 0.09, 0.012, 0.14, outline=0.006, bevel=0)
box('portaldoor', M['window'], CX, CY - 0.352, G, 0.05, 0.01, 0.1, outline=0, bevel=0)
lathe('drum', M['marble'], ((0.065, 0), (0.065, 0.16)), G + 0.28, CX, CY + 0.03, segs=12, outline=0.014, smooth=False)
for k in range(6):
    a = 2 * math.pi * k / 6 + math.pi / 12
    box(f'drumwin{k}', M['window'], CX + 0.064 * math.cos(a), CY + 0.03 + 0.064 * math.sin(a), G + 0.32, 0.014, 0.014, 0.06, rot_z=a, outline=0, bevel=0)
lathe('dome', M['lead'], ((0.075, 0), (0.07, 0.04), (0.045, 0.08), (0.004, 0.1)), G + 0.44, CX, CY + 0.03, segs=16, outline=0.012)
rod('cross', M['gold'], (CX, CY + 0.03, G + 0.54), (CX, CY + 0.03, G + 0.6), 0.005, segs=6, outline=0)
for s in (-1, 1):
    for k in range(2):
        box(f'navewin{s}{k}', M['window'], CX + s * 0.104, CY - 0.12 + k * 0.24, G + 0.12, 0.01, 0.02, 0.07, outline=0, bevel=0)

# ---------- the King's Church ----------
KX, KY = 0.42, 0.25
box('kingschurch', M['marbleDark'], KX, KY, G - 0.005, 0.12, 0.18, 0.14, outline=0.012, bevel=0)
gable_roof('kingschurchroof', 'roofTile', KX, KY, G + 0.135, 0.12, 0.18, 0.05, along_x=False)
lathe('kingsdrum', M['marbleDark'], ((0.035, 0), (0.035, 0.06)), G + 0.15, KX, KY, segs=10, outline=0.008, smooth=False)
lathe('kingsdome', M['roofTile'], ((0.04, 0), (0.004, 0.05)), G + 0.21, KX, KY, segs=10, outline=0.006, smooth=False)

# ---------- the monks' quarters with their wooden galleries ----------
QX, QY = -0.45, 0.48
box('quarters', M['stone'], QX, QY, G - 0.005, 0.42, 0.14, 0.2, rot_z=0.35, outline=0.014, bevel=0)
box('gallery', M['wood'], QX + 0.025, QY - 0.07, G + 0.1, 0.42, 0.03, 0.08, rot_z=0.35, outline=0.006, bevel=0)
loft('quartersroof', M['roofTile'], [[(QX + dx * math.cos(0.35) - dy * math.sin(0.35), QY + dx * math.sin(0.35) + dy * math.cos(0.35), G + 0.195)
                                      for dx, dy in ((-0.23, -0.1), (0.23, -0.1), (0.23, 0.09), (-0.23, 0.09))],
                                     [(QX + dx * math.cos(0.35) - dy * math.sin(0.35), QY + dx * math.sin(0.35) + dy * math.cos(0.35), G + 0.26)
                                      for dx, dy in ((-0.22, -0.004), (0.22, -0.004), (0.22, 0.004), (-0.22, 0.004))]], outline=0.01)

# ---------- forest outside the walls ----------
for k in range(10):
    a = 2 * math.pi * k / 10 + 0.3
    if 4.4 < a < 5.0:
        continue
    r = rng.uniform(1.05, 1.25)
    ball(f'forest{k}', M['forest'], r * math.cos(a), 0.05 + r * 0.92 * math.sin(a), G + 0.12, rng.uniform(0.09, 0.12), outline=0.016)

turn(before, -20)
render(G)
