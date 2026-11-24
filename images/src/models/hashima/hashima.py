# A cartoon Hashima for the country maps, built in the set's shared look (../toon.py): Battleship
# Island off Nagasaki, its long shape ringed by a tall grey sea wall rising straight out of the sea,
# the rock ridge down its middle, and the abandoned concrete apartment blocks crowded on top of it
# with their rows of windows, the lighthouse at the summit. Turned a little towards the camera.
# Run: blender -b --factory-startup -P hashima.py -- hashima-1024.png 1024 hashima.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'wall': toon('wall', '#9a9a96', shadow_mul=(0.84, 0.84, 0.9), lift=0.06),
    'rock': toon('rock', '#7a7466', shadow_mul=(0.84, 0.84, 0.88)),
    'c1': toon('c1', '#b4b0a8', shadow_mul=(0.84, 0.84, 0.9), lift=0.08),
    'c2': toon('c2', '#a0a09a', shadow_mul=(0.84, 0.84, 0.9), lift=0.06),
    'c3': toon('c3', '#c4bca8', shadow_mul=(0.84, 0.84, 0.9), lift=0.08),
    'window': flat('window', '#3a3a40'),
    'white': toon('white', '#f4f4f0', lift=0.15),
    'green': toon('green', '#6a8a4a'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)
rng = random.Random(2389)


def rrect(cx, cy, hw, hh, z, rad, n=4):
    pts = []
    for ox, oy, a0 in ((cx + hw - rad, cy - hh + rad, -90), (cx + hw - rad, cy + hh - rad, 0), (cx - hw + rad, cy + hh - rad, 90), (cx - hw + rad, cy - hh + rad, 180)):
        for k in range(n + 1):
            a = math.radians(a0 + 90 * k / n)
            pts.append((ox + rad * math.cos(a), oy + rad * math.sin(a), G + z))
    return pts


loft('seawall', M['wall'], [rrect(0.0, 0.05, 0.98, 0.4, -0.01, 0.28), rrect(0.0, 0.05, 0.95, 0.37, 0.12, 0.26)], outline=0.01)
for k in range(4):
    loft(f'wallcourse{k}', M['c2'], [rrect(0.0, 0.05, 0.985 - k * 0.0075, 0.405 - k * 0.0075, 0.02 + k * 0.03, 0.28), rrect(0.0, 0.05, 0.985 - k * 0.0075, 0.405 - k * 0.0075, 0.026 + k * 0.03, 0.28)], outline=0)
T = G + 0.12
rk = loft('ridge', M['rock'], [rrect(0.05, 0.08, 0.42, 0.18, 0.11, 0.12), rrect(0.05, 0.1, 0.3, 0.12, 0.22, 0.08)], outline=0.006)
rk.visible_shadow = False


def block(name, x, y, z, w, d, h):
    mat = M[rng.choice(('c1', 'c2', 'c3'))]
    box(name, mat, x, y, z - 0.005, w, d, h, outline=0.005, bevel=0)
    for r in range(int(h / 0.035)):
        box(f'{name}win{r}', M['window'], x, y - d / 2 - 0.003, z + 0.015 + r * 0.035, w * 0.84, 0.006, 0.012, outline=0, bevel=0)


for j in range(12):
    x = -0.82 + j * 0.15
    for i, y in enumerate((-0.22, -0.06, 0.12, 0.3)):
        if abs(x) / 0.95 + abs(y - 0.05) / 0.37 > 1.25 or rng.random() < 0.12:
            continue
        on_ridge = abs(x - 0.05) < 0.36 and abs(y - 0.09) < 0.16
        if on_ridge:
            continue
        h = rng.uniform(0.14, 0.32) if y > -0.1 else rng.uniform(0.1, 0.2)
        block(f'block{j}{i}', x, y, T, rng.uniform(0.11, 0.13), rng.uniform(0.11, 0.14), h)
for j, x in enumerate((-0.25, -0.1, 0.2, 0.35)):
    block(f'ridgeblock{j}', x, 0.0, G + 0.17, 0.12, 0.1, 0.18)
lathe('lighthouse', M['white'], ((0.03, 0), (0.025, 0.12)), G + 0.215, 0.07, 0.12, segs=10, outline=0.003)
lathe('lighthousetop', M['window'], ((0.03, 0), (0.03, 0.025), (0.004, 0.05)), G + 0.33, 0.07, 0.12, segs=10, outline=0.002)
for k, (x, y) in enumerate(((0.2, 0.18), (-0.15, 0.2))):
    ball(f'scrub{k}', M['green'], x, y, G + 0.22, 0.04, outline=0.003)

turn(before, -20)
render(G)
