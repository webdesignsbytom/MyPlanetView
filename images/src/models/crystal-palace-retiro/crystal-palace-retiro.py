# A cartoon Palacio de Cristal for the country maps, built in the set's shared look (../toon.py): the
# glass and iron pavilion in Madrid's Retiro Park, its cross-shaped hall of glass on a brick and tile
# base, the tall glass dome over the crossing and the portico of Ionic columns at its front, the steps
# down to the lake with its fountain jet and the old cypress growing in the water, and the park's
# trees round it. Turned a little towards the camera.
# Run: blender -b --factory-startup -P crystal-palace-retiro.py -- crystal-palace-retiro-1024.png 1024 crystal-palace-retiro.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'glass': toon('glass', '#a8d0e0', shadow_mul=(0.8, 0.88, 0.94), lift=0.35),
    'iron': toon('iron', '#3a4a5a', lift=0.08),
    'brick': toon('brick', '#c8704a', lift=0.06),
    'tile': toon('tile', '#3a7ab0', lift=0.12),
    'stone': toon('stone', '#e8e0cc', lift=0.15),
    'lake': toon('lake', '#4a9a9a', shadow_mul=(0.78, 0.88, 0.88), lift=0.3),
    'path': toon('path', '#d8c8a8'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'cypress': toon('cypress', '#3f7a40'),
    'trunk': toon('trunk', '#6a4a36'),
    'white': toon('white', '#f6f4ee', lift=0.2),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the lake in front ----------
lake = [(0.85 * math.cos(2 * math.pi * k / 24), -0.55 + 0.42 * math.sin(2 * math.pi * k / 24)) for k in range(24)]
loft('lakerim', M['stone'], [[(x * 1.04, -0.55 + (y + 0.55) * 1.06, G - 0.005) for x, y in lake], [(x * 1.04, -0.55 + (y + 0.55) * 1.06, G + 0.015) for x, y in lake]], outline=0.003)
loft('lake', M['lake'], [[(x, y, G + 0.005) for x, y in lake], [(x, y, G + 0.02) for x, y in lake]], outline=0)
rod('jet', M['white'], (0.0, -0.6, G + 0.02), (0.0, -0.6, G + 0.22), 0.012, r2=0.004, segs=8, outline=0.001)
for k in range(6):
    a = 2 * math.pi * k / 6
    rod(f'spray{k}', M['white'], (0.0, -0.6, G + 0.2), (0.06 * math.cos(a), -0.6 + 0.06 * math.sin(a), G + 0.05), 0.005, segs=4, outline=0)
for k, (x, y) in enumerate(((-0.55, -0.5), (0.5, -0.65))):
    lathe(f'swampcypress{k}', M['cypress'], ((0.05, 0), (0.06, 0.08), (0.035, 0.2), (0.004, 0.28)), G + 0.015, x, y, segs=10, outline=0.006)

# ---------- the palace ----------
PX, PY = 0.0, 0.3
FL = G + 0.08
box('base', M['brick'], PX, PY, G - 0.005, 0.86, 0.46, 0.085, outline=0.006, bevel=0)
box('baseband', M['tile'], PX, PY - 0.232, G + 0.03, 0.86, 0.006, 0.03, outline=0, bevel=0)
for i in range(6):
    box(f'step{i}', M['stone'], PX, PY - 0.25 - i * 0.025, G - 0.005, 0.36, 0.025, 0.085 - i * 0.014, outline=0.001, bevel=0)


def glasshall(name, x, y, w, d, h):
    """A glass hall with its iron frame and a curved glass roof along its length."""
    box(f'{name}walls', M['glass'], x, y, FL, w, d, h, outline=0.005, bevel=0)
    along_x = w > d
    n = int((w if along_x else d) / 0.06)
    for j in range(n + 1):
        t = -0.5 + j / n
        if along_x:
            for fy in (-1, 1):
                rod(f'{name}mullion{j}{fy}', M['iron'], (x + t * w, y + fy * d / 2, FL), (x + t * w, y + fy * d / 2, FL + h), 0.004, segs=4, outline=0)
        else:
            for fx in (-1, 1):
                rod(f'{name}mullion{j}{fx}', M['iron'], (x + fx * w / 2, y + t * d, FL), (x + fx * w / 2, y + t * d, FL + h), 0.004, segs=4, outline=0)
    # the barrel-vaulted glass roof
    span = d if along_x else w
    rings = []
    for k in range(7):
        a = math.pi * k / 6
        rings.append((span / 2 * math.cos(a), FL + h + span * 0.3 * math.sin(a)))
    for k in range(6):
        (o0, z0), (o1, z1) = rings[k], rings[k + 1]
        if along_x:
            quad = [(x - w / 2, y + o0, z0), (x + w / 2, y + o0, z0), (x + w / 2, y + o1, z1), (x - w / 2, y + o1, z1)]
        else:
            quad = [(x + o0, y - d / 2, z0), (x + o0, y + d / 2, z0), (x + o1, y + d / 2, z1), (x + o1, y - d / 2, z1)]
        loft(f'{name}vault{k}', M['glass'], [quad, [(p[0], p[1], p[2] + 0.006) for p in quad]], outline=0.002)
    box(f'{name}eaves', M['iron'], x, y, FL + h - 0.005, w + 0.01, d + 0.01, 0.01, outline=0.001, bevel=0)


glasshall('nave', PX, PY, 0.8, 0.22, 0.18)
glasshall('transept', PX, PY + 0.02, 0.26, 0.4, 0.2)
# the dome over the crossing
lathe('dome', M['glass'], ((0.13, 0), (0.125, 0.06), (0.1, 0.14), (0.05, 0.2), (0.004, 0.22)), FL + 0.27, PX, PY + 0.02, segs=24, outline=0.005)
for k in range(12):
    a = 2 * math.pi * k / 12
    pts = [(PX + r * math.cos(a), PY + 0.02 + r * math.sin(a), FL + 0.27 + z + 0.004) for r, z in ((0.13, 0), (0.125, 0.06), (0.1, 0.14), (0.05, 0.2), (0.004, 0.22))]
    for j, (p, q) in enumerate(zip(pts, pts[1:])):
        bar(f'domerib{k}{j}', M['iron'], p, q, 0.006, outline=0)
rod('domefinial', M['iron'], (PX, PY + 0.02, FL + 0.49), (PX, PY + 0.02, FL + 0.54), 0.005, segs=4, outline=0)
# the portico of Ionic columns at the front
for j in range(4):
    x = PX - 0.09 + j * 0.06
    rod(f'portico{j}', M['stone'], (x, PY - 0.2, FL), (x, PY - 0.2, FL + 0.2), 0.012, segs=8, outline=0.002)
box('porticotop', M['stone'], PX, PY - 0.2, FL + 0.2, 0.24, 0.05, 0.03, outline=0.003, bevel=0)

# ---------- the park ----------
for k, (x, y) in enumerate(((-0.75, 0.55), (-0.45, 0.85), (0.0, 0.95), (0.45, 0.85), (0.75, 0.55), (-0.95, 0.05), (0.95, 0.05))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.08), 0.014, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, G + 0.17, 0.13, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
