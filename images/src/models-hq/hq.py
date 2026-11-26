# The high-quality landmark models' shared look (a pilot, 25 Nov 2026, the user's wish after the
# Pisa diorama): physically based materials rendered with Cycles, the same plinth for every model
# (a slab of bright cartoon-green turf on a wooden base, equal in depth), the same sun and sky,
# and the cartoon set's camera (../models/toon.py: orthographic, from the front left, fitted to
# the model), so a model here can go through images/src/tools/landmark-models.mjs unchanged: the
# render writes the same <id>-1024.json (the tile's middle and the scene's units per pixel).
#
# A model's script: `from hq import *`, `setup()`, build round the origin with the helpers below
# (the plinth's top is G), then `render()`.
# Run: blender -b --factory-startup -P <id>.py -- <id>-1024.png 1024 <id>.blend [samples]
import bpy, bmesh, math, random, sys, json, os
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

__all__ = ['glazed', 'elevation', 'geo', 'blob_cloud', 'scatter_on', 'bpy', 'bmesh', 'math', 'random', 'Vector', 'Matrix', 'M', 'G', 'PLINTH_R', 'setup', 'lin', 'material', 'finish',
           'box', 'box_m', 'cylinder', 'lathe', 'annulus', 'bar', 'tube', 'arch_outline', 'add_prism', 'arcade_ring',
           'arcade_path', 'column', 'gable_roof', 'hip_roof', 'pyramid', 'paving_strip', 'tree', 'cypress', 'person', 'windows', 'banded', 'striped',
           'parented', 'water_disc', 'render', 'multi', 'fir', 'spire', 'clip_to_plinth', 'slab', 'rect', 'layered', 'terrain', 'loft', 'subsurf', 'masonry', 'import_model', 'SOURCES', 'stand_sourced']

ARGV = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
SIZE = int(ARGV[1]) if len(ARGV) > 1 else 1024
SAMPLES = int(ARGV[3]) if len(ARGV) > 3 else 256

M = {}
G = 0.018          # the turf's top
TURF = 0.085       # the turf's depth, and the wood's under it
PLINTH_R = 1.5
COL = None
rng = random.Random(1173)


# ------------------------------------------------------------------ materials
def lin(hexstr):
    h = hexstr.lstrip('#')
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)


def material(name, base, rough=0.5, vary=None, vary_scale=30.0, bump=0.0, bump_scale=60.0, metallic=0.0, sss=0.0,
             coat=0.0, emission=None, transmission=0.0):
    """A Principled material; `vary` mixes in a second colour by noise, `bump` roughens the surface."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    bsdf = n['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = lin(base)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metallic
    if sss:
        for key in ('Subsurface Weight', 'Subsurface'):
            if key in bsdf.inputs:
                bsdf.inputs[key].default_value = sss
                break
        if 'Subsurface Radius' in bsdf.inputs:
            bsdf.inputs['Subsurface Radius'].default_value = (0.02, 0.016, 0.012)
    if coat and 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value = coat
    if transmission:
        for key in ('Transmission Weight', 'Transmission'):
            if key in bsdf.inputs:
                bsdf.inputs[key].default_value = transmission
                break
    if emission:
        for key in ('Emission Color', 'Emission'):
            if key in bsdf.inputs:
                bsdf.inputs[key].default_value = lin(emission[0])
                break
        if 'Emission Strength' in bsdf.inputs:
            bsdf.inputs['Emission Strength'].default_value = emission[1]
    coord = n.new('ShaderNodeTexCoord')
    if vary:
        tex = n.new('ShaderNodeTexNoise')
        tex.inputs['Scale'].default_value = vary_scale
        tex.inputs['Detail'].default_value = 6.0
        l.new(coord.outputs['Object'], tex.inputs['Vector'])
        ramp = n.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].position = 0.38
        ramp.color_ramp.elements[0].color = lin(base)
        ramp.color_ramp.elements[1].position = 0.72
        ramp.color_ramp.elements[1].color = lin(vary)
        l.new(tex.outputs['Fac'], ramp.inputs['Fac'])
        l.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    if bump:
        btex = n.new('ShaderNodeTexNoise')
        btex.inputs['Scale'].default_value = bump_scale
        btex.inputs['Detail'].default_value = 10.0
        l.new(coord.outputs['Object'], btex.inputs['Vector'])
        bnode = n.new('ShaderNodeBump')
        bnode.inputs['Strength'].default_value = bump
        bnode.inputs['Distance'].default_value = 0.002
        l.new(btex.outputs['Fac'], bnode.inputs['Height'])
        l.new(bnode.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


def banded(mat, axis, scale, strength=0.35, profile='SAW', wave_type='BANDS'):
    """Adds bands to a material's surface (roof seams, courses of stone, tiles)."""
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    coord = [x for x in n if x.bl_idname == 'ShaderNodeTexCoord'][0]
    wave = n.new('ShaderNodeTexWave')
    wave.wave_type = wave_type
    if wave_type == 'BANDS':
        wave.bands_direction = axis
    else:
        wave.rings_direction = axis
    wave.wave_profile = profile
    wave.inputs['Scale'].default_value = scale
    l.new(coord.outputs['Object'], wave.inputs['Vector'])
    bnode = n.new('ShaderNodeBump')
    bnode.inputs['Strength'].default_value = strength
    bnode.inputs['Distance'].default_value = 0.002
    l.new(wave.outputs['Fac'], bnode.inputs['Height'])
    l.new(bnode.outputs['Normal'], n['Principled BSDF'].inputs['Normal'])
    return mat


