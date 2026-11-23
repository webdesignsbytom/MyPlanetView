# A cartoon Grand Place for the country maps, built in the set's shared look (../toon.py) on a tile
# of cobbles: Brussels' Town Hall across the back, its arcade, rows of windows and steep slate
# roof with dormers, and its tall Gothic tower narrowing in open octagonal stages to the gilded
# Saint Michael; the guild houses down both sides with their Baroque gables and gold; and the
# flower carpet laid out in begonias in the middle of the square.
# Run: blender -b --factory-startup -P grand-place.py -- grand-place-1024.png 1024 grand-place.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'cobble': toon('cobble', '#d3cab8', lift=0.25),
    'stone': toon('stone', '#ccb383', shadow_mul=(0.82, 0.76, 0.76)),
    'stoneDark': toon('stoneDark', '#a88f62', shadow_mul=(0.82, 0.76, 0.76)),
    'slate': toon('slate', '#4f5866', shadow_mul=(0.75, 0.75, 0.85)),
    'window': flat('window', '#33303d'),
    'houseDark': toon('houseDark', '#76695a', shadow_mul=(0.8, 0.76, 0.84)),
    'houseCream': toon('houseCream', '#e6d8b8', shadow_mul=(0.8, 0.78, 0.86)),
    'houseRed': toon('houseRed', '#a8473b'),
    'houseOchre': toon('houseOchre', '#d4a85a', shadow_mul=(0.84, 0.74, 0.62)),
    'roofTile': toon('roofTile', '#5b5f6b', shadow_mul=(0.75, 0.75, 0.85)),
    'red': flat('fred', '#e0453a'),
    'yellow': flat('fyellow', '#f4c83c'),
    'orange': flat('forange', '#f08a3a'),
    'white': flat('fwhite', '#f6f3ec'),
    'pink': flat('fpink', '#ef8fb6'),
    'leaf': toon('leaf', '#3f8a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile(M['cobble'])
everything = set(bpy.data.objects)
rng = random.Random(101)


def place(made_before, degrees, x, y):
    """Turns what was made since `made_before` (built facing -Y at the origin) and moves it to (x, y)."""
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    for ob in set(bpy.data.objects) - made_before:
        ob.matrix_world = m @ ob.matrix_world


def slab(name, mat, pts, y0, y1, outline=0.0):
    """A flat shape in the XZ plane, (x, z) points round its edge, as a slab from y0 to y1."""
    return loft(name, mat, [[(px, y0, pz) for px, pz in pts], [(px, y1, pz) for px, pz in pts]], outline=outline)


def pointed_arch(name, mat, a, h1, y0, y1, z0, x):
    left = [(x + a + 2 * a * math.cos(t), z0 + h1 + 2 * a * math.sin(t)) for t in (math.pi - (math.pi / 3) * k / 6 for k in range(7))]
    pts = [(x - a, z0), (x + a, z0)] + [(2 * x - px, pz) for px, pz in left] + list(reversed(left))[1:]
    slab(name, mat, pts, y0, y1)


def ridge_roof(name, mat, x, y, z, w, d, h, along_x=True):
    if along_x:
        top = [(x - w / 2 + 0.01, y - 0.004), (x + w / 2 - 0.01, y - 0.004), (x + w / 2 - 0.01, y + 0.004), (x - w / 2 + 0.01, y + 0.004)]
    else:
        top = [(x - 0.004, y - d / 2 + 0.01), (x + 0.004, y - d / 2 + 0.01), (x + 0.004, y + d / 2 - 0.01), (x - 0.004, y + d / 2 - 0.01)]
    loft(name, mat, [[(x - w / 2, y - d / 2, z), (x + w / 2, y - d / 2, z), (x + w / 2, y + d / 2, z), (x - w / 2, y + d / 2, z)],
                     [(px, py, z + h) for px, py in top]], outline=0.018)


# ---------- the Town Hall, built facing -Y ----------
made = set(bpy.data.objects)
W, D, H = 1.3, 0.3, 0.42
box('hall', M['stone'], 0, 0, G - 0.005, W, D, H, outline=0.03, bevel=0.004)
ridge_roof('hallroof', M['slate'], 0, 0, G + H, W + 0.04, D + 0.04, 0.3)
for k in range(9):
    x = -0.56 + k * 0.14
    pointed_arch(f'arcade{k}', M['window'], 0.04, 0.05, -D / 2 - 0.008, -D / 2 + 0.002, G, x)
for row, z in enumerate((0.19, 0.3)):
    for k in range(14):
        x = -0.6 + k * 0.0923
        if abs(x + 0.08) < 0.12:
            continue
        box(f'hallwin{row}_{k}', M['window'], x, -D / 2 - 0.004, G + z, 0.035, 0.01, 0.07, outline=0, bevel=0)
box('hallband', M['stoneDark'], 0, -D / 2 - 0.006, G + 0.155, W, 0.012, 0.018, outline=0, bevel=0)
for k in range(6):
    x = -0.52 + k * 0.21
    if abs(x + 0.08) < 0.15:
        continue
    box(f'dormer{k}', M['slate'], x, -0.06, G + H + 0.06, 0.07, 0.1, 0.07, outline=0.01, bevel=0)
    box(f'dormerwin{k}', M['window'], x, -0.112, G + H + 0.07, 0.035, 0.01, 0.045, outline=0, bevel=0)
    pyramid(f'dormerroof{k}', M['slate'], x, -0.06, G + H + 0.13, 0.08, 0.05, outline=0.008)
for side in (-1, 1):
    lathe(f'turret{side}', M['stone'], ((0.045, 0), (0.045, 0.32)), G + 0.2, side * (W / 2 - 0.01), -D / 2 + 0.01, segs=8, outline=0.012, smooth=False)
    lathe(f'turretspire{side}', M['slate'], ((0.05, 0), (0.004, 0.16)), G + 0.52, side * (W / 2 - 0.01), -D / 2 + 0.01, segs=8, outline=0.01,
          smooth=False)
# the tower: a square base rising through the roof, then open octagonal stages and the spire
TX, TY = -0.08, -D / 2 + 0.06
TB = H + 0.34
box('towerbase', M['stone'], TX, TY, G - 0.005, 0.22, 0.2, TB, outline=0.026, bevel=0.004)
pointed_arch('towerdoor', M['window'], 0.05, 0.07, TY - 0.108, TY - 0.098, G, TX)
for k, z in enumerate((0.48, 0.62)):
    pointed_arch(f'towerwin{k}', M['window'], 0.025, 0.05, TY - 0.108, TY - 0.098, G + z, TX)
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'pinnacle{sx}{sy}', M['stoneDark'], ((0.018, 0), (0.002, 0.1)), G + TB, TX + sx * 0.1, TY + sy * 0.09, segs=6, outline=0.006,
              smooth=False)
