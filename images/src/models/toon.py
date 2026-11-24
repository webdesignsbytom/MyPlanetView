# The shared look of the little 3D landmark models (22 Nov 2026, the user's wish), so every
# model belongs to one set: the same toon shading (three flat colours: shaded, lit, highlight),
# the same dark brown outline (an inverted hull), the same grass tile, camera, sun and scale.
# Each model's own script (images/src/models/<id>/<id>.py) imports it:
#
#   import os, sys
#   sys.dont_write_bytecode = True
#   sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
#   from toon import *
#   setup()
#   ground = tile()
#   ...the model, standing on z = ground...
#   render(ground)
#
# Run: blender -b --factory-startup -P <id>.py -- <id>-1024.png 1024 <id>.blend
# render() writes the picture (transparent) and <out>.json beside it: `anchor`, where the
# middle of the tile's top falls in the picture (fractions from the top left), and
# `unitsPerPixel`, the scene's units per pixel, so images/src/tools/landmark-models.mjs can
# draw every model at the same scale.
import bpy, bmesh, json, math, sys
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector, Matrix

__all__ = ['bpy', 'bmesh', 'math', 'Vector', 'Matrix', 'setup', 'toon', 'flat', 'M', 'finish', 'box', 'cyl',
           'pyramid', 'ball', 'loft', 'lathe', 'bar', 'rod', 'each_side', 'tile', 'turn', 'render',
           'gable', 'hip', 'arch']

ARGV = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SIZE = int(ARGV[1]) if len(ARGV) > 1 else 1024
OUTLINE = None
M = {}


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


def setup():
    """An empty scene with the set's render settings, the outline and the shared colours (M)."""
    global OUTLINE
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

    OUTLINE = flat('outline', '#3a2417')
    OUTLINE.use_backface_culling = True
    M.update({
        'gold': toon('gold', '#f3b53a', shadow_mul=(0.78, 0.62, 0.55), lift=0.45),
        'cream': toon('cream', '#fff7e2', shadow_mul=(0.90, 0.85, 0.80)),
        'ink': flat('ink', '#2e211a'),
        'grass': toon('grass', '#8cc35b', shadow_mul=(0.70, 0.78, 0.80), lift=0.25),
        'dirt': toon('dirt', '#9b6b43'),
        'path': toon('path', '#e4d3b0'),
    })
    return scene


# ---------- geometry ----------
def finish(name, bm, mat, outline=0.045, bevel=0.0, smooth=False):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
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
    """A square pyramid with its sides facing the axes."""
    m = Matrix.Translation((x, y, z0 + height / 2)) @ Matrix.Rotation(math.pi / 4, 4, 'Z')
    return cyl(name, mat, base / math.sqrt(2), height, segs=4, r2=0.0, outline=outline, matrix=m)


def ball(name, mat, x, y, z, r, outline=0.03):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=10, radius=r)
    bmesh.ops.translate(bm, vec=(x, y, z), verts=bm.verts)
    return finish(name, bm, mat, outline, smooth=True)


