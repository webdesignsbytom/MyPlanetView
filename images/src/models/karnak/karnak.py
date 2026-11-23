# A cartoon Karnak for the country maps, built in the set's shared look (../toon.py): the great
# hypostyle hall's forest of massive columns with their open papyrus capitals and the stone beams
# across them, a pink granite obelisk with its gilded tip, the first pylon's sloping towers, and a
# felucca on the Nile in front. Turned a little towards the camera.
# Run: blender -b --factory-startup -P karnak.py -- karnak-1024.png 1024 karnak.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sand': toon('sand', '#e8c88a', shadow_mul=(0.86, 0.78, 0.72), lift=0.25),
    'stone': toon('stone', '#d8b07a', shadow_mul=(0.86, 0.76, 0.7)),
    'stoneDark': toon('stoneDark', '#b89060', shadow_mul=(0.86, 0.76, 0.7)),
    'granite': toon('granite', '#c88a7a', shadow_mul=(0.86, 0.76, 0.76)),
    'gold': toon('gold', '#f0c030', lift=0.35),
    'nile': toon('nile', '#3a8aa0', shadow_mul=(0.74, 0.82, 0.9), lift=0.3),
    'sail': toon('sail', '#f8f4ea', lift=0.2),
    'hull': toon('hull', '#7a5236'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


flat_face('nile', M['nile'], [(1.42 * math.cos(math.radians(a)), 1.42 * math.sin(math.radians(a))) for a in range(210, 331, 4)], G + 0.004, outline=0.01)

# ---------- the hypostyle hall: rows of papyrus columns, beams across ----------
HX, HY = -0.15, 0.3
for i in range(4):
    for j in range(5):
        x, y = HX - 0.4 + j * 0.2, HY - 0.25 + i * 0.17
        h = 0.4 if 1 <= j <= 3 and i in (1, 2) else 0.32
        lathe(f'column{i}{j}', M['stone'], ((0.055, 0), (0.05, h * 0.85), (0.075, h)), G - 0.005, x, y, segs=12, outline=0.01)
        box(f'abacus{i}{j}', M['stoneDark'], x, y, G + h - 0.005, 0.1, 0.1, 0.03, outline=0.004, bevel=0)
    for j in range(4):
        x = HX - 0.3 + j * 0.2
        h = 0.4 if i in (1, 2) and 1 <= j <= 2 else 0.32
        box(f'beam{i}{j}', M['stoneDark'], x, HY - 0.25 + i * 0.17, G + h + 0.025, 0.2, 0.07, 0.04, outline=0.006, bevel=0)
for j in range(5):
    lathe(f'band{j}', M['stoneDark'], ((0.056, 0), (0.056, 0.02)), G + 0.1, HX - 0.4 + j * 0.2, HY - 0.25, segs=12, outline=0.002)

# ---------- the first pylon and the obelisk ----------
for s in (-1, 1):
    loft(f'pylon{s}', M['stone'], [[(0.55 + s * 0.17 - 0.14, 0.05, G - 0.01), (0.55 + s * 0.17 + 0.14, 0.05, G - 0.01), (0.55 + s * 0.17 + 0.14, 0.2, G - 0.01),
                                    (0.55 + s * 0.17 - 0.14, 0.2, G - 0.01)],
                                   [(0.55 + s * 0.17 - 0.11, 0.08, G + 0.42), (0.55 + s * 0.17 + 0.11, 0.08, G + 0.42), (0.55 + s * 0.17 + 0.11, 0.18, G + 0.42),
                                    (0.55 + s * 0.17 - 0.11, 0.18, G + 0.42)]], outline=0.012)
box('pylongate', M['stoneDark'], 0.55, 0.12, G - 0.005, 0.08, 0.1, 0.3, outline=0.006, bevel=0)
OX, OY = 0.45, -0.25
lathe('obelisk', M['granite'], ((0.04, 0), (0.028, 0.6)), G - 0.005, OX, OY, segs=4, outline=0.008, smooth=False)
lathe('pyramidion', M['gold'], ((0.028, 0), (0.004, 0.05)), G + 0.595, OX, OY, segs=4, outline=0.004, smooth=False)
box('obeliskbase', M['stoneDark'], OX, OY, G - 0.005, 0.1, 0.1, 0.03, outline=0.004, bevel=0)

# ---------- a felucca on the Nile, palms on the bank ----------
FX, FY = -0.35, -0.95
loft('felucca', M['hull'], [[(FX - 0.12, FY, G), (FX + 0.08, FY - 0.03, G), (FX + 0.14, FY, G), (FX + 0.08, FY + 0.03, G)],
                            [(FX - 0.14, FY, G + 0.04), (FX + 0.08, FY - 0.04, G + 0.04), (FX + 0.18, FY, G + 0.05), (FX + 0.08, FY + 0.04, G + 0.04)]], outline=0.006)
rod('feluccamast', M['hull'], (FX, FY, G + 0.04), (FX, FY, G + 0.3), 0.005, segs=5, outline=0)
loft('feluccasail', M['sail'], [[(FX + 0.004, FY - 0.004, G + 0.06), (FX + 0.004, FY + 0.004, G + 0.06), (FX + 0.18, FY + 0.004, G + 0.06)],
                                [(FX - 0.12, FY - 0.004, G + 0.38), (FX - 0.12, FY + 0.004, G + 0.38), (FX - 0.11, FY + 0.004, G + 0.38)]], outline=0.004)
for k, (x, y) in enumerate(((-0.95, -0.25), (0.9, -0.1), (-1.0, 0.35), (0.95, 0.4))):
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.02, y, G + 0.32), 0.013, r2=0.01, segs=8, outline=0.004)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.02, y, G + 0.32), (x + 0.02 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + 0.27), 0.019, outline=0.005)

turn(before, -20)
render(G)