def striped(name, colours, axis, scale, rough=0.45, metallic=0.0):
    """Crisp stripes of colours (onion domes), by a wave texture through a constant ramp."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    bsdf = n['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metallic
    coord = n.new('ShaderNodeTexCoord')
    wave = n.new('ShaderNodeTexWave')
    wave.wave_type = 'BANDS'
    wave.bands_direction = axis
    wave.wave_profile = 'SAW'
    wave.inputs['Scale'].default_value = scale
    l.new(coord.outputs['Object'], wave.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.interpolation = 'CONSTANT'
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = 0.0, lin(colours[0])
    els[1].position, els[1].color = 1.0 / len(colours), lin(colours[1 % len(colours)])
    for i in range(2, len(colours)):
        e = els.new(i / len(colours))
        e.color = lin(colours[i])
    l.new(wave.outputs['Color'], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    return mat


def wood_material(name, light, dark):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    bsdf = n['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 0.42
    if 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value = 0.35
    coord = n.new('ShaderNodeTexCoord')
    mapping = n.new('ShaderNodeMapping')
    mapping.inputs['Scale'].default_value = (1.0, 1.0, 9.0)
    l.new(coord.outputs['Object'], mapping.inputs['Vector'])
    wave = n.new('ShaderNodeTexWave')
    wave.wave_type = 'BANDS'
    wave.bands_direction = 'Z'
    wave.inputs['Scale'].default_value = 3.0
    wave.inputs['Distortion'].default_value = 6.0
    wave.inputs['Detail'].default_value = 3.0
    l.new(mapping.outputs['Vector'], wave.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = lin(dark)
    ramp.color_ramp.elements[1].color = lin(light)
    l.new(wave.outputs['Fac'], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    return mat


def build_materials():
    M.update({
        # stone
        'marble': material('marble', '#efe9dc', 0.38, vary='#e2d9c6', vary_scale=18, bump=0.06, bump_scale=80, sss=0.04),
        'marbleShade': material('marbleShade', '#e3dccd', 0.42, vary='#d6ccb7', vary_scale=18, bump=0.05, bump_scale=80, sss=0.03),
        'whiteMarble': material('whiteMarble', '#f6f3ec', 0.3, vary='#ebe6dc', vary_scale=14, bump=0.04, bump_scale=90, sss=0.06),
        'stripe': material('stripe', '#8f8a82', 0.45, vary='#7d786f', vary_scale=25, bump=0.05),
        'limestone': material('limestone', '#dcc38e', 0.55, vary='#cdb27b', vary_scale=16, bump=0.08, bump_scale=120),
        'limestoneLight': material('limestoneLight', '#e9d6a8', 0.55, vary='#dcc792', vary_scale=16, bump=0.06, bump_scale=120),
        'travertine': material('travertine', '#d9c7a3', 0.62, vary='#c4ae86', vary_scale=10, bump=0.18, bump_scale=160),
        'travertineDark': material('travertineDark', '#b9a47e', 0.66, vary='#a48e69', vary_scale=10, bump=0.18, bump_scale=160),
        'sandstone': material('sandstone', '#c98f5d', 0.6, vary='#b67d4f', vary_scale=12, bump=0.1, bump_scale=120),
        'redSandstone': material('redSandstone', '#b0563c', 0.6, vary='#9a4632', vary_scale=12, bump=0.1, bump_scale=120),
        'granite': material('granite', '#c7a796', 0.55, vary='#b39282', vary_scale=40, bump=0.08, bump_scale=200),
        'brick': material('brick', '#b4483a', 0.7, vary='#9c3a2f', vary_scale=20, bump=0.12, bump_scale=160),
        'whiteStone': material('whiteStone', '#f1ede4', 0.45, vary='#e3ddd0', vary_scale=14, bump=0.06, bump_scale=100),
        'rock': material('rock', '#8f8778', 0.85, vary='#6f685c', vary_scale=4, bump=0.5, bump_scale=30),
        'rockLight': material('rockLight', '#a99f8c', 0.85, vary='#8d8473', vary_scale=4, bump=0.45, bump_scale=30),
        'shadow': material('shadow', '#2b2622', 0.8),
        # window glass: matte, as a glossy pane mirrors the white sky at the camera's angle and reads as a white or black hole
        'window': material('window', '#4f6779', 0.45, vary='#5d7689', vary_scale=4),
        'glass': material('glass', '#3b4a56', 0.08, metallic=0.4, coat=0.6),
        'glassBronze': material('glassBronze', '#4a3e30', 0.1, metallic=0.5, coat=0.6),
        # roofs and metal
        'lead': material('lead', '#cdd0cf', 0.45, vary='#bcc0c0', vary_scale=10, bump=0.05, metallic=0.25),
        'slate': material('slate', '#4f5a68', 0.55, vary='#45505d', vary_scale=14, bump=0.12, bump_scale=200),
        'slateBlue': material('slateBlue', '#5c7286', 0.5, vary='#52687b', vary_scale=14, bump=0.12, bump_scale=200),
        'terracotta': material('terracotta', '#c0694a', 0.62, vary='#a9553a', vary_scale=9, bump=0.12, bump_scale=140),
        'copperGreen': material('copperGreen', '#6fa58f', 0.5, vary='#5d917c', vary_scale=10, bump=0.06, metallic=0.2),
        'bronze': material('bronze', '#9a6b33', 0.32, vary='#6e5a32', vary_scale=12, metallic=1.0),
        'gold': material('gold', '#e8b84a', 0.22, vary='#d9a43a', vary_scale=20, metallic=1.0),
        'iron': material('iron', '#6e5b45', 0.5, vary='#5f4e3b', vary_scale=20, metallic=0.6),
        'bridgeRed': material('bridgeRed', '#c4442b', 0.45, vary='#b23c25', vary_scale=20, metallic=0.2, coat=0.2),
        'steel': material('steel', '#8e9296', 0.35, metallic=0.9),
        'door': material('door', '#5a3b22', 0.55, vary='#4a3019', vary_scale=60, bump=0.08),
        # ground
        'grass': material('grass', '#6ec246', 0.82, vary='#64b83e', vary_scale=6, bump=0.12, bump_scale=420),
        'lawn': material('lawn', '#62b33e', 0.82, vary='#58a737', vary_scale=7, bump=0.12, bump_scale=420),
        'paving': material('paving', '#ddd2bd', 0.6, vary='#cfc2aa', vary_scale=14, bump=0.1, bump_scale=200),
        'pavingDark': material('pavingDark', '#cdbfa6', 0.62, vary='#beae92', vary_scale=14, bump=0.1, bump_scale=200),
        'gravel': material('gravel', '#d9ccb2', 0.9, vary='#c7b898', vary_scale=60, bump=0.3, bump_scale=600),
        'sand': material('sand', '#e6c88f', 0.9, vary='#d8b578', vary_scale=3, bump=0.2, bump_scale=300),
        'water': material('water', '#2f7fb8', 0.06, vary='#3b92c8', vary_scale=3, bump=0.04, bump_scale=40, coat=0.8),
        'snow': material('snow', '#f6f8fb', 0.6, vary='#e4ebf3', vary_scale=8, bump=0.15, bump_scale=60, sss=0.1),
        'leaf': material('leaf', '#4f9a3a', 0.8, vary='#3f8a30', vary_scale=14, bump=0.4, bump_scale=90),
        'leafDark': material('leafDark', '#2f6e34', 0.8, vary='#275f2c', vary_scale=14, bump=0.4, bump_scale=90),
        'blossom': material('blossom', '#f2b6c8', 0.7, vary='#e89ab2', vary_scale=14, bump=0.3, bump_scale=90),
        'trunk': material('trunk', '#6b4a30', 0.8, vary='#5a3c26', vary_scale=30, bump=0.2, bump_scale=120),
        'wood': wood_material('wood', '#8a5a36', '#5e3a22'),
        # people
        'skin': material('skin', '#e0b08f', 0.6),
        'red': material('red', '#c8453a', 0.7),
        'blue': material('blue', '#3d6fb0', 0.7),
        'yellow': material('yellow', '#e2b13c', 0.7),
        'green': material('green', '#4f8a5b', 0.7),
        'denim': material('denim', '#3b4a66', 0.75),
        'hair': material('hair', '#3a2a20', 0.8),
        'white': material('white', '#f4f4f2', 0.5),
    })
    M['leadX'] = banded(material('leadX', '#cfd1d0', 0.48, vary='#bfc2c2', vary_scale=8, metallic=0.25), 'X', 9.0)
    M['leadY'] = banded(material('leadY', '#cfd1d0', 0.48, vary='#bfc2c2', vary_scale=8, metallic=0.25), 'Y', 9.0)


# ------------------------------------------------------------------ scene
def setup(top='grass', base=True):
    """An empty scene with the set's render settings, materials, and the plinth (its turf `top`)."""
    global COL
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    COL = scene.collection
    build_materials()
    scene.render.engine = 'CYCLES'
    cy = scene.cycles
    cy.samples = SAMPLES
    cy.use_denoising = True
    cy.max_bounces = 8
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.get_devices()
        # CUDA first: OptiX's kernel fails to load on this machine
        for kind in ('CUDA', 'OPTIX', 'HIP', 'ONEAPI', 'METAL'):
            try:
                prefs.compute_device_type = kind
            except TypeError:
                continue
            if any(d.type == kind for d in prefs.devices):
                for d in prefs.devices:
                    d.use = True
                cy.device = 'GPU'
                break
    except Exception:
        pass
    scene.render.resolution_x = SIZE
    scene.render.resolution_y = SIZE
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    try:
        scene.view_settings.view_transform = 'AgX'
        scene.view_settings.look = 'AgX - Medium High Contrast'
    except TypeError:
        pass

    world = bpy.data.worlds.new('World')
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = lin('#c9d6e6')
    bg.inputs['Strength'].default_value = 0.85
    sun = bpy.data.lights.new('Sun', 'SUN')
    sun.energy = 3.6
    sun.angle = math.radians(4.0)
    sun.color = (1.0, 0.96, 0.9)
    sun_ob = bpy.data.objects.new('Sun', sun)
    COL.objects.link(sun_ob)
    sun_ob.rotation_euler = (math.radians(48), 0.0, math.radians(-52))
    fill = bpy.data.lights.new('Fill', 'AREA')
    fill.energy = 140
    fill.size = 4.0
    fill.color = (0.85, 0.9, 1.0)
    fill_ob = bpy.data.objects.new('Fill', fill)
    COL.objects.link(fill_ob)
    fill_ob.location = (4.5, -3.5, 3.0)
    fill_ob.rotation_euler = (Vector((0, 0, 0.7)) - Vector(fill_ob.location)).to_track_quat('-Z', 'Y').to_euler()

    if base:
        cylinder('plinth', M['wood'], PLINTH_R, TURF, (0, 0, G - 2 * TURF), segs=128, bevel=0.01)
        lathe('turf', M[top], [(PLINTH_R, 0), (PLINTH_R, TURF - 0.012), (PLINTH_R - 0.003, TURF - 0.005), (PLINTH_R - 0.01, TURF - 0.001), (0.0, TURF)],
              (0, 0, G - TURF), segs=160)
    return scene


