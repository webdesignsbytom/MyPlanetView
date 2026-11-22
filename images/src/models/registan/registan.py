# A cartoon Registan for the country maps, built in the set's shared look (../toon.py) on a tile of
# paving: Samarkand's square framed on three sides by its madrasas: Ulugh Beg's on the left,
# Sher-Dor's on the right with its two ribbed turquoise domes and the suns on its portal, and
# Tilya-Kori's across the back with its great blue dome. Each has its huge tiled portal round a
# pointed arch, arched niches along the walls and a minaret at each front corner.
# Run: blender -b --factory-startup -P registan.py -- registan-1024.png 1024 registan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *
import toon as toonkit  # for the outline material

setup()
M.update({
    'paving': toon('paving', '#e3d3b0', lift=0.25),
    'brick': toon('brick', '#d9b17a', shadow_mul=(0.82, 0.72, 0.72)),
    'tile': toon('tile', '#2f6fb8', shadow_mul=(0.72, 0.74, 0.86)),
    'recess': flat('recess', '#1d2c57'),
    'turq': toon('turq', '#3fbcc4', shadow_mul=(0.72, 0.84, 0.88), lift=0.3),
    'turqDark': toon('turqDark', '#2c9aa6', shadow_mul=(0.72, 0.84, 0.88), lift=0.3),
    'blueDome': toon('blueDome', '#3a7fd0', shadow_mul=(0.72, 0.74, 0.86), lift=0.3),
    'blueDomeDark': toon('blueDomeDark', '#2b62ad', shadow_mul=(0.72, 0.74, 0.86), lift=0.3),
    'sun': flat('sun', '#f2a33a'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'trunk': toon('trunk', '#7a5238'),
})

G = tile(M['paving'])


def place(before, degrees, x, y):
    """Turns what was made since `before` (built facing -Y at the origin) and moves it to (x, y)."""
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
    for ob in set(bpy.data.objects) - before:
        ob.matrix_world = m @ ob.matrix_world


def ribbed(name, a, b, x, y, z0, profile, ribs=16):
    """A melon dome: a lathe whose segments take the two materials in turn."""
    n = ribs * 2
    bm = bmesh.new()
    rings = [[bm.verts.new((x + r * math.cos(2 * math.pi * k / n), y + r * math.sin(2 * math.pi * k / n), z0 + h)) for k in range(n)]
             for r, h in profile]
    for i in range(len(rings) - 1):
        for k in range(n):
            f = bm.faces.new((rings[i][k], rings[i][(k + 1) % n], rings[i + 1][(k + 1) % n], rings[i + 1][k]))
            f.material_index = k % 2
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for mat in (a, b, toonkit.OUTLINE, toonkit.OUTLINE):
        me.materials.append(mat)
    o = ob.modifiers.new('outline', 'SOLIDIFY')
    o.thickness, o.offset, o.use_flip_normals, o.use_rim, o.material_offset = 0.02, 1.0, True, False, 2
    return ob


def pointed_arch(name, mat, a, h1, y0, y1, z0=G, x=0.0):
    """A pointed (equilateral) arch, span 2a, springing at h1, as a thin slab from y0 to y1."""
    left = [(x + a + 2 * a * math.cos(t), z0 + h1 + 2 * a * math.sin(t)) for t in (math.pi - (math.pi / 3) * k / 6 for k in range(7))]
    # along the foot, up the right side to the apex, down the left side
    pts = [(x - a, z0), (x + a, z0)] + [(2 * x - px, pz) for px, pz in left] + list(reversed(left))[1:]
    loft(name, mat, [[(px, y0, pz) for px, pz in pts], [(px, y1, pz) for px, pz in pts]], outline=0)


def minaret(name, x, y, h):
    lathe(name, M['brick'], ((0.05, 0), (0.042, h)), G - 0.005, x, y, segs=16, outline=0.016)
    for k, z in enumerate((h * 0.35, h * 0.62, h * 0.86)):
        lathe(f'{name}band{k}', M['tile'], ((0.05 - 0.008 * z / h + 0.006, 0), (0.05 - 0.008 * z / h + 0.006, 0.035)), G + z, x, y, segs=16,
              outline=0.008)
    lathe(f'{name}lantern', M['tile'], ((0.058, 0), (0.058, 0.05)), G + h, x, y, segs=16, outline=0.012)
    lathe(f'{name}cap', M['turq'], ((0.06, 0), (0.05, 0.03), (0.02, 0.06), (0.003, 0.08)), G + h + 0.05, x, y, segs=16, outline=0.012)


def madrasa(name, W, D, H, PW, PH, domes=(), dome_mats=('turq', 'turqDark'), suns=False, minaret_h=0.72):
    """A madrasa facing -Y at the origin: its body, the tiled portal and pointed arch, niches, minarets, domes."""
    box(f'{name}body', M['brick'], 0, 0, G - 0.005, W, D, H, outline=0.026, bevel=0.004)
    box(f'{name}band', M['tile'], 0, -D / 2 - 0.004, G + H - 0.055, W - 0.06, 0.012, 0.04, outline=0, bevel=0)
    # arched niches, two rows along the front either side of the portal
    count = max(1, int((W / 2 - PW / 2 - 0.06) / 0.09))
    for side in (-1, 1):
        for c in range(count):
            nx = side * (PW / 2 + 0.06 + c * 0.09)
            for r, nz in enumerate((0.03, 0.15)):
                pointed_arch(f'{name}niche{side}{c}{r}', M['recess'], 0.025, 0.04, -D / 2 - 0.008, -D / 2 + 0.002, z0=G + nz, x=nx)
    # the portal: brick frame, tiled panel, the great pointed arch and a door in it
    yf = -D / 2 - 0.1
    box(f'{name}portal', M['brick'], 0, -D / 2 - 0.04, G - 0.005, PW, 0.12, PH, outline=0.026, bevel=0.004)
    box(f'{name}panel', M['tile'], 0, yf - 0.004, G + 0.02, PW - 0.06, 0.01, PH - 0.06, outline=0, bevel=0)
    a = PW * 0.3
    pointed_arch(f'{name}arch', M['recess'], a, PH * 0.45, yf - 0.014, yf - 0.006, z0=G + 0.02)
    box(f'{name}door', M['brick'], 0, yf - 0.016, G, a * 0.9, 0.01, PH * 0.3, outline=0, bevel=0)
    if suns:
        for side in (-1, 1):
            cyl(f'{name}sun{side}', M['sun'], 0.032, 0.012, segs=20, outline=0,
                matrix=Matrix.Translation((side * (a + 0.035), yf - 0.012, G + PH - 0.1)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    for side in (-1, 1):
        minaret(f'{name}minaret{side}', side * (W / 2 - 0.01), -D / 2 + 0.01, minaret_h)
    for k, (dx, dy, s) in enumerate(domes):
        lathe(f'{name}drum{k}', M['tile'], ((0.13 * s, 0), (0.13 * s, 0.1 * s)), G + H, dx, dy, segs=24, outline=0.016)
        ribbed(f'{name}dome{k}', M[dome_mats[0]], M[dome_mats[1]], dx, dy, G + H + 0.1 * s,
               [(r * s, h * s) for r, h in ((0.13, 0), (0.16, 0.06), (0.16, 0.13), (0.13, 0.22), (0.07, 0.29), (0.005, 0.32))])
        rod(f'{name}finial{k}', M['sun'], (dx, dy, G + H + 0.42 * s), (dx, dy, G + H + 0.5 * s), 0.008, segs=6, outline=0.004)


everything = set(bpy.data.objects)
# The side madrasas face each other across the square; here they're splayed a little towards the
# open side, and the square turned to the camera, so all three portals show.

# ---------- Ulugh Beg's on the left ----------
b = set(bpy.data.objects)
madrasa('ulughbeg', 0.96, 0.48, 0.38, 0.46, 0.84, minaret_h=0.95)
place(b, 62, -0.82, 0.02)

# ---------- Sher-Dor's on the right, with its two ribbed domes and the suns ----------
b = set(bpy.data.objects)
madrasa('sherdor', 0.96, 0.48, 0.38, 0.46, 0.84, domes=((-0.33, 0.06, 0.95), (0.33, 0.06, 0.95)), suns=True, minaret_h=0.95)
place(b, -62, 0.82, 0.02)

# ---------- Tilya-Kori's across the back, its great blue dome to one side ----------
b = set(bpy.data.objects)
madrasa('tilyakori', 1.0, 0.46, 0.34, 0.44, 0.72, domes=((-0.28, 0.04, 1.3),), dome_mats=('blueDome', 'blueDomeDark'), minaret_h=0.62)
place(b, 0, 0.0, 0.86)

# ---------- trees at the front ----------
for k, (x, y) in enumerate(((-0.55, -1.0), (0.55, -1.0), (-1.05, -0.62), (1.05, -0.62))):
    rod(f'trunk{k}', M['trunk'], (x, y, G), (x, y, G + 0.12), 0.02, segs=8, outline=0.01)
    ball(f'tree{k}', M['tree'], x, y, G + 0.22, 0.12, outline=0.02)

turn(everything, -32)
render(G)