def loft(name, mat, rings, outline=0.045, bevel=0.0, smooth=False):
    """A solid through `rings` (bottom to top, each a list of (x, y, z) of the same length,
    counter-clockwise seen from above), capped at both ends; `smooth` for rounded shapes."""
    bm = bmesh.new()
    verts = [[bm.verts.new(p) for p in ring] for ring in rings]
    n = len(rings[0])
    for a, b in zip(verts, verts[1:]):
        for i in range(n):
            bm.faces.new((a[i], a[(i + 1) % n], b[(i + 1) % n], b[i]))
    bm.faces.new(list(reversed(verts[0])))
    bm.faces.new(verts[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return finish(name, bm, mat, outline, bevel, smooth)


def lathe(name, mat, profile, z0, x=0.0, y=0.0, segs=28, outline=0.03, smooth=True):
    """A round solid from (radius, height) pairs, bottom to top, standing at (x, y) on z0
    (segs=8 makes an octagonal one, with smooth=False)."""
    return loft(name, mat, [[(x + r * math.cos(2 * math.pi * k / segs), y + r * math.sin(2 * math.pi * k / segs), z0 + z)
                              for k in range(segs)] for r, z in profile], outline=outline, smooth=smooth)


def bar(name, mat, p0, p1, thickness, outline=0.03):
    """A square beam from p0 to p1."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(thickness, thickness, d.length), verts=bm.verts)
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=Matrix.Translation((p0 + p1) / 2) @ rot, verts=bm.verts)
    return finish(name, bm, mat, outline)


def rod(name, mat, p0, p1, r, r2=None, segs=12, outline=0.03):
    """A round rod (or a cone, with r2) from p0 to p1, smooth-shaded."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    return cyl(name, mat, r, d.length, segs=segs, r2=r2, outline=outline, smooth=True,
               matrix=Matrix.Translation((p0 + p1) / 2) @ rot)


def turn(before, degrees, about=(0, 0)):
    """Turns everything made since `before` (a set of bpy.data.objects) round a vertical axis
    through `about`: a figure built facing the front (-Y) turned to face the camera (-32)."""
    m = (Matrix.Translation((*about, 0)) @ Matrix.Rotation(math.radians(degrees), 4, 'Z')
         @ Matrix.Translation((-about[0], -about[1], 0)))
    for ob in set(bpy.data.objects) - before:
        ob.matrix_world = m @ ob.matrix_world


def each_side(fn):
    """fn(i, angle, at) builds one face's details, `at(dx, dy)` turning the front face's
    (-Y) offsets to that face's."""
    for i in range(4):
        a = i * math.pi / 2
        c, s = math.cos(a), math.sin(a)
        fn(i, a, lambda dx, dy, c=c, s=s: (dx * c - dy * s, dx * s + dy * c))


def gable(name, mat, x, y, z, w, d, h, ridge_x=False, over=0.0, outline=0.004):
    """A pitched roof (or a pediment) on a w x d top at height z, its ridge h above along y
    (the gable ends face the front) or, with ridge_x, along x; `over` makes it overhang."""
    w2, d2 = w / 2 + over, d / 2 + over
    base = [(x - w2, y - d2), (x + w2, y - d2), (x + w2, y + d2), (x - w2, y + d2)]
    if ridge_x:
        top = [(x - w2, y - 0.003), (x + w2, y - 0.003), (x + w2, y + 0.003), (x - w2, y + 0.003)]
    else:
        top = [(x - 0.003, y - d2), (x + 0.003, y - d2), (x + 0.003, y + d2), (x - 0.003, y + d2)]
    return loft(name, mat, [[(a, b, z) for a, b in base], [(a, b, z + h) for a, b in top]], outline=outline)


def hip(name, mat, x, y, z, w, d, h, over=0.0, outline=0.004):
    """A hipped roof on a w x d top at height z, rising h to a ridge along its longer side
    (a pyramid when square); `over` makes it overhang."""
    w2, d2 = w / 2 + over, d / 2 + over
    r = max(0.003, abs(w2 - d2))
    top = [(x - r, y - 0.003), (x + r, y - 0.003), (x + r, y + 0.003), (x - r, y + 0.003)] if w2 >= d2 else \
          [(x - 0.003, y - r), (x + 0.003, y - r), (x + 0.003, y + r), (x - 0.003, y + r)]
    base = [(x - w2, y - d2), (x + w2, y - d2), (x + w2, y + d2), (x - w2, y + d2)]
    return loft(name, mat, [[(a, b, z) for a, b in base], [(a, b, z + h) for a, b in top]], outline=outline)


def arch(name, mat, x, y, z, w, h, face='y', depth=0.006):
    """A round-headed opening (a door, a window, a niche) standing on z, w wide and h tall
    to the top of its round head, on a face that looks along y (the front) or x."""
    hh = max(0.0, h - w / 2)
    if face == 'y':
        box(name, mat, x, y, z, w, depth, hh, outline=0, bevel=0)
        rot = Matrix.Rotation(math.pi / 2, 4, 'X')
    else:
        box(name, mat, x, y, z, depth, w, hh, outline=0, bevel=0)
        rot = Matrix.Rotation(math.pi / 2, 4, 'Y')
    return cyl(name + 'top', mat, w / 2, depth, segs=12, outline=0, matrix=Matrix.Translation((x, y, z + hh)) @ rot)


def tile(top=None):
    """The tile every model stands on: grass, unless `top` is another material (Giza's sand,
    Sydney's harbour). Returns the height of its top."""
    cyl('dirt', M['dirt'], 1.40, 0.30, matrix=Matrix.Translation((0, 0, -0.12)))
    cyl('grass', top or M['grass'], 1.44, 0.10, matrix=Matrix.Translation((0, 0, 0.06)))
    return 0.11


# ---------- camera, sun and the picture ----------
def render(ground_z):
    scene = bpy.context.scene
    out = ARGV[0] if ARGV else '//model.png'
    target = bpy.data.objects.new('target', None)
    scene.collection.objects.link(target)
    target.location = (0, 0, 2.4)

    cam_data = bpy.data.cameras.new('cam')
    cam_data.type = 'ORTHO'
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
    # From the front right and high, the same for every model (a sun shines along its -Z)
    sun.location = (5, -8.5, 19)
    sun.rotation_euler = Vector((0.5, -0.85, 1.651)).to_track_quat('Z', 'Y').to_euler()

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

    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print('WROTE', out)
    spot = world_to_camera_view(scene, cam, Vector((0, 0, ground_z)))
    with open(bpy.path.abspath(out).rsplit('.', 1)[0] + '.json', 'w') as f:
        json.dump({'anchor': [round(spot.x, 5), round(1 - spot.y, 5)],
                   'unitsPerPixel': round(cam_data.ortho_scale / SIZE, 7)}, f)
    if len(ARGV) > 2:
        bpy.ops.wm.save_as_mainfile(filepath=ARGV[2])
        print('SAVED', ARGV[2])