z = G + TB
for k, (r, h) in enumerate(((0.085, 0.2), (0.07, 0.18), (0.055, 0.14))):
    lathe(f'stage{k}', M['stone'], ((r, 0), (r, h)), z, TX, TY, segs=8, outline=0.016, smooth=False)
    for j in range(4):
        a = math.pi / 8 + j * math.pi / 2 - math.pi / 2
        box(f'stagewin{k}{j}', M['window'], TX + r * 0.93 * math.cos(a), TY + r * 0.93 * math.sin(a), z + h * 0.25, 0.022, 0.022, h * 0.55,
            rot_z=a, outline=0, bevel=0)
    lathe(f'stagerim{k}', M['stoneDark'], ((r + 0.012, 0), (r + 0.012, 0.02)), z + h - 0.005, TX, TY, segs=8, outline=0.008, smooth=False)
    z += h
lathe('spire', M['stone'], ((0.055, 0), (0.004, 0.4)), z, TX, TY, segs=8, outline=0.014, smooth=False)
rod('michaelpole', M['gold'], (TX, TY, z + 0.38), (TX, TY, z + 0.45), 0.006, segs=6, outline=0)
rod('michael', M['gold'], (TX, TY, z + 0.45), (TX, TY, z + 0.51), 0.014, r2=0.008, segs=8, outline=0.005)
ball('michaelhead', M['gold'], TX, TY, z + 0.525, 0.012, outline=0.004)
place(made, 0, 0, 0.72)


