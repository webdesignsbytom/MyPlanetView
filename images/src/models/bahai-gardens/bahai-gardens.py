# Cartoon Bahá'í Gardens for the country maps, built in the set's shared look (../toon.py): the
# terraced gardens stepping down Mount Carmel in Haifa, green lawns edged with flower beds and dark
# cypresses either side of the central stair, the Shrine of the Báb on its terrace with its white
# colonnade and golden dome, and the bay at the foot. Turned a little towards the camera.
# Run: blender -b --factory-startup -P bahai-gardens.py -- bahai-gardens-1024.png 1024 bahai-gardens.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'sea': toon('sea', '#2fa0c8', shadow_mul=(0.74, 0.82, 0.9), lift=0.35),
    'wall': toon('wall', '#e8dcc0', shadow_mul=(0.82, 0.8, 0.84)),
    'garden': toon('garden', '#5f9e55', shadow_mul=(0.7, 0.78, 0.8)),
    'lawn': toon('lawn', '#7cc061', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'flower': toon('flower', '#e0453a'),
    'flower2': toon('flower2', '#f2c84a', shadow_mul=(0.84, 0.72, 0.6)),
    'cypress': toon('cypress', '#2f6e40', shadow_mul=(0.7, 0.78, 0.8)),
    'stair': toon('stair', '#f4f0e6', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'marble': toon('marble', '#f8f6f0', shadow_mul=(0.8, 0.82, 0.92), lift=0.2),
    'gold': toon('goldDome', '#f3b53a', shadow_mul=(0.78, 0.62, 0.55), lift=0.45),
    'green': toon('greenTile', '#4f9a6a'),
    'window': flat('window', '#3a3640'),
    'city': toon('city', '#e0d8c8', shadow_mul=(0.8, 0.8, 0.86)),
    'roof': toon('roof', '#c4573a'),
})

G = tile()
before = set(bpy.data.objects)
rng = random.Random(787)


def flat_face(name, mat, pts, z, outline=0.0):
    bm = bmesh.new()
    bmesh.ops.triangulate(bm, faces=[bm.faces.new([bm.verts.new((x, y, z)) for x, y in pts])])
    return finish(name, bm, mat, outline=outline)


# ---------- the bay at the foot ----------
R = 1.42
flat_face('bay', M['sea'], [(R * math.cos(math.radians(a)), R * math.sin(math.radians(a))) for a in range(212, 329, 6)], G + 0.004, outline=0.01)

# ---------- the terraces stepping down the mountain towards us ----------
W = 0.7          # half the gardens' width
TERR = 9
for k in range(TERR):
    y0 = 0.95 - k * 0.17
    z = 0.06 * (TERR - k)
    half = min(W, math.sqrt(max(0.0, 1.32 ** 2 - (y0 - 0.085) ** 2)) - 0.05)
    box(f'terrace{k}', M['garden'], 0, y0 - 0.085, G - 0.005, 2 * half, 0.17, z, outline=0.01, bevel=0)
    box(f'terraceedge{k}', M['wall'], 0, y0 - 0.172, G + z - 0.06, 2 * half + 0.004, 0.012, 0.062, outline=0.004, bevel=0)
    box(f'terracelawn{k}', M['lawn'], 0, y0 - 0.09, G + z - 0.006, 2 * half - 0.06, 0.13, 0.008, outline=0, bevel=0)
    for s in (-1, 1):
        box(f'bed{k}{s}', M['flower' if k % 2 else 'flower2'], s * (half - 0.05), y0 - 0.155, G + z - 0.004, 0.06, 0.02, 0.012, outline=0, bevel=0)
        for j in range(2):
            x = s * (0.18 + j * 0.22)
            if abs(x) < half - 0.06:
                lathe(f'cypress{k}{s}{j}', M['cypress'], ((0.025, 0), (0.028, 0.05), (0.004, 0.14)), G + z - 0.005, x, y0 - 0.06, segs=8, outline=0.006)
    # the central stair down the middle
    box(f'stair{k}', M['stair'], 0, y0 - 0.085, G + z - 0.004, 0.12, 0.17, 0.006, outline=0.004, bevel=0)

# ---------- the Shrine of the Báb on its terrace ----------
SY = 0.95 - 4 * 0.17 - 0.085
SZ = G + 0.06 * (TERR - 4)
box('shrine', M['marble'], 0, SY, SZ - 0.005, 0.3, 0.2, 0.12, outline=0.014, bevel=0)
for k in range(9):
    x = -0.14 + k * 0.035
    rod(f'column{k}', M['marble'], (x, SY - 0.115, SZ), (x, SY - 0.115, SZ + 0.1), 0.007, segs=8, outline=0.002)
box('colonnadeedge', M['marble'], 0, SY - 0.115, SZ + 0.1, 0.32, 0.02, 0.02, outline=0.004, bevel=0)
box('parapet', M['marble'], 0, SY, SZ + 0.115, 0.32, 0.22, 0.02, outline=0.006, bevel=0)
lathe('drum', M['marble'], ((0.08, 0), (0.08, 0.1)), SZ + 0.13, 0, SY, segs=16, outline=0.01)
for k in range(8):
    a = 2 * math.pi * k / 8
    box(f'drumwin{k}', M['green'], 0.079 * math.cos(a), SY + 0.079 * math.sin(a), SZ + 0.15, 0.015, 0.02, 0.05, rot_z=a, outline=0, bevel=0)
lathe('dome', M['gold'], ((0.09, 0), (0.085, 0.05), (0.06, 0.1), (0.02, 0.13), (0.004, 0.15)), SZ + 0.225, 0, SY, segs=20, outline=0.012)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'shrinefinial{sx}{sy}', M['marble'], ((0.012, 0), (0.008, 0.03), (0.002, 0.05)), SZ + 0.13, sx * 0.14, SY + sy * 0.09, segs=6, outline=0.002)

# ---------- the city's houses along the shore ----------
for k, (x, y) in enumerate(((-1.05, -0.35), (-0.85, -0.5), (0.85, -0.5), (1.05, -0.3), (-0.95, 0.2), (0.95, 0.25))):
    box(f'city{k}', M['city'], x, y, G - 0.005, 0.14, 0.12, rng.uniform(0.08, 0.14), outline=0.008, bevel=0)

turn(before, -20)
render(G)
