# A cartoon Prince's Palace of Monaco for the country maps, built in the set's shared look
# (../toon.py): the palace on top of the Rock, its pale walls and crenellated towers, the clock
# tower, cannon and their pyramids of cannonballs on the square in front, the old town's ochre and
# pink houses behind, the cliff falling to the sea, and Port Hercule below crowded with white yachts.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P monaco-palace.py -- monaco-palace-1024.png 1024 monaco-palace.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f8fc8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'rock': toon('rock', '#b8a88e', shadow_mul=(0.8, 0.78, 0.84)),
    'green': toon('green2', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'palace': toon('palace', '#f0e2c0', shadow_mul=(0.84, 0.8, 0.82), lift=0.2),
    'palaceTrim': toon('palaceTrim', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'roofTile': toon('roofTile', '#c4573a'),
    'window': flat('window', '#3a4a5a'),
    'ochre': toon('ochre', '#e0a85a', shadow_mul=(0.84, 0.74, 0.62)),
    'pink': toon('pink', '#e8a8a0', shadow_mul=(0.84, 0.74, 0.8)),
    'paving': toon('paving', '#ddd3c0', lift=0.25),
    'cannon': toon('cannon', '#3a3a40'),
    'quay': toon('quay', '#c9c2b4', shadow_mul=(0.8, 0.8, 0.88)),
    'hull': toon('hull', '#f6f3ec', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'hullStripe': flat('hullStripe', '#2f4f7a'),
    'glass': flat('glass', '#2f3f5a'),
    'flagRed': flat('flagRed', '#ce1126'),
    'flagWhite': flat('flagWhite', '#ffffff'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(443)


def ring(cx, cy, rx, ry, z, jitter, sides=18):
    return [(cx + rx * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / sides),
             cy + ry * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / sides), G + z) for k in range(sides)]


# ---------- the Rock ----------
RX, RY = -0.3, 0.35
rock = loft('rock', M['rock'], [ring(RX, RY, 0.92, 0.62, -0.01, 0.04), ring(RX, RY, 0.86, 0.56, 0.26, 0.05), ring(RX, RY, 0.82, 0.52, 0.36, 0.02)], outline=0.035)
rock.visible_shadow = False
top = loft('rocktop', M['green'], [ring(RX, RY, 0.823, 0.523, 0.355, 0.0), ring(RX, RY, 0.8, 0.5, 0.375, 0.02)], outline=0.016)
top.visible_shadow = False
T = G + 0.375

# ---------- the palace square, with cannon and cannonballs ----------
box('square', M['paving'], RX + 0.05, RY - 0.25, T - 0.005, 0.7, 0.22, 0.01, outline=0.006, bevel=0)
for k, x in enumerate((RX - 0.2, RX + 0.05, RX + 0.3)):
    rod(f'cannon{k}', M['cannon'], (x, RY - 0.25, T + 0.025), (x + 0.02, RY - 0.36, T + 0.035), 0.014, r2=0.011, segs=8, outline=0.004)
    for b, (dx, dy, dz) in enumerate(((0, 0, 0), (0.024, 0, 0), (0.012, 0.02, 0), (0.012, 0.007, 0.02))):
        ball(f'ball{k}{b}', M['cannon'], x + 0.05 + dx, RY - 0.2 + dy, T + 0.017 + dz, 0.012, outline=0.002)

# ---------- the palace: its long front, crenellated towers, the clock tower ----------
PX, PY = RX + 0.05, RY + 0.02
box('palace', M['palace'], PX, PY, T - 0.005, 0.62, 0.22, 0.2, outline=0.02, bevel=0)
box('palacecornice', M['palaceTrim'], PX, PY, T + 0.19, 0.64, 0.24, 0.025, outline=0.01, bevel=0)
for row, z in enumerate((0.04, 0.12)):
    for k in range(9):
        box(f'palacewin{row}{k}', M['window'], PX - 0.27 + k * 0.0675, PY - 0.112, T + z, 0.025, 0.01, 0.045, outline=0, bevel=0)
box('palacedoor', M['window'], PX, PY - 0.112, T, 0.06, 0.01, 0.09, outline=0, bevel=0)
for s in (-1, 1):
    x = PX + s * 0.33
    box(f'tower{s}', M['palace'], x, PY - 0.02, T - 0.005, 0.12, 0.12, 0.3, outline=0.016, bevel=0)
    for cx in (-1, 0, 1):
        for cy in (-1, 1):
            box(f'towermerlon{s}{cx}{cy}', M['palaceTrim'], x + cx * 0.045, PY - 0.02 + cy * 0.05, T + 0.295, 0.025, 0.02, 0.03, outline=0.004, bevel=0)
    box(f'towerwin{s}', M['window'], x, PY - 0.082, T + 0.2, 0.025, 0.01, 0.05, outline=0, bevel=0)
CTX = PX + 0.12
box('clocktower', M['palace'], CTX, PY + 0.05, T + 0.19, 0.08, 0.08, 0.15, outline=0.012, bevel=0)
cyl('clock', M['palaceTrim'], 0.025, 0.01, segs=16, outline=0.004, matrix=Matrix.Translation((CTX, PY + 0.008, T + 0.29)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
pyramid('clockroof', M['roofTile'], CTX, PY + 0.05, T + 0.34, 0.1, 0.07, outline=0.008)
rod('flagpole', M['palaceTrim'], (PX - 0.33, PY - 0.02, T + 0.33), (PX - 0.33, PY - 0.02, T + 0.5), 0.005, segs=6, outline=0)
box('flagred', M['flagRed'], PX - 0.33 + 0.045, PY - 0.02, T + 0.465, 0.08, 0.006, 0.025, outline=0, bevel=0)
box('flagwhite', M['flagWhite'], PX - 0.33 + 0.045, PY - 0.02, T + 0.44, 0.08, 0.006, 0.025, outline=0, bevel=0)

# ---------- the old town behind ----------
for k in range(6):
    x = RX - 0.45 + k * 0.17 + rng.uniform(-0.02, 0.02)
    y = RY + 0.3 + (k % 2) * 0.08
    h = rng.uniform(0.1, 0.16)
    box(f'house{k}', M['ochre' if k % 2 else 'pink'], x, y, T - 0.005, 0.13, 0.12, h, outline=0.012, bevel=0)
    pyramid(f'houseroof{k}', M['roofTile'], x, y, T + h - 0.005, 0.15, 0.06, outline=0.008)

# ---------- Port Hercule: its quays and the yachts ----------
QY = -0.55
box('quay', M['quay'], 0.45, QY - 0.18, G - 0.005, 0.85, 0.05, 0.04, rot_z=0.15, outline=0.01, bevel=0)
box('quay2', M['quay'], 0.9, -0.2, G - 0.005, 0.05, 0.75, 0.04, outline=0.01, bevel=0)
for k in range(5):
    box(f'pontoon{k}', M['quay'], 0.25 + k * 0.13, QY + 0.1, G - 0.005, 0.025, 0.3, 0.025, outline=0.005, bevel=0)


def yacht(name, x, y, length, deg):
    a = math.radians(deg)
    ca, sa = math.cos(a), math.sin(a)

    def p(u, v, z):
        return (x + u * ca - v * sa, y + u * sa + v * ca, G + z)
    w = length * 0.28
    hull = [p(-length / 2, -w / 2, -0.005), p(length / 3, -w / 2, -0.005), p(length / 2, 0, -0.005), p(length / 3, w / 2, -0.005), p(-length / 2, w / 2, -0.005)]
    hull2 = [p(-length / 2, -w / 2 * 1.1, 0.04), p(length / 3, -w / 2 * 1.1, 0.04), p(length / 2 + 0.02, 0, 0.04), p(length / 3, w / 2 * 1.1, 0.04),
             p(-length / 2, w / 2 * 1.1, 0.04)]
    loft(f'{name}hull', M['hull'], [hull, hull2], outline=0.008)
    cx, cy, _ = p(-0.02, 0, 0)
    box(f'{name}cabin', M['hull'], cx, cy, G + 0.04, length * 0.45, w * 0.75, 0.035, rot_z=a, outline=0.006, bevel=0)
    box(f'{name}glass', M['glass'], cx, cy, G + 0.05, length * 0.46, w * 0.77, 0.012, rot_z=a, outline=0, bevel=0)


for k, (x, y, L, d) in enumerate(((0.32, -0.42, 0.22, 90), (0.45, -0.42, 0.24, 90), (0.58, -0.42, 0.2, 90), (0.71, -0.4, 0.26, 90), (0.55, -0.05, 0.3, 160),
                                  (0.25, -0.85, 0.2, 10))):
    yacht(f'yacht{k}', x, y, L, d)

turn(before, -20)
render(G)
