# A cartoon Saint Basil's Cathedral for the country maps, built in the set's shared look
# (../toon.py): the red brick church on its plinth, the central tower with its tall tent roof
# and little gold dome, and round it four big and four small towers, each crowned with an
# onion dome in spiral stripes of two colours, every one with a gold cross.
# Run: blender -b --factory-startup -P saint-basils.py -- saint-basils-1024.png 1024 saint-basils.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *
import toon as toonkit  # for the outline material

setup()
M.update({
    'brick': toon('brick', '#b8473a'),
    'trim': toon('trim', '#f1ece0', shadow_mul=(0.85, 0.82, 0.88)),
    'green': toon('green', '#3aa56b', shadow_mul=(0.7, 0.78, 0.8)),
    'white': toon('white', '#f4f1ea', shadow_mul=(0.82, 0.82, 0.92)),
    'blue': toon('blue', '#3c6fc4', shadow_mul=(0.72, 0.72, 0.82)),
    'red': toon('red', '#d8463a'),
    'yellow': toon('yellow', '#f2c84a', shadow_mul=(0.8, 0.68, 0.55)),
    'tent': toon('tent', '#4f9a6c', shadow_mul=(0.7, 0.78, 0.8)),
    'window': flat('window', '#4b3a55'),
})

G = tile()
ONION = ((0.11, 0.0), (0.15, 0.06), (0.17, 0.13), (0.155, 0.2), (0.115, 0.26), (0.065, 0.31), (0.025, 0.35), (0.004, 0.38))


def striped_onion(name, a, b, x, y, z0, scale, stripes=10, twist=0.55):
    """An onion dome in spiral stripes: its faces alternate between materials a and b, on
    rings that twist a little more at every step up."""
    n = 40
    bm = bmesh.new()
    rings = [[bm.verts.new((x + r * scale * math.cos(2 * math.pi * k / n + twist * i),
                            y + r * scale * math.sin(2 * math.pi * k / n + twist * i), z0 + z * scale))
              for k in range(n)] for i, (r, z) in enumerate(ONION)]
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
    for p in me.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for mat in (a, b, toonkit.OUTLINE, toonkit.OUTLINE):
        me.materials.append(mat)
    s = ob.modifiers.new('outline', 'SOLIDIFY')
    s.thickness, s.offset, s.use_flip_normals, s.use_rim, s.material_offset = 0.03 * scale, 1.0, True, False, 2
    top = z0 + ONION[-1][1] * scale
    rod(name + 'cross', M['gold'], (x, y, top - 0.01), (x, y, top + 0.11 * scale + 0.03), 0.01, segs=6, outline=0.01)
    rod(name + 'crossbar', M['gold'], (x - 0.035, y, top + 0.07 * scale + 0.02), (x + 0.035, y, top + 0.07 * scale + 0.02),
        0.009, segs=6, outline=0.01)


def tower(name, x, y, r, h, z0):
    """An octagonal brick drum with white bands and a dark window towards the camera."""
    lathe(name, M['brick'], ((r, 0), (r, h)), z0, x, y, segs=8, outline=0.03, smooth=False)
    for f in (0.35, 0.98):
        lathe(f'{name}band{f}', M['trim'], ((r + 0.012, 0), (r + 0.012, 0.035)), z0 + f * h - 0.035, x, y, segs=8,
              outline=0.012, smooth=False)
    cam = Vector((-math.sin(math.radians(32)), -math.cos(math.radians(32)), 0)) * (r + 0.006)
    box(f'{name}win', M['window'], x + cam.x, y + cam.y, z0 + 0.5 * h, 0.05, 0.02, 0.1, rot_z=math.radians(-32),
        outline=0, bevel=0)
    return z0 + h


# ---------- the plinth ----------
box('plinth', M['brick'], 0, 0, G, 1.42, 1.42, 0.1, outline=0.035, bevel=0.01)
box('plinthband', M['trim'], 0, 0, G + 0.1, 1.44, 1.44, 0.03, outline=0.02, bevel=0)
P = G + 0.13

# ---------- the central tower: a tall tent roof with a little gold dome ----------
top = tower('central', 0, 0, 0.21, 0.72, P)
lathe('tentroof', M['tent'], ((0.235, 0), (0.035, 0.58)), top, segs=8, outline=0.035, smooth=False)
striped_onion('centraldome', M['yellow'], M['yellow'], 0, 0, top + 0.54, 0.42)

# ---------- four big towers and four small ones, each with its striped onion ----------
for k, ((x, y), (a, b)) in enumerate(zip(((0, -0.43), (-0.43, 0), (0.43, 0), (0, 0.43)),
                                        (('green', 'white'), ('red', 'yellow'), ('blue', 'white'), ('green', 'yellow')))):
    top = tower(f'big{k}', x, y, 0.13, 0.5, P)
    striped_onion(f'bigdome{k}', M[a], M[b], x, y, top - 0.01, 1.0)
for k, ((x, y), (a, b)) in enumerate(zip(((-0.35, -0.35), (0.35, -0.35), (-0.35, 0.35), (0.35, 0.35)),
                                        (('red', 'white'), ('yellow', 'green'), ('blue', 'yellow'), ('green', 'red')))):
    top = tower(f'small{k}', x, y, 0.1, 0.36, P)
    striped_onion(f'smalldome{k}', M[a], M[b], x, y, top - 0.01, 0.72)

render(G)
