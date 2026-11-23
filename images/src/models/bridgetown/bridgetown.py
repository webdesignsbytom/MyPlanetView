# A cartoon Historic Bridgetown and its Garrison for the country maps, built in the set's shared
# look (../toon.py): Barbados' Parliament Buildings, the neo-Gothic west wing with its clock tower
# and the east wing, in pale coral stone under red roofs, by the Careenage, the inlet where
# fishing boats moor along the quays, the Chamberlain Bridge across it, and palms. Turned a little
# towards the camera.
# Run: blender -b --factory-startup -P bridgetown.py -- bridgetown-1024.png 1024 bridgetown.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'water': toon('water', '#2fa0c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'quay': toon('quay', '#c9bfa8', shadow_mul=(0.8, 0.8, 0.88)),
    'coral': toon('coral', '#e8d9b8', shadow_mul=(0.82, 0.78, 0.82)),
    'coralDark': toon('coralDark', '#cdb98f', shadow_mul=(0.82, 0.78, 0.82)),
    'roof': toon('roof', '#b84a32'),
    'slate': toon('slate', '#5a6068', shadow_mul=(0.78, 0.8, 0.88)),
    'window': flat('window', '#3a3640'),
    'clock': toon('clock', '#f6f3ec', lift=0.2),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'b1': toon('b1', '#e0453a'), 'b2': toon('b2', '#3f7fc0'), 'b3': toon('b3', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)),
    'boatIn': toon('boatIn', '#f6f3ec', lift=0.2),
    'path': toon('path2', '#d9c9a8', lift=0.25),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(617)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the Careenage, from the sea at the left into the town ----------
CAREENAGE = [(-1.33, -0.32), (-1.25, -0.6), (0.45, -0.62), (0.58, -0.47), (0.45, -0.32)]
flat_face('careenage', M['water'], CAREENAGE, G + 0.004, outline=0.01)
for k, y in enumerate((-0.28, -0.66)):
    box(f'quaywall{k}', M['quay'], -0.4, y, G - 0.005, 1.7, 0.07, 0.03, outline=0.006, bevel=0)
box('bridge', M['quay'], -0.35, -0.47, G + 0.02, 0.14, 0.42, 0.025, outline=0.008, bevel=0)
for k, x in enumerate((-0.41, -0.29)):
    box(f'bridgerail{k}', M['quay'], x, -0.47, G + 0.045, 0.012, 0.42, 0.02, outline=0.003, bevel=0)
for k, (x, y, mat) in enumerate(((-0.85, -0.42, 'b1'), (-0.7, -0.54, 'b2'), (0.05, -0.4, 'b3'), (0.25, -0.53, 'b1'), (-1.05, -0.5, 'b2'))):
    loft(f'boat{k}', M[mat], [[(x - 0.06, y, G + 0.002), (x + 0.04, y - 0.02, G + 0.002), (x + 0.07, y, G + 0.002), (x + 0.04, y + 0.02, G + 0.002)],
                              [(x - 0.07, y, G + 0.03), (x + 0.04, y - 0.028, G + 0.03), (x + 0.085, y, G + 0.03), (x + 0.04, y + 0.028, G + 0.03)]], outline=0.006)
    box(f'boatin{k}', M['boatIn'], x - 0.005, y, G + 0.025, 0.07, 0.03, 0.008, outline=0, bevel=0)


# ---------- the Parliament Buildings ----------
def gothic_block(name, x, y, w, d, h, roof_h):
    box(name, M['coral'], x, y, G - 0.005, w, d, h, outline=0.018, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2 - 0.012, y - d / 2 - 0.012, G + h - 0.005), (x + w / 2 + 0.012, y - d / 2 - 0.012, G + h - 0.005),
                                     (x + w / 2 + 0.012, y + d / 2 + 0.012, G + h - 0.005), (x - w / 2 - 0.012, y + d / 2 + 0.012, G + h - 0.005)],
                                    [(x - w / 2 + 0.02, y - 0.004, G + h + roof_h), (x + w / 2 - 0.02, y - 0.004, G + h + roof_h), (x + w / 2 - 0.02, y + 0.004, G + h + roof_h),
                                     (x - w / 2 + 0.02, y + 0.004, G + h + roof_h)]], outline=0.012)
    n = max(3, int(w / 0.08))
    for row, z in enumerate((0.03, 0.12)):
        for k in range(n):
            wx = x - w / 2 + 0.05 + k * (w - 0.1) / (n - 1)
            box(f'{name}win{row}{k}', M['window'], wx, y - d / 2 - 0.004, G + z, 0.026, 0.01, 0.055, outline=0, bevel=0)
            pyramid(f'{name}winarch{row}{k}', M['window'], wx, y - d / 2 - 0.004, G + z + 0.055, 0.026, 0.02, outline=0)
    # pinnacles on the corners
    for sx in (-1, 1):
        for sy in (-1, 1):
            lathe(f'{name}pinnacle{sx}{sy}', M['coralDark'], ((0.018, 0), (0.018, 0.04), (0.004, 0.08)), G + h, x + sx * (w / 2 - 0.01), y + sy * (d / 2 - 0.01), segs=4,
                  outline=0.004, smooth=False)


WX, WY = -0.3, 0.25
gothic_block('westwing', WX, WY, 0.62, 0.24, 0.2, 0.09)
# the clock tower at the west wing's end
TX, TY = WX + 0.36, WY - 0.02
box('tower', M['coral'], TX, TY, G - 0.005, 0.14, 0.14, 0.42, outline=0.016, bevel=0)
box('towerband', M['coralDark'], TX, TY, G + 0.3, 0.15, 0.15, 0.016, outline=0.004, bevel=0)
for k in range(4):
    a = k * math.pi / 2
    ox, oy = 0.073 * math.sin(a), -0.073 * math.cos(a)
    cyl(f'clockface{k}', M['clock'], 0.035, 0.008, segs=16, outline=0.004,
        matrix=Matrix.Translation((TX + ox, TY + oy, G + 0.36)) @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    bar(f'clockhand{k}', M['window'], (TX + ox * 1.06, TY + oy * 1.06, G + 0.36), (TX + ox * 1.06, TY + oy * 1.06, G + 0.385), 0.004, outline=0)
pyramid('towerspire', M['slate'], TX, TY, G + 0.415, 0.17, 0.2, outline=0.012)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'towerpinnacle{sx}{sy}', M['coralDark'], ((0.014, 0), (0.014, 0.03), (0.003, 0.07)), G + 0.415, TX + sx * 0.06, TY + sy * 0.06, segs=4, outline=0.003, smooth=False)
gothic_block('eastwing', 0.6, 0.55, 0.42, 0.22, 0.18, 0.08)

# ---------- the square in front, palms ----------
box('square', M['path'], 0.05, -0.05, G - 0.004, 1.2, 0.3, 0.008, outline=0.005, bevel=0)
for k, (x, y) in enumerate(((-0.85, 0.15), (0.3, -0.1), (0.95, 0.15), (-0.75, 0.75), (0.15, 0.85))):
    h = rng.uniform(0.22, 0.28)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.03, y, G + h), 0.014, r2=0.011, segs=8, outline=0.006)
    for f in range(6):
        b = 2 * math.pi * f / 6 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.03, y, G + h), (x + 0.03 + 0.1 * math.cos(b), y + 0.1 * math.sin(b), G + h - 0.05), 0.02, outline=0.005)

turn(before, -20)
render(G)