# ---------- the guild houses down both sides ----------
GABLES = {
    'stepped': lambda w: [(-w / 2, 0), (w / 2, 0), (w / 2, 0.05), (w / 3, 0.05), (w / 3, 0.11), (w / 6, 0.11), (w / 6, 0.17), (-w / 6, 0.17),
                          (-w / 6, 0.11), (-w / 3, 0.11), (-w / 3, 0.05), (-w / 2, 0.05)],
    'scroll': lambda w: [(-w / 2, 0), (w / 2, 0), (w / 2, 0.03), (w * 0.32, 0.07), (w * 0.24, 0.1), (w * 0.24, 0.15), (w * 0.12, 0.19), (0, 0.22),
                         (-w * 0.12, 0.19), (-w * 0.24, 0.15), (-w * 0.24, 0.1), (-w * 0.32, 0.07), (-w / 2, 0.03)],
    'bell': lambda w: bell_gable(w),
}


def bell_gable(w):
    """A bell-shaped gable: up the right side, the top, down the left side."""
    side = [(w / 2 * (1 - k / 8) ** 0.6, 0.2 * k / 8) for k in range(1, 8)]
    return [(-w / 2, 0), (w / 2, 0)] + side + [(0, 0.2)] + [(-x, z) for x, z in reversed(side)]


def house(name, x, w, h, mat, gable):
    """A guild house facing -Y with its front at y = -0.12, its gable above."""
    dd = 0.24
    box(f'{name}body', M[mat], x, 0, G - 0.005, w, dd, h, outline=0.022, bevel=0.003)
    pts = [(x + px, G + h + pz) for px, pz in GABLES[gable](w)]
    slab(f'{name}gable', M[mat], pts, -dd / 2, -dd / 2 + 0.04, outline=0.016)
    ridge_roof(f'{name}roof', M['roofTile'], x, 0.02, G + h, w - 0.01, dd - 0.04, 0.17, along_x=False)
    box(f'{name}gold', M['gold'], x, -dd / 2 - 0.004, G + h - 0.02, w - 0.02, 0.012, 0.014, outline=0, bevel=0)
    ball(f'{name}finial', M['gold'], x, -dd / 2 + 0.02, G + h + max(pz for _, pz in GABLES[gable](w)) + 0.02, 0.016, outline=0.004)
    cols = 3 if w > 0.21 else 2
    for row in range(3):
        for c in range(cols):
            wx = x - w / 2 + w * (c + 0.5) / cols
            z = 0.04 + row * (h - 0.08) / 3 + (0.03 if row else 0)
            box(f'{name}win{row}{c}', M['window'], wx, -dd / 2 - 0.004, G + z, 0.034, 0.01, 0.06 if row else 0.08, outline=0, bevel=0)
    box(f'{name}gablewin', M['window'], x, -dd / 2 - 0.004, G + h + 0.04, 0.03, 0.01, 0.05, outline=0, bevel=0)


ROWS = [('houseDark', 'scroll'), ('houseCream', 'stepped'), ('houseRed', 'bell'), ('houseOchre', 'scroll')]
for side, degrees, at in ((-1, 62, (-0.86, -0.12)), (1, -62, (0.86, -0.12))):
    made = set(bpy.data.objects)
    x = -0.46
    for k in range(4):
        mat, gable = ROWS[(k + (0 if side < 0 else 2)) % 4]
        w = (0.22, 0.2, 0.24, 0.21)[(k + (1 if side > 0 else 0)) % 4]
        h = (0.44, 0.5, 0.42, 0.48)[(k + (2 if side > 0 else 0)) % 4]
        house(f'house{side}_{k}', x + w / 2, w, h, mat, gable)
        x += w + 0.005
    place(made, degrees, *at)

# ---------- the flower carpet in the middle of the square ----------
COLOURS = ('red', 'yellow', 'orange', 'white', 'pink')
box('carpetedge', M['leaf'], 0, -0.25, G - 0.005, 0.98, 0.78, 0.03, outline=0.014, bevel=0)
for i in range(9):
    for j in range(7):
        ring = abs(i - 4) + abs(j - 3)
        box(f'carpet{i}{j}', M[COLOURS[ring % 5]], -0.4 + i * 0.1, -0.25 - 0.3 + j * 0.1, G + 0.022, 0.1, 0.1, 0.014, outline=0, bevel=0)

turn(everything, -32)
render(G)