def render(name='model'):
    """Fits the cartoon set's orthographic camera to the model, renders, and writes the picture's
    .json (the tile's middle and the units per pixel) and, when asked, the .blend."""
    scene = bpy.context.scene
    out = ARGV[0] if ARGV else f'//{name}-1024.png'
    target = Vector((0, 0, 2.4))
    cam_data = bpy.data.cameras.new('cam')
    cam_data.type = 'ORTHO'
    cam = bpy.data.objects.new('cam', cam_data)
    COL.objects.link(cam)
    az, el, d = math.radians(32), math.radians(24), 20
    cam.location = (-d * math.cos(el) * math.sin(az), -d * math.cos(el) * math.cos(az), target.z + d * math.sin(el))
    cam.rotation_euler = (target - Vector(cam.location)).to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam

    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    inv = cam.matrix_world.inverted()
    xs, ys = [], []
    over = {}
    for ob in scene.objects:
        if ob.type not in ('MESH', 'CURVE', 'META'):
            continue
        ev = ob.evaluated_get(dg)
        me = ev.to_mesh()
        if me is None:
            continue
        for v in me.vertices:
            w = ev.matrix_world @ v.co
            p = inv @ w
            xs.append(p.x)
            ys.append(p.y)
            # nothing may stick out over the base's edge (roads, paving, trees, boats)
            if ob.name not in ('plinth', 'turf') and math.hypot(w.x, w.y) > PLINTH_R * 0.997:
                over[ob.name] = max(over.get(ob.name, 0.0), math.hypot(w.x, w.y))
        ev.to_mesh_clear()
    for name, r in sorted(over.items()):
        print(f'OUT OF BOUNDS: {name} reaches {r:.3f} (the base is {PLINTH_R})')
    w, h = max(xs) - min(xs), max(ys) - min(ys)
    cam_data.ortho_scale = max(w, h) * 1.03
    cam_data.shift_x = (max(xs) + min(xs)) / 2 / cam_data.ortho_scale
    cam_data.shift_y = (max(ys) + min(ys)) / 2 / cam_data.ortho_scale

    if len(ARGV) > 2 and ARGV[2]:
        bpy.ops.wm.save_as_mainfile(filepath=ARGV[2])
        print('SAVED', ARGV[2])
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True)
    print('WROTE', out, 'device', scene.cycles.device)
    spot = world_to_camera_view(scene, cam, Vector((0, 0, G)))
    with open(bpy.path.abspath(out).rsplit('.', 1)[0] + '.json', 'w') as f:
        json.dump({'anchor': [round(spot.x, 5), round(1 - spot.y, 5)], 'unitsPerPixel': round(cam_data.ortho_scale / SIZE, 7)}, f)


# ------------------------------------------------------------------ geometry
def finish(name, bm, mat, bevel=0.0, segments=2, smooth_sides=True, smooth_all=False):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if smooth_all:
        for f in bm.faces:
            f.smooth = True
    elif smooth_sides:
        for f in bm.faces:
            f.smooth = abs(f.normal.z) < 0.7 and len(f.verts) == 4
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    COL.objects.link(ob)
    me.materials.append(mat)
    if bevel:
        mod = ob.modifiers.new('bevel', 'BEVEL')
        mod.width = bevel
        mod.segments = segments
        mod.limit_method = 'ANGLE'
    return ob


def box(name, mat, center, size, rot_z=0.0, bevel=0.003):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=size, verts=bm.verts)
    if rot_z:
        bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(rot_z, 3, 'Z'), verts=bm.verts)
    bmesh.ops.translate(bm, vec=center, verts=bm.verts)
    return finish(name, bm, mat, bevel, smooth_sides=False)


