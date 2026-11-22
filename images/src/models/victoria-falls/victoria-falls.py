# A cartoon Victoria Falls for the country maps, built in the set's shared look (../toon.py):
# the Zambezi running wide across its plateau to the cliff's edge, the white curtain of water
# falling the full width of the cliff into the gorge, the spray rising and a rainbow to one
# side. Turned a little towards the camera, so the cliff shows its depth.
# Run: blender -b --factory-startup -P victoria-falls.py -- victoria-falls-1024.png 1024 victoria-falls.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *
import toon as toonkit  # for the outline material

setup()
M.update({
    'cliff': toon('cliff', '#7c6a5a', shadow_mul=(0.76, 0.72, 0.8)),
    'river': toon('river', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'gorge': toon('gorge', '#2f7f8f', shadow_mul=(0.75, 0.82, 0.9), lift=0.3),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
    'foamBlue': toon('foamBlue', '#bfe3f5', shadow_mul=(0.82, 0.86, 0.95), lift=0.15),
    'forest': toon('forest', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'red': toon('red', '#e0453a'), 'orange': toon('orange', '#f0883a'), 'yellow': toon('yellow', '#f4c83c'),
    'green': toon('green', '#5cc08a'), 'blue': toon('blue', '#5b9be0'),
})

G = tile()
before = set(bpy.data.objects)
R = 1.42
EDGE, PLATEAU = 0.0, 0.58      # the cliff's edge (y) and the plateau's height above the gorge


def half_disc(y0, back=True, n=40):
    """The tile's area behind (back) or in front of the line y = y0."""
    a0 = math.asin(abs(y0) / R) * (1 if y0 >= 0 else -1)
    if back:
        return [(R * math.cos(a), R * math.sin(a)) for a in (a0 + (math.pi - 2 * a0) * k / n for k in range(n + 1))]
    return [(R * math.cos(a), R * math.sin(a)) for a in (math.pi - a0 + (math.pi + 2 * a0) * k / n for k in range(n + 1))]


# ---------- the plateau behind, its cliff face to the front ----------
plateau = half_disc(EDGE)
loft('plateau', M['cliff'], [[(x, y, G - 0.01) for x, y in plateau], [(x, y, G + PLATEAU) for x, y in plateau]], outline=0.035)
# its forested banks and the river across it
bm = bmesh.new()
bm.faces.new([bm.verts.new((x, y, G + PLATEAU + 0.003)) for x, y in plateau])
finish('banks', bm, M['forest'], outline=0)
river = [(-1.25, EDGE + 0.001), (1.25, EDGE + 0.001), (0.9, 0.7), (0.4, 1.3), (-0.4, 1.3), (-0.9, 0.7)]
bm = bmesh.new()
bm.faces.new([bm.verts.new((x, y, G + PLATEAU + 0.006)) for x, y in river])
finish('river', bm, M['river'], outline=0.012)

# ---------- the falls: sheets of water pouring over the lip, split by two islands ----------
rng = random.Random(2)
# the sheet's section (y, z above the gorge): over the lip, bulging out a little, then down
SECTION = ((0.06, PLATEAU + 0.008), (0.0, PLATEAU + 0.012), (-0.045, PLATEAU - 0.03), (-0.06, PLATEAU - 0.15),
           (-0.065, PLATEAU * 0.45), (-0.07, 0.01))


def curtain(name, x0, x1):
    """One sheet of falling water from x0 to x1, in streaks of white and pale blue, outlined
    only round its edge."""
    xs, x = [x0], x0
    while x < x1:
        x = min(x1, x + rng.uniform(0.035, 0.08))
        xs.append(x)
    bm = bmesh.new()
    grid = [[bm.verts.new((xx, EDGE + y, G + z)) for (y, z) in SECTION] for xx in xs]
    for i in range(len(xs) - 1):
        for j in range(len(SECTION) - 1):
            f = bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
            f.material_index = i % 2
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.015)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for mat in (M['foam'], M['foamBlue'], toonkit.OUTLINE, toonkit.OUTLINE):
        me.materials.append(mat)
    o = ob.modifiers.new('outline', 'SOLIDIFY')
    o.thickness, o.offset, o.use_flip_normals, o.use_rim, o.material_offset = 0.02, 1.0, True, False, 2


ISLANDS = (-0.62, 0.42)
for k, (x0, x1) in enumerate(((-1.24, ISLANDS[0] - 0.1), (ISLANDS[0] + 0.1, ISLANDS[1] - 0.1), (ISLANDS[1] + 0.1, 1.24))):
    curtain(f'falls{k}', x0, x1)
for k, x in enumerate(ISLANDS):
    isle = ball(f'island{k}', M['forest'], x, EDGE + 0.12, G + PLATEAU, 0.13, outline=0.02)
    isle.scale = (1, 1, 0.35)
    isle.location = (0, 0, (G + PLATEAU) * (1 - 0.35))
    ball(f'islandtree{k}', M['forest'], x + 0.02, EDGE + 0.14, G + PLATEAU + 0.08, 0.06, outline=0.016)
# trees on the banks
for k, (x, y) in enumerate(((-1.12, 0.45), (1.1, 0.5), (-0.95, 0.9), (0.9, 0.95), (0.0, 1.3))):
    ball(f'banktree{k}', M['forest'], x, y, G + PLATEAU + 0.08, 0.1, outline=0.02)

# ---------- the gorge: churning water to the front of the tile ----------
FAR = -0.45   # where the spray hangs
bm = bmesh.new()
bm.faces.new([bm.verts.new((x, y, G + 0.004)) for x, y in half_disc(EDGE - 0.001, back=False)])
finish('gorge', bm, M['gorge'], outline=0)

# ---------- the spray rising, and the rainbow over it ----------
for k, (x, dz, r) in enumerate(((-1.0, 0.03, 0.09), (-0.78, 0.06, 0.1), (-0.3, 0.03, 0.1), (-0.05, 0.07, 0.11), (0.2, 0.03, 0.09),
                                (0.72, 0.06, 0.1), (0.98, 0.03, 0.08))):
    ball(f'spray{k}', M['foam'], x, EDGE - 0.15, G + dz, r, outline=0.018)
CX, CZ, RAD = 0.55, G + 0.12, 0.4
for j, colour in enumerate(('red', 'orange', 'yellow', 'green', 'blue')):
    rr = RAD - j * 0.035
    pts = [Vector((CX + rr * math.cos(math.pi * i / 16), EDGE - 0.3, CZ + rr * math.sin(math.pi * i / 16)))
           for i in range(17)]
    for i in range(16):
        rod(f'rainbow{j}{i}', M[colour], pts[i], pts[i + 1], 0.019, segs=6, outline=0)

turn(before, -16)
render(G)
