# A cartoon Tower of Hercules for the country maps, built in the set's shared look (../toon.py):
# the Roman lighthouse of A Coruña, still lit after nineteen centuries, its tall square tower banded
# by the slanting lines of the old outside ramp, the two smaller stages and the lantern on top,
# standing on its green headland over the Atlantic with the compass rose of the winds laid in the
# grass. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tower-of-hercules.py -- tower-of-hercules-1024.png 1024 tower-of-hercules.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2f7ab8', shadow_mul=(0.76, 0.84, 0.92), lift=0.3),
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8)),
    'rock': toon('rock', '#8a8680', shadow_mul=(0.84, 0.84, 0.9)),
    'stone': toon('stone', '#c8bca4', shadow_mul=(0.84, 0.84, 0.88), lift=0.08),
    'stoneDark': toon('stoneDark', '#9a907c'),
    'lamp': toon('lamp', '#f0e070', lift=0.4),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'dark': flat('dark', '#2e2a28'),
})

G = tile(M['sea'])
before = set(bpy.data.objects)


def segment(c, r, z, n=30):
    a0 = math.asin(c / r)
    return [(r * math.cos(a), r * math.sin(a), G + z) for a in (a0 + (math.pi - 2 * a0) * j / (n - 1) for j in range(n))]


cl = loft('cliff', M['rock'], [segment(-0.5, 1.3, -0.01), segment(-0.45, 1.25, 0.1)], outline=0.01)
cl.visible_shadow = False
loft('headland', M['grass'], [segment(-0.45, 1.25, 0.1), segment(-0.38, 1.15, 0.16)], outline=0.008, smooth=True)
T = G + 0.16

# ---------- the tower ----------
TX, TY, W, H = 0.08, 0.25, 0.2, 0.48
box('tower', M['stone'], TX, TY, T - 0.005, W, W, H, outline=0.009, bevel=0)
for side in range(2):
    a = -math.pi / 2 if side == 0 else 0.0
    nx, ny = math.cos(a), math.sin(a)
    for k in range(5):
        z0 = T + 0.02 + k * 0.09
        u0, u1 = -W / 2 + 0.005, W / 2 - 0.005
        p0 = (TX + nx * (W / 2 + 0.004) - ny * u0, TY + ny * (W / 2 + 0.004) + nx * u0, z0)
        p1 = (TX + nx * (W / 2 + 0.004) - ny * u1, TY + ny * (W / 2 + 0.004) + nx * u1, z0 + 0.06)
        bar(f'ramp{side}{k}', M['stoneDark'], p0, p1, 0.014, outline=0)
    for k in range(3):
        box(f'slit{side}{k}', M['dark'], TX + nx * (W / 2 + 0.003), TY + ny * (W / 2 + 0.003), T + 0.08 + k * 0.13, 0.02, 0.006, 0.04, rot_z=a + math.pi / 2, outline=0, bevel=0)
box('stage1', M['stone'], TX, TY, T + H - 0.005, W * 0.75, W * 0.75, 0.08, outline=0.005, bevel=0)
box('stage1top', M['stoneDark'], TX, TY, T + H + 0.07, W * 0.8, W * 0.8, 0.012, outline=0.001, bevel=0)
lathe('stage2', M['stone'], ((W * 0.28, 0), (W * 0.28, 0.06)), T + H + 0.08, TX, TY, segs=8, outline=0.004, smooth=False)
lathe('lantern', M['lamp'], ((W * 0.16, 0), (W * 0.16, 0.05)), T + H + 0.14, TX, TY, segs=8, outline=0.003, smooth=False)
lathe('lanterncap', M['stoneDark'], ((W * 0.2, 0), (W * 0.12, 0.03), (0.004, 0.06)), T + H + 0.19, TX, TY, segs=8, outline=0.003, smooth=False)
box('base', M['stoneDark'], TX, TY, T - 0.005, W + 0.06, W + 0.06, 0.035, outline=0.003, bevel=0)

# ---------- the rose of the winds ----------
RX, RY = -0.3, -0.12
lathe('rose', M['white'], ((0.16, 0), (0.16, 0.006)), T - 0.003, RX, RY, segs=24, outline=0.001)
for k in range(8):
    a = 2 * math.pi * k / 8
    L = 0.15 if k % 2 == 0 else 0.1
    bar(f'rosepoint{k}', M['stoneDark'], (RX, RY, T + 0.006), (RX + L * math.cos(a), RY + L * math.sin(a), T + 0.006), 0.02 if k % 2 == 0 else 0.014, outline=0)

turn(before, -20)
render(G)
