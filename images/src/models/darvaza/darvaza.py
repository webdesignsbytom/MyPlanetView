# A cartoon Darvaza gas crater for the country maps, built in the set's shared look (../toon.py) on
# a tile of Karakum sand: the wide round pit with its rocky walls glowing orange, flames burning all
# round its floor and up its sides, low dunes and saxaul shrubs about it, and a visitors' camp: a
# tent, a four-by-four and two people at the rim looking in. Turned a little towards the camera.
# Run: blender -b --factory-startup -P darvaza.py -- darvaza-1024.png 1024 darvaza.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *
import toon as toonkit  # for the outline material

setup()
M.update({
    'sand': toon('sand', '#e6c98a', shadow_mul=(0.84, 0.74, 0.62), lift=0.25),
    'dune': toon('dune', '#d9b672', shadow_mul=(0.84, 0.74, 0.62)),
    'rock': toon('rock', '#9a5a3a', shadow_mul=(0.8, 0.68, 0.66)),
    'glow': flat('glow', '#f08a3a'),
    'floor': flat('floor', '#e5462e'),
    'flameRed': flat('flameRed', '#ff6a2a'),
    'flameOrange': flat('flameOrange', '#ffa23a'),
    'flameYellow': flat('flameYellow', '#ffd84a'),
    'shrub': toon('shrub', '#8a9a6a', shadow_mul=(0.76, 0.8, 0.82)),
    'tent': toon('tent', '#3aa56b', shadow_mul=(0.7, 0.78, 0.8)),
    'jeep': toon('jeep', '#f2f0ea', shadow_mul=(0.8, 0.8, 0.9), lift=0.2),
    'tyre': toon('tyre', '#3a3a40'),
    'glass': flat('glass', '#3f4a5a'),
    'coat': toon('coat', '#3c6fc4', shadow_mul=(0.72, 0.72, 0.82)),
    'coat2': toon('coat2', '#c8402f'),
    'skin': toon('skin', '#e8b48f'),
})

G = tile(M['sand'])
before = set(bpy.data.objects)
rng = random.Random(137)

CX, CY = 0.05, 0.1
SIDES = 40


def ring(r, z, jitter=0.03):
    return [(CX + r * (1 + rng.uniform(-jitter, jitter)) * math.cos(2 * math.pi * k / SIDES),
             CY + r * 0.92 * (1 + rng.uniform(-jitter, jitter)) * math.sin(2 * math.pi * k / SIDES), G + z) for k in range(SIDES)]


# ---------- the crater: one bowl, sandy up to the rim, rocky walls down to the burning floor ----------
def bowl(name, rings, rock_from):
    """Rings from the outer foot over the rim to the floor; faces from ring `rock_from` on are rock."""
    bm = bmesh.new()
    verts = [[bm.verts.new(p) for p in r] for r in rings]
    for i in range(len(verts) - 1):
        for k in range(SIDES):
            f = bm.faces.new((verts[i][k], verts[i][(k + 1) % SIDES], verts[i + 1][(k + 1) % SIDES], verts[i + 1][k]))
            f.material_index = 1 if i >= rock_from else 0
    bm.faces.new(list(reversed(verts[0])))
    bm.faces.new(verts[-1]).material_index = 1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for mat in (M['sand'], M['rock'], toonkit.OUTLINE, toonkit.OUTLINE):
        me.materials.append(mat)
    o = ob.modifiers.new('outline', 'SOLIDIFY')
    o.thickness, o.offset, o.use_flip_normals, o.use_rim, o.material_offset = 0.028, 1.0, True, False, 2
    ob.visible_shadow = False
    return ob


bowl('crater', [ring(1.05, -0.01, 0.02), ring(0.88, 0.14, 0.04), ring(0.76, 0.26, 0.04), ring(0.7, 0.24, 0.03), ring(0.64, 0.14, 0.05),
                ring(0.58, 0.012, 0.03)], rock_from=2)
glowband = loft('glowband', M['glow'], [ring(0.6, 0.012, 0.0), ring(0.625, 0.07, 0.03)], outline=0)
cyl('floor', M['floor'], 0.59, 0.01, segs=SIDES, outline=0, matrix=Matrix.Translation((CX, CY, G + 0.012)) @ Matrix.Scale(0.92, 4, (0, 1, 0)))


def flame(name, x, y, z, h, r):
    mat = rng.choice(('flameRed', 'flameOrange', 'flameYellow'))
    rod(name, M[mat], (x, y, z), (x + rng.uniform(-0.01, 0.01), y + rng.uniform(-0.01, 0.01), z + h), r, r2=0.0, segs=8, outline=0.006)


