# A cartoon Verona Arena for the country maps, built in the set's shared look (../toon.py): the
# Roman amphitheatre on Piazza Bra, its oval of two storeys of pink limestone arches, the stepped
# seats inside round the sandy arena floor, and the "Ala", the last fragment of the outer ring,
# standing taller with its three storeys of arches. Turned a little towards the camera.
# Run: blender -b --factory-startup -P verona-arena.py -- verona-arena-1024.png 1024 verona-arena.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'piazza': toon('piazza', '#e0d4c0', shadow_mul=(0.86, 0.82, 0.8), lift=0.2),
    'stone': toon('stone', '#e8b8a0', shadow_mul=(0.86, 0.8, 0.8), lift=0.1),
    'stoneDark': toon('stoneDark', '#c89880', shadow_mul=(0.86, 0.8, 0.8)),
    'seat': toon('seat', '#d8c8b0', shadow_mul=(0.84, 0.82, 0.86)),
    'sand': toon('sand', '#e8d098', lift=0.15),
    'door': flat('door', '#3a2a28'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['piazza'])
before = set(bpy.data.objects)

AX, AY = 0.0, 0.15
RX, RY = 0.78, 0.58


def ell(rx, ry, z, n=40):
    return [(AX + rx * math.cos(t), AY + ry * math.sin(t), G + z) for t in (2 * math.pi * j / n for j in range(n))]


# ---------- the seats, stepped down to the arena ----------
for t in range(6):
    f = 1.0 - t * 0.09
    loft(f'seats{t}', M['seat'] if t % 2 == 0 else M['stoneDark'], [ell(RX * f, RY * f, -0.01), ell(RX * f, RY * f, 0.26 - t * 0.04)], outline=0.005, smooth=True)
loft('arenafloor', M['sand'], [ell(RX * 0.42, RY * 0.38, -0.01), ell(RX * 0.42, RY * 0.38, 0.03)], outline=0.004, smooth=True)

# ---------- the outer wall: two storeys of arches ----------
N = 36
for j in range(N):
    a0, a1 = 2 * math.pi * j / N, 2 * math.pi * (j + 1) / N
    x0, y0 = AX + (RX + 0.03) * math.cos(a0), AY + (RY + 0.03) * math.sin(a0)
    x1, y1 = AX + (RX + 0.03) * math.cos(a1), AY + (RY + 0.03) * math.sin(a1)
    xm, ym = (x0 + x1) / 2, (y0 + y1) / 2
    L = math.hypot(x1 - x0, y1 - y0)
    rot = math.atan2(y1 - y0, x1 - x0)
    box(f'bay{j}', M['stone'], xm, ym, G - 0.005, L + 0.005, 0.05, 0.27, rot_z=rot, outline=0.004, bevel=0)
    am = (a0 + a1) / 2
    nx, ny = math.cos(am) * RY, math.sin(am) * RX
    nl = math.hypot(nx, ny)
    for level, (z, h) in enumerate(((0.025, 0.09), (0.14, 0.09))):
        box(f'arch{j}{level}', M['door'], xm + 0.026 * nx / nl, ym + 0.026 * ny / nl, G + z, L * 0.55, 0.004, h, rot_z=rot, outline=0, bevel=0)

# ---------- the Ala: the outer ring's last fragment ----------
for j in range(4):
    a0 = math.radians(60 + j * 9)
    a1 = math.radians(60 + (j + 1) * 9)
    x0, y0 = AX + (RX + 0.13) * math.cos(a0), AY + (RY + 0.13) * math.sin(a0)
    x1, y1 = AX + (RX + 0.13) * math.cos(a1), AY + (RY + 0.13) * math.sin(a1)
    xm, ym = (x0 + x1) / 2, (y0 + y1) / 2
    L = math.hypot(x1 - x0, y1 - y0)
    rot = math.atan2(y1 - y0, x1 - x0)
    box(f'ala{j}', M['stone'], xm, ym, G - 0.005, L + 0.004, 0.05, 0.42, rot_z=rot, outline=0.005, bevel=0)
    for level in range(3):
        box(f'alaarch{j}{level}', M['door'], xm - 0.026 * math.sin(rot) * -1, ym - 0.026 * math.cos(rot), G + 0.03 + level * 0.13, L * 0.5, 0.004, 0.09, rot_z=rot, outline=0, bevel=0)

for k, (x, y) in enumerate(((-0.95, -0.55), (0.95, -0.5), (-0.4, -0.85), (0.45, -0.85))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.1, 0.09, outline=0.009)

turn(before, -20)
render(G)
