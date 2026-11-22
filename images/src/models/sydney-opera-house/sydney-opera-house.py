# A cartoon Sydney Opera House for the country maps, built in the set's shared look (../toon.py)
# on a tile of harbour water: the granite podium with its broad steps, and the two halls' white
# shells, each a vault with a pointed-arch section rising from the podium to a tip leaning
# forwards, its open front glazed in bronze; three shells face the harbour in each hall, one
# faces back. Turned side-on to the camera, as it's seen from the harbour.
# Run: blender -b --factory-startup -P sydney-opera-house.py -- sydney-opera-house-1024.png 1024 sydney-opera-house.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'shell': toon('shell', '#f8f5ec', shadow_mul=(0.80, 0.84, 0.95), lift=0.2),
    'glass': toon('glass', '#8a5f3e', shadow_mul=(0.75, 0.68, 0.7)),
    'podium': toon('podium', '#cfa57e'),
    'steps': toon('steps', '#e2c7a1'),
    'water': toon('water', '#4aa6dc', shadow_mul=(0.75, 0.82, 0.9), lift=0.35),
})

G = tile(M['water'])
before = set(bpy.data.objects)

# ---------- the podium and its steps (at the back, towards the city) ----------
Z = G + 0.14
box('podium', M['podium'], 0, 0.05, G - 0.01, 1.7, 1.55, 0.15, outline=0.035, bevel=0.015)
for k in range(3):
    box(f'step{k}', M['steps'], 0, 0.86 + k * 0.07, G - 0.01, 0.9, 0.08, 0.15 - (k + 1) * 0.045, outline=0.02, bevel=0)


def shell(name, cx, yb, ya, h, w, z=Z):
    """A shell: a vault from its back at y=yb to its front at y=ya (tip h high, leaning
    forwards), each section a pointed arch w either side of x=cx; its front glazed."""
    U, T = 16, 16
    lean = 0.14 * h * (1 if ya < yb else -1)
    def at(u, t):
        rise = h * (0.12 + 0.88 * math.sin(u * math.pi / 2))   # curving up and over to the tip
        half = w * (0.82 + 0.18 * u)
        up = (1 - abs(t)) ** 0.62
        return Vector((cx + half * t, yb + (ya - yb) * u - lean * up * u, z + rise * up))
    bm = bmesh.new()
    grid = [[bm.verts.new(at(i / U, -1 + 2 * j / T)) for j in range(T + 1)] for i in range(U + 1)]
    for i in range(U):
        for j in range(T):
            bm.faces.new((grid[i][j], grid[i][j + 1], grid[i + 1][j + 1], grid[i + 1][j]))
    bmesh.ops.solidify(bm, geom=bm.faces[:], thickness=0.022)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    finish(name, bm, M['shell'], outline=0.03, smooth=True)
    # the bronze glass filling the front arch, a little inside it
    bm = bmesh.new()
    face = bm.faces.new([bm.verts.new(at(0.985, -1 + 2 * j / T)) for j in range(T + 1)])
    bmesh.ops.triangulate(bm, faces=[face])
    finish(name + 'glass', bm, M['glass'], outline=0.015)


def hall(prefix, cx, k):
    # three shells facing the harbour (-Y), each lower than the one in front, and one facing back
    shell(prefix + '1', cx, 0.0 * k, -0.62 * k, 0.95 * k, 0.36 * k)
    shell(prefix + '2', cx, 0.3 * k, -0.12 * k, 0.74 * k, 0.33 * k)
    shell(prefix + '3', cx, 0.54 * k, 0.2 * k, 0.52 * k, 0.3 * k)
    shell(prefix + 'back', cx, 0.42 * k, 0.76 * k, 0.4 * k, 0.27 * k)


hall('concert', -0.36, 1.0)
hall('opera', 0.42, 0.86)

turn(before, -78)
render(G)
