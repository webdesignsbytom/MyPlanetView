# A cartoon Jerónimos Monastery for the country maps, built in the set's shared look (../toon.py):
# Lisbon's long Manueline front of white limestone at Belém, its richly carved south portal, the
# church's square tower with its dome at the east end, the rows of arched windows along the cloister
# wing, the western pavilion's tower, and the gardens of the Praça do Império with its fountain in
# front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P jeronimos.py -- jeronimos-1024.png 1024 jeronimos.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#f0e6d0', shadow_mul=(0.86, 0.84, 0.86), lift=0.2),
    'stoneDark': toon('stoneDark', '#d6c8a8', shadow_mul=(0.86, 0.84, 0.86)),
    'roof': toon('roof', '#c4603e'),
    'dark': flat('dark', '#3a3028'),
    'lawn': toon('lawn', '#6aa54a', shadow_mul=(0.7, 0.78, 0.8)),
    'paving': toon('paving', '#e0d8c8', lift=0.2),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'tree': toon('tree', '#4f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#6a4a36'),
    'slate': toon('slate', '#6a7280'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)

FY = 0.15                 # the long front's face
L = 1.5                   # its length
box('monastery', M['stone'], 0, FY + 0.18, G - 0.005, L, 0.36, 0.24, outline=0.009, bevel=0)
loft('monasteryroof', M['roof'], [[(-L / 2, FY, G + 0.235), (L / 2, FY, G + 0.235), (L / 2, FY + 0.36, G + 0.235), (-L / 2, FY + 0.36, G + 0.235)],
                                  [(-L / 2, FY + 0.17, G + 0.3), (L / 2, FY + 0.17, G + 0.3), (L / 2, FY + 0.19, G + 0.3), (-L / 2, FY + 0.19, G + 0.3)]], outline=0.005)
# two rows of arched windows and the carved buttress pinnacles along the front
for row in range(2):
    for j in range(16):
        x = -L / 2 + 0.06 + j * (L - 0.12) / 15
        if -0.25 < x < 0.12:
            continue
        box(f'win{row}{j}', M['dark'], x, FY - 0.003, G + 0.04 + row * 0.1, 0.03, 0.006, 0.05, outline=0, bevel=0)
        cyl(f'wintop{row}{j}', M['dark'], 0.015, 0.006, segs=8, outline=0, matrix=Matrix.Translation((x, FY - 0.003, G + 0.09 + row * 0.1)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for j in range(9):
    x = -L / 2 + 0.03 + j * (L - 0.06) / 8
    box(f'buttress{j}', M['stoneDark'], x, FY - 0.01, G - 0.005, 0.025, 0.025, 0.26, outline=0.002, bevel=0)
    lathe(f'pinnacle{j}', M['stoneDark'], ((0.014, 0), (0.002, 0.06)), G + 0.255, x, FY - 0.01, segs=6, outline=0.001, smooth=False)

# ---------- the church: its tall south front, the portal and the tower ----------
CX = -0.06
box('church', M['stone'], CX, FY + 0.18, G - 0.005, 0.36, 0.36, 0.36, outline=0.008, bevel=0)
loft('churchroof', M['roof'], [[(CX - 0.18, FY, G + 0.355), (CX + 0.18, FY, G + 0.355), (CX + 0.18, FY + 0.36, G + 0.355), (CX - 0.18, FY + 0.36, G + 0.355)],
                               [(CX - 0.18, FY + 0.17, G + 0.42), (CX + 0.18, FY + 0.17, G + 0.42), (CX + 0.18, FY + 0.19, G + 0.42), (CX - 0.18, FY + 0.19, G + 0.42)]], outline=0.004)
for j in range(3):
    x = CX - 0.12 + j * 0.12
    box(f'churchwin{j}', M['dark'], x, FY - 0.003, G + 0.2, 0.04, 0.006, 0.1, outline=0, bevel=0)
    cyl(f'churchwintop{j}', M['dark'], 0.02, 0.006, segs=8, outline=0, matrix=Matrix.Translation((x, FY - 0.003, G + 0.3)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
# the south portal: a tall carved frame climbing to a pinnacle
box('portal', M['stoneDark'], CX, FY - 0.012, G - 0.005, 0.12, 0.02, 0.3, outline=0.003, bevel=0)
box('portaldoor', M['dark'], CX, FY - 0.024, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
for k in range(4):
    rod(f'portalniche{k}', M['stone'], (CX - 0.035 + (k % 2) * 0.07, FY - 0.025, G + 0.13 + (k // 2) * 0.07), (CX - 0.035 + (k % 2) * 0.07, FY - 0.025, G + 0.18 + (k // 2) * 0.07), 0.008, segs=6, outline=0.001)
lathe('portalspire', M['stoneDark'], ((0.03, 0), (0.003, 0.14)), G + 0.295, CX, FY - 0.012, segs=6, outline=0.002, smooth=False)
# the bell tower at the church's west end, with its dome
TX = CX - 0.24
box('tower', M['stone'], TX, FY + 0.1, G - 0.005, 0.14, 0.14, 0.5, outline=0.007, bevel=0)
for fy in (-1, 1):
    box(f'towerwin{fy}', M['dark'], TX, FY + 0.1 + fy * 0.072, G + 0.38, 0.04, 0.006, 0.07, outline=0, bevel=0)
lathe('towerdrum', M['stone'], ((0.06, 0), (0.06, 0.05)), G + 0.495, TX, FY + 0.1, segs=12, outline=0.003)
lathe('towerdome', M['slate'], ((0.065, 0), (0.06, 0.03), (0.035, 0.07), (0.004, 0.1)), G + 0.545, TX, FY + 0.1, segs=16, outline=0.003)
# the western pavilion's little tower at the far end
box('westtower', M['stone'], L / 2 - 0.08, FY + 0.12, G - 0.005, 0.12, 0.12, 0.34, outline=0.006, bevel=0)
lathe('westtowercap', M['slate'], ((0.07, 0), (0.003, 0.12)), G + 0.335, L / 2 - 0.08, FY + 0.12, segs=4, outline=0.003, smooth=False)

# ---------- the garden in front ----------
for s in (-1, 1):
    box(f'lawn{s}', M['lawn'], s * 0.4, -0.45, G - 0.004, 0.55, 0.5, 0.012, outline=0.002, bevel=0)
    for j in range(3):
        x = s * (0.2 + j * 0.2)
        rod(f'trunk{s}{j}', M['trunk'], (x, -0.25, G), (x, -0.25, G + 0.06), 0.012, segs=6, outline=0.002)
        ball(f'tree{s}{j}', M['tree'], x, -0.25, G + 0.12, 0.07, outline=0.009)
lathe('fountain', M['stoneDark'], ((0.15, 0), (0.15, 0.03), (0.13, 0.03)), G - 0.004, 0, -0.62, segs=24, outline=0.003)
lathe('fountainwater', M['water'], ((0.135, 0), (0.135, 0.025)), G - 0.002, 0, -0.62, segs=24, outline=0)
lathe('fountaincolumn', M['stone'], ((0.025, 0), (0.02, 0.1), (0.05, 0.11), (0.05, 0.12), (0.003, 0.16)), G, 0, -0.62, segs=12, outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