def box_m(name, mat, matrix, size, bevel=0.0):
    """A box of `size` placed by a matrix (rotated any way)."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0, matrix=matrix @ Matrix.Diagonal((*size, 1)))
    return finish(name, bm, mat, bevel, smooth_sides=False)


def cylinder(name, mat, r, h, base, segs=48, r2=None, bevel=0.0, matrix=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=h)
    m = Matrix.Translation(Vector(base) + Vector((0, 0, h / 2)))
    if matrix is not None:
        m = matrix @ m
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    return finish(name, bm, mat, bevel)


def lathe(name, mat, profile, base, segs=48, matrix=None, bevel=0.0, smooth=False, sx=1.0, sy=1.0):
    """A solid of revolution from (radius, height) pairs, bottom to top (sx, sy stretch it)."""
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        rings.append([bm.verts.new((base[0] + sx * r * math.cos(2 * math.pi * k / segs), base[1] + sy * r * math.sin(2 * math.pi * k / segs), base[2] + z)) for k in range(segs)])
    for a, b in zip(rings, rings[1:]):
        for k in range(segs):
            bm.faces.new((a[k], a[(k + 1) % segs], b[(k + 1) % segs], b[k]))
    if profile[0][0] > 1e-4:
        bm.faces.new(list(reversed(rings[0])))
    if profile[-1][0] > 1e-4:
        bm.faces.new(rings[-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    if matrix is not None:
        bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
    return finish(name, bm, mat, bevel, smooth_all=smooth)


def annulus(name, mat, r_out, r_in, z0, z1, segs=64, bevel=0.0, matrix=None, center=(0, 0)):
    bm = bmesh.new()
    pts = [(math.cos(2 * math.pi * k / segs), math.sin(2 * math.pi * k / segs)) for k in range(segs)]
    cx, cy = center
    ob_ = [bm.verts.new((cx + r_out * c, cy + r_out * s, z0)) for c, s in pts]
    ot = [bm.verts.new((cx + r_out * c, cy + r_out * s, z1)) for c, s in pts]
    ib = [bm.verts.new((cx + r_in * c, cy + r_in * s, z0)) for c, s in pts]
    it = [bm.verts.new((cx + r_in * c, cy + r_in * s, z1)) for c, s in pts]
    for k in range(segs):
        j = (k + 1) % segs
        bm.faces.new((ob_[k], ob_[j], ot[j], ot[k]))
        bm.faces.new((ib[j], ib[k], it[k], it[j]))
        bm.faces.new((ot[k], ot[j], it[j], it[k]))
        bm.faces.new((ib[k], ib[j], ob_[j], ob_[k]))
    if matrix is not None:
        bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
    return finish(name, bm, mat, bevel)


def bar(name, mat, p0, p1, thick, bevel=0.0):
    """A square beam from p0 to p1."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    return box_m(name, mat, Matrix.Translation((p0 + p1) / 2) @ rot, (thick, thick, d.length), bevel)


def tube(name, mat, points, radius, resolution=2):
    """A round tube through points (a curve with a bevel): cables, ribs, railings."""
    cu = bpy.data.curves.new(name, 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = radius
    cu.bevel_resolution = resolution
    sp = cu.splines.new('POLY')
    sp.points.add(len(points) - 1)
    for i, q in enumerate(points):
        sp.points[i].co = (*q, 1)
    ob = bpy.data.objects.new(name, cu)
    ob.data.materials.append(mat)
    COL.objects.link(ob)
    return ob


def arch_outline(half_chord, a, z0, height, steps=12, pointed=0.0):
    """A bay's spandrel in (u, z): the band from z0 up `height` with an arch of radius a cut from its
    bottom middle (round, or `pointed` > 0 for a Gothic point)."""
    pts = [(-half_chord, z0), (-a, z0)]
    for k in range(1, steps):
        t = math.pi - math.pi * k / steps
        x = a * math.cos(t)
        zz = a * math.sin(t)
        if pointed:
            zz += pointed * a * (1 - abs(x) / a) ** 1.0 * 0.5
        pts.append((x, z0 + zz))
    pts += [(a, z0), (half_chord, z0), (half_chord, z0 + height), (-half_chord, z0 + height)]
    return pts


def add_prism(bm, front, back):
    """Joins two outlines (lists of BMVerts, same length) into a closed solid."""
    n = len(front)
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    for k in range(n):
        j = (k + 1) % n
        bm.faces.new((front[j], front[k], back[k], back[j]))


def arcade_ring(name, mat, r_out, thick, z0, height, n, arch_a, phase=0.0, matrix=None, sx=1.0, sy=1.0, pointed=0.0, center=(0, 0)):
    """A ring of n arched bays (flat chords) from z0 up `height`; sx, sy stretch it to an ellipse."""
    pts = [(center[0] + sx * r_out * math.cos(phase + 2 * math.pi * i / n), center[1] + sy * r_out * math.sin(phase + 2 * math.pi * i / n)) for i in range(n)]
    return arcade_path(name, mat, pts + [pts[0]], thick, z0, height, arch_a, matrix=matrix, pointed=pointed, inward=True, closed_center=center)


def arcade_path(name, mat, pts, thick, z0, height, arch_a, matrix=None, pointed=0.0, inward=False, closed_center=None, normal_side=1):
    """Arched bays along a path of (x, y) points (one bay between each pair): a straight arcade, or a
    ring when `inward` (the wall thickness going towards closed_center)."""
    bm = bmesh.new()
    for i in range(len(pts) - 1):
        a, b = Vector((*pts[i], 0)), Vector((*pts[i + 1], 0))
        mid = (a + b) / 2
        tan = (b - a)
        half = tan.length / 2
        tan.normalize()
        nrm = Vector((-tan.y, tan.x, 0)) * normal_side
        if inward and closed_center is not None:
            to_c = Vector((closed_center[0], closed_center[1], 0)) - mid
            if nrm.dot(to_c) < 0:
                nrm = -nrm
        aa = min(arch_a, half * 0.92)
        outline = arch_outline(half, aa, z0, height, pointed=pointed)
        front = [bm.verts.new(mid + tan * u + Vector((0, 0, z))) for u, z in outline]
        back = [bm.verts.new(mid + tan * u + nrm * thick + Vector((0, 0, z))) for u, z in outline]
        add_prism(bm, front, back)
    if matrix is not None:
        bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
    return finish(name, bm, mat, smooth_sides=False)


def window_outline(w, h, shape, steps=8):
    if shape == 'rect':
        return [(-w / 2, 0), (w / 2, 0), (w / 2, h), (-w / 2, h)]
    if shape == 'trap':
        return [(-w / 2, 0), (w / 2, 0), (w * 0.34, h), (-w * 0.34, h)]
    if shape == 'pointed':
        return [(-w / 2, 0), (w / 2, 0), (w / 2, h - w * 0.62), (w * 0.3, h - w * 0.2), (0, h), (-w * 0.3, h - w * 0.2), (-w / 2, h - w * 0.62)]
    pts = [(-w / 2, 0), (w / 2, 0)]
    for k in range(steps + 1):
        a = math.pi * k / steps
        pts.append((w / 2 * math.cos(a), h - w / 2 + w / 2 * math.sin(a)))
    return pts


def windows(name, mat, specs, depth=0.006, matrix=None):
    """Many openings as one object: specs of (x, y, z0, w, h, normal (x, y), shape), each a thin slab
    standing on a wall whose outward normal is `normal`, its foot at z0, `shape` rect, round or pointed."""
    bm = bmesh.new()
    for x, y, z0, w, h, normal, shape in specs:
        nrm = Vector((normal[0], normal[1], 0)).normalized()
        tan = Vector((-nrm.y, nrm.x, 0))
        base = Vector((x, y, z0))
        outline = window_outline(w, h, shape)
        front = [bm.verts.new(base + tan * u + Vector((0, 0, v)) + nrm * depth / 2) for u, v in outline]
        back = [bm.verts.new(base + tan * u + Vector((0, 0, v)) - nrm * depth / 2) for u, v in outline]
        add_prism(bm, front, back)
    if matrix is not None:
        bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
    return finish(name, bm, mat, smooth_sides=False)


def glazed(name, specs, frame, glass=None, depth=0.006, bars=True):
    """Windows that read as windows, never black holes: for each opening (as windows() takes them) a
    frame of `frame` round a pane of slate-blue glass (or `glass`: a door's wood), with a mullion and a
    transom on the square ones."""
    glass = M['window'] if glass is None else glass
    rims, panes, cross = [], [], []
    for x, y, z0, w, h, normal, shape in specs:
        m = min(w, h) * 0.16
        rims.append((x, y, z0 - m * 0.5, w + 2 * m, h + 1.5 * m, normal, shape))
        panes.append((x, y, z0, w, h, normal, shape))
        if bars and shape == 'rect' and glass is M['window']:
            cross.append((x, y, z0, w * 0.1, h, normal, 'rect'))
            cross.append((x, y, z0 + h * 0.62, w, h * 0.07, normal, 'rect'))
    windows(name + 'Frames', frame, rims, depth=depth)
    windows(name, glass, panes, depth=depth + 0.003)
    if cross:
        windows(name + 'Bars', frame, cross, depth=depth + 0.005)


def column(name, mat, x, y, z0, h, r, matrix=None, cap_mat=None, segs=12):
    objs = [cylinder(name, mat, r, h * 0.9, (x, y, z0 + h * 0.05), segs=segs, r2=r * 0.88, matrix=matrix)]
    m = matrix if matrix is not None else Matrix.Identity(4)
    bm = bmesh.new()
    for zc, w in ((z0, r * 2.6), (z0 + h * 0.95, r * 2.8)):
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x, y, zc + h * 0.025)) @ Matrix.Diagonal((w, w, h * 0.05, 1)))
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    objs.append(finish(name + 'ends', bm, cap_mat or mat, smooth_sides=False))
    return objs


