# A cartoon Holašovice for the country maps, built in the set's shared look (../toon.py): the
# farming village in South Bohemia, Czechia, its farmhouses round the long village green with
# their ornate South Bohemian folk baroque gables, white and pastel with curling scrolls and
# niches, the little chapel with its bell turret in the middle, and the pond. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P holasovice.py -- holasovice-1024.png 1024 holasovice.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#8cc05a', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'white': toon('white', '#f4f0e6', shadow_mul=(0.82, 0.82, 0.88), lift=0.22),
    'yellow': toon('yellow', '#f0d488', lift=0.2),
    'pink': toon('pink', '#eec0b0', lift=0.2),
    'green2': toon('green2', '#c8dca8', lift=0.2),
    'roof': toon('roof', '#b45a3a'),
    'trim': toon('trim', '#e8e0cc'),
    'water': toon('water', '#4a9ac8', lift=0.3),
    'dark': flat('dark', '#2e2622'),
    'tree': toon('tree', '#4e8a3e', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5a3e'),
})

G = tile()
before = set(bpy.data.objects)
def tree(name, x, y, r=0.09, h=0.12, mat="tree"):
    rod(name + "trunk", M["trunk"], (x, y, G), (x, y, G + h), 0.012, segs=6, outline=0.002)
    b = ball(name, M[mat], 0, 0, 0, r, outline=0.008)
    b.scale = (1.1, 1.1, 0.95)
    b.location = (x, y, G + h + r * 0.75)



def farmhouse(name, mat):
    """A farmhouse built at the origin with its ornate gable facing the front (-y)."""
    W, D, H = 0.2, 0.26, 0.1
    box(name, mat, 0, 0, G - 0.005, W, D, H, outline=0.005, bevel=0)
    gable(name + 'roof', M['roof'], 0, 0.02, G + H - 0.005, W, D - 0.04, 0.13, over=0.01)
    # the gable's scrolled outline, standing a little proud of the roof's end
    pts = [(-W / 2, 0), (W / 2, 0), (W / 2 - 0.01, 0.03), (W / 2 - 0.04, 0.05), (W / 2 - 0.035, 0.08), (0.03, 0.12), (0.025, 0.15), (-0.025, 0.15), (-0.03, 0.12), (-W / 2 + 0.035, 0.08), (-W / 2 + 0.04, 0.05), (-W / 2 + 0.01, 0.03)]
    loft(name + 'gable', mat, [[(x, -D / 2 - 0.01, G + H - 0.005 + z) for x, z in pts], [(x, -D / 2 + 0.02, G + H - 0.005 + z) for x, z in pts]], outline=0.004)
    for z in (0.03, 0.08):
        box(f'{name}scroll{z}', M['trim'], 0, -D / 2 - 0.013, G + H + z, W - 0.06 - z * 0.6, 0.004, 0.008, outline=0, bevel=0)
    arch(name + 'niche', M['dark'], 0, -D / 2 - 0.013, G + H + 0.06, 0.02, 0.035)
    for j in (-1, 1):
        box(f'{name}win{j}', M['dark'], j * 0.05, -D / 2 - 0.003, G + 0.035, 0.03, 0.006, 0.035, outline=0, bevel=0)


# ---------- the farmhouses, their gables to the green ----------
MATS = (M['white'], M['yellow'], M['pink'], M['white'], M['green2'], M['yellow'], M['white'], M['pink'])
k = 0
for side, (x0, y0, x1, y1) in enumerate(((-0.6, 0.55, 0.6, 0.55), (-0.66, 0.0, 0.66, 0.0))):
    for j in range(4):
        t = j / 3
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        objs = set(bpy.data.objects)
        farmhouse(f'farm{k}', MATS[k % len(MATS)])
        for o in set(bpy.data.objects) - objs:
            o.matrix_world = Matrix.Translation((x, y, 0)) @ o.matrix_world
        k += 1

# ---------- the chapel and the pond on the green ----------
CX, CY = 0.1, -0.55
box('chapel', M['white'], CX, CY, G - 0.005, 0.14, 0.2, 0.13, outline=0.005, bevel=0)
gable('chapelroof', M['roof'], CX, CY, G + 0.125, 0.14, 0.2, 0.09, over=0.01)
box('turret', M['white'], CX, CY - 0.06, G + 0.15, 0.05, 0.05, 0.08, outline=0.003, bevel=0)
lathe('turretcap', M['roof'], ((0.035, 0), (0.0, 0.08)), G + 0.23, CX, CY - 0.06, segs=8, outline=0.002, smooth=False)
box('chapeldoor', M['dark'], CX, CY - 0.102, G - 0.005, 0.035, 0.006, 0.07, outline=0, bevel=0)
lathe('pond', M['water'], ((0.16, 0), (0.16, 0.008)), G - 0.004, -0.35, -0.6, segs=24, outline=0.002)
for k, (x, y) in enumerate(((0.5, -0.5), (0.65, -0.7), (-0.65, -0.45), (1.0, 0.3), (-1.0, 0.3))):
    tree(f'tree{k}', x, y, r=0.08, h=0.1)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
