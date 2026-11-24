# A cartoon Burgos Cathedral for the country maps, built in the set's shared look (../toon.py): the
# pale stone Gothic cathedral's west front with its rose window and gallery of kings between two
# square towers crowned by the famous openwork spires, lacy cages of stone ribs and rings dotted
# with crockets, the long nave and transept behind, and the lantern tower over the crossing with its
# pinnacles. Turned a little towards the camera.
# Run: blender -b --factory-startup -P burgos-cathedral.py -- burgos-cathedral-1024.png 1024 burgos-cathedral.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.84, 0.82, 0.88), lift=0.2),
    'stone': toon('stone', '#ece4d0', shadow_mul=(0.84, 0.84, 0.88), lift=0.12),
    'stoneDark': toon('stoneDark', '#cfc4aa'),
    'slate': toon('slate', '#7a7a80'),
    'window': flat('window', '#3a3a48'),
    'rose': flat('rose', '#4a5a8a'),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def openwork_spire(name, x, y, z, r, h):
    """A lacy spire: eight ribs from an octagon up to the tip, rings between them, crockets."""
    ribs = []
    for k in range(8):
        a = 2 * math.pi * k / 8 + math.pi / 8
        ribs.append(a)
        rod(f'{name}rib{k}', M['stone'], (x + r * math.cos(a), y + r * math.sin(a), z), (x, y, z + h), 0.009, segs=6, outline=0.002)
    for i in range(1, 6):
        t = i / 6
        rr = r * (1 - t)
        zz = z + h * t
        for k in range(8):
            a0, a1 = ribs[k], ribs[(k + 1) % 8]
            bar(f'{name}ring{i}{k}', M['stone'], (x + rr * math.cos(a0), y + rr * math.sin(a0), zz), (x + rr * math.cos(a1), y + rr * math.sin(a1), zz), 0.008, outline=0.001)
        for k in range(0, 8, 2):
            a = ribs[k]
            ball(f'{name}crocket{i}{k}', M['stone'], x + (rr + 0.006) * math.cos(a), y + (rr + 0.006) * math.sin(a), zz + h / 12, 0.008, outline=0)
    lathe(f'{name}base', M['stone'], ((r + 0.012, 0), (r + 0.012, 0.025)), z - 0.02, x, y, segs=8, outline=0.003, smooth=False)
    ball(f'{name}tip', M['stone'], x, y, z + h, 0.012, outline=0.001)


FY = -0.1
# ---------- the nave and transept ----------
box('nave', M['stone'], 0.0, 0.28, G - 0.005, 0.3, 0.62, 0.28, outline=0.009, bevel=0)
loft('naveroof', M['slate'], [[(-0.155, -0.03, G + 0.275), (0.155, -0.03, G + 0.275), (0.155, 0.59, G + 0.275), (-0.155, 0.59, G + 0.275)],
                              [(-0.004, -0.03, G + 0.37), (0.004, -0.03, G + 0.37), (0.004, 0.59, G + 0.37), (-0.004, 0.59, G + 0.37)]], outline=0.005)
box('transept', M['stone'], 0.0, 0.32, G - 0.005, 0.66, 0.2, 0.26, outline=0.008, bevel=0)
loft('transeptroof', M['slate'], [[(-0.33, 0.22, G + 0.255), (0.33, 0.22, G + 0.255), (0.33, 0.42, G + 0.255), (-0.33, 0.42, G + 0.255)],
                                  [(-0.33, 0.316, G + 0.35), (0.33, 0.316, G + 0.35), (0.33, 0.324, G + 0.35), (-0.33, 0.324, G + 0.35)]], outline=0.005)
for s in (-1, 1):
    for j in range(3):
        box(f'navewin{s}{j}', M['window'], s * 0.152, 0.06 + j * 0.08, G + 0.1, 0.006, 0.035, 0.12, outline=0, bevel=0)
# the lantern over the crossing
lathe('lantern', M['stone'], ((0.12, 0), (0.12, 0.2)), G + 0.3, 0.0, 0.32, segs=8, outline=0.006, smooth=False)
for k in range(8):
    a = 2 * math.pi * k / 8
    lathe(f'lanternpinnacle{k}', M['stoneDark'], ((0.018, 0), (0.004, 0.12)), G + 0.49, 0.12 * math.cos(a), 0.32 + 0.12 * math.sin(a), segs=4, outline=0.002, smooth=False)
    a2 = a + math.pi / 8
    box(f'lanternwin{k}', M['window'], 0.112 * math.cos(a2), 0.32 + 0.112 * math.sin(a2), G + 0.36, 0.03, 0.006, 0.09, rot_z=a2 + math.pi / 2, outline=0, bevel=0)
lathe('lanternroof', M['stoneDark'], ((0.1, 0), (0.004, 0.12)), G + 0.495, 0.0, 0.32, segs=8, outline=0.004, smooth=False)

# ---------- the west front ----------
box('front', M['stone'], 0.0, FY + 0.035, G - 0.005, 0.18, 0.07, 0.34, outline=0.006, bevel=0)
box('portal', M['window'], 0.0, FY - 0.002, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
cyl('portaltop', M['window'], 0.03, 0.006, segs=12, outline=0, matrix=Matrix.Translation((0.0, FY - 0.002, G + 0.095)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('rosering', M['stoneDark'], 0.055, 0.008, segs=24, outline=0.002, matrix=Matrix.Translation((0.0, FY - 0.002, G + 0.2)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
cyl('rose', M['rose'], 0.045, 0.008, segs=24, outline=0, matrix=Matrix.Translation((0.0, FY - 0.006, G + 0.2)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(5):
    lathe(f'king{j}', M['stoneDark'], ((0.01, 0), (0.008, 0.04)), G + 0.27, -0.06 + j * 0.03, FY - 0.005, segs=6, outline=0.001)
for s in (-1, 1):
    tx = s * 0.15
    box(f'tower{s}', M['stone'], tx, FY + 0.04, G - 0.005, 0.14, 0.14, 0.46, outline=0.008, bevel=0)
    for r in range(2):
        box(f'towerwin{s}{r}', M['window'], tx, FY - 0.032, G + 0.22 + r * 0.11, 0.035, 0.006, 0.08, outline=0, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            lathe(f'towerpinnacle{s}{sx}{sy}', M['stoneDark'], ((0.016, 0), (0.004, 0.09)), G + 0.455, tx + sx * 0.06, FY + 0.04 + sy * 0.06, segs=4, outline=0.002, smooth=False)
    openwork_spire(f'spire{s}', tx, FY + 0.04, G + 0.475, 0.05, 0.36)

for k, (x, y, r) in enumerate(((-0.75, -0.35, 0.11), (0.78, -0.3, 0.11), (-0.7, 0.4, 0.12), (0.72, 0.45, 0.12))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