def gable_roof(name, mat, x0, x1, y0, y1, z0, rise, over=0.02, along='x'):
    """A pitched roof over the rectangle x0..x1, y0..y1 at height z0, its ridge `rise` above, along x or y."""
    bm = bmesh.new()
    xa, xb, ya, yb = x0 - over, x1 + over, y0 - over, y1 + over
    base = [(xa, ya), (xb, ya), (xb, yb), (xa, yb)]
    if along == 'x':
        ym = (y0 + y1) / 2
        top = [(xa, ym - 0.003), (xb, ym - 0.003), (xb, ym + 0.003), (xa, ym + 0.003)]
    else:
        xm = (x0 + x1) / 2
        top = [(xm - 0.003, ya), (xm + 0.003, ya), (xm + 0.003, yb), (xm - 0.003, yb)]
    v0 = [bm.verts.new((x, y, z0)) for x, y in base]
    v1 = [bm.verts.new((x, y, z0 + rise)) for x, y in top]
    add_prism(bm, v0, v1)
    return finish(name, bm, mat, smooth_sides=False)


def hip_roof(name, mat, cx, cy, z0, w, d, rise, over=0.02):
    """A hipped roof on a w x d rectangle (a pyramid when square)."""
    bm = bmesh.new()
    w2, d2 = w / 2 + over, d / 2 + over
    r = max(0.003, abs(w2 - d2))
    top = [(cx - r, cy - 0.003), (cx + r, cy - 0.003), (cx + r, cy + 0.003), (cx - r, cy + 0.003)] if w2 >= d2 else \
          [(cx - 0.003, cy - r), (cx + 0.003, cy - r), (cx + 0.003, cy + r), (cx - 0.003, cy + r)]
    base = [(cx - w2, cy - d2), (cx + w2, cy - d2), (cx + w2, cy + d2), (cx - w2, cy + d2)]
    v0 = [bm.verts.new((x, y, z0)) for x, y in base]
    v1 = [bm.verts.new((x, y, z0 + rise)) for x, y in top]
    add_prism(bm, v0, v1)
    return finish(name, bm, mat, smooth_sides=False)


def pyramid(name, mat, cx, cy, z0, base, height, rot=0.0, segs=4):
    return cylinder(name, mat, base / math.sqrt(2), height, (0, 0, 0), segs=segs, r2=0.0,
                    matrix=Matrix.Translation((cx, cy, z0)) @ Matrix.Rotation(math.pi / 4 + rot, 4, 'Z'))


def water_disc(name, r, depth=0.012, mat='water', center=(0, 0)):
    return cylinder(name, M[mat], r, depth, (center[0], center[1], G - depth + 0.004), segs=96)


def paving_strip(name, x0, y0, x1, y1, width, tile=0.075, gap=0.008):
    """A path of square flagstones from (x0, y0) to (x1, y1)."""
    length = math.hypot(x1 - x0, y1 - y0)
    ang = math.atan2(y1 - y0, x1 - x0)
    nu, nv = max(1, int(length / tile)), max(1, int(width / tile))
    bms = {'paving': bmesh.new(), 'pavingDark': bmesh.new()}
    for i in range(nu):
        for j in range(nv):
            u = -length / 2 + (i + 0.5) * length / nu
            v = -width / 2 + (j + 0.5) * width / nv
            cx = (x0 + x1) / 2 + u * math.cos(ang) - v * math.sin(ang)
            cy = (y0 + y1) / 2 + u * math.sin(ang) + v * math.cos(ang)
            if math.hypot(cx, cy) + math.hypot(length / nu, width / nv) / 2 > PLINTH_R - 0.04:
                continue
            h = 0.012 + 0.003 * rng.random()
            key = 'paving' if rng.random() < 0.7 else 'pavingDark'
            bmesh.ops.create_cube(bms[key], size=1.0, matrix=Matrix.Translation((cx, cy, G + h / 2 - 0.004)) @ Matrix.Rotation(ang + rng.uniform(-0.02, 0.02), 4, 'Z') @ Matrix.Diagonal((length / nu - gap, width / nv - gap, h, 1)))
    for key, bm in bms.items():
        finish(f'{name}{key}', bm, M[key], bevel=0.002, smooth_sides=False)


