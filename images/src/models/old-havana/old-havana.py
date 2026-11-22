# A cartoon Old Havana for the country maps, built in the set's shared look (../toon.py): a row
# of pastel colonial houses with balconies and tall shuttered windows, the white dome of the
# Capitolio rising behind them, palms, and two vintage American cars with their fins on the
# street in front, one pink, one turquoise. Turned a little towards the camera.
# Run: blender -b --factory-startup -P old-havana.py -- old-havana-1024.png 1024 old-havana.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'pink': toon('pink', '#f2a0bd', shadow_mul=(0.85, 0.75, 0.85)),
    'yellow': toon('yellow', '#f4d06f', shadow_mul=(0.8, 0.7, 0.6)),
    'turquoise': toon('turquoise', '#5cc8c2', shadow_mul=(0.72, 0.82, 0.86)),
    'blue': toon('blue', '#6fa8e6', shadow_mul=(0.72, 0.74, 0.84)),
    'peach': toon('peach', '#f5b58a'),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.82, 0.82, 0.92)),
    'shutter': toon('shutter', '#3f8a6a', shadow_mul=(0.7, 0.78, 0.8)),
    'road': toon('road', '#8d8a86', shadow_mul=(0.78, 0.78, 0.86)),
    'pavement': toon('pavement', '#d8d2c6'),
    'chrome': toon('chrome', '#d9dde2', shadow_mul=(0.78, 0.8, 0.9), lift=0.4),
    'tyre': flat('tyre', '#2e2a28'),
    'palm': toon('palm', '#5fa04a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#9b6b43'),
    'carPink': toon('carPink', '#f07aa6', shadow_mul=(0.85, 0.72, 0.82)),
    'carTeal': toon('carTeal', '#3fbfb8', shadow_mul=(0.72, 0.82, 0.86)),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the street ----------
box('road', M['road'], 0, -0.62, G - 0.006, 2.6, 0.5, 0.02, outline=0.012, bevel=0)
box('pavement', M['pavement'], 0, -0.25, G - 0.006, 2.4, 0.22, 0.04, outline=0.014, bevel=0)

# ---------- the Capitolio's dome behind ----------
lathe('drum', M['white'], ((0.22, 0), (0.22, 0.3)), G, 0.05, 0.7, segs=24, outline=0.025)
for k in range(12):
    a = 2 * math.pi * k / 12
    rod(f'drumcol{k}', M['white'], (0.05 + 0.235 * math.cos(a), 0.7 + 0.235 * math.sin(a), G + 0.3),
        (0.05 + 0.235 * math.cos(a), 0.7 + 0.235 * math.sin(a), G + 0.5), 0.015, segs=6, outline=0.008)
lathe('dome', M['white'], ((0.25, 0), (0.24, 0.1), (0.19, 0.22), (0.1, 0.3), (0.05, 0.32), (0.05, 0.38), (0.01, 0.44)),
      G + 0.5, 0.05, 0.7, segs=28, outline=0.03)

# ---------- the row of colonial houses ----------
HOUSES = (('pink', 0.3, 0.42), ('yellow', 0.34, 0.5), ('turquoise', 0.3, 0.44), ('blue', 0.32, 0.52), ('peach', 0.3, 0.4))
x = -0.82
for k, (colour, w, h) in enumerate(HOUSES):
    cx = x + w / 2
    box(f'house{k}', M[colour], cx, 0.08, G, w - 0.01, 0.32, h, outline=0.022, bevel=0.004)
    box(f'parapet{k}', M['white'], cx, 0.08, G + h, w, 0.33, 0.035, outline=0.012, bevel=0)
    front = 0.08 - 0.16 - 0.006
    for row, z in enumerate((G + 0.05, G + h - 0.18)):
        for c in (-1, 1):
            box(f'win{k}{row}{c}', M['shutter'], cx + c * w * 0.22, front, z, 0.05, 0.02, 0.12, outline=0, bevel=0)
    box(f'balcony{k}', M['white'], cx, front - 0.025, G + h - 0.2, w * 0.8, 0.05, 0.015, outline=0.008, bevel=0)
    box(f'railing{k}', M['white'], cx, front - 0.045, G + h - 0.185, w * 0.8, 0.008, 0.04, outline=0.006, bevel=0)
    x += w

# ---------- palms ----------
for k, (px, py) in enumerate(((-1.1, -0.2), (1.05, -0.05))):
    top = Vector((px, py, G + 0.55))
    rod(f'trunk{k}', M['trunk'], (px, py, G), top, 0.03, r2=0.022, segs=8, outline=0.015)
    for j in range(6):
        a = 2 * math.pi * j / 6 + k
        rod(f'leaf{k}{j}', M['palm'], top, top + Vector((0.2 * math.cos(a), 0.2 * math.sin(a), -0.08)), 0.045, r2=0.0, segs=6,
            outline=0.014)


# ---------- two vintage cars with fins ----------
def car(name, mat, x, y, facing):
    s = facing
    box(name, M[mat], x, y, G + 0.05, 0.42, 0.17, 0.07, outline=0.016, bevel=0.02)
    box(name + 'cabin', M[mat], x + s * 0.02, y, G + 0.12, 0.2, 0.15, 0.06, outline=0.014, bevel=0.02)
    box(name + 'glass', M['chrome'], x + s * 0.02, y - 0.076, G + 0.13, 0.16, 0.01, 0.04, outline=0, bevel=0)
    for fy in (-0.07, 0.07):
        loft(name + f'fin{fy}', M[mat], [[(x - s * 0.21, y + fy - 0.012, G + 0.115), (x - s * 0.21, y + fy + 0.012, G + 0.115),
                                          (x - s * 0.12, y + fy, G + 0.115)],
                                         [(x - s * 0.22, y + fy - 0.012, G + 0.16), (x - s * 0.22, y + fy + 0.012, G + 0.16),
                                          (x - s * 0.15, y + fy, G + 0.13)]], outline=0.008)
    for bx in (-0.215, 0.215):
        box(name + f'bumper{bx}', M['chrome'], x + bx, y, G + 0.05, 0.02, 0.18, 0.03, outline=0.006, bevel=0)
    for wx in (-0.13, 0.13):
        for wy in (-0.085, 0.085):
            cyl(name + f'wheel{wx}{wy}', M['tyre'], 0.045, 0.03, segs=14, outline=0,
                matrix=Matrix.Translation((x + wx, y + wy, G + 0.045)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))


car('carpink', 'carPink', -0.4, -0.58, 1)
car('carteal', 'carTeal', 0.45, -0.7, -1)

turn(before, -20)
render(G)
