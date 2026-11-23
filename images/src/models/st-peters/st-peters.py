# A cartoon Saint Peter's Basilica for the country maps, built in the set's shared look (../toon.py):
# the basilica's travertine front with its columns and its row of statues along the top, the great
# ribbed dome on its drum with the lantern and cross, the two small domes beside it, and in front
# Saint Peter's Square, held in the two curving arms of Bernini's colonnade, with the obelisk and
# its two fountains. Turned a little towards the camera.
# Run: blender -b --factory-startup -P st-peters.py -- st-peters-1024.png 1024 st-peters.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *
import toon as toonkit  # for the outline material

setup()
M.update({
    'paving': toon('paving', '#ddd6c6', lift=0.25),
    'cobble': toon('cobble', '#b8ae9c', shadow_mul=(0.8, 0.8, 0.88)),
    'travertine': toon('travertine', '#efe4c8', shadow_mul=(0.84, 0.8, 0.82), lift=0.2),
    'travertineDark': toon('travertineDark', '#d9cba8', shadow_mul=(0.84, 0.8, 0.82)),
    'lead': toon('lead', '#8fa0b0', shadow_mul=(0.76, 0.8, 0.9)),
    'leadRib': toon('leadRib', '#c9d0d6', shadow_mul=(0.76, 0.8, 0.9), lift=0.2),
    'window': flat('window', '#3f4a5a'),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
    'foam': toon('foam', '#f4f8fb', shadow_mul=(0.82, 0.86, 0.95), lift=0.1),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def ribbed(name, a, b, x, y, z0, profile, ribs=16):
    n = ribs * 2
    bm = bmesh.new()
    rings = [[bm.verts.new((x + r * math.cos(2 * math.pi * k / n), y + r * math.sin(2 * math.pi * k / n), z0 + h)) for k in range(n)] for r, h in profile]
    for i in range(len(rings) - 1):
        for k in range(n):
            f = bm.faces.new((rings[i][k], rings[i][(k + 1) % n], rings[i + 1][(k + 1) % n], rings[i + 1][k]))
            f.material_index = 1 if k % 4 == 0 else 0
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
    o.thickness, o.offset, o.use_flip_normals, o.use_rim, o.material_offset = 0.022, 1.0, True, False, 2


# ---------- the square: the oval within the colonnade, the obelisk and fountains ----------
SX, SY, RX, RY = 0.0, -0.35, 0.72, 0.5
cyl('oval', M['cobble'], 1.0, 0.008, segs=40, outline=0, matrix=Matrix.Translation((SX, SY, G + 0.002)) @ Matrix.Scale(RX, 4, (1, 0, 0)) @ Matrix.Scale(RY, 4, (0, 1, 0)))
for k in range(8):
    a = 2 * math.pi * k / 8
    bar(f'paveline{k}', M['travertineDark'], (SX, SY, G + 0.008), (SX + RX * 0.95 * math.cos(a), SY + RY * 0.95 * math.sin(a), G + 0.008), 0.012, outline=0)
lathe('obeliskbase', M['travertineDark'], ((0.05, 0), (0.05, 0.05)), G, SX, SY, segs=4, outline=0.008, smooth=False)
loft('obelisk', M['travertineDark'], [[(SX - 0.025, SY - 0.025, G + 0.05), (SX + 0.025, SY - 0.025, G + 0.05), (SX + 0.025, SY + 0.025, G + 0.05), (SX - 0.025, SY + 0.025, G + 0.05)],
                                      [(SX - 0.016, SY - 0.016, G + 0.4), (SX + 0.016, SY - 0.016, G + 0.4), (SX + 0.016, SY + 0.016, G + 0.4), (SX - 0.016, SY + 0.016, G + 0.4)]],
     outline=0.008)
pyramid('obelisktip', M['travertineDark'], SX, SY, G + 0.4, 0.032, 0.04, outline=0.006)
rod('obeliskcross', M['gold'], (SX, SY, G + 0.44), (SX, SY, G + 0.48), 0.004, segs=6, outline=0)
for s in (-1, 1):
    fx = SX + s * 0.36
    lathe(f'fountainbasin{s}', M['travertine'], ((0.07, 0), (0.07, 0.03)), G, fx, SY, segs=20, outline=0.008)
    cyl(f'fountainwater{s}', M['water'], 0.06, 0.01, segs=20, outline=0, matrix=Matrix.Translation((fx, SY, G + 0.028)))
    lathe(f'fountainbowl{s}', M['travertine'], ((0.01, 0), (0.035, 0.08), (0.03, 0.09)), G + 0.03, fx, SY, segs=16, outline=0.006)
    lathe(f'fountainjet{s}', M['foam'], ((0.02, 0), (0.008, 0.06), (0.03, 0.08), (0.003, 0.1)), G + 0.12, fx, SY, segs=10, outline=0.005)

# ---------- Bernini's colonnade: two curving arms of columns, statues along the top ----------
for side in (-1, 1):
    n = 11
    for row, scale in enumerate((1.0, 1.12)):
        for k in range(n):
            t = math.radians(-70 + 140 * k / (n - 1))
            a = (math.pi if side < 0 else 0) + (-t if side < 0 else t)
            x, y = SX + RX * scale * math.cos(a), SY + RY * scale * math.sin(a)
            rod(f'col{side}{row}{k}', M['travertine'], (x, y, G), (x, y, G + 0.2), 0.014, segs=8, outline=0.005)
    # the roof and entablature over each arm
    pts_in = []
    pts_out = []
    for k in range(13):
        t = math.radians(-74 + 148 * k / 12)
        a = (math.pi if side < 0 else 0) + (-t if side < 0 else t)
        pts_in.append((SX + RX * 0.95 * math.cos(a), SY + RY * 0.95 * math.sin(a)))
        pts_out.append((SX + RX * 1.18 * math.cos(a), SY + RY * 1.18 * math.sin(a)))
    ring = pts_in + list(reversed(pts_out))
    loft(f'entab{side}', M['travertineDark'], [[(x, y, G + 0.2) for x, y in ring], [(x, y, G + 0.25) for x, y in ring]], outline=0.012)
    for k in range(0, 13, 2):
        x, y = (pts_in[k][0] + pts_out[k][0]) / 2, (pts_in[k][1] + pts_out[k][1]) / 2
        rod(f'statue{side}{k}', M['travertine'], (x, y, G + 0.25), (x, y, G + 0.3), 0.009, segs=6, outline=0.003)
        ball(f'statuehead{side}{k}', M['travertine'], x, y, G + 0.31, 0.008, outline=0.002)

# ---------- the basilica's front ----------
BY = 0.3
FW, FD, FH = 0.9, 0.22, 0.44
box('facade', M['travertine'], 0, BY, G - 0.005, FW, FD, FH, outline=0.024, bevel=0.003)
box('attic', M['travertineDark'], 0, BY, G + FH - 0.01, FW + 0.02, FD + 0.02, 0.05, outline=0.014, bevel=0)
pyramid('pediment', M['travertine'], 0, BY - FD / 2 + 0.03, G + FH + 0.03, 0.26, 0.06, outline=0.01)
for k in range(8):
    x = -FW / 2 + 0.07 + k * (FW - 0.14) / 7
    rod(f'facadecol{k}', M['travertineDark'], (x, BY - FD / 2 - 0.012, G), (x, BY - FD / 2 - 0.012, G + FH - 0.02), 0.016, segs=8, outline=0.005)
    rod(f'facadestatue{k}', M['travertine'], (x, BY, G + FH + 0.04), (x, BY, G + FH + 0.1), 0.01, segs=6, outline=0.003)
    ball(f'facadestatuehead{k}', M['travertine'], x, BY, G + FH + 0.11, 0.009, outline=0.002)
    if k < 7:
        xm = x + (FW - 0.14) / 14
        box(f'facadewin{k}', M['window'], xm, BY - FD / 2 - 0.004, G + 0.26, 0.04, 0.01, 0.07, outline=0, bevel=0)
        box(f'facadedoor{k}', M['window'], xm, BY - FD / 2 - 0.004, G, 0.045, 0.01, 0.13, outline=0, bevel=0)
box('nave', M['travertine'], 0, BY + 0.35, G - 0.005, 0.5, 0.5, 0.42, outline=0.022, bevel=0)

# ---------- the great dome on its drum, the lantern; the two small domes ----------
DX, DY, DZ = 0.0, BY + 0.42, G + 0.42
lathe('drum', M['travertine'], ((0.25, 0), (0.25, 0.16)), DZ, DX, DY, segs=32, outline=0.02)
for k in range(16):
    a = 2 * math.pi * k / 16
    rod(f'drumcol{k}', M['travertineDark'], (DX + 0.255 * math.cos(a), DY + 0.255 * math.sin(a), DZ), (DX + 0.255 * math.cos(a), DY + 0.255 * math.sin(a), DZ + 0.16), 0.01,
        segs=6, outline=0)
    if k % 2:
        box(f'drumwin{k}', M['window'], DX + 0.252 * math.cos(a), DY + 0.252 * math.sin(a), DZ + 0.05, 0.03, 0.03, 0.06, rot_z=a, outline=0, bevel=0)
lathe('drumcornice', M['travertineDark'], ((0.27, 0), (0.27, 0.025)), DZ + 0.155, DX, DY, segs=32, outline=0.01)
ribbed('dome', M['lead'], M['leadRib'], DX, DY, DZ + 0.18, ((0.25, 0), (0.25, 0.08), (0.22, 0.2), (0.16, 0.3), (0.08, 0.36), (0.04, 0.38)))
lathe('lantern', M['travertine'], ((0.045, 0), (0.045, 0.08)), DZ + 0.56, DX, DY, segs=12, outline=0.008)
lathe('lanterncap', M['lead'], ((0.05, 0), (0.02, 0.05), (0.004, 0.07)), DZ + 0.64, DX, DY, segs=12, outline=0.006)
rod('cross', M['gold'], (DX, DY, DZ + 0.71), (DX, DY, DZ + 0.79), 0.006, segs=6, outline=0)
box('crossbar', M['gold'], DX, DY, DZ + 0.755, 0.04, 0.008, 0.008, outline=0, bevel=0)
for s in (-1, 1):
    x = s * 0.33
    lathe(f'smalldrum{s}', M['travertine'], ((0.06, 0), (0.06, 0.05)), G + FH + 0.04, x, BY + 0.08, segs=16, outline=0.008)
    ribbed(f'smalldome{s}', M['lead'], M['leadRib'], x, BY + 0.08, G + FH + 0.09, ((0.06, 0), (0.055, 0.04), (0.035, 0.08), (0.01, 0.1)), ribs=8)

turn(before, -20)
render(G)