def tree(name, x, y, h=0.22, r=0.1, mat='leaf', z=None):
    """A leafy tree: a trunk and a cluster of soft blobs."""
    z = G if z is None else z
    cylinder(name + 'Trunk', M['trunk'], r * 0.14, h * 0.55, (x, y, z), segs=10, r2=r * 0.09)
    bm = bmesh.new()
    lr = random.Random(hash(name) & 0xffff)
    for k in range(5):
        a = 2 * math.pi * k / 5 + lr.random()
        rr = r * (0.55 + 0.2 * lr.random())
        off = Vector((math.cos(a) * r * 0.45, math.sin(a) * r * 0.45, h * (0.62 + 0.15 * lr.random())))
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=rr, matrix=Matrix.Translation(Vector((x, y, z)) + off))
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=r * 0.7, matrix=Matrix.Translation((x, y, z + h * 0.85)))
    return finish(name, bm, M[mat], smooth_all=True)


def cypress(name, x, y, h=0.3, r=0.04, z=None):
    z = G if z is None else z
    return lathe(name, M['leafDark'], [(0.0, 0), (r * 0.9, h * 0.08), (r, h * 0.3), (r * 0.8, h * 0.65), (r * 0.35, h * 0.9), (0.0, h)], (x, y, z), segs=16, smooth=True)


def person(name, x, y, rot, shirt, pose='stand', scale=1.0, z=None):
    m = Matrix.Translation((x, y, G if z is None else z)) @ Matrix.Rotation(rot, 4, 'Z') @ Matrix.Scale(scale, 4)
    cylinder(name + 'legs', M['denim'], 0.0085, 0.032, (0, 0, 0), segs=10, r2=0.0095, matrix=m)
    cylinder(name + 'body', M[shirt], 0.011, 0.026, (0, 0, 0.032), segs=12, r2=0.009, matrix=m)
    cylinder(name + 'head', M['skin'], 0.0075, 0.012, (0, 0, 0.059), segs=12, r2=0.007, matrix=m)
    lathe(name + 'hair', M['hair'], [(0.0078, 0), (0.0068, 0.004), (0.0, 0.006)], (0, 0, 0), segs=12, matrix=m @ Matrix.Translation((0, 0, 0.069)))
    if pose == 'push':
        for s in (-1, 1):
            bm = bmesh.new()
            bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((0.014, s * 0.01, 0.06)) @ Matrix.Rotation(-0.9, 4, 'Y') @ Matrix.Diagonal((0.005, 0.005, 0.03, 1)))
            bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
            finish(name + f'arm{s}', bm, M['skin'], smooth_sides=False)


def parented(objs, parent):
    for ob in objs:
        ob.parent = parent


def blob_cloud(name, mat, blobs, subdivisions=2):
    """Many little spheres as one mesh (a wood's crowns, a hedge, rocks), built in a single pass: adding
    them one by one to a bmesh slows with every one (thousands took minutes). blobs: (centre, radius,
    how squat)."""
    tmpl = bmesh.new()
    bmesh.ops.create_icosphere(tmpl, subdivisions=subdivisions, radius=1.0)
    tv = [v.co.copy() for v in tmpl.verts]
    tf = [[v.index for v in f.verts] for f in tmpl.faces]
    tmpl.free()
    verts, faces = [], []
    for c, r, squat in blobs:
        base = len(verts)
        verts += [(c[0] + v.x * r, c[1] + v.y * r, c[2] + v.z * r * squat) for v in tv]
        faces += [[base + i for i in f] for f in tf]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
    me.materials.append(mat)
    ob = bpy.data.objects.new(name, me)
    COL.objects.link(ob)
    return ob


def scatter_on(ground, tries, area, keep, seed=7):
    """Points on a ground mesh (as terrain() makes it): `tries` random (x, y) in area (x0, x1, y0, y1),
    each kept when keep(point, face's material index) says so; returns the kept points."""
    from mathutils.bvhtree import BVHTree
    r_ = random.Random(seed)
    bm = bmesh.new()
    bm.from_mesh(ground.data)
    bm.faces.ensure_lookup_table()
    hits = BVHTree.FromBMesh(bm)
    out = []
    for _ in range(tries):
        x, y = r_.uniform(area[0], area[1]), r_.uniform(area[2], area[3])
        hit = hits.ray_cast(Vector((x, y, 3.0)), Vector((0, 0, -1)), 5.0)
        if hit[0] is not None and keep(hit[0], bm.faces[hit[2]].material_index):
            out.append(hit[0].copy())
    bm.free()
    return out


def multi(name, bm, mats, smooth=True):
    """A mesh whose faces carry their own material index (domes in patterns, a rock with its forest)."""
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:
        f.smooth = smooth
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    COL.objects.link(ob)
    for m in mats:
        me.materials.append(m)
    return ob


def fir(name, x, y, h=0.2, r=0.05, z=None, mat='leafDark'):
    """A conifer: a short trunk and three stacked cones."""
    z = G if z is None else z
    cylinder(name + 'Trunk', M['trunk'], r * 0.16, h * 0.3, (x, y, z), segs=8)
    bm = bmesh.new()
    for k, (z0, rr, hh) in enumerate(((0.18, 1.0, 0.45), (0.42, 0.78, 0.36), (0.62, 0.55, 0.38))):
        bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=12, radius1=r * rr, radius2=0.0, depth=h * hh,
                              matrix=Matrix.Translation((x, y, z + h * z0 + h * hh / 2)))
    return finish(name, bm, M[mat], smooth_all=True)


def spire(name, mat, x, y, z0, r, h, segs=24, finial=True):
    """A pointed conical roof with a little eave and, if asked, a gold ball and spike on top."""
    lathe(name, mat, [(r * 1.1, 0), (r * 1.1, 0.008), (r * 0.98, 0.016), (r * 0.5, h * 0.55), (0.0, h)], (x, y, z0), segs=segs, smooth=False)
    if finial:
        lathe(name + 'Finial', M['gold'], [(0.0, 0), (r * 0.09, h * 0.02), (r * 0.11, h * 0.05), (0.0, h * 0.08)], (x, y, z0 + h - h * 0.01), segs=12, smooth=True)
        cylinder(name + 'Spike', M['gold'], r * 0.025, h * 0.12, (x, y, z0 + h + h * 0.05), segs=6, r2=0.0)


