# A cartoon Big Ben (the Elizabeth Tower) for the map, built from primitives and rendered
# with toon shading and an inverted-hull outline on a transparent background.
# Run: blender -b --factory-startup -P big-ben.py -- <out.png> [size] [out.blend]
# Beside <out.png> it writes <out>.json: `anchor`, where the middle of the grass tile's top
# (the spot the model stands on) falls in the picture, as fractions of its width and height
# from the top left. images/src/tools/landmark-models.mjs puts that point on the map.
import bpy, bmesh, json, math, sys
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else '//bigben.png'
SIZE = int(argv[1]) if len(argv) > 1 else 1024

# ---------- scene ----------
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
scene = bpy.context.scene
for engine in ('BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT'):
    try:
        scene.render.engine = engine
        break
    except TypeError:
        pass
scene.render.resolution_x = SIZE
scene.render.resolution_y = SIZE
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
try:
    scene.eevee.taa_render_samples = 64
except AttributeError:
    pass

world = bpy.data.worlds.new('World')
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (0.32, 0.32, 0.36, 1)
bg.inputs['Strength'].default_value = 1.0


def lin(hexstr):
    h = hexstr.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return out


def srgb_mul(hexstr, mul):
    h = hexstr.lstrip('#')
    return '#' + ''.join(f'{min(255, round(int(h[i:i+2], 16) * m)):02x}' for i, m in zip((0, 2, 4), mul))


def srgb_lift(hexstr, k):
    h = hexstr.lstrip('#')
    return '#' + ''.join(f'{round(int(h[i:i+2], 16) + (255 - int(h[i:i+2], 16)) * k):02x}' for i in (0, 2, 4))


# Toon material: the light reaching the surface picks one of three flat colours
T_SHADOW, T_LIGHT = 0.5, 1.12
def toon(name, hexstr, shadow_mul=(0.78, 0.68, 0.70), lift=0.30):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    diff = nt.nodes.new('ShaderNodeBsdfDiffuse')
    diff.inputs['Color'].default_value = (1, 1, 1, 1)
    s2rgb = nt.nodes.new('ShaderNodeShaderToRGB')
    bw = nt.nodes.new('ShaderNodeRGBToBW')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    els = ramp.color_ramp.elements
    els[0].position = 0.0
    els[0].color = (*lin(srgb_mul(hexstr, shadow_mul)), 1)
    els[1].position = T_SHADOW / 2  # ramp positions are 0..1; light is scaled by half below
    els[1].color = (*lin(hexstr), 1)
    e3 = els.new(T_LIGHT / 2)
    e3.color = (*lin(srgb_lift(hexstr, lift)), 1)
    half = nt.nodes.new('ShaderNodeMath')
    half.operation = 'MULTIPLY'
    half.inputs[1].default_value = 0.5
    emit = nt.nodes.new('ShaderNodeEmission')
    nt.links.new(diff.outputs[0], s2rgb.inputs[0])
    nt.links.new(s2rgb.outputs['Color'], bw.inputs[0])
    nt.links.new(bw.outputs[0], half.inputs[0])
    nt.links.new(half.outputs[0], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], emit.inputs['Color'])
    nt.links.new(emit.outputs[0], out.inputs['Surface'])
    return mat


def flat(name, hexstr):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value = (*lin(hexstr), 1)
    nt.links.new(emit.outputs[0], out.inputs['Surface'])
    return mat


OUTLINE = flat('outline', '#3a2417')
OUTLINE.use_backface_culling = True

M = {
    'stone': toon('stone', '#ecc88c'),
    'stoneLight': toon('stoneLight', '#f6dcaa'),
    'stoneDark': toon('stoneDark', '#cf9f63'),
    'roof': toon('roof', '#3f5873', shadow_mul=(0.72, 0.72, 0.82), lift=0.22),
    'gold': toon('gold', '#f3b53a', shadow_mul=(0.78, 0.62, 0.55), lift=0.45),
    'cream': toon('cream', '#fff7e2', shadow_mul=(0.90, 0.85, 0.80)),
    'window': flat('window', '#4b3a55'),
    'ink': flat('ink', '#2e211a'),
    'grass': toon('grass', '#8cc35b', shadow_mul=(0.70, 0.78, 0.80), lift=0.25),
    'dirt': toon('dirt', '#9b6b43'),
    'path': toon('path', '#e4d3b0'),
}


