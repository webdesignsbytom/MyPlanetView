# A cartoon Villa La Rotonda for the country maps, built in the set's shared look (../toon.py):
# Palladio's perfectly symmetrical villa on its little hill outside Vicenza, the square block with a
# temple-front portico of six Ionic columns and a broad flight of steps on each of its four sides,
# the statues on the pediments, the low dome in the middle, and the lawns and cypresses round it.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P villa-rotonda.py -- villa-rotonda-1024.png 1024 villa-rotonda.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'stone': toon('stone', '#f0e6d0', shadow_mul=(0.84, 0.84, 0.88), lift=0.2),
    'stoneDark': toon('stoneDark', '#d4c6a8'),
    'ochre': toon('ochre', '#ecd6a8', lift=0.15),
    'roof': toon('roof', '#c4704a'),
    'dark': flat('dark', '#2e2a26'),
    'cypress': toon('cypress', '#2f5a34', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)

# ---------- the little hill ----------
hl = lathe('hill', M['lawn'], ((1.0, 0), (0.85, 0.05), (0.62, 0.1), (0.0, 0.11)), G - 0.01, 0, 0, segs=36, outline=0.006)
hl.visible_shadow = False
T = G + 0.1

# ---------- the villa ----------
S, H = 0.4, 0.24
box('base', M['stoneDark'], 0, 0, T - 0.005, S + 0.04, S + 0.04, 0.06, outline=0.006, bevel=0)
box('block', M['ochre'], 0, 0, T + 0.05, S, S, H, outline=0.008, bevel=0)
loft('roof', M['roof'], [[(-S / 2 - 0.02, -S / 2 - 0.02, T + 0.05 + H), (S / 2 + 0.02, -S / 2 - 0.02, T + 0.05 + H), (S / 2 + 0.02, S / 2 + 0.02, T + 0.05 + H), (-S / 2 - 0.02, S / 2 + 0.02, T + 0.05 + H)],
                         [(-0.1, -0.1, T + 0.05 + H + 0.08), (0.1, -0.1, T + 0.05 + H + 0.08), (0.1, 0.1, T + 0.05 + H + 0.08), (-0.1, 0.1, T + 0.05 + H + 0.08)]], outline=0.005)
lathe('drum', M['stone'], ((0.11, 0), (0.11, 0.04)), T + 0.05 + H + 0.075, 0, 0, segs=24, outline=0.003)
lathe('dome', M['roof'], ((0.115, 0), (0.1, 0.04), (0.06, 0.07), (0.025, 0.08)), T + 0.05 + H + 0.11, 0, 0, segs=24, outline=0.004)
lathe('lantern', M['stone'], ((0.025, 0), (0.025, 0.03), (0.003, 0.05)), T + 0.05 + H + 0.185, 0, 0, segs=10, outline=0.002)
# the four porticoes, steps and pediments
for k in range(4):
    a = k * math.pi / 2 - math.pi / 2
    nx, ny = math.cos(a), math.sin(a)
    tx, ty = -ny, nx
    objs = set(bpy.data.objects)
    # built facing -y at the origin, then turned to its side
    box(f'porticofloor{k}', M['stoneDark'], 0, -S / 2 - 0.07, T + 0.05, 0.3, 0.14, 0.01, outline=0.002, bevel=0)
    for j in range(6):
        x = -0.125 + j * 0.05
        rod(f'column{k}{j}', M['stone'], (x, -S / 2 - 0.12, T + 0.055), (x, -S / 2 - 0.12, T + 0.05 + H - 0.03), 0.011, segs=8, outline=0.002)
    box(f'porticoentab{k}', M['stone'], 0, -S / 2 - 0.07, T + 0.05 + H - 0.035, 0.3, 0.15, 0.03, outline=0.003, bevel=0)
    loft(f'pediment{k}', M['stone'], [[(-0.15, -S / 2 - 0.145, T + 0.05 + H - 0.005), (0.15, -S / 2 - 0.145, T + 0.05 + H - 0.005), (0.15, -S / 2, T + 0.05 + H - 0.005), (-0.15, -S / 2, T + 0.05 + H - 0.005)],
                                      [(-0.004, -S / 2 - 0.145, T + 0.05 + H + 0.06), (0.004, -S / 2 - 0.145, T + 0.05 + H + 0.06), (0.004, -S / 2, T + 0.05 + H + 0.06), (-0.004, -S / 2, T + 0.05 + H + 0.06)]], outline=0.003)
    for j, x in enumerate((-0.15, 0.0, 0.15)):
        rod(f'statue{k}{j}', M['stone'], (x, -S / 2 - 0.14, T + 0.05 + H + (0.06 if j == 1 else 0.0)), (x, -S / 2 - 0.14, T + 0.05 + H + 0.05 + (0.06 if j == 1 else 0.0)), 0.008, segs=5, outline=0.001)
    box(f'door{k}', M['dark'], 0, -S / 2 - 0.003, T + 0.06, 0.05, 0.006, 0.1, outline=0, bevel=0)
    for i in range(5):
        box(f'step{k}{i}', M['stoneDark'], 0, -S / 2 - 0.15 - i * 0.03, T - 0.005, 0.26, 0.03, 0.055 - i * 0.011, outline=0.001, bevel=0)
    for s in (-1, 1):
        box(f'stepwall{k}{s}', M['stone'], s * 0.15, -S / 2 - 0.2, T - 0.005, 0.03, 0.12, 0.06, outline=0.002, bevel=0)
    bpy.context.view_layer.update()
    m = Matrix.Rotation(a + math.pi / 2, 4, 'Z')
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = m @ o.matrix_world
bpy.context.view_layer.update()

# ---------- cypresses round the hill ----------
for k in range(10):
    a = 2 * math.pi * k / 10 + 0.3
    x, y = 1.05 * math.cos(a), 1.05 * math.sin(a)
    lathe(f'cypress{k}', M['cypress'], ((0.035, 0), (0.045, 0.06), (0.03, 0.2), (0.004, 0.3)), G - 0.005, x, y, segs=10, outline=0.006)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