# flames all round the foot of the walls, a few up the walls and out on the floor
for k in range(30):
    a = 2 * math.pi * k / 30 + rng.uniform(-0.05, 0.05)
    r = rng.uniform(0.5, 0.57)
    flame(f'flame{k}', CX + r * math.cos(a), CY + r * 0.92 * math.sin(a), G + 0.012, rng.uniform(0.12, 0.28), rng.uniform(0.035, 0.055))
for k in range(12):
    a = 2 * math.pi * k / 12 + 0.2
    flame(f'wallflame{k}', CX + 0.62 * math.cos(a), CY + 0.62 * 0.92 * math.sin(a), G + 0.08, rng.uniform(0.06, 0.12), 0.026)
for k in range(10):
    a = rng.uniform(0, 2 * math.pi)
    r = rng.uniform(0.05, 0.42)
    flame(f'floorflame{k}', CX + r * math.cos(a), CY + r * 0.92 * math.sin(a), G + 0.012, rng.uniform(0.07, 0.16), rng.uniform(0.03, 0.045))

# ---------- dunes and saxaul shrubs ----------
for k, (x, y, r) in enumerate(((-0.9, 0.7, 0.24), (0.7, 0.95, 0.22), (1.0, -0.25, 0.2), (-1.05, -0.3, 0.18))):
    d = ball(f'dune{k}', M['dune'], 0, 0, 0, r, outline=0.02)
    d.scale = (1.2, 0.8, 0.35)
    d.location = (x, y, G - 0.01)
    d.visible_shadow = False
for k, (x, y) in enumerate(((-0.75, -0.85), (0.95, -0.7), (-1.2, 0.3), (0.55, 1.15), (-0.4, 1.2), (1.25, 0.35))):
    for j in range(3):
        ball(f'shrub{k}{j}', M['shrub'], x + rng.uniform(-0.04, 0.04), y + rng.uniform(-0.04, 0.04), G + 0.04, rng.uniform(0.04, 0.06), outline=0.01)

# ---------- the visitors' camp: a tent, a four-by-four, two people at the rim ----------
TX, TY = -0.55, -1.0
loft('tent', M['tent'], [[(TX - 0.12, TY - 0.09, G), (TX + 0.12, TY - 0.09, G), (TX + 0.12, TY + 0.09, G), (TX - 0.12, TY + 0.09, G)],
                         [(TX - 0.12, TY - 0.004, G + 0.13), (TX + 0.12, TY - 0.004, G + 0.13), (TX + 0.12, TY + 0.004, G + 0.13),
                          (TX - 0.12, TY + 0.004, G + 0.13)]], outline=0.012)
JX, JY = 0.45, -1.0
box('jeep', M['jeep'], JX, JY, G + 0.04, 0.26, 0.13, 0.07, rot_z=0.3, outline=0.012, bevel=0.01)
box('jeeptop', M['jeep'], JX - 0.02, JY - 0.006, G + 0.11, 0.16, 0.12, 0.06, rot_z=0.3, outline=0.01, bevel=0.01)
box('jeepglass', M['glass'], JX + 0.055, JY + 0.017, G + 0.12, 0.012, 0.11, 0.04, rot_z=0.3, outline=0, bevel=0)
for sx in (-1, 1):
    for sy in (-1, 1):
        lx, ly = sx * 0.08, sy * 0.065
        x = JX + lx * math.cos(0.3) - ly * math.sin(0.3)
        y = JY + lx * math.sin(0.3) + ly * math.cos(0.3)
        cyl(f'tyre{sx}{sy}', M['tyre'], 0.035, 0.03, segs=16, outline=0.006,
            matrix=Matrix.Translation((x, y, G + 0.035)) @ Matrix.Rotation(0.3, 4, 'Z') @ Matrix.Rotation(math.pi / 2, 4, 'X'))
for k, (a, coat) in enumerate(((-1.75, 'coat'), (-1.6, 'coat2'))):
    x, y = CX + 0.82 * math.cos(a), CY + 0.82 * 0.92 * math.sin(a)
    z = G + 0.2
    rod(f'person{k}', M[coat], (x, y, z), (x, y, z + 0.08), 0.022, r2=0.018, segs=8, outline=0.006)
    ball(f'head{k}', M['skin'], x, y, z + 0.1, 0.02, outline=0.005)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
