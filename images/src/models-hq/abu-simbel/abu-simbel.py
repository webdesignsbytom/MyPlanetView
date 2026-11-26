# Abu Simbel in the high-quality look (hq.py): Ramesses II's Great Temple cut into its sandstone hill:
# the four seated colossi of the king either side of the doorway, the second from the left broken, its
# head and shoulders lying at its feet (each colossus the scanned seated statue of a Ramesside king in
# _sources/ramesses-seated/, Abby Gancz, CC BY 4.0, given the diorama's sandstone); the sloping front
# like a pylon, Ra-Horakhty's niche over the door, the band of cartouches and the frieze of baboons
# along the top; the hill rising behind and round it, the sand of the forecourt, the shore of Lake
# Nasser in front, and people.
# Run: blender -b --factory-startup -P abu-simbel.py -- abu-simbel-1024.png 1024 abu-simbel.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup(top='sand')
rng = random.Random(1264)
M['nubian'] = material('nubianSandstone', '#d49b63', 0.8, vary='#c18954', vary_scale=9, bump=0.3, bump_scale=110)
M['facade'] = layered('facadeSandstone', ['#cf935b', '#d9a46c', '#c88c55', '#d49c64'], scale=9.0, distortion=1.5, rough=0.85, bump=0.25, bump_scale=90)
M['hill'] = layered('hillSandstone', ['#c98d58', '#d8a46d', '#bf8450', '#d29a63'], scale=14.0, distortion=3.0, rough=0.85, bump=0.35, bump_scale=80)
M['desert'] = material('desertSand', '#e3c08a', 0.9, vary='#d6b07a', vary_scale=4, bump=0.2, bump_scale=260)
M['nasser'] = material('lakeNasser', '#2f86b0', 0.06, vary='#3a95bd', vary_scale=3, coat=0.6, bump=0.1, bump_scale=40)
M['doorDark'] = material('doorDark', '#4a3524', 0.9)

FY = 0.12               # the front's face
FW, FH = 1.98, 1.42     # its width at the foot and its height
ZF = G + 0.006          # the forecourt's top

# ------------------------------------------------------------------ the hill, the forecourt and the lake
def hill(x, y):
    """Behind the front, a sandstone hill as high as the front, rounding down to the sides and back."""
    if y < FY + 0.03:
        return 0.0
    across = max(0.0, abs(x) - FW / 2 + 0.25)
    back = max(0.0, y - (FY + 0.3))
    d = math.hypot(across / 0.75, back / 1.0)
    return (FH + 0.03) * max(0.0, 1.0 - d * d) ** 1.1 * min(1.0, (y - FY - 0.03) / 0.06)


terrain('hill', hill, [M['desert'], M['hill']], lambda z, nz, x, y: 0 if z < 0.02 else 1, rings=90, segs=240)
SHORE = [(x, -0.98 + 0.07 * math.sin(2.3 * x + 0.4) + 0.03 * math.sin(6.1 * x)) for x in [-1.6 + 0.1 * k for k in range(33)]]
slab('lake', M['nasser'], SHORE + [(1.6, -1.6), (-1.6, -1.6)], G - 0.004, G + 0.003, margin=0.02)
slab('forecourt', M['desert'], [(-1.6, FY + 0.05), (1.6, FY + 0.05)] + list(reversed(SHORE)), G - 0.004, ZF, margin=0.02)

# ------------------------------------------------------------------ the front: a pylon's sloping face cut into the hill
bm = bmesh.new()
outline = [(-FW / 2, 0.0), (FW / 2, 0.0), (FW / 2 - 0.1, FH), (-FW / 2 + 0.1, FH)]
add_prism(bm, [bm.verts.new((x, FY, ZF - 0.004 + z)) for x, z in outline], [bm.verts.new((x * 1.04, FY + 0.32, ZF - 0.004 + z)) for x, z in outline])
finish('front', bm, M['facade'], bevel=0.004, smooth_sides=False)
# the torus moulding up its sides and the cornice along the top
for s_ in (-1, 1):
    bar(f'torus{s_}', M['nubian'], (s_ * FW / 2, FY - 0.01, ZF), (s_ * (FW / 2 - 0.1), FY - 0.01, ZF + FH), 0.035)