def clip_to_plinth(poly, margin=0.04, center=(0.0, 0.0), radius=None):
    """A polygon of (x, y) points cut to the base's circle (`margin` inside its edge), by
    Sutherland-Hodgman against a 160-gon: roads, squares and paving never run over the edge."""
    R = (PLINTH_R if radius is None else radius) - margin
    n = 160
    circle = [(center[0] + R * math.cos(2 * math.pi * k / n), center[1] + R * math.sin(2 * math.pi * k / n)) for k in range(n)]
    out = list(poly)
    for k in range(n):
        a, b = circle[k], circle[(k + 1) % n]
        inside = lambda p: (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0
        def cut(p, q):
            ax_, ay_ = q[0] - p[0], q[1] - p[1]
            bx_, by_ = b[0] - a[0], b[1] - a[1]
            den = ax_ * by_ - ay_ * bx_
            t = ((a[0] - p[0]) * by_ - (a[1] - p[1]) * bx_) / den
            return (p[0] + t * ax_, p[1] + t * ay_)
        src, out = out, []
        if not src:
            break
        prev = src[-1]
        for cur in src:
            if inside(cur):
                if not inside(prev):
                    out.append(cut(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(cut(prev, cur))
            prev = cur
    return out


def slab(name, mat, poly, z0, z1, bevel=0.0, margin=0.04):
    """A flat piece of ground (a road, a pavement, a square) from a polygon, cut to the base."""
    pts = clip_to_plinth(poly, margin)
    if len(pts) < 3:
        return None
    bm = bmesh.new()
    add_prism(bm, [bm.verts.new((x, y, z0)) for x, y in pts], [bm.verts.new((x, y, z1)) for x, y in pts])
    return finish(name, bm, mat, bevel=bevel, smooth_sides=False)


def rect(cx, cy, w, h, rot=0.0):
    """The corners of a w x h rectangle about (cx, cy), turned by rot (for slab)."""
    c, s_ = math.cos(rot), math.sin(rot)
    return [(cx + c * x - s_ * y, cy + s_ * x + c * y) for x, y in ((-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2))]


def layered(name, colours, scale=6.0, distortion=2.0, rough=0.8, bump=0.3, bump_scale=60.0, axis='Z', detail=3.0):
    """Rock in soft layers of colour (sandstone strata): a wave texture's bands along `axis`, made
    wavy by `distortion`, through a ramp of the colours, and a noise bump."""
    mat = material(name, colours[0], rough, bump=bump, bump_scale=bump_scale)
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    coord = [x for x in n if x.bl_idname == 'ShaderNodeTexCoord'][0]
    wave = n.new('ShaderNodeTexWave')
    wave.wave_type = 'BANDS'
    wave.bands_direction = axis
    wave.inputs['Scale'].default_value = scale
    wave.inputs['Distortion'].default_value = distortion
    wave.inputs['Detail'].default_value = detail
    l.new(coord.outputs['Object'], wave.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = 0.0, lin(colours[0])
    els[1].position, els[1].color = 1.0, lin(colours[-1])
    for i, c in enumerate(colours[1:-1], 1):
        e = els.new(i / (len(colours) - 1))
        e.color = lin(c)
    l.new(wave.outputs['Fac'], ramp.inputs['Fac'])
    l.new(ramp.outputs['Color'], n['Principled BSDF'].inputs['Base Color'])
    return mat


def terrain(name, height, mats, pick, rings=60, segs=192, r_max=None):
    """A ground surface over the whole base: height(x, y) above the turf (bring it to 0 at the edge),
    each face's material mats[pick(z, nz, x, y)] (z above the turf; nz how level the face is, 1 flat,
    0 a cliff)."""
    R = PLINTH_R * 0.995 if r_max is None else r_max
    bm = bmesh.new()
    centre = bm.verts.new((0, 0, G + height(0.0, 0.0)))
    ringv = []
    for i in range(1, rings + 1):
        r = R * i / rings
        ring = []
        for k in range(segs):
            x, y = r * math.cos(2 * math.pi * k / segs), r * math.sin(2 * math.pi * k / segs)
            ring.append(bm.verts.new((x, y, G + height(x, y))))
        ringv.append(ring)
    faces = [bm.faces.new((centre, ringv[0][k], ringv[0][(k + 1) % segs])) for k in range(segs)]
    for a, b in zip(ringv, ringv[1:]):
        for k in range(segs):
            j = (k + 1) % segs
            faces.append(bm.faces.new((a[k], b[k], b[j], a[j])))
    for f in faces:
        f.normal_update()
        c = f.calc_center_median()
        f.material_index = pick(c.z - G, abs(f.normal.z), c.x, c.y)
    return multi(name, bm, mats)


def elevation(prefix, zoom):
    """Real ground heights from the open terrain tiles kept in _sources/dem/ (Mapzen's terrarium
    tiles on AWS: <prefix>_<zoom>_<x>_<y>.png, a height in each pixel's red, green and blue): a
    function (lat, lon) -> metres above sea level, read bilinearly; 0 off the tiles."""
    import numpy as np
    folder = os.path.join(SOURCES, 'dem')
    tiles = {}
    for f in os.listdir(folder):
        bits = f[:-4].split('_')
        if f.endswith('.png') and len(bits) == 4 and bits[0] == prefix and bits[1] == str(zoom):
            im = bpy.data.images.load(os.path.join(folder, f))
            w, h = im.size
            px = np.empty(w * h * 4, dtype=np.float32)
            im.pixels.foreach_get(px)
            rgb = np.round(px.reshape(h, w, 4)[::-1, :, :3] * 255.0)       # Blender's rows start at the bottom
            tiles[(int(bits[2]), int(bits[3]))] = rgb[:, :, 0] * 256.0 + rgb[:, :, 1] + rgb[:, :, 2] / 256.0 - 32768.0
            bpy.data.images.remove(im)
    n = 2 ** zoom * 256

    def pixel(ix, iy):
        t = tiles.get((ix // 256, iy // 256))
        return float(t[iy % 256, ix % 256]) if t is not None else 0.0

    def at(lat, lon):
        gx = (lon + 180.0) / 360.0 * n - 0.5
        gy = (1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n - 0.5
        ix, iy = int(math.floor(gx)), int(math.floor(gy))
        fx, fy = gx - ix, gy - iy
        return (pixel(ix, iy) * (1 - fx) * (1 - fy) + pixel(ix + 1, iy) * fx * (1 - fy)
                + pixel(ix, iy + 1) * (1 - fx) * fy + pixel(ix + 1, iy + 1) * fx * fy)
    return at


def geo(lat0, lon0, metres_per_unit, turn=0.0):
    """The tile's (x, y) -> (lat, lon) round (lat0, lon0): north up, or turned by `turn` degrees (180
    puts north towards the camera)."""
    c, s_ = math.cos(math.radians(turn)), math.sin(math.radians(turn))

    def to(x, y):
        east = (x * c + y * s_) * metres_per_unit
        north = (-x * s_ + y * c) * metres_per_unit
        return lat0 + north / 111320.0, lon0 + east / (111320.0 * math.cos(math.radians(lat0)))
    return to


def loft(name, mat, rings, cap=True, smooth=True):
    """A surface through rings of points (each a list of (x, y, z), all the same length, going round):
    robes, drapery, bodies; the first and last rings capped."""
    bm = bmesh.new()
    vs = [[bm.verts.new(p) for p in ring] for ring in rings]
    n = len(rings[0])
    for a, b in zip(vs, vs[1:]):
        for k in range(n):
            j = (k + 1) % n
            bm.faces.new((a[k], a[j], b[j], b[k]))
    if cap:
        bm.faces.new(list(reversed(vs[0])))
        bm.faces.new(vs[-1])
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
    return finish(name, bm, mat, smooth_all=smooth)


def subsurf(ob, levels=2):
    """Smooths an object with a subdivision surface (organic forms from a few faces)."""
    mod = ob.modifiers.new('subsurf', 'SUBSURF')
    mod.levels = levels
    mod.render_levels = levels
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


def masonry(name, base, mortar, scale=40.0, rough=0.85, vary=None):
    """Fitted stone walls: Voronoi cells for the stones, their edges dark and pressed in."""
    mat = material(name, base, rough, vary=vary or base, vary_scale=scale * 0.3)
    nt = mat.node_tree
    n, l = nt.nodes, nt.links
    coord = [x for x in n if x.bl_idname == 'ShaderNodeTexCoord'][0]
    vor = n.new('ShaderNodeTexVoronoi')
    vor.feature = 'DISTANCE_TO_EDGE'
    vor.inputs['Scale'].default_value = scale
    l.new(coord.outputs['Object'], vor.inputs['Vector'])
    ramp = n.new('ShaderNodeValToRGB')
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = 0.0, lin(mortar)
    els[1].position, els[1].color = 0.06, (1, 1, 1, 1)
    mix = n.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 1.0
    bsdf = n['Principled BSDF']
    src = bsdf.inputs['Base Color'].links[0].from_socket if bsdf.inputs['Base Color'].links else None
    if src is not None:
        l.new(src, mix.inputs['A'])
    else:
        mix.inputs['A'].default_value = lin(base)
    l.new(ramp.outputs['Color'], mix.inputs['B'])
    l.new(vor.outputs['Distance'], ramp.inputs['Fac'])
    l.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
    bump = n.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.6
    bump.inputs['Distance'].default_value = 0.002
    l.new(vor.outputs['Distance'], bump.inputs['Height'])
    l.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


SOURCES = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_sources')


def import_model(folder, name='sourced', skip=None, group=None):
    """A sourced model (_sources/<folder>/, as downloaded: glb, gltf, fbx, obj or stl) brought in as
    one mesh object, its parts' transforms baked in, Z up; None when nothing is there yet. `skip(names)`,
    given a part's material names, leaves that part out (a figure standing in for scale); `group(names)`
    gives each kept part's faces a material index (rock, stone, lettering), for the caller's slots."""
    root = os.path.join(SOURCES, folder)
    found = []
    for base, _, files in os.walk(root):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in ('.glb', '.gltf', '.fbx', '.obj', '.stl'):
                found.append((('.glb', '.gltf', '.fbx', '.obj', '.stl').index(ext), os.path.join(base, f)))
    if not found:
        return None
    path = sorted(found)[0][1]
    ext = os.path.splitext(path)[1].lower()
    before = set(bpy.data.objects)
    if ext in ('.glb', '.gltf'):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == '.fbx':
        bpy.ops.import_scene.fbx(filepath=path)
    elif ext == '.obj':
        bpy.ops.wm.obj_import(filepath=path)
    else:
        bpy.ops.wm.stl_import(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    bm = bmesh.new()
    for o in new:
        if o.type != 'MESH':
            continue
        names = [m.name for m in o.data.materials if m is not None]
        if skip is not None and skip(names):
            continue
        ev = o.evaluated_get(dg)
        tmp = ev.to_mesh()
        part = bmesh.new()
        part.from_mesh(tmp)
        bmesh.ops.transform(part, matrix=o.matrix_world, verts=part.verts)
        if group is not None:
            index = group(names)
            for f in part.faces:
                f.material_index = index
        me = bpy.data.meshes.new('tmp')
        part.to_mesh(me)
        part.free()
        bm.from_mesh(me)
        bpy.data.meshes.remove(me)
        ev.to_mesh_clear()
    for o in new:
        bpy.data.objects.remove(o, do_unlink=True)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    COL.objects.link(ob)
    print('IMPORTED', path, len(me.vertices), 'vertices')
    return ob


def stand_sourced(ob, cut=0.0, turn=0.0, height=1.0, z=None, mat=None, report=True):
    """Stands an imported model on a pedestal: everything below `cut` (a share of its height: its own
    base) cut away, centred on the foot of what's left, turned by `turn` degrees about Z, scaled to
    `height` and stood at `z`, with `mat` for every face. `report` prints its size by slices, to
    choose the cut and the turn."""
    z = G if z is None else z
    me = ob.data
    zs = [v.co.z for v in me.vertices]
    zmin, zmax = min(zs), max(zs)
    if report:
        xs, ys = [v.co.x for v in me.vertices], [v.co.y for v in me.vertices]
        print('SOURCE BOUNDS x', round(min(xs), 3), round(max(xs), 3), 'y', round(min(ys), 3), round(max(ys), 3), 'z', round(zmin, 3), round(zmax, 3))
        for k in range(20):
            z0, z1 = zmin + (zmax - zmin) * k / 20, zmin + (zmax - zmin) * (k + 1) / 20
            sl = [v.co for v in me.vertices if z0 <= v.co.z < z1]
            if sl:
                print('SLICE', k, 'x', round(min(c.x for c in sl), 3), round(max(c.x for c in sl), 3), 'y', round(min(c.y for c in sl), 3), round(max(c.y for c in sl), 3))
    c = zmin + cut * (zmax - zmin)
    bm = bmesh.new()
    bm.from_mesh(me)
    if cut > 0:
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, c), plane_no=(0, 0, 1), clear_inner=True)
    low = [v.co for v in bm.verts if v.co.z < c + (zmax - c) * 0.05]
    cx = (min(p.x for p in low) + max(p.x for p in low)) / 2 if low else 0.0
    cy = (min(p.y for p in low) + max(p.y for p in low)) / 2 if low else 0.0
    bm.to_mesh(me)
    bm.free()
    k_ = height / (zmax - c)
    me.transform(Matrix.Translation((0, 0, z)) @ Matrix.Rotation(math.radians(turn), 4, 'Z') @ Matrix.Scale(k_, 4) @ Matrix.Translation((-cx, -cy, -c)))
    if mat is not None:
        me.materials.clear()
        me.materials.append(mat)
        for poly in me.polygons:
            poly.material_index = 0
            poly.use_smooth = True
    return ob
