# A cartoon Rani ki Vav for the country maps, built in the set's shared look (../toon.py): the Queen's
# Stepwell at Patan, cut deep into the ground, its long flights of steps going down level by level
# between storeys of carved stone pavilions on pillars, the walls lined with rows of sculpted gods,
# the round well shaft at the far end and the green water at the bottom. Turned a little towards the
# camera.
# Run: blender -b --factory-startup -P rani-ki-vav.py -- rani-ki-vav-1024.png 1024 rani-ki-vav.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#b8c87a', shadow_mul=(0.76, 0.8, 0.78), lift=0.2),
    'stone': toon('stone', '#d8bc90', shadow_mul=(0.86, 0.8, 0.76), lift=0.12),
    'stoneDark': toon('stoneDark', '#b0946a'),
    'water': toon('water', '#5a9a7a', lift=0.25),
    'dark': flat('dark', '#3a2e24'),
    'tree': toon('tree', '#5a9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3a'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)

# The well is drawn as a stepped trench going down into a raised plinth, so it can be seen into:
# the tile's ground is the plinth's top; the trench runs from the front (shallow) to the back (deep).
PZ = G + 0.36          # the plinth's top: the ground level round the well
W = 0.5                # the trench's width
Y0, Y1 = -0.75, 0.55   # the trench from its entrance to the well shaft
box('plinthleft', M['stoneDark'], -(W / 2 + 0.3), -0.05, G - 0.005, 0.6, 1.5, PZ - G, outline=0.006, bevel=0)
box('plinthright', M['stoneDark'], W / 2 + 0.3, -0.05, G - 0.005, 0.6, 1.5, PZ - G, outline=0.006, bevel=0)
box('plinthback', M['stoneDark'], 0, Y1 + 0.2, G - 0.005, W + 0.02, 0.4, PZ - G, outline=0.006, bevel=0)

# ---------- the steps down, in levels, and the pavilions over the landings ----------
LEVELS = 4
for lv in range(LEVELS):
    ya = Y0 + (Y1 - Y0) * lv / LEVELS
    yb = Y0 + (Y1 - Y0) * (lv + 1) / LEVELS
    za = PZ - 0.09 * lv
    for i in range(6):
        t = i / 6
        y = ya + (yb - ya) * 0.7 * t
        box(f'step{lv}{i}', M['stone'], 0, y, G - 0.005, W, (yb - ya) * 0.7 / 6 + 0.002, za - 0.015 * i - G, outline=0.001, bevel=0)
    # the landing and its pavilion: pillars and a slab roof spanning the trench
    yl = ya + (yb - ya) * 0.85
    zl = za - 0.09
    box(f'landing{lv}', M['stoneDark'], 0, yl, G - 0.005, W, (yb - ya) * 0.3, zl - G, outline=0.002, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod(f'pillar{lv}{sx}{sy}', M['stone'], (sx * (W / 2 - 0.04), yl + sy * 0.05, zl), (sx * (W / 2 - 0.04), yl + sy * 0.05, PZ - 0.005), 0.014, segs=6, outline=0.002)
    for k in range(lv + 1):
        z = PZ - 0.005 - k * 0.09
        if z <= zl + 0.03:
            continue
        box(f'pavilionslab{lv}{k}', M['stoneDark'], 0, yl, z - 0.012, W, 0.14, 0.012, outline=0.002, bevel=0)

# the top edges of the trench, a parapet of carved stone
for s in (-1, 1):
    box(f'parapet{s}', M['stone'], s * (W / 2 + 0.03), Y0 + (Y1 - Y0) / 2, PZ - 0.005, 0.06, Y1 - Y0, 0.03, outline=0.002, bevel=0)

# ---------- the carved side walls: rows of gods in niches ----------
for s in (-1, 1):
    x = s * (W / 2 + 0.004)
    for row in range(3):
        z = PZ - 0.06 - row * 0.09
        for j in range(12):
            y = Y0 + 0.08 + j * (Y1 - Y0 - 0.1) / 11
            if z < PZ - 0.09 * (LEVELS * (y - Y0) / (Y1 - Y0)) - 0.02:
                continue
            box(f'niche{s}{row}{j}', M['stoneDark'], x - s * 0.002, y, z, 0.006, 0.05, 0.06, outline=0, bevel=0)
            rod(f'god{s}{row}{j}', M['stone'], (x - s * 0.006, y, z + 0.005), (x - s * 0.006, y, z + 0.05), 0.008, segs=5, outline=0)

# ---------- the well shaft at the far end ----------
lathe('shaftrim', M['stone'], ((0.2, 0), (0.2, 0.03), (0.17, 0.03)), PZ - 0.005, 0, Y1 + 0.2, segs=24, outline=0.004)
lathe('shaftwater', M['water'], ((0.17, 0), (0.17, 0.01)), PZ - 0.25, 0, Y1 + 0.2, segs=24, outline=0)
box('bottomwater', M['water'], 0, Y1 - 0.08, G - 0.005, W, 0.16, PZ - 0.09 * LEVELS - G - 0.04, outline=0, bevel=0)

# ---------- trees round the top ----------
for k, (x, y) in enumerate(((-0.75, -0.6), (0.75, -0.6), (-0.8, 0.45), (0.8, 0.45), (-0.45, 0.9), (0.45, 0.9))):
    z = PZ if abs(x) < 0.9 and -0.8 < y < 0.7 else G
    rod(f'trunk{k}', M['trunk'], (x, y, z), (x, y, z + 0.07), 0.014, segs=6, outline=0.002)
    ball(f'tree{k}', M['tree'], x, y, z + 0.15, 0.1, outline=0.012)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
