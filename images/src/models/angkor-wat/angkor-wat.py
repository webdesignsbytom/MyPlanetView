# A cartoon Angkor Wat for the country maps, built in the set's shared look (../toon.py): the
# sandstone temple rising in three galleries, its five lotus-bud towers (the tallest in the
# middle, the four others at the corners of the top terrace), steep stairs up the front, and
# the causeway across the reflecting pools, with sugar palms.
# Run: blender -b --factory-startup -P angkor-wat.py -- angkor-wat-1024.png 1024 angkor-wat.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sandstone': toon('sandstone', '#b9aa8c', shadow_mul=(0.78, 0.76, 0.82)),
    'sandDark': toon('sandDark', '#9f907a', shadow_mul=(0.78, 0.76, 0.82)),
    'stairs': toon('stairs', '#d0c3a6'),
    'door': flat('door', '#4b3a55'),
    'water': toon('water', '#5ab3e2', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'palm': toon('palm', '#5fa04a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6a4a'),
})

G = tile()

# ---------- the causeway across the reflecting pools ----------
box('causeway', M['path'], 0, -1.0, G - 0.005, 0.2, 0.68, 0.03, outline=0.015, bevel=0)
for side in (-1, 1):
    box(f'pool{side}', M['water'], side * 0.38, -1.02, G - 0.005, 0.5, 0.3, 0.022, outline=0.012, bevel=0)

# ---------- three galleries, one above another ----------
CY = 0.12
LEVELS = ((1.42, 1.06, 0.08, 'sandDark'), (1.2, 0.9, 0.15, 'sandstone'), (0.9, 0.7, 0.16, 'sandstone'), (0.58, 0.58, 0.2, 'sandstone'))
z = G - 0.005
for k, (w, d, h, mat) in enumerate(LEVELS):
    box(f'level{k}', M[mat], 0, CY, z, w, d, h, outline=0.03, bevel=0.008)
    if k:
        # its gallery's row of dark doorways on the front, and stairs up the middle
        for j in range(-3, 4):
            if j == 0:
                continue
            x = j * w / 8
            box(f'gallerydoor{k}{j}', M['door'], x, CY - d / 2 - 0.006, z + h * 0.25, 0.035, 0.02, h * 0.5, outline=0, bevel=0)
        box(f'stairs{k}', M['stairs'], 0, CY - d / 2 - 0.03, z, 0.14, 0.07, h + 0.01, outline=0.015, bevel=0)
    z += h
TOP = z


# ---------- the five lotus-bud towers ----------
def lotus(name, x, y, z0, s):
    """A tower like a lotus bud: tier upon tier, each a little narrower, to a point."""
    profile = ((0.16, 0), (0.16, 0.12), (0.14, 0.14), (0.145, 0.24), (0.12, 0.26), (0.125, 0.35), (0.1, 0.37),
               (0.1, 0.45), (0.075, 0.47), (0.075, 0.53), (0.05, 0.55), (0.045, 0.6), (0.022, 0.66), (0.004, 0.72))
    lathe(name, M['sandstone'], tuple((r * s, h * s) for r, h in profile), z0, x, y, segs=12, outline=0.03 * s + 0.005,
          smooth=False)
    box(name + 'door', M['door'], x, y - 0.16 * s - 0.004, z0, 0.05 * s, 0.02, 0.09 * s, outline=0, bevel=0)


lotus('central', 0, CY, TOP, 1.0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lotus(f'corner{sx}{sy}', sx * 0.22, CY + sy * 0.22, TOP, 0.62)

# ---------- sugar palms ----------
for k, (x, y, lean) in enumerate(((-1.08, -0.45, -0.05), (1.04, -0.5, 0.05), (1.0, 0.62, 0.04))):
    top = Vector((x + lean, y, G + 0.5))
    rod(f'trunk{k}', M['trunk'], (x, y, G), top, 0.03, r2=0.024, segs=8, outline=0.018)
    for j in range(7):
        a = 2 * math.pi * j / 7 + k
        rod(f'leaf{k}{j}', M['palm'], top, top + Vector((0.2 * math.cos(a), 0.2 * math.sin(a), -0.06)), 0.05, r2=0.0,
            segs=6, outline=0.016)
    ball(f'crown{k}', M['palm'], *top, 0.05, outline=0.016)

render(G)