# ---------- geometry helpers ----------
def finish(name, bm, mat, outline=0.045, bevel=0.0, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    me.materials.append(mat)
    if bevel:
        b = ob.modifiers.new('bevel', 'BEVEL')
        b.width = bevel
        b.segments = 1
        b.limit_method = 'ANGLE'
    if outline:
        me.materials.append(OUTLINE)
        s = ob.modifiers.new('outline', 'SOLIDIFY')
        s.thickness = outline
        s.offset = 1.0
        s.use_flip_normals = True
        s.use_rim = False
        s.material_offset = 1
    return ob


def box(name, mat, x, y, z0, sx, sy, sz, rot_z=0.0, outline=0.045, bevel=0.025):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
    if rot_z:
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rot_z, 3, 'Z'), verts=bm.verts)
    bmesh.ops.translate(bm, vec=(x, y, z0 + sz / 2), verts=bm.verts)
    return finish(name, bm, mat, outline, bevel)


def cyl(name, mat, r, depth, segs=48, r2=None, outline=0.045, smooth=False, matrix=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs,
                          radius1=r, radius2=r if r2 is None else r2, depth=depth)
    if matrix is not None:
        bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
    return finish(name, bm, mat, outline, smooth=smooth)


def pyramid(name, mat, x, y, z0, base, height, outline=0.045):
    # A square pyramid with its sides facing the axes
    m = Matrix.Translation((x, y, z0 + height / 2)) @ Matrix.Rotation(math.pi / 4, 4, 'Z')
    return cyl(name, mat, base / math.sqrt(2), height, segs=4, r2=0.0, outline=outline, matrix=m)


def ball(name, mat, x, y, z, r, outline=0.03):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r)
    bmesh.ops.translate(bm, vec=(x, y, z), verts=bm.verts)
    return finish(name, bm, mat, outline, smooth=True)


def each_side(fn):
    # fn(rot, sx(dx, dy) -> (x, y)) builds one face's details; the front face is -Y
    for i in range(4):
        a = i * math.pi / 2
        c, s = math.cos(a), math.sin(a)
        fn(i, a, lambda dx, dy, c=c, s=s: (dx * c - dy * s, dx * s + dy * c))


# ---------- the tile ----------
cyl('dirt', M['dirt'], 1.40, 0.30, matrix=Matrix.Translation((0, 0, -0.12)))
cyl('grass', M['grass'], 1.44, 0.10, matrix=Matrix.Translation((0, 0, 0.06)))
GROUND_Z = 0.11  # the grass's top
# a little paved path to the door
box('path', M['path'], 0, -1.0, 0.10, 0.42, 0.85, 0.02, outline=0.015, bevel=0.0)

# ---------- the tower ----------
W = 1.0          # shaft
CW = 1.30        # clock stage
Z_PLINTH, Z_SHAFT, Z_CLOCK, Z_TOP = 0.11, 0.30, 1.78, 2.92

box('plinth', M['stoneDark'], 0, 0, Z_PLINTH, 1.24, 1.24, Z_SHAFT - Z_PLINTH)
box('shaft', M['stone'], 0, 0, Z_SHAFT, W, W, Z_CLOCK - Z_SHAFT)
# corner buttresses and string courses
for cx in (-1, 1):
    for cy in (-1, 1):
        box(f'buttress{cx}{cy}', M['stoneLight'], cx * (W / 2 - 0.04), cy * (W / 2 - 0.04), Z_SHAFT,
            0.17, 0.17, Z_CLOCK - Z_SHAFT, outline=0.032)
for k, z in enumerate((0.78, 1.28)):
    box(f'course{k}', M['stoneDark'], 0, 0, z, W + 0.05, W + 0.05, 0.05, outline=0.028, bevel=0.012)


def shaft_windows(i, a, at):
    for col in (-0.18, 0.18):
        for row, (z0, h) in enumerate(((0.42, 0.30), (0.90, 0.32), (1.40, 0.30))):
            x, y = at(col, -W / 2 - 0.005)
            box(f'win{i}{col}{row}', M['window'], x, y, z0, 0.13, 0.02, h, rot_z=a, outline=0, bevel=0)
            # a pointed top
            x2, y2 = at(col, -W / 2 - 0.006)
            pyr = pyramid(f'arch{i}{col}{row}', M['window'], 0, 0, 0, 0.092, 0.08, outline=0)
            pyr.matrix_world = (Matrix.Translation((x2, y2, z0 + h - 0.005))
                                @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Scale(0.22, 4, (0, 1, 0)))
    # the door, on the front only
    if i == 0:
        x, y = at(0, -W / 2 - 0.01)
        box('door', M['ink'], x, y, Z_SHAFT - 0.04, 0.22, 0.03, 0.26, rot_z=a, outline=0, bevel=0)

