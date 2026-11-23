# A cartoon of Amsterdam's canal ring for the country maps, built in the set's shared look
# (../toon.py): tall narrow gabled canal houses in brick, black and white, their step, bell and neck
# gables against the sky, a humped brick bridge over the canal with bicycles on it, a houseboat and
# a canal tour boat, and the elms along the quay. Turned a little towards the camera.
# Run: blender -b --factory-startup -P amsterdam-canals.py -- amsterdam-canals-1024.png 1024 amsterdam-canals.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'canal': toon('canal', '#4a7a8a', shadow_mul=(0.76, 0.84, 0.86), lift=0.3),
    'quay': toon('quay', '#9a8e80', shadow_mul=(0.84, 0.84, 0.9), lift=0.15),
    'b0': toon('b0', '#8a4a32'), 'b1': toon('b1', '#3a3434'), 'b2': toon('b2', '#a85a3a'), 'b3': toon('b3', '#f2ece0', lift=0.2), 'b4': toon('b4', '#6a3a2c'),
    'white': toon('white', '#f8f6f0', lift=0.2),
    'window': flat('window', '#2e3a54'),
    'brick': toon('bridgeBrick', '#9a5a3a'),
    'bike': toon('bike', '#2e2a30'),
    'boat': toon('boat', '#f6f3ec', lift=0.2),
    'glass': toon('glass', '#8ab8d8', lift=0.3),
    'houseboat': toon('houseboat', '#3f8a5a'),
    'elm': toon('elm', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#5a4038'),
})

G = tile(M['canal'])
before = set(bpy.data.objects)
rng = random.Random(1879)

# ---------- the quays either side of the canal ----------
for s in (-1, 1):
    pts = [(1.4 * math.cos(math.radians(a)), 1.4 * math.sin(math.radians(a))) for a in (range(25, 156, 5) if s > 0 else range(205, 336, 5))]
    q = loft(f'quay{s}', M['quay'], [[(x, y, G - 0.01) for x, y in pts], [(x * 0.98, y * 0.98, G + 0.05) for x, y in pts]], outline=0.01)
    q.visible_shadow = False
T = G + 0.05


# ---------- the canal houses ----------
def canal_house(name, x, y, w, h, mat, gable):
    box(name, M[mat], x, y, T - 0.005, w, 0.18, h, outline=0.008, bevel=0)
    fy = y - 0.092
    for row in range(int(h / 0.07)):
        for j in range(2):
            box(f'{name}win{row}{j}', M['window'], x - w / 4 + j * w / 2, fy, T + 0.03 + row * 0.07, 0.026, 0.006, 0.04, outline=0, bevel=0)
    top = T + h - 0.005
    if gable == 'step':
        for i in range(3):
            box(f'{name}step{i}', M[mat], x, fy + 0.012, top + i * 0.03, w * (0.8 - i * 0.25), 0.02, 0.032, outline=0.003, bevel=0)
    elif gable == 'bell':
        lathe(f'{name}bell', M[mat], ((w * 0.45, 0), (w * 0.4, 0.04), (w * 0.2, 0.07), (0.004, 0.09)), top, x, fy + 0.012, segs=10, outline=0.004)
    else:
        box(f'{name}neck', M[mat], x, fy + 0.012, top, w * 0.45, 0.02, 0.07, outline=0.003, bevel=0)
        pyramid(f'{name}neckcap', M['white'], x, fy + 0.012, top + 0.07, w * 0.5, 0.03, outline=0.002)
    box(f'{name}hoist', M['white'], x, fy - 0.01, top - 0.02, 0.008, 0.03, 0.008, outline=0, bevel=0)


GABLES = ['step', 'bell', 'neck']
for k in range(9):
    x = -1.0 + k * 0.25
    for s, y in ((1, 0.55), (-1, -0.55)):
        if math.hypot(x, y + s * 0.1) > 1.18:
            continue
        canal_house(f'house{s}{k}', x, y + s * 0.05, 0.22, rng.uniform(0.25, 0.36), f'b{(k + (s > 0)) % 5}', GABLES[(k + (s > 0)) % 3]) if s > 0 else None

# ---------- the bridge, the boats, the elms ----------
BX = 0.0
for j in range(9):
    u = -0.2 + j * 0.05
    z = 0.06 * math.cos(u / 0.2 * math.pi / 2)
    box(f'bridgedeck{j}', M['brick'], BX + u, -0.05, T + z - 0.02, 0.055, 0.22, 0.03, outline=0.004, bevel=0)
box('bridgepierL', M['brick'], BX - 0.28, -0.05, G - 0.01, 0.12, 0.24, 0.06, outline=0.006, bevel=0)
box('bridgepierR', M['brick'], BX + 0.28, -0.05, G - 0.01, 0.12, 0.24, 0.06, outline=0.006, bevel=0)
box('bridgearch', M['canal'], BX, -0.05, G - 0.01, 0.2, 0.26, 0.04, outline=0, bevel=0)
for k, (u, v) in enumerate(((-0.08, -0.12), (0.06, 0.02))):
    for w in (-0.025, 0.025):
        cyl(f'bikewheel{k}{w}', M['bike'], 0.022, 0.004, segs=12, outline=0.002, matrix=Matrix.Translation((BX + u + w, v - 0.05, T + 0.09)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    bar(f'bikeframe{k}', M['bike'], (BX + u - 0.025, v - 0.05, T + 0.09), (BX + u + 0.025, v - 0.05, T + 0.11), 0.006, outline=0)
loft('tourboat', M['glass'], [[(-0.85, -0.2, G), (-0.45, -0.2, G), (-0.4, -0.12, G), (-0.85, -0.12, G)],
                              [(-0.85, -0.2, G + 0.07), (-0.45, -0.2, G + 0.07), (-0.4, -0.12, G + 0.07), (-0.85, -0.12, G + 0.07)]], outline=0.006)
box('tourboathull', M['boat'], -0.63, -0.16, G - 0.002, 0.46, 0.1, 0.03, outline=0.005, bevel=0)
box('houseboat', M['houseboat'], 0.62, 0.22, G - 0.002, 0.4, 0.12, 0.09, outline=0.007, bevel=0)
box('houseboatroof', M['b1'], 0.62, 0.22, G + 0.088, 0.42, 0.14, 0.015, outline=0.004, bevel=0)
for k in range(6):
    x = -0.9 + k * 0.36
    for s, y in ((1, 0.36), (-1, -0.38)):
        if math.hypot(x, y) > 1.2:
            continue
        rod(f'elmtrunk{s}{k}', M['trunk'], (x, y, T), (x, y, T + 0.08), 0.01, segs=6, outline=0.003)
        ball(f'elm{s}{k}', M['elm'], x, y, T + 0.12, 0.06, outline=0.009)
for k in range(8):
    x = -0.95 + k * 0.27
    canal_house(f'front{k}', x, -0.62, 0.22, rng.uniform(0.18, 0.24), f'b{k % 5}', GABLES[k % 3]) if math.hypot(x, -0.62) < 1.12 else None

turn(before, -20)
render(G)
