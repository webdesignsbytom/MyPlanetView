# A cartoon Triple Bridge for the country maps, built in the set's shared look (../toon.py): Plečnik's
# three bridges over the green Ljubljanica in Ljubljana, the old middle bridge and the two footbridges
# fanning out from it towards Prešeren Square, all of pale stone with their rows of balusters and
# their lamps, and on the square the pink baroque front of the Franciscan Church with its statue
# on top, the Prešeren monument and the pastel houses along the river's banks. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P triple-bridge.py -- triple-bridge-1024.png 1024 triple-bridge.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d6cfc0', shadow_mul=(0.84, 0.84, 0.9), lift=0.2),
    'water': toon('water', '#4a9a8a', lift=0.3),
    'white': toon('white', '#f4f0e6', shadow_mul=(0.82, 0.84, 0.9), lift=0.22),
    'pink': toon('pink', '#e48a76', lift=0.12),
    'yellow': toon('yellow', '#f0d890', lift=0.12),
    'blue': toon('blue', '#a8c4e0', lift=0.12),
    'green': toon('green', '#a8d0a0', lift=0.12),
    'roof': toon('roof', '#b8503e'),
    'dark': flat('dark', '#2e2a2a'),
    'lamp': toon('lamp', '#34383e'),
    'bronze': toon('bronze', '#5a6a5a'),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


# ---------- the river between its raised stone banks ----------
RW, BZ = 0.2, 0.08
loft('river', M['water'], [strip(-RW, RW, 1.32, G - 0.004), strip(-RW, RW, 1.32, G + 0.008)], outline=0.002)
for name, (y0, y1) in (('frontbank', (-1.31, -RW)), ('backbank', (RW, 1.31))):
    loft(name, M['paving'], [strip(y0, y1, 1.32, G - 0.01), strip(y0, y1, 1.32, G + BZ)], outline=0.005)
DZ = G + BZ


def bridge(name, x0, y0, x1, y1, w):
    """A stone bridge from (x0, y0) to (x1, y1), its deck level with the banks, balusters along both edges."""
    dx, dy = x1 - x0, y1 - y0
    length = math.hypot(dx, dy)
    ux, uy = dx / length, dy / length
    nx, ny = -uy, ux
    box(name, M['white'], (x0 + x1) / 2, (y0 + y1) / 2, G - 0.005, w, length, BZ + 0.02, rot_z=math.atan2(-dx, dy), outline=0.004, bevel=0)
    n = int(length / 0.04)
    for s in (-1, 1):
        ex, ey = s * nx * (w / 2 - 0.008), s * ny * (w / 2 - 0.008)
        bar(f'{name}rail{s}', M['white'], (x0 + ex, y0 + ey, DZ + 0.055), (x1 + ex, y1 + ey, DZ + 0.055), 0.014, outline=0.002)
        for k in range(n + 1):
            t = k / n
            px, py = x0 + dx * t + ex, y0 + dy * t + ey
            rod(f'{name}baluster{s}{k}', M['white'], (px, py, DZ + 0.012), (px, py, DZ + 0.05), 0.007, segs=6, outline=0.001)


bridge('middle', 0.0, -RW - 0.05, 0.0, RW + 0.05, 0.2)
for s in (-1, 1):
    bridge(f'foot{s}', s * 0.15, -RW - 0.05, s * 0.32, RW + 0.05, 0.08)
for k, (x, y) in enumerate(((-0.085, -RW - 0.03), (0.085, -RW - 0.03), (-0.085, RW + 0.03), (0.085, RW + 0.03))):
    rod(f'lamppost{k}', M['lamp'], (x, y, DZ + 0.01), (x, y, DZ + 0.13), 0.006, segs=6, outline=0.001)
    ball(f'lampglobe{k}', M['white'], x, y, DZ + 0.14, 0.016, outline=0.002)

# ---------- the Franciscan Church on Prešeren Square ----------
FX, FY = 0.12, 0.78
box('church', M['pink'], FX, FY, DZ - 0.005, 0.34, 0.22, 0.3, outline=0.007, bevel=0)
for s in (-1, 1):
    for j in (0.06, 0.16):
        box(f'pilaster{s}{j}', M['white'], FX + s * j, FY - 0.113, DZ - 0.005, 0.02, 0.008, 0.3, outline=0, bevel=0)