each_side(shaft_windows)

# the clock stage
box('clockstage', M['stone'], 0, 0, Z_CLOCK, CW, CW, Z_TOP - Z_CLOCK)
box('cornice', M['stoneDark'], 0, 0, Z_TOP, CW + 0.1, CW + 0.1, 0.08, bevel=0.015)
box('sill', M['stoneDark'], 0, 0, Z_CLOCK - 0.02, CW + 0.06, CW + 0.06, 0.07, bevel=0.015)
for cx in (-1, 1):
    for cy in (-1, 1):
        x, y = cx * (CW / 2 + 0.01), cy * (CW / 2 + 0.01)
        box(f'cpost{cx}{cy}', M['stoneLight'], x, y, Z_CLOCK, 0.15, 0.15, Z_TOP - Z_CLOCK + 0.2, outline=0.032)
        pyramid(f'cpin{cx}{cy}', M['stoneLight'], x, y, Z_TOP + 0.2, 0.15, 0.26, outline=0.03)
        ball(f'cball{cx}{cy}', M['gold'], x, y, Z_TOP + 0.48, 0.045)

CLOCK_Z = (Z_CLOCK + Z_TOP) / 2
CLOCK_R = 0.42


def clock(i, a, at):
    face = -CW / 2
    # gilded square frame, gold ring, cream dial
    x, y = at(0, face - 0.02)
    box(f'frame{i}', M['gold'], x, y, CLOCK_Z - 0.49, 0.98, 0.04, 0.98, rot_z=a, outline=0.03, bevel=0.015)
    face_m = (Matrix.Rotation(a, 4, 'Z') @ Matrix.Translation((0, face - 0.06, CLOCK_Z))
              @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    cyl(f'ring{i}', M['gold'], CLOCK_R + 0.05, 0.05, matrix=face_m @ Matrix.Translation((0, 0, 0.0)))
    cyl(f'dial{i}', M['cream'], CLOCK_R, 0.05,
        matrix=Matrix.Rotation(a, 4, 'Z') @ Matrix.Translation((0, face - 0.075, CLOCK_Z)) @ Matrix.Rotation(math.pi / 2, 4, 'X'),
        outline=0.028)
    # hour marks
    for h in range(12):
        t = h / 12 * 2 * math.pi
        big = h % 3 == 0
        mx, mz = math.sin(t) * (CLOCK_R - 0.065), math.cos(t) * (CLOCK_R - 0.065)
        mk = box(f'mark{i}{h}', M['ink'], 0, 0, 0, 0.035 if big else 0.022, 0.02, 0.07 if big else 0.045, outline=0, bevel=0)
        mk.matrix_world = (Matrix.Rotation(a, 4, 'Z') @ Matrix.Translation((mx, face - 0.105, CLOCK_Z + mz))
                           @ Matrix.Rotation(-t, 4, 'Y') @ Matrix.Translation((0, 0, -(0.07 if big else 0.045) / 2)))
    # hands at ten past ten
    for name, ang, length, width in (('hour', -60, 0.22, 0.05), ('minute', 60, 0.33, 0.035)):
        hd = box(f'{name}{i}', M['ink'], 0, 0, 0, width, 0.02, length, outline=0, bevel=0)
        hd.matrix_world = (Matrix.Rotation(a, 4, 'Z') @ Matrix.Translation((0, face - 0.115, CLOCK_Z))
                           @ Matrix.Rotation(math.radians(ang), 4, 'Y') @ Matrix.Translation((0, 0, -0.03)))
    ball(f'hub{i}', M['ink'], *at(0, face - 0.12), CLOCK_Z, 0.03, outline=0)

each_side(clock)

# the belfry
Z_BELL = Z_TOP + 0.08
BW = 1.08
box('belfry', M['stone'], 0, 0, Z_BELL, BW, BW, 0.46)


def belfry_openings(i, a, at):
    for col in (-0.3, 0.0, 0.3):
        x, y = at(col, -BW / 2 - 0.005)
        box(f'bel{i}{col}', M['window'], x, y, Z_BELL + 0.08, 0.13, 0.02, 0.26, rot_z=a, outline=0, bevel=0)
        x2, y2 = at(col, -BW / 2 - 0.006)
        pyr = pyramid(f'belarch{i}{col}', M['window'], 0, 0, 0, 0.092, 0.08, outline=0)
        pyr.matrix_world = (Matrix.Translation((x2, y2, Z_BELL + 0.335))
                            @ Matrix.Rotation(a, 4, 'Z') @ Matrix.Scale(0.22, 4, (0, 1, 0)))

each_side(belfry_openings)

# the roof: a gold band, a tall slate pyramid, corner spires, a lantern and the finial
Z_ROOF = Z_BELL + 0.46
box('roofband', M['gold'], 0, 0, Z_ROOF, BW + 0.08, BW + 0.08, 0.07, bevel=0.012)
pyramid('roof', M['roof'], 0, 0, Z_ROOF + 0.07, BW + 0.02, 1.25)
for cx in (-1, 1):
    for cy in (-1, 1):
        x, y = cx * (BW / 2 + 0.01), cy * (BW / 2 + 0.01)
        box(f'rpost{cx}{cy}', M['roof'], x, y, Z_ROOF, 0.13, 0.13, 0.22, outline=0.03, bevel=0.01)
        pyramid(f'rpin{cx}{cy}', M['roof'], x, y, Z_ROOF + 0.22, 0.14, 0.42, outline=0.03)
        ball(f'rball{cx}{cy}', M['gold'], x, y, Z_ROOF + 0.66, 0.04)
Z_LANTERN = Z_ROOF + 0.07 + 0.95
box('lantern', M['gold'], 0, 0, Z_LANTERN, 0.26, 0.26, 0.22, outline=0.03, bevel=0.01)
pyramid('spire', M['roof'], 0, 0, Z_LANTERN + 0.22, 0.26, 0.42, outline=0.03)
ball('finial', M['gold'], 0, 0, Z_LANTERN + 0.68, 0.06)
TOP = Z_LANTERN + 0.74

# ---------- camera and light ----------
target = bpy.data.objects.new('target', None)
scene.collection.objects.link(target)
target.location = (0, 0, TOP / 2 - 0.12)

cam_data = bpy.data.cameras.new('cam')
cam_data.type = 'ORTHO'
cam_data.ortho_scale = TOP + 0.75
cam = bpy.data.objects.new('cam', cam_data)
scene.collection.objects.link(cam)
az, el, d = math.radians(32), math.radians(24), 20
cam.location = (-d * math.cos(el) * math.sin(az), -d * math.cos(el) * math.cos(az), target.location.z + d * math.sin(el))
tc = cam.constraints.new('TRACK_TO')
tc.target = target
tc.track_axis = 'TRACK_NEGATIVE_Z'
tc.up_axis = 'UP_Y'
scene.camera = cam

sun_data = bpy.data.lights.new('sun', 'SUN')
sun_data.energy = 3.0
sun_data.angle = math.radians(2)
sun = bpy.data.objects.new('sun', sun_data)
scene.collection.objects.link(sun)
sun.location = Vector((0.5, -0.85, 1.9)) * 10
sc = sun.constraints.new('TRACK_TO')
sc.target = target
sc.track_axis = 'TRACK_NEGATIVE_Z'
sc.up_axis = 'UP_Y'

# Fit the camera to the model: every object's bounds in camera space
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
inv = cam.matrix_world.inverted()
xs, ys = [], []
for ob in scene.objects:
    if ob.type != 'MESH':
        continue
    ev = ob.evaluated_get(dg)
    for v in ev.data.vertices:
        p = inv @ (ev.matrix_world @ v.co)
        xs.append(p.x); ys.append(p.y)
w, h = max(xs) - min(xs), max(ys) - min(ys)
cam_data.ortho_scale = max(w, h) * 1.03
cam_data.shift_x = (max(xs) + min(xs)) / 2 / cam_data.ortho_scale
cam_data.shift_y = (max(ys) + min(ys)) / 2 / cam_data.ortho_scale
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('WROTE', OUT)
spot = world_to_camera_view(scene, cam, Vector((0, 0, GROUND_Z)))
with open(bpy.path.abspath(OUT).rsplit('.', 1)[0] + '.json', 'w') as f:
    json.dump({'anchor': [round(spot.x, 5), round(1 - spot.y, 5)]}, f)
if len(argv) > 2:
    bpy.ops.wm.save_as_mainfile(filepath=argv[2])
    print('SAVED', argv[2])
