# Cartoon Tivoli Gardens for the country maps, built in the set's shared look (../toon.py): the
# old pleasure garden in Copenhagen: the Chinese pagoda by the lake, a carousel under its striped
# canopy, the tall Star Flyer with its swings, the Nimb palace's white domes behind, and strings of
# coloured lights between their poles. Turned a little towards the camera.
# Run: blender -b --factory-startup -P tivoli.py -- tivoli-1024.png 1024 tivoli.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *
import toon as toonkit  # for the outline material

setup()
M.update({
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'pagodaRed': toon('pagodaRed', '#c8402f'),
    'pagodaRoof': toon('pagodaRoof', '#2f8a6a', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f6f3ec', shadow_mul=(0.82, 0.82, 0.92), lift=0.2),
    'red': toon('red', '#e0453a'),
    'yellow': toon('yellow', '#f4c83c', shadow_mul=(0.8, 0.68, 0.55)),
    'blue': toon('blue', '#3c6fc4', shadow_mul=(0.72, 0.72, 0.82)),
    'green': toon('green', '#3aa56b', shadow_mul=(0.7, 0.78, 0.8)),
    'steel': toon('steel', '#b7bcc4', shadow_mul=(0.78, 0.78, 0.88)),
    'wood': toon('wood', '#8a5a3c'),
    'tree': toon('tree', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
})

G = tile()
before = set(bpy.data.objects)

# ---------- the lake ----------
LAKE = [(-1.25, -0.25), (-0.55, -0.5), (-0.05, -0.9), (-0.45, -1.25), (-1.0, -0.95), (-1.32, -0.55)]
bm = bmesh.new()
face = bm.faces.new([bm.verts.new((x, y, G + 0.004)) for x, y in LAKE])
bmesh.ops.triangulate(bm, faces=[face])
finish('lake', bm, M['water'], outline=0.012)

# ---------- the Chinese pagoda by the lake ----------
PX, PY = -0.55, -0.25
z = G
for k in range(4):
    w = 0.2 - k * 0.03
    box(f'pagoda{k}', M['pagodaRed'], PX, PY, z, w, w, 0.12, outline=0.016, bevel=0.004)
    z += 0.12
    pyramid(f'pagodaroof{k}', M['pagodaRoof'], PX, PY, z - 0.012, w + 0.12, 0.06, outline=0.014)
    z += 0.025
rod('pagodaspire', M['yellow'], (PX, PY, z), (PX, PY, z + 0.12), 0.01, segs=6, outline=0.006)


# ---------- the carousel under its striped canopy ----------
def striped(name, a, b, x, y, z0, profile, stripes=12):
    n = 36
    bm = bmesh.new()
    rings = [[bm.verts.new((x + r * math.cos(2 * math.pi * k / n), y + r * math.sin(2 * math.pi * k / n), z0 + h))
              for k in range(n)] for r, h in profile]
    for i in range(len(rings) - 1):
        for k in range(n):
            f = bm.faces.new((rings[i][k], rings[i][(k + 1) % n], rings[i + 1][(k + 1) % n], rings[i + 1][k]))
            f.material_index = (k * stripes // n) % 2
    bm.faces.new(list(reversed(rings[0])))
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for mat in (a, b, toonkit.OUTLINE, toonkit.OUTLINE):
        me.materials.append(mat)
    o = ob.modifiers.new('outline', 'SOLIDIFY')
    o.thickness, o.offset, o.use_flip_normals, o.use_rim, o.material_offset = 0.02, 1.0, True, False, 2


KX, KY = 0.2, -0.35
lathe('carouselbase', M['white'], ((0.3, 0), (0.3, 0.05)), G - 0.005, KX, KY, segs=32, outline=0.02)
for k in range(10):
    a = 2 * math.pi * k / 10
    x, y = KX + 0.25 * math.cos(a), KY + 0.25 * math.sin(a)
    rod(f'carouselpole{k}', M['yellow'], (x, y, G + 0.05), (x, y, G + 0.26), 0.008, segs=6, outline=0)
    ball(f'horse{k}', M['white'] if k % 2 else M['red'], x, y, G + 0.12 + 0.03 * (k % 2), 0.03, outline=0.008)
lathe('carouselcore', M['blue'], ((0.08, 0), (0.08, 0.22)), G + 0.05, KX, KY, segs=16, outline=0.012)
striped('canopy', M['red'], M['white'], KX, KY, G + 0.25, ((0.32, 0), (0.3, 0.04), (0.15, 0.13), (0.02, 0.2)))
rod('carouselflag', M['yellow'], (KX, KY, G + 0.44), (KX, KY, G + 0.54), 0.006, segs=6, outline=0.004)

# ---------- the Star Flyer: a tall tower with swings on chains ----------
SX, SY, SH = 0.72, 0.3, 1.25
lathe('flyertower', M['steel'], ((0.05, 0), (0.035, SH)), G - 0.005, SX, SY, segs=12, outline=0.018)
lathe('flyertop', M['yellow'], ((0.2, 0), (0.18, 0.04), (0.05, 0.1)), G + SH - 0.32, SX, SY, segs=24, outline=0.016)
for k in range(10):
    a = 2 * math.pi * k / 10
    top = Vector((SX + 0.19 * math.cos(a), SY + 0.19 * math.sin(a), G + SH - 0.32))
    seat = Vector((SX + 0.34 * math.cos(a), SY + 0.34 * math.sin(a), G + SH - 0.62))
    rod(f'chain{k}', M['steel'], top, seat, 0.004, segs=4, outline=0)
    box(f'seat{k}', M[('red', 'blue', 'yellow', 'green')[k % 4]], seat.x, seat.y, seat.z - 0.03, 0.04, 0.04, 0.03, outline=0.006,
        bevel=0)
ball('flyerlight', M['red'], SX, SY, G + SH, 0.03, outline=0.008)

# ---------- the Nimb palace's white domes behind ----------
NX, NY = -0.25, 0.75
box('nimb', M['white'], NX, NY, G - 0.005, 0.7, 0.26, 0.3, outline=0.03, bevel=0.005)
for k, (dx, r) in enumerate(((-0.28, 0.06), (0.0, 0.1), (0.28, 0.06))):
    lathe(f'nimbdrum{k}', M['white'], ((r, 0), (r, 0.08)), G + 0.3, NX + dx, NY, segs=16, outline=0.014)
    lathe(f'nimbdome{k}', M['white'], ((r * 1.05, 0), (r * 1.25, 0.05), (r * 1.1, 0.1), (r * 0.5, 0.15), (0.004, 0.2)), G + 0.38,
          NX + dx, NY, segs=20, outline=0.016)
    ball(f'nimbtip{k}', M['yellow'], NX + dx, NY, G + 0.59, 0.02, outline=0.006)
for k in range(6):
    cyl(f'nimbwin{k}', M['blue'], 0.025, 0.02, segs=12, outline=0,
        matrix=Matrix.Translation((NX - 0.25 + k * 0.1, NY - 0.135, G + 0.17)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))

# ---------- strings of coloured lights between poles ----------
POLES = [(-0.95, 0.35), (-0.45, 0.2), (0.05, 0.25), (0.45, -0.05), (0.95, -0.25)]
for k, (x, y) in enumerate(POLES):
    rod(f'lightpole{k}', M['wood'], (x, y, G), (x, y, G + 0.32), 0.01, segs=6, outline=0.006)
COLOURS = ('red', 'yellow', 'blue', 'green', 'white')
for k, ((x0, y0), (x1, y1)) in enumerate(zip(POLES, POLES[1:])):
    for i in range(1, 8):
        t = i / 8
        x, y = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
        z = G + 0.32 - 0.07 * math.sin(math.pi * t)
        ball(f'bulb{k}{i}', M[COLOURS[(k + i) % 5]], x, y, z, 0.018, outline=0)

# ---------- trees ----------
for k, (x, y) in enumerate(((-1.05, 0.7), (0.6, 0.9), (1.1, 0.5), (-0.15, -0.95))):
    ball(f'tree{k}', M['tree'], x, y, G + 0.15, 0.13, outline=0.02)

turn(before, -20)
render(G)
