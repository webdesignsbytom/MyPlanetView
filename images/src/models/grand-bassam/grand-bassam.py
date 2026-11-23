# A cartoon Grand-Bassam for the country maps, built in the set's shared look (../toon.py): the old
# colonial capital of Côte d'Ivoire by the Ébrié lagoon, its two-storey colonial houses with
# verandas under red tiled roofs, faded in ochre and cream, the old governor's palace, the
# lighthouse, coconut palms, and pirogues on the lagoon. Turned a little towards the camera.
# Run: blender -b --factory-startup -P grand-bassam.py -- grand-bassam-1024.png 1024 grand-bassam.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lagoon': toon('lagoon', '#4aa6b8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'sand': toon('sand', '#efe0bc', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'ochre': toon('ochre', '#e8b870', shadow_mul=(0.84, 0.74, 0.62)),
    'cream': toon('cream2', '#f2e6cc', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'pinkWall': toon('pinkWall', '#e8a898', shadow_mul=(0.84, 0.74, 0.74)),
    'roof': toon('roof', '#b84a32'),
    'wood': toon('wood', '#8a5a3a'),
    'white': toon('white', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'red': toon('red', '#d0402f'),
    'window': flat('window', '#3a3640'),
    'shutter': toon('shutter', '#4f8a6a'),
    'palm': toon('palm', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#8a6448'),
    'pirogue': toon('pirogue', '#6b4a33'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(691)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the lagoon along the front, a sandy shore ----------
R = 1.42
flat_face('shore', M['sand'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(192, 349, 6)], G + 0.002, outline=0.008)
flat_face('lagoon', M['lagoon'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(204, 337, 6)], G + 0.005, outline=0.01)


# ---------- colonial houses with verandas ----------
def colonial(name, x, y, w, d, wall, upper=True):
    h = 0.24 if upper else 0.12
    box(name, M[wall], x, y, G - 0.005, w, d, h, outline=0.016, bevel=0)
    loft(f'{name}roof', M['roof'], [[(x - w / 2 - 0.04, y - d / 2 - 0.06, G + h - 0.005), (x + w / 2 + 0.04, y - d / 2 - 0.06, G + h - 0.005),
                                     (x + w / 2 + 0.04, y + d / 2 + 0.02, G + h - 0.005), (x - w / 2 - 0.04, y + d / 2 + 0.02, G + h - 0.005)],
                                    [(x - w / 2 + 0.06, y - 0.01, G + h + 0.09), (x + w / 2 - 0.06, y - 0.01, G + h + 0.09), (x + w / 2 - 0.06, y + 0.0, G + h + 0.09),
                                     (x - w / 2 + 0.06, y + 0.0, G + h + 0.09)]], outline=0.012)
    n = max(3, int(w / 0.09))
    for row, z in enumerate((0.0, 0.12) if upper else (0.0,)):
        box(f'{name}veranda{row}', M['wood'], x, y - d / 2 - 0.045, G + z + 0.11, w + 0.02, 0.09, 0.012, outline=0.003, bevel=0)
        for k in range(n + 1):
            px = x - w / 2 + k * w / n
            rod(f'{name}post{row}{k}', M['white'], (px, y - d / 2 - 0.085, G + z), (px, y - d / 2 - 0.085, G + z + 0.11), 0.006, segs=6, outline=0.002)
        for k in range(n):
            px = x - w / 2 + (k + 0.5) * w / n
            box(f'{name}shutter{row}{k}', M['shutter'], px, y - d / 2 - 0.004, G + z + 0.025, 0.035, 0.01, 0.06, outline=0, bevel=0)


colonial('palace', -0.15, 0.25, 0.62, 0.26, 'ochre')
colonial('house1', -0.85, -0.05, 0.3, 0.2, 'cream')
colonial('house2', 0.62, -0.02, 0.32, 0.2, 'pinkWall')
colonial('house3', 0.45, 0.72, 0.36, 0.2, 'cream', upper=False)

# ---------- the lighthouse ----------
LX, LY = -0.7, 0.7
lathe('lighthouse', M['white'], ((0.06, 0), (0.045, 0.42)), G - 0.005, LX, LY, segs=12, outline=0.01)
for k, z in enumerate((0.12, 0.26)):
    lathe(f'lighthouseband{k}', M['red'], ((0.055, 0), (0.051, 0.04)), G + z, LX, LY, segs=12, outline=0.003)
lathe('lantern', M['red'], ((0.05, 0), (0.05, 0.03), (0.004, 0.08)), G + 0.41, LX, LY, segs=12, outline=0.006)

# ---------- coconut palms ----------
for k, (x, y) in enumerate(((-1.1, 0.3), (-0.45, -0.3), (0.15, -0.28), (1.05, 0.35), (0.0, 0.85), (-1.0, -0.4))):
    h = rng.uniform(0.26, 0.32)
    rod(f'palmtrunk{k}', M['trunk'], (x, y, G), (x + 0.04, y, G + h), 0.014, r2=0.011, segs=8, outline=0.006)
    for f in range(7):
        b = 2 * math.pi * f / 7 + k
        bar(f'frond{k}{f}', M['palm'], (x + 0.04, y, G + h), (x + 0.04 + 0.11 * math.cos(b), y + 0.11 * math.sin(b), G + h - 0.06), 0.02, outline=0.005)

# ---------- pirogues on the lagoon ----------
for k, (x, y, a) in enumerate(((-0.4, -0.85, 0.2), (0.25, -0.75, -0.3), (0.6, -1.0, 0.1))):
    c, s = math.cos(a), math.sin(a)
    at = lambda dx, dy, z: (x + dx * c - dy * s, y + dx * s + dy * c, z)
    loft(f'pirogue{k}', M['pirogue'], [[at(-0.14, 0, G + 0.002), at(0, -0.025, G + 0.002), at(0.14, 0, G + 0.002), at(0, 0.025, G + 0.002)],
                                       [at(-0.16, 0, G + 0.03), at(0, -0.035, G + 0.03), at(0.16, 0, G + 0.03), at(0, 0.035, G + 0.03)]], outline=0.006)

turn(before, -20)
render(G)
