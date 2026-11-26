# Makes terracotta-general-light.glb, a light copy of the scan for the many warriors of
# ../../terracotta-army/ (the scan's 1.3 million faces, copied 400 times, would not render):
# the scan's parts joined, their seams merged, decimated to about 16,000 faces, its texture dropped.
# Run: blender -b --factory-startup -P make-light.py
import os, sys, bpy, bmesh
here = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(here, 'terracotta-general.glb'))
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
print('parts', len(meshes), 'faces', sum(len(o.data.polygons) for o in meshes), flush=True)
for o in meshes:
    o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.join()
ob = bpy.context.view_layer.objects.active
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bm = bmesh.new()
bm.from_mesh(ob.data)
size = max(ob.dimensions)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=size * 0.0015)
bm.to_mesh(ob.data)
bm.free()
print('merged, faces', len(ob.data.polygons), flush=True)
for _ in range(5):
    n = len(ob.data.polygons)
    if n <= 20000:
        break
    mod = ob.modifiers.new('light', 'DECIMATE')
    mod.ratio = max(16000.0 / n, 0.08)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    print('faces now', len(ob.data.polygons), flush=True)
ob.data.materials.clear()
for o in list(bpy.data.objects):
    if o is not ob:
        bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.export_scene.gltf(filepath=os.path.join(here, 'terracotta-general-light.glb'), export_format='GLB', use_selection=False, export_materials='NONE')
print('wrote light copy', len(ob.data.polygons), 'faces', flush=True)