box('cornice', M['white'], FX, FY - 0.01, DZ + 0.2, 0.36, 0.24, 0.02, outline=0.002, bevel=0)
loft('pediment', M['pink'], [[(FX - 0.17, FY - 0.11, DZ + 0.29), (FX + 0.17, FY - 0.11, DZ + 0.29), (FX + 0.17, FY - 0.09, DZ + 0.29), (FX - 0.17, FY - 0.09, DZ + 0.29)],
                             [(FX - 0.004, FY - 0.11, DZ + 0.4), (FX + 0.004, FY - 0.11, DZ + 0.4), (FX + 0.004, FY - 0.09, DZ + 0.4), (FX - 0.004, FY - 0.09, DZ + 0.4)]], outline=0.003)
box('portal', M['dark'], FX, FY - 0.114, DZ - 0.005, 0.06, 0.006, 0.12, outline=0, bevel=0)
box('portalframe', M['white'], FX, FY - 0.112, DZ + 0.115, 0.1, 0.008, 0.02, outline=0, bevel=0)
for s in (-1, 1):
    box(f'churchwin{s}', M['dark'], FX + s * 0.11, FY - 0.114, DZ + 0.12, 0.035, 0.006, 0.07, outline=0, bevel=0)
cyl('rosewin', M['dark'], 0.025, 0.006, segs=12, outline=0, matrix=Matrix.Translation((FX, FY - 0.114, DZ + 0.25)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
rod('statue', M['white'], (FX, FY - 0.1, DZ + 0.39), (FX, FY - 0.1, DZ + 0.45), 0.014, r2=0.008, segs=8, outline=0.002)
ball('statuehead', M['white'], FX, FY - 0.1, DZ + 0.46, 0.011, outline=0.001)
loft('churchroof', M['roof'], [[(FX - 0.17, FY - 0.09, DZ + 0.29), (FX + 0.17, FY - 0.09, DZ + 0.29), (FX + 0.17, FY + 0.11, DZ + 0.29), (FX - 0.17, FY + 0.11, DZ + 0.29)],
                               [(FX - 0.004, FY - 0.09, DZ + 0.4), (FX + 0.004, FY - 0.09, DZ + 0.4), (FX + 0.004, FY + 0.11, DZ + 0.4), (FX - 0.004, FY + 0.11, DZ + 0.4)]], outline=0.004)
# the Prešeren monument
box('monumentbase', M['white'], -0.25, 0.42, DZ - 0.005, 0.07, 0.07, 0.1, outline=0.002, bevel=0)
rod('preseren', M['bronze'], (-0.25, 0.42, DZ + 0.095), (-0.25, 0.42, DZ + 0.17), 0.016, r2=0.01, segs=8, outline=0.002)
ball('preserenhead', M['bronze'], -0.25, 0.42, DZ + 0.18, 0.012, outline=0.001)

# ---------- houses along the banks ----------
for k, (x, y, w, mat) in enumerate(((-0.62, 0.42, 0.34, 'yellow'), (0.62, 0.42, 0.3, 'blue'), (-0.6, -0.46, 0.36, 'green'), (0.6, -0.46, 0.36, 'yellow'))):
    box(f'house{k}', M[mat], x, y, DZ - 0.005, w, 0.2, 0.2, outline=0.005, bevel=0)
    for j in range(3):
        for row in range(2):
            box(f'housewin{k}{j}{row}', M['dark'], x - w / 3 + j * w / 3, y - 0.103, DZ + 0.04 + row * 0.08, 0.03, 0.006, 0.045, outline=0, bevel=0)
    loft(f'houseroof{k}', M['roof'], [[(x - w / 2, y - 0.11, DZ + 0.195), (x + w / 2, y - 0.11, DZ + 0.195), (x + w / 2, y + 0.11, DZ + 0.195), (x - w / 2, y + 0.11, DZ + 0.195)],
                                      [(x - w / 2 + 0.03, y - 0.004, DZ + 0.27), (x + w / 2 - 0.03, y - 0.004, DZ + 0.27), (x + w / 2 - 0.03, y + 0.004, DZ + 0.27), (x - w / 2 + 0.03, y + 0.004, DZ + 0.27)]], outline=0.004)
for k, (x, y) in enumerate(((-0.95, -0.05 - RW - 0.06), (0.95, RW + 0.08), (-0.25, -0.9), (0.3, -0.92))):
    ball(f'tree{k}', M['tree'], x, y, DZ + 0.12, 0.1, outline=0.01)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
