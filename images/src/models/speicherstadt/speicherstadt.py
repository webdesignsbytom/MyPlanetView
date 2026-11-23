# A cartoon Speicherstadt for the country maps, built in the set's shared look (../toon.py):
# Hamburg's warehouse city, tall red-brick storehouses in neo-Gothic dress with their gables, little
# turrets and green copper roofs rising straight out of the canals, the green iron bridges, and the
# turreted Wasserschloss on its point where two canals meet. Turned a little towards the camera.
# Run: blender -b --factory-startup -P speicherstadt.py -- speicherstadt-1024.png 1024 speicherstadt.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'water': toon('water', '#4a7a9a', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'quay': toon('quay', '#a8a098'),
    'brick': toon('brick', '#b04a34', shadow_mul=(0.86, 0.78, 0.76), lift=0.04),
    'brickDark': toon('brickDark', '#8a3a2a'),
    'copper': toon('copper', '#5aa88a', lift=0.12),
    'iron': toon('iron', '#3a7a5a'),
    'dark': flat('dark', '#2a2a32'),
})

G = tile(M['water'])
before = set(bpy.data.objects)

# canals: one across the front, one running back on the right; blocks of land between
for name, (x, y, sx, sy) in {'blockA': (-0.38, 0.28, 0.9, 0.6), 'blockB': (0.62, 0.28, 0.42, 0.6), 'blockC': (-0.15, -0.55, 1.2, 0.32)}.items():
    box(name, M['quay'], x, y, G - 0.005, sx, sy, 0.04, outline=0.004, bevel=0)


def warehouse(name, x, y, w, d, h, face=-1):
    box(name, M['brick'], x, y, G + 0.03, w, d, h, outline=0.007, bevel=0)
    for r in range(int(h / 0.06)):
        for j in range(int(w / 0.06)):
            box(f'{name}win{r}{j}', M['dark'], x - w / 2 + 0.03 + j * (w - 0.06) / max(1, int(w / 0.06) - 1), y + face * (d / 2 + 0.003), G + 0.06 + r * 0.06, 0.02, 0.006, 0.03, outline=0, bevel=0)
    box(f'{name}cornice', M['brickDark'], x, y, G + 0.03 + h - 0.01, w + 0.01, d + 0.01, 0.015, outline=0.002, bevel=0)
    loft(f'{name}roof', M['copper'], [[(x - w / 2, y - d / 2, G + 0.03 + h), (x + w / 2, y - d / 2, G + 0.03 + h), (x + w / 2, y + d / 2, G + 0.03 + h), (x - w / 2, y + d / 2, G + 0.03 + h)],
                                      [(x - w / 2 + 0.03, y - 0.004, G + 0.03 + h + 0.07), (x + w / 2 - 0.03, y - 0.004, G + 0.03 + h + 0.07), (x + w / 2 - 0.03, y + 0.004, G + 0.03 + h + 0.07), (x - w / 2 + 0.03, y + 0.004, G + 0.03 + h + 0.07)]], outline=0.004)
    for j in range(int(w / 0.25) + 1):
        gx = x - w / 2 + 0.06 + j * 0.25
        if gx > x + w / 2 - 0.04:
            continue
        for k, (gw, gh) in enumerate(((0.07, 0.04), (0.04, 0.04))):
            box(f'{name}gable{j}{k}', M['brick'], gx, y + face * (d / 2 - 0.01), G + 0.03 + h + k * 0.04 - 0.005, gw, 0.02, gh, outline=0.002, bevel=0)
        lathe(f'{name}turret{j}', M['copper'], ((0.018, 0), (0.004, 0.06)), G + 0.03 + h + 0.075, gx, y + face * (d / 2 - 0.01), segs=8, outline=0.001, smooth=False)


warehouse('w1', -0.38, 0.08, 0.84, 0.18, 0.3)
warehouse('w2', -0.38, 0.45, 0.84, 0.18, 0.24)
warehouse('w3', -0.2, -0.55, 0.9, 0.16, 0.22)

# ---------- the Wasserschloss ----------
box('wscore', M['brick'], 0.62, 0.15, G + 0.03, 0.22, 0.2, 0.26, outline=0.007, bevel=0)
for j in range(3):
    for r in range(3):
        box(f'wswin{j}{r}', M['dark'], 0.55 + j * 0.07, 0.047, G + 0.07 + r * 0.07, 0.025, 0.006, 0.04, outline=0, bevel=0)
for sx in (-1, 1):
    lathe(f'wsturret{sx}', M['brick'], ((0.04, 0), (0.04, 0.32)), G + 0.03, 0.62 + sx * 0.11, 0.05, segs=12, outline=0.004)
    lathe(f'wsturretcap{sx}', M['copper'], ((0.046, 0), (0.004, 0.12)), G + 0.345, 0.62 + sx * 0.11, 0.05, segs=12, outline=0.003)
loft('wsroof', M['copper'], [[(0.51, 0.05, G + 0.285), (0.73, 0.05, G + 0.285), (0.73, 0.25, G + 0.285), (0.51, 0.25, G + 0.285)],
                             [(0.6, 0.13, G + 0.4), (0.64, 0.13, G + 0.4), (0.64, 0.17, G + 0.4), (0.6, 0.17, G + 0.4)]], outline=0.004)

# ---------- the bridges ----------
for k, (p0, p1) in enumerate((((0.07, 0.1), (0.4, 0.1)), ((-0.6, -0.04), (-0.6, -0.38)), ((0.5, -0.03), (0.4, -0.38)))):
    for s in (-1, 1):
        dx, dy = p1[0] - p0[0], p1[1] - p0[1]
        L = math.hypot(dx, dy)
        nx, ny = -dy / L * 0.035 * s, dx / L * 0.035 * s
        bar(f'bridgerail{k}{s}', M['iron'], (p0[0] + nx, p0[1] + ny, G + 0.08), (p1[0] + nx, p1[1] + ny, G + 0.08), 0.012, outline=0.001)
        for i in range(6):
            t0, t1 = i / 6, (i + 1) / 6
            bar(f'bridgediag{k}{s}{i}', M['iron'], (p0[0] + dx * t0 + nx, p0[1] + dy * t0 + ny, G + 0.04), (p0[0] + dx * t1 + nx, p0[1] + dy * t1 + ny, G + 0.08), 0.006, outline=0)
    bar(f'bridgedeck{k}', M['iron'], (p0[0], p0[1], G + 0.04), (p1[0], p1[1], G + 0.04), 0.07, outline=0.002)

turn(before, -20)
render(G)
