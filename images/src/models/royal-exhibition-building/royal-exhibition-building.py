# A cartoon Royal Exhibition Building for the country maps, built in the set's shared look
# (../toon.py): Melbourne's great hall of 1880 in the Carlton Gardens, its long cream naves with tall
# arched windows under grey roofs, the entrance pavilion with its pediment and two little domed
# towers, the octagonal drum and the great terracotta dome with its lantern over the crossing, and
# the Hochstetter Fountain on the lawn in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P royal-exhibition-building.py -- royal-exhibition-building-1024.png 1024 royal-exhibition-building.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'path': toon('path', '#d8ccb0'),
    'cream': toon('cream', '#ece0c4', shadow_mul=(0.86, 0.84, 0.8), lift=0.12),
    'creamDark': toon('creamDark', '#cfc0a0'),
    'slate': toon('slate', '#6a6e76'),
    'dome': toon('dome', '#b85a3a', shadow_mul=(0.86, 0.8, 0.78), lift=0.06),
    'gold': toon('gold', '#e0b040', lift=0.3),
    'window': flat('window', '#3a4050'),
    'water': toon('water', '#5aa8d0', lift=0.3),
    'tree': toon('tree', '#3f7a3a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
box('path', M['path'], 0.0, -0.5, G - 0.003, 0.12, 0.6, 0.008, outline=0, bevel=0)

Y = 0.25


def nave(name, x, y, sx, sy, h, winside):
    box(name, M['cream'], x, y, G - 0.005, sx, sy, h, outline=0.008, bevel=0)
    if sx > sy:
        loft(f'{name}roof', M['slate'], [[(x - sx / 2, y - sy / 2, G + h - 0.005), (x + sx / 2, y - sy / 2, G + h - 0.005), (x + sx / 2, y + sy / 2, G + h - 0.005), (x - sx / 2, y + sy / 2, G + h - 0.005)],
                                         [(x - sx / 2, y - 0.004, G + h + 0.09), (x + sx / 2, y - 0.004, G + h + 0.09), (x + sx / 2, y + 0.004, G + h + 0.09), (x - sx / 2, y + 0.004, G + h + 0.09)]], outline=0.005)
        n = int(sx / 0.09)
        for j in range(n):
            wx = x - sx / 2 + (j + 0.5) * sx / n
            box(f'{name}win{j}', M['window'], wx, y - sy / 2 - 0.003, G + 0.04, 0.04, 0.006, 0.09, outline=0, bevel=0)
            cyl(f'{name}wintop{j}', M['window'], 0.02, 0.006, segs=10, outline=0, matrix=Matrix.Translation((wx, y - sy / 2 - 0.003, G + 0.13)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    else:
        loft(f'{name}roof', M['slate'], [[(x - sx / 2, y - sy / 2, G + h - 0.005), (x + sx / 2, y - sy / 2, G + h - 0.005), (x + sx / 2, y + sy / 2, G + h - 0.005), (x - sx / 2, y + sy / 2, G + h - 0.005)],
                                         [(x - 0.004, y - sy / 2, G + h + 0.09), (x + 0.004, y - sy / 2, G + h + 0.09), (x + 0.004, y + sy / 2, G + h + 0.09), (x - 0.004, y + sy / 2, G + h + 0.09)]], outline=0.005)


nave('westnave', -0.36, Y, 0.48, 0.26, 0.2, -1)
nave('eastnave', 0.36, Y, 0.48, 0.26, 0.2, -1)
nave('transept', 0.0, Y + 0.05, 0.28, 0.62, 0.22, -1)

# ---------- the entrance pavilion ----------
EY = Y - 0.31
box('entrance', M['cream'], 0.0, EY, G - 0.005, 0.32, 0.1, 0.26, outline=0.007, bevel=0)
box('entrancearch', M['window'], 0.0, EY - 0.053, G - 0.005, 0.08, 0.006, 0.13, outline=0, bevel=0)
cyl('entrancearchtop', M['window'], 0.04, 0.006, segs=14, outline=0, matrix=Matrix.Translation((0.0, EY - 0.053, G + 0.125)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
loft('pediment', M['creamDark'], [[(-0.16, EY - 0.05, G + 0.255), (0.16, EY - 0.05, G + 0.255), (0.16, EY + 0.05, G + 0.255), (-0.16, EY + 0.05, G + 0.255)],
                                  [(-0.004, EY - 0.05, G + 0.33), (0.004, EY - 0.05, G + 0.33), (0.004, EY + 0.05, G + 0.33), (-0.004, EY + 0.05, G + 0.33)]], outline=0.004)
for s in (-1, 1):
    box(f'etower{s}', M['cream'], s * 0.19, EY + 0.01, G - 0.005, 0.08, 0.08, 0.34, outline=0.005, bevel=0)
    lathe(f'etowerdome{s}', M['dome'], ((0.045, 0), (0.04, 0.03), (0.02, 0.06), (0.004, 0.08)), G + 0.335, s * 0.19, EY + 0.01, segs=12, outline=0.003)

# ---------- the dome ----------
DY = Y + 0.03
lathe('drum', M['cream'], ((0.17, 0), (0.17, 0.12)), G + 0.22, 0.0, DY, segs=8, outline=0.007, smooth=False)
for k in range(8):
    a = 2 * math.pi * (k + 0.5) / 8
    box(f'drumwin{k}', M['window'], 0.158 * math.cos(a), DY + 0.158 * math.sin(a), G + 0.25, 0.04, 0.006, 0.06, rot_z=a + math.pi / 2, outline=0, bevel=0)
lathe('dome', M['dome'], ((0.18, 0), (0.165, 0.08), (0.12, 0.17), (0.06, 0.22), (0.004, 0.235)), G + 0.335, 0.0, DY, segs=8, outline=0.007, smooth=False)
lathe('lantern', M['cream'], ((0.035, 0), (0.035, 0.06), (0.02, 0.08), (0.004, 0.12)), G + 0.56, 0.0, DY, segs=8, outline=0.003, smooth=False)
ball('lanternball', M['gold'], 0.0, DY, G + 0.685, 0.014, outline=0.001)

# ---------- the Hochstetter Fountain ----------
FX, FY = 0.0, -0.62
lathe('fountainbasin', M['creamDark'], ((0.16, 0), (0.16, 0.04)), G - 0.005, FX, FY, segs=20, outline=0.004)
lathe('fountainwater', M['water'], ((0.15, 0), (0.15, 0.043)), G - 0.005, FX, FY, segs=20, outline=0)
for k, (r, z) in enumerate(((0.08, 0.1), (0.05, 0.17))):
    lathe(f'fountainstem{k}', M['creamDark'], ((0.02, 0), (0.016, z - (0.035 if k == 0 else 0.11))), G + (0.035 if k == 0 else 0.11), FX, FY, segs=8, outline=0.002)
    lathe(f'fountainbowl{k}', M['creamDark'], ((0.015, 0), (r, 0.02), (r, 0.03)), G + z, FX, FY, segs=14, outline=0.002)
for k, (x, y, r) in enumerate(((-0.75, -0.3, 0.13), (0.75, -0.3, 0.13), (-0.5, -0.75, 0.11), (0.5, -0.75, 0.11), (-0.85, 0.35, 0.11), (0.85, 0.35, 0.11))):
    ball(f'tree{k}', M['tree'], x, y, G + r * 1.1, r, outline=0.008)

turn(before, -20)
render(G)
