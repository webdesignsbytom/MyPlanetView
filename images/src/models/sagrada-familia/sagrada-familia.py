# A cartoon Sagrada Família for the country maps, built in the set's shared look (../toon.py):
# the nave, the Nativity façade's four bell towers in front and the Passion façade's four
# behind, each a tall tapering spire with a red-and-white mosaic finial, the two evangelists'
# towers and the tallest, Jesus Christ's, with its cross, and, as ever, a crane.
# Run: blender -b --factory-startup -P sagrada-familia.py -- sagrada-familia-1024.png 1024 sagrada-familia.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#dcc59a'),
    'stoneDark': toon('stoneDark', '#c4a676'),
    'window': flat('window', '#4b3a55'),
    'mosaicRed': toon('mosaicRed', '#d8493b'),
    'mosaicWhite': toon('mosaicWhite', '#f6f1e6', shadow_mul=(0.85, 0.82, 0.88)),
    'crane': toon('crane', '#f2c230'),
    'weight': toon('weight', '#5a5a66', shadow_mul=(0.75, 0.75, 0.85)),
})

G = tile()
box('plaza', M['path'], 0, 0, G - 0.008, 1.5, 1.15, 0.03, outline=0.015, bevel=0)
Z = G + 0.02

# ---------- the nave, with its windows and a row of pinnacles along each side ----------
box('nave', M['stoneDark'], 0, 0, Z, 0.92, 0.58, 0.5, outline=0.04, bevel=0.01)
for k, x in enumerate((-0.3, -0.1, 0.1, 0.3)):
    for side in (-1, 1):
        box(f'navewin{k}{side}', M['window'], x, side * 0.3, Z + 0.12, 0.07, 0.02, 0.22, outline=0, bevel=0)
for k in range(7):
    x = -0.39 + 0.13 * k
    for side in (-1, 1):
        lathe(f'pinnacle{k}{side}', M['stone'], ((0.035, 0), (0.03, 0.08), (0.004, 0.17)), Z + 0.5, x, side * 0.26,
              segs=10, outline=0.015)

CAMERA = Vector((-math.sin(math.radians(32)), -math.cos(math.radians(32)), 0))


def spire(name, x, y, h, r, finial='mosaic'):
    """A tall tower tapering to its tip, its openings showing towards the camera."""
    profile = ((r, 0), (r * 0.96, 0.3 * h), (r * 0.84, 0.6 * h), (r * 0.62, 0.8 * h), (r * 0.36, 0.93 * h), (0.006, h))
    lathe(name, M['stone'], profile, Z, x, y, segs=18, outline=0.03)
    for k, f in enumerate((0.28, 0.46, 0.64)):
        rr = r * (0.97 - 0.3 * f) + 0.004
        box(f'{name}slit{k}', M['window'], x + CAMERA.x * rr, y + CAMERA.y * rr, Z + f * h, 0.03, 0.02, 0.07,
            rot_z=math.radians(-32), outline=0, bevel=0)
    top = Z + h * 0.9
    if finial == 'mosaic':
        ball(f'{name}finial', M['mosaicRed'], x, y, top, r * 0.55, outline=0.018)
        ball(f'{name}finialtop', M['mosaicWhite'], x, y, top + r * 0.55, r * 0.3, outline=0.014)
    else:
        ball(f'{name}finial', M['gold'], x, y, top + r * 0.2, r * 0.45, outline=0.018)


# the Nativity façade (front) and the Passion façade (back): four bell towers each
for k, (x, h) in enumerate(((-0.33, 1.22), (-0.11, 1.42), (0.11, 1.42), (0.33, 1.22))):
    spire(f'nativity{k}', x, -0.36, h, 0.064)
    spire(f'passion{k}', x, 0.36, h - 0.1, 0.06)
# the evangelists' towers, and the tallest, Jesus Christ's, with its cross
spire('luke', -0.2, 0.0, 1.58, 0.075, finial='gold')
spire('john', 0.2, 0.0, 1.58, 0.075, finial='gold')
H_JESUS = 1.95
lathe('jesus', M['stone'], ((0.12, 0), (0.115, 0.4 * H_JESUS), (0.095, 0.7 * H_JESUS), (0.065, 0.88 * H_JESUS),
                            (0.04, 0.97 * H_JESUS), (0.01, H_JESUS)), Z, 0, 0, segs=20, outline=0.035)
CROSS = Z + H_JESUS + 0.06
for p0, p1 in (((0, 0, CROSS - 0.08), (0, 0, CROSS + 0.12)), ((-0.08, 0, CROSS + 0.03), (0.08, 0, CROSS + 0.03)),
               ((0, -0.08, CROSS + 0.03), (0, 0.08, CROSS + 0.03))):
    rod('cross', M['mosaicWhite'], p0, p1, 0.022, segs=8, outline=0.014)
ball('crossheart', M['gold'], 0, 0, CROSS + 0.03, 0.035, outline=0.012)

# ---------- the crane ----------
MAST = Vector((0.86, 0.5, G))
TOP_C = MAST + Vector((0, 0, 1.5))
bar('mast', M['crane'], MAST, TOP_C, 0.05, outline=0.018)
JIB_END = Vector((0.1, 0.12, TOP_C.z))
bar('jib', M['crane'], TOP_C, JIB_END, 0.035, outline=0.015)
bar('counterjib', M['crane'], TOP_C, TOP_C + (TOP_C - JIB_END) * 0.3, 0.035, outline=0.015)
c = TOP_C + (TOP_C - JIB_END) * 0.28
box('counterweight', M['weight'], c.x, c.y, c.z - 0.07, 0.08, 0.08, 0.07, outline=0.015, bevel=0)
rod('cable', M['weight'], JIB_END + (TOP_C - JIB_END) * 0.25, JIB_END + (TOP_C - JIB_END) * 0.25 - Vector((0, 0, 0.3)),
    0.006, segs=6, outline=0.006)

render(G)
