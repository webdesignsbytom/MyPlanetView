# The Pyramids of Giza for the country maps, built from primitives in the set's shared look
# (../toon.py), on a tile of desert sand: Khufu's Great Pyramid, Khafre's with the pale
# casing still on its tip, little Menkaure's, the Sphinx in front of them facing the camera,
# and two palms.
# Run: blender -b --factory-startup -P pyramids-of-giza.py -- pyramids-of-giza-1024.png 1024 pyramids-of-giza.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#e3b96d'),
    'cap': toon('cap', '#f7ecd4', shadow_mul=(0.85, 0.8, 0.82)),
    'sand': toon('sand', '#efd9a0', lift=0.25),
    'sphinx': toon('sphinx', '#d6a35c'),
    'palm': toon('palm', '#5fa04a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#9b6b43'),
    'stripe': toon('stripe', '#2f55b0', shadow_mul=(0.72, 0.72, 0.82)),
})

G = tile(M['sand'])

# ---------- the three pyramids (their sides at the Great Pyramid's 52 degrees) ----------
SLOPE = math.tan(math.radians(52)) / 2   # height over base
for name, x, y, base in (('khufu', -0.45, 0.35, 0.98), ('khafre', 0.42, 0.3, 0.9), ('menkaure', 0.6, -0.42, 0.5)):
    pyramid(name, M['stone'], x, y, G - 0.005, base, base * SLOPE)
# Khafre's tip keeps its smooth pale casing
H_KHAFRE = 0.9 * SLOPE
pyramid('khafrecap', M['cap'], 0.42, 0.3, G - 0.005 + H_KHAFRE * 0.74, 0.9 * 0.28, H_KHAFRE * 0.28)

# ---------- the Sphinx, built facing the front and turned to face the camera ----------
before = set(bpy.data.objects)
SX, SY = -0.42, -0.78
box('sphinxbody', M['sphinx'], SX, SY + 0.12, G, 0.17, 0.4, 0.12, outline=0.025, bevel=0.015)
box('sphinxhaunch', M['sphinx'], SX, SY + 0.27, G, 0.19, 0.12, 0.15, outline=0.025, bevel=0.02)
for side in (-1, 1):
    box(f'paw{side}', M['sphinx'], SX + side * 0.055, SY - 0.13, G, 0.055, 0.2, 0.045, outline=0.02, bevel=0.01)
box('sphinxchest', M['sphinx'], SX, SY - 0.03, G, 0.15, 0.12, 0.2, outline=0.025, bevel=0.015)
# the nemes headdress (blue and gold stripes, as it was painted) and the face in front of it
box('nemes', M['stripe'], SX, SY - 0.02, G + 0.18, 0.15, 0.1, 0.11, outline=0.025, bevel=0.012)
for k, z in enumerate((G + 0.2, G + 0.24)):
    box(f'nemesgold{k}', M['gold'], SX, SY - 0.02, z, 0.155, 0.105, 0.015, outline=0, bevel=0)
box('face', M['sphinx'], SX, SY - 0.075, G + 0.19, 0.075, 0.05, 0.1, outline=0.02, bevel=0.01)
# side-on, so its long lion's body shows, and a little bigger than life
place = (Matrix.Translation((SX, SY, G)) @ Matrix.Rotation(math.radians(-75), 4, 'Z') @ Matrix.Scale(1.3, 4)
         @ Matrix.Translation((-SX, -SY, -G)))
for ob in set(bpy.data.objects) - before:
    ob.matrix_world = place @ ob.matrix_world

# ---------- palms ----------
for k, (x, y, lean) in enumerate(((-1.02, -0.3, -0.08), (0.88, -0.86, 0.06))):
    top = Vector((x + lean, y, G + 0.46))
    rod(f'trunk{k}', M['trunk'], (x, y, G), top, 0.035, r2=0.028, segs=8, outline=0.02)
    for j in range(6):
        a = 2 * math.pi * j / 6 + k
        tip = top + Vector((0.22 * math.cos(a), 0.22 * math.sin(a), -0.1))
        rod(f'leaf{k}{j}', M['palm'], top, tip, 0.05, r2=0.0, segs=6, outline=0.018)
    ball(f'crown{k}', M['palm'], *top, 0.05, outline=0.018)

render(G)
