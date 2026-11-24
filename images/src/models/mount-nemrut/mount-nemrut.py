# A cartoon Mount Nemrut for the country maps, built in the set's shared look (../toon.py): King
# Antiochus's tomb mound of loose stone on the summit, and on its terrace the colossal stone heads
# of the king and the gods, fallen from their seated bodies, set out in a row on the ground with
# their tall conical caps, an eagle's and a lion's head among them, the headless bodies behind.
# Turned a little towards the camera.
# Run: blender -b --factory-startup -P mount-nemrut.py -- mount-nemrut-1024.png 1024 mount-nemrut.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'mountain': toon('mountain', '#b8a888', shadow_mul=(0.86, 0.82, 0.78), lift=0.2),
    'gravel': toon('gravel', '#9a9088', shadow_mul=(0.84, 0.84, 0.88)),
    'limestone': toon('limestone', '#e0d4b8', shadow_mul=(0.84, 0.82, 0.86), lift=0.12),
    'limestoneDark': toon('limestoneDark', '#c4b494', shadow_mul=(0.84, 0.82, 0.86)),
    'eye': flat('eye', '#5a4e44'),
})

G = tile(M['mountain'])
before = set(bpy.data.objects)

# ---------- the tumulus ----------
tm = lathe('tumulus', M['gravel'], ((0.75, 0), (0.45, 0.32), (0.15, 0.5), (0.04, 0.53)), G - 0.01, 0.0, 0.55, segs=24, outline=0.012)
tm.visible_shadow = False
box('terrace', M['limestoneDark'], 0.0, -0.1, G - 0.005, 1.6, 0.6, 0.04, outline=0.006, bevel=0)
T = G + 0.035

# ---------- the seated bodies behind ----------
for j in range(3):
    x = -0.45 + j * 0.45
    box(f'throne{j}', M['limestoneDark'], x, 0.2, T - 0.005, 0.18, 0.14, 0.12, outline=0.006, bevel=0)
    box(f'body{j}', M['limestone'], x, 0.18, T + 0.115, 0.14, 0.1, 0.13, outline=0.006, bevel=0)
    for s in (-1, 1):
        box(f'knee{j}{s}', M['limestone'], x + s * 0.04, 0.1, T + 0.09, 0.05, 0.1, 0.04, outline=0.003, bevel=0)


def head(name, x, y, r, cap=True, kind='god'):
    b = ball(f'{name}', M['limestone'], 0, 0, 0, r, outline=0.01)
    b.scale = (0.85, 0.8, 1.05)
    b.location = (x, y, T + r * 1.0)
    if kind == 'god':
        for s in (-1, 1):
            box(f'{name}brow{s}', M['limestoneDark'], x + s * r * 0.3, y - r * 0.78, T + r * 1.3, r * 0.4, r * 0.12, r * 0.09, outline=0.002, bevel=0)
            ball(f'{name}eye{s}', M['eye'], x + s * r * 0.3, y - r * 0.8, T + r * 1.15, r * 0.13, outline=0)
        loft(f'{name}nose', M['limestone'], [[(x - r * 0.1, y - r * 0.8, T + r * 0.75), (x + r * 0.1, y - r * 0.8, T + r * 0.75), (x, y - r * 0.6, T + r * 0.75)],
                                              [(x - r * 0.03, y - r * 0.78, T + r * 1.1), (x + r * 0.03, y - r * 0.78, T + r * 1.1), (x, y - r * 0.6, T + r * 1.1)]], outline=0.003)
        box(f'{name}mouth', M['eye'], x, y - r * 0.8, T + r * 0.55, r * 0.35, r * 0.05, r * 0.05, outline=0, bevel=0)
        b = ball(f'{name}beard', M['limestoneDark'], 0, 0, 0, r * 0.4, outline=0.004)
        b.scale = (1.1, 0.7, 0.8)
        b.location = (x, y - r * 0.45, T + r * 0.3)
        if cap:
            lathe(f'{name}cap', M['limestoneDark'], ((r * 0.75, 0), (r * 0.55, r * 0.55), (r * 0.25, r * 1.0)), T + r * 1.75, x, y + r * 0.05, segs=12, outline=0.005)
    elif kind == 'eagle':
        loft(f'{name}beak', M['limestoneDark'], [[(x - r * 0.15, y - r * 0.7, T + r * 0.9), (x + r * 0.15, y - r * 0.7, T + r * 0.9), (x, y - r * 0.7, T + r * 1.15)],
                                                  [(x - r * 0.04, y - r * 1.15, T + r * 0.75), (x + r * 0.04, y - r * 1.15, T + r * 0.75), (x, y - r * 1.15, T + r * 0.85)]], outline=0.003)
        for s in (-1, 1):
            ball(f'{name}eye{s}', M['eye'], x + s * r * 0.35, y - r * 0.65, T + r * 1.25, r * 0.12, outline=0)
    elif kind == 'lion':
        for j in range(10):
            a = 2 * math.pi * j / 10
            ball(f'{name}mane{j}', M['limestoneDark'], x + r * 0.95 * math.cos(a), y + 0.02, T + r * 1.0 + r * 0.95 * math.sin(a), r * 0.32, outline=0.002)
        for s in (-1, 1):
            ball(f'{name}eye{s}', M['eye'], x + s * r * 0.3, y - r * 0.8, T + r * 1.15, r * 0.12, outline=0)
        ball(f'{name}muzzle', M['limestoneDark'], x, y - r * 0.75, T + r * 0.75, r * 0.25, outline=0.002)


# ---------- the fallen heads in a row ----------
HEADS = ((-0.72, -0.28, 0.14, 'lion'), (-0.36, -0.36, 0.19, 'god'), (0.02, -0.4, 0.21, 'god'), (0.4, -0.36, 0.19, 'god'), (0.76, -0.28, 0.14, 'eagle'))
for k, (x, y, r, kind) in enumerate(HEADS):
    head(f'head{k}', x, y, r, cap=(k != 2), kind=kind)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