box('cornice', M['nubian'], (0, FY + 0.02, ZF + FH - 0.02), (FW - 0.16, 0.07, 0.05), bevel=0.004)
# the frieze of baboons, the band of cartouches below it
bm = bmesh.new()
for k in range(22):
    x = -(FW - 0.3) / 2 + (FW - 0.3) * (k + 0.5) / 22
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.022, matrix=Matrix.Translation((x, FY - 0.02, ZF + FH - 0.075)) @ Matrix.Diagonal((0.85, 0.75, 1.15, 1)))
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.013, matrix=Matrix.Translation((x, FY - 0.028, ZF + FH - 0.04)))
finish('baboons', bm, M['nubian'], smooth_all=True)
box('cartoucheBand', M['nubian'], (0, FY - 0.006, ZF + FH - 0.14), (FW - 0.34, 0.012, 0.04), bevel=0.002)
for k in range(9):
    x = -0.6 + 1.2 * k / 8
    box(f'cartouche{k}', M['facade'], (x, FY - 0.014, ZF + FH - 0.14), (0.035, 0.006, 0.028), bevel=0.003)
# the doorway (a recess into the dark of the temple) and Ra-Horakhty's niche over it
box('doorFrame', M['nubian'], (0, FY - 0.006, ZF + 0.14), (0.2, 0.014, 0.28), bevel=0.002)
box('doorway', M['doorDark'], (0, FY - 0.01, ZF + 0.12), (0.12, 0.014, 0.24), bevel=0)
box('niche', M['nubian'], (0, FY - 0.004, ZF + 0.6), (0.14, 0.012, 0.24), bevel=0.002)

# ------------------------------------------------------------------ the four colossi
SCALE_H = 1.06          # each colossus's height
XS = (-0.72, -0.27, 0.27, 0.72)
for k, x in enumerate(XS):
    src = import_model('ramesses-seated', f'colossus{k}')
    if src is None:
        break
    stand_sourced(src, cut=0.0, turn=0.0, height=SCALE_H, z=ZF - 0.004, mat=M['nubian'], report=(k == 0))
    me = src.data
    ys = [v.co.y for v in me.vertices]
    me.transform(Matrix.Translation((x, FY + 0.02 - max(ys), 0)))       # its back against the front
    if k == 1:
        # broken in an earthquake soon after it was carved: the upper half lies at its feet
        bm = bmesh.new()
        bm.from_mesh(me)
        cutz = ZF + SCALE_H * 0.58
        upper = bm.copy()
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, cutz), plane_no=(0, 0, 1), clear_outer=True)
        bm.to_mesh(me)
        bm.free()
        bmesh.ops.bisect_plane(upper, geom=upper.verts[:] + upper.edges[:] + upper.faces[:], plane_co=(0, 0, cutz), plane_no=(0, 0, 1), clear_inner=True)
        fallen = bpy.data.meshes.new('fallenHalf')
        upper.to_mesh(fallen)
        upper.free()
        fallen.transform(Matrix.Translation((x + 0.06, FY - 0.66, ZF + 0.08)) @ Matrix.Rotation(math.pi, 4, 'Y') @ Matrix.Rotation(math.radians(80), 4, 'X') @ Matrix.Rotation(math.radians(25), 4, 'Z') @ Matrix.Translation((-x, -(FY - 0.2), -cutz)))   # lying face up, its head towards the lake
        ob = bpy.data.objects.new('fallenHalf', fallen)
        bpy.context.scene.collection.objects.link(ob)
        fallen.materials.append(M['nubian'])
        for p in fallen.polygons:
            p.use_smooth = True

# Ra-Horakhty in his niche over the door
src = import_model('ramesses-seated', 'raHorakhty')
if src is not None:
    stand_sourced(src, cut=0.0, turn=0.0, height=0.2, z=ZF + 0.49, mat=M['nubian'], report=False)
    ys = [v.co.y for v in src.data.vertices]
    src.data.transform(Matrix.Translation((0, FY - 0.004 - max(ys), 0)))

for k, (x, y, shirt) in enumerate(((-0.35, -0.42, 'red'), (-0.1, -0.5, 'blue'), (0.2, -0.38, 'yellow'), (0.5, -0.55, 'green'), (-0.75, -0.6, 'red'), (0.05, -0.72, 'blue'), (0.85, -0.45, 'yellow'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt, z=ZF)

render('abu-simbel')
