# A cartoon Pattadakal for the country maps, built in the set's shared look (../toon.py): the
# Chalukya kings' temple town on the Malaprabha in Karnataka, India: the Virupaksha temple with
# its stepped southern tower and its pillared hall, the Nandi pavilion before it, and the
# smaller shrines with their curved northern towers, on the lawns by the river. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P pattadakal.py -- pattadakal-1024.png 1024 pattadakal.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#94c060', shadow_mul=(0.7, 0.78, 0.8), lift=0.22),
    'stone': toon('stone', '#c8a07a', shadow_mul=(0.8, 0.74, 0.78), lift=0.14),
    'stoneLight': toon('stoneLight', '#d8b48c', lift=0.16),
    'path': toon('path2', '#e2d4b4', lift=0.18),
    'dark': flat('dark', '#2e2420'),
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


box('court', M['path'], 0.0, 0.0, G - 0.004, 1.5, 1.1, 0.008, outline=0.001, bevel=0)


def dravida(name, x, y, w, h, tiers):
    """A southern stepped tower: a square shrine and storeys narrowing up to a domed top."""
    box(name, M['stone'], x, y, G - 0.005, w, w, h, outline=0.005, bevel=0)
    z, ww = G + h - 0.005, w
    for k in range(tiers):
        box(f'{name}tier{k}', M['stoneLight'] if k % 2 else M['stone'], x, y, z, ww, ww, 0.06, outline=0.003, bevel=0)
        for c in (-1, 1):
            for d in (-1, 1):
                box(f'{name}kuta{k}{c}{d}', M['stoneLight'], x + c * (ww / 2 - 0.02), y + d * (ww / 2 - 0.02), z + 0.06, 0.035, 0.035, 0.03, outline=0.001, bevel=0)
        z += 0.06
        ww *= 0.78
    lathe(f'{name}top', M['stoneLight'], ((ww * 0.6, 0), (ww * 0.7, 0.04), (ww * 0.4, 0.08), (0.0, 0.1)), z, x, y, segs=8, outline=0.003, smooth=False)


def nagara(name, x, y, w, h, th):
    """A northern curved tower over a small shrine, crowned by its ribbed amalaka."""
    box(name, M['stone'], x, y, G - 0.005, w, w, h, outline=0.004, bevel=0)
    rings = []
    for k in range(6):
        t = k / 5
        s = w / 2 * (1 - 0.6 * t ** 1.6)
        rings.append([(x - s, y - s, G + h + th * t), (x + s, y - s, G + h + th * t), (x + s, y + s, G + h + th * t), (x - s, y + s, G + h + th * t)])
    loft(name + 'tower', M['stoneLight'], rings, outline=0.004)
    lathe(name + 'amalaka', M['stone'], ((w * 0.22, 0), (w * 0.28, 0.02), (w * 0.22, 0.04), (0.0, 0.06)), G + h + th, x, y, segs=12, outline=0.002, smooth=False)


# ---------- the Virupaksha temple ----------
VX, VY = 0.0, 0.25
dravida('virupaksha', VX, VY + 0.12, 0.3, 0.2, 4)
box('hall', M['stone'], VX, VY - 0.18, G - 0.005, 0.36, 0.36, 0.14, outline=0.005, bevel=0)
box('hallroof', M['stoneLight'], VX, VY - 0.18, G + 0.135, 0.38, 0.38, 0.03, outline=0.003, bevel=0)
for j in range(5):
    lathe(f'hallpillar{j}', M['stoneLight'], ((0.014, 0), (0.014, 0.14)), G - 0.005, VX - 0.16 + j * 0.08, VY - 0.37, segs=8, outline=0.001, smooth=False)
box('halldoor', M['dark'], VX, VY - 0.362, G - 0.005, 0.06, 0.006, 0.1, outline=0, bevel=0)
# the Nandi pavilion
box('nandi', M['stone'], VX, VY - 0.62, G - 0.005, 0.16, 0.16, 0.1, outline=0.004, bevel=0)
box('nandiroof', M['stoneLight'], VX, VY - 0.62, G + 0.095, 0.18, 0.18, 0.025, outline=0.002, bevel=0)
box('nandiopen', M['dark'], VX, VY - 0.702, G + 0.01, 0.08, 0.006, 0.07, outline=0, bevel=0)

# ---------- the smaller shrines ----------
dravida('mallikarjuna', -0.5, 0.05, 0.22, 0.16, 3)
nagara('galaganatha', 0.5, 0.2, 0.18, 0.14, 0.24)
nagara('kashivishwanatha', 0.48, -0.35, 0.15, 0.12, 0.2)
nagara('jambulinga', -0.45, -0.45, 0.13, 0.1, 0.18)

for k, (x, y) in enumerate(((-0.95, 0.45), (0.95, 0.55), (-0.2, 0.9), (0.9, -0.75), (-0.85, -0.75))):
    tree(f'tree{k}', x, y)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
