# A cartoon Bellinzona for the country maps, built in the set's shared look (../toon.py): Castelgrande on
# its great rock above the town in Ticino, its grey stone walls with swallow-tailed battlements round
# the top, the tall White Tower and the Black Tower, the Murata wall running down from the castle
# across the valley, and the town's houses with their orange roofs at the rock's foot. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P bellinzona.py -- bellinzona-1024.png 1024 bellinzona.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'rock': toon('rock', '#9a968a', shadow_mul=(0.8, 0.8, 0.86)),
    'wall': toon('wall', '#c4bcaa', shadow_mul=(0.82, 0.82, 0.88), lift=0.15),
    'white': toon('white', '#e8e2d4', lift=0.2),
    'black': toon('black', '#7a746a'),
    'roof': toon('roof', '#c8643e'),
    'house': toon('house', '#f0e4c8', lift=0.15),
    'dark': flat('dark', '#2e2a2a'),
    'bush': toon('bush', '#5a8f44', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

# ---------- the rock ----------
RX, RY = -0.1, 0.12
rock = lathe('rock', M['rock'], ((0.9, 0), (0.78, 0.1), (0.6, 0.22), (0.5, 0.28), (0.0, 0.3)), G - 0.01, RX, RY, segs=36, outline=0.007)
rock.visible_shadow = False
T = G + 0.29
for k in range(9):
    a = math.radians(200 + k * 17)
    ball(f'rockbush{k}', M['bush'], RX + 0.78 * math.cos(a), RY + 0.78 * math.sin(a), G + 0.12, 0.06, outline=0.006)


def merlons(name, p0, p1, n):
    """Swallow-tailed battlements along a wall from p0 to p1 (their tops)."""
    for k in range(n):
        t = (k + 0.5) / n
        x, y, z = (p0[i] + (p1[i] - p0[i]) * t for i in range(3))
        ang = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
        for s in (-1, 1):
            box(f'{name}{k}{s}', M['wall'], x + s * 0.008 * math.cos(ang), y + s * 0.008 * math.sin(ang), z, 0.014, 0.025, 0.03, rot_z=ang + math.pi / 2, outline=0.001, bevel=0)


# ---------- the castle's walls round the top ----------
CORNERS = [(-0.48, -0.15), (0.28, -0.15), (0.3, 0.38), (-0.46, 0.38)]
for k in range(4):
    (x0, y0), (x1, y1) = CORNERS[k], CORNERS[(k + 1) % 4]
    d = math.hypot(x1 - x0, y1 - y0)
    box(f'wall{k}', M['wall'], (x0 + x1) / 2, (y0 + y1) / 2, T - 0.02, 0.035, d + 0.035, 0.14, rot_z=math.atan2(-(x1 - x0), y1 - y0), outline=0.004, bevel=0)
    merlons(f'merlon{k}', (x0, y0, T + 0.12), (x1, y1, T + 0.12), int(d / 0.05))
# the White Tower and the Black Tower
for name, x, y, w, h, mat in (('whitetower', -0.25, 0.12, 0.13, 0.52, 'white'), ('blacktower', 0.1, 0.2, 0.12, 0.38, 'black')):
    box(name, M[mat], x, y, T - 0.02, w, w, h, outline=0.006, bevel=0)
    for k in range(2):
        box(f'{name}win{k}', M['dark'], x, y - w / 2 - 0.003, T + 0.12 + k * 0.13, 0.02, 0.006, 0.04, outline=0, bevel=0)
    top = T - 0.02 + h
    for sx, sy, ex, ey in ((-1, -1, 1, -1), (1, -1, 1, 1), (1, 1, -1, 1), (-1, 1, -1, -1)):
        merlons(f'{name}merlon{sx}{sy}', (x + sx * w / 2, y + sy * w / 2, top), (x + ex * w / 2, y + ey * w / 2, top), 3)
box('whitetowerroof', M['roof'], -0.25, 0.12, T + 0.53, 0.08, 0.08, 0.02, outline=0.002, bevel=0)
pyramid('whitetowercap', M['roof'], -0.25, 0.12, T + 0.545, 0.09, 0.08)
# the castle's inner buildings
box('palace', M['house'], -0.2, -0.05, T - 0.02, 0.3, 0.12, 0.13, outline=0.004, bevel=0)
loft('palaceroof', M['roof'], [[(-0.36, -0.12, T + 0.105), (-0.04, -0.12, T + 0.105), (-0.04, 0.02, T + 0.105), (-0.36, 0.02, T + 0.105)],
                               [(-0.36, -0.054, T + 0.16), (-0.04, -0.054, T + 0.16), (-0.04, -0.046, T + 0.16), (-0.36, -0.046, T + 0.16)]], outline=0.003)

# ---------- the Murata running down across the valley ----------
M0, M1 = (0.28, 0.1, T + 0.04), (1.12, -0.32, G + 0.1)
bar('murata', M['wall'], (M0[0], M0[1], M0[2]), (M1[0], M1[1], M1[2]), 0.04, outline=0.004)
for k in range(10):
    t = (k + 0.5) / 10
    x, y = M0[0] + (M1[0] - M0[0]) * t, M0[1] + (M1[1] - M0[1]) * t
    z = M0[2] + (M1[2] - M0[2]) * t
    box(f'murataprop{k}', M['wall'], x, y, G - 0.005, 0.035, 0.035, z - G, outline=0.002, bevel=0)
merlons('muratamerlon', (M0[0], M0[1], M0[2] + 0.02), (M1[0], M1[1], M1[2] + 0.02), 14)

# ---------- the town at the foot ----------
for k, (x, y) in enumerate(((-0.75, -0.6), (-0.4, -0.85), (0.05, -0.92), (0.45, -0.75), (-0.95, -0.25))):
    box(f'house{k}', M['house'], x, y, G - 0.005, 0.18, 0.14, 0.12, outline=0.004, bevel=0)
    box(f'housewin{k}', M['dark'], x, y - 0.073, G + 0.05, 0.03, 0.006, 0.035, outline=0, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - 0.1, y - 0.08, G + 0.115), (x + 0.1, y - 0.08, G + 0.115), (x + 0.1, y + 0.08, G + 0.115), (x - 0.1, y + 0.08, G + 0.115)],
                                      [(x - 0.1, y - 0.004, G + 0.17), (x + 0.1, y - 0.004, G + 0.17), (x + 0.1, y + 0.004, G + 0.17), (x - 0.1, y + 0.004, G + 0.17)]], outline=0.003)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
