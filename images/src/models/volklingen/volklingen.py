# A cartoon Völklingen Ironworks for the country maps, built in the set's shared look (../toon.py):
# the old ironworks in the Saar, its row of six tall rusty blast furnaces with their round stoves, the
# tangle of big pipes and gas mains looping between them, the inclined lift of the charging
# platform, the long blower hall, the tall chimneys, and the birches growing through it now. Turned a
# little towards the camera.
# Run: blender -b --factory-startup -P volklingen.py -- volklingen-1024.png 1024 volklingen.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'ground': toon('ground', '#a8a090', shadow_mul=(0.84, 0.84, 0.88), lift=0.2),
    'rust': toon('rust', '#a8582e', shadow_mul=(0.86, 0.78, 0.74), lift=0.08),
    'rustDark': toon('rustDark', '#7a3e24'),
    'steel': toon('steel', '#5a5e66', lift=0.08),
    'brick': toon('brick', '#b86a4a', lift=0.06),
    'roof': toon('roof', '#5a5e66'),
    'window': flat('window', '#2e3238'),
    'birch': toon('birch', '#8ab84a', shadow_mul=(0.72, 0.8, 0.74)),
    'bark': toon('bark', '#e8e4dc'),
})

G = tile(M['ground'])
before = set(bpy.data.objects)
rng = random.Random(1873)

# ---------- the blower hall at the front ----------
box('blowerhall', M['brick'], 0.0, -0.55, G - 0.005, 1.1, 0.24, 0.22, outline=0.007, bevel=0)
for j in range(9):
    box(f'hallwin{j}', M['window'], -0.48 + j * 0.12, -0.673, G + 0.06, 0.06, 0.006, 0.12, outline=0, bevel=0)
loft('hallroof', M['roof'], [[(-0.55, -0.67, G + 0.215), (0.55, -0.67, G + 0.215), (0.55, -0.43, G + 0.215), (-0.55, -0.43, G + 0.215)],
                             [(-0.55, -0.552, G + 0.29), (0.55, -0.552, G + 0.29), (0.55, -0.548, G + 0.29), (-0.55, -0.548, G + 0.29)]], outline=0.004)

# ---------- the six blast furnaces and their stoves ----------
FY = 0.15
for k in range(6):
    x = -0.62 + k * 0.25
    # the furnace: a fat round stack narrowing at the top, then the downcomer and its headframe
    lathe(f'furnace{k}', M['rust'], ((0.07, 0), (0.08, 0.15), (0.065, 0.4), (0.045, 0.55)), G - 0.005, x, FY, segs=14, outline=0.005)
    box(f'furnacetop{k}', M['steel'], x, FY, G + 0.54, 0.12, 0.12, 0.05, outline=0.003, bevel=0)
    for sx in (-1, 1):
        for sy in (-1, 1):
            bar(f'headframe{k}{sx}{sy}', M['steel'], (x + sx * 0.06, FY + sy * 0.06, G + 0.59), (x + sx * 0.02, FY + sy * 0.02, G + 0.7), 0.008, outline=0)
    rod(f'downcomer{k}', M['rustDark'], (x + 0.03, FY - 0.03, G + 0.6), (x + 0.1, FY - 0.15, G + 0.35), 0.022, segs=8, outline=0.002)
    # the Cowper stoves behind each furnace
    for j in range(2):
        sx = x - 0.05 + j * 0.1
        lathe(f'stove{k}{j}', M['rustDark'], ((0.045, 0), (0.045, 0.38), (0.03, 0.42), (0.003, 0.44)), G - 0.005, sx, FY + 0.3, segs=12, outline=0.004)
# the great gas main running along the furnaces and looping down
pts = [(-0.72, FY - 0.17, G + 0.35), (0.62, FY - 0.17, G + 0.35)]
bar('gasmain', M['rustDark'], pts[0], pts[1], 0.05, outline=0.004)
for k in range(5):
    x = -0.5 + k * 0.25
    rod(f'gasloop{k}', M['rust'], (x, FY - 0.17, G + 0.35), (x, FY + 0.22, G + 0.3), 0.02, segs=8, outline=0.002)
# the inclined skip lift to the charging platform
bar('incline', M['steel'], (0.85, -0.25, G + 0.02), (0.65, FY, G + 0.6), 0.05, outline=0.004)
box('platform', M['steel'], 0.0, FY + 0.02, G + 0.5, 1.45, 0.06, 0.025, outline=0.003, bevel=0)
for k, x in enumerate((-0.85, 0.8)):
    lathe(f'chimney{k}', M['brick'], ((0.05, 0), (0.035, 0.82)), G - 0.005, x, FY + 0.55, segs=12, outline=0.005)

# ---------- birches through the works ----------
for k, (x, y) in enumerate(((-0.85, -0.2), (0.85, -0.1), (-0.3, -0.25), (0.35, -0.3), (0.6, 0.75), (-0.55, 0.75))):
    rod(f'birchtrunk{k}', M['bark'], (x, y, G), (x, y, G + 0.12), 0.01, segs=6, outline=0.002)
    b = ball(f'birch{k}', M['birch'], 0, 0, 0, 0.07, outline=0.008)
    b.scale = (0.9, 0.9, 1.4)
    b.location = (x, y, G + 0.2)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
