# A cartoon Bordeaux for the country maps, built in the set's shared look (../toon.py): the Place de
# la Bourse, its two long classical palaces of pale stone curving round the square under their grey
# slate mansard roofs, the Fountain of the Three Graces in the middle, the Water Mirror's thin sheet of
# water in front reflecting them, a tram gliding past, and the Garonne's quay. Turned a little towards
# the camera.
# Run: blender -b --factory-startup -P bordeaux.py -- bordeaux-1024.png 1024 bordeaux.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'paving': toon('paving', '#d8d0c0', shadow_mul=(0.82, 0.8, 0.88), lift=0.2),
    'stone': toon('stone', '#efe4cc', shadow_mul=(0.84, 0.84, 0.88), lift=0.2),
    'stoneDark': toon('stoneDark', '#d2c4a4'),
    'slate': toon('slate', '#5e6a7a', shadow_mul=(0.82, 0.86, 0.92)),
    'window': flat('window', '#3a3a46'),
    'mirror': toon('mirror', '#9ac8e0', shadow_mul=(0.82, 0.88, 0.94), lift=0.4),
    'bronze': toon('bronze', '#4a6a5a', lift=0.1),
    'river': toon('river', '#7a8a6a', lift=0.2),
    'tram': toon('tram', '#e8e4dc', lift=0.15),
    'tramstripe': toon('tramstripe', '#8a3a5a'),
})

G = tile(M['paving'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z, n=6):
    """The band of the tile's disc between y0 and y1 (counter-clockwise from above)."""
    xa0, xa1 = math.sqrt(r * r - y0 * y0), math.sqrt(r * r - y1 * y1)
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    pts = [(-xa0, y0), (xa0, y0)]
    pts += [(r * math.cos(a0 + (a1 - a0) * k / n), r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(1, n)]
    pts += [(xa1, y1), (-xa1, y1)]
    pts += [(r * math.cos(math.pi - a1 + (a1 - a0) * k / n), r * math.sin(math.pi - a1 + (a1 - a0) * k / n)) for k in range(1, n)]
    return [(x, y, G + z) for x, y in pts]


loft('garonne', M['river'], [strip(-1.41, -1.0, 1.42, -0.004), strip(-1.41, -1.0, 1.42, 0.004)], outline=0)
# the Water Mirror: a thin sheet of water over black granite, reflecting the palaces
box('mirror', M['mirror'], 0, -0.62, G - 0.003, 1.5, 0.34, 0.008, outline=0.001, bevel=0)
for k in range(5):
    box(f'reflection{k}', M['stone'], -0.55 + k * 0.28, -0.52, G + 0.006, 0.2, 0.06, 0.001, outline=0, bevel=0)

# ---------- the palaces round the square: a central block and two wings curving forward ----------
H = 0.26


def palace(name, x, y, w, rot):
    """A palace block with its rows of windows, its arcade and its mansard roof."""
    objs = set(bpy.data.objects)
    box(name, M['stone'], 0, 0, G - 0.005, w, 0.24, H, outline=0.008, bevel=0)
    box(name + 'cornice', M['stoneDark'], 0, 0, G + H - 0.02, w + 0.01, 0.25, 0.02, outline=0.002, bevel=0)
    for row in range(3):
        n = int(w / 0.07)
        for j in range(n):
            px = -w / 2 + (j + 0.5) * w / n
            box(f'{name}win{row}{j}', M['window'], px, -0.123, G + 0.03 + row * 0.075, 0.03, 0.006, 0.045 if row else 0.06, outline=0, bevel=0)
    loft(name + 'roof', M['slate'], [[(-w / 2, -0.12, G + H - 0.005), (w / 2, -0.12, G + H - 0.005), (w / 2, 0.12, G + H - 0.005), (-w / 2, 0.12, G + H - 0.005)],
                                     [(-w / 2 + 0.02, -0.08, G + H + 0.07), (w / 2 - 0.02, -0.08, G + H + 0.07), (w / 2 - 0.02, 0.08, G + H + 0.07), (-w / 2 + 0.02, 0.08, G + H + 0.07)],
                                     [(-w / 2 + 0.03, -0.004, G + H + 0.1), (w / 2 - 0.03, -0.004, G + H + 0.1), (w / 2 - 0.03, 0.004, G + H + 0.1), (-w / 2 + 0.03, 0.004, G + H + 0.1)]], outline=0.004)
    bpy.context.view_layer.update()
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(rot, 4, 'Z')
    for o in set(bpy.data.objects) - objs:
        o.matrix_world = m @ o.matrix_world


palace('centre', 0, 0.45, 0.5, 0)
box('centrepediment', M['stone'], 0, 0.32, G + H - 0.02, 0.18, 0.02, 0.08, outline=0.003, bevel=0)
for s in (-1, 1):
    palace(f'wingnear{s}', s * 0.5, 0.33, 0.42, s * math.radians(28))
    palace(f'wingfar{s}', s * 0.82, 0.02, 0.38, s * math.radians(62))

# ---------- the Fountain of the Three Graces ----------
FX, FY = 0.0, 0.05
lathe('basin', M['stoneDark'], ((0.16, 0), (0.16, 0.03), (0.14, 0.03)), G - 0.004, FX, FY, segs=24, outline=0.003)
lathe('basinwater', M['mirror'], ((0.145, 0), (0.145, 0.025)), G - 0.002, FX, FY, segs=24, outline=0)
lathe('pedestal', M['stoneDark'], ((0.05, 0), (0.04, 0.12), (0.07, 0.13), (0.07, 0.15)), G, FX, FY, segs=12, outline=0.003)
for k in range(3):
    a = 2 * math.pi * k / 3
    gx, gy = FX + 0.03 * math.cos(a), FY + 0.03 * math.sin(a)
    rod(f'grace{k}', M['bronze'], (gx, gy, G + 0.15), (gx, gy, G + 0.25), 0.014, r2=0.01, segs=8, outline=0.002)
    ball(f'gracehead{k}', M['bronze'], gx, gy, G + 0.262, 0.01, outline=0.001)

# ---------- a tram on the quay ----------
TY = -0.88
for k in range(3):
    box(f'tram{k}', M['tram'], -0.4 + k * 0.23, TY, G + 0.01, 0.22, 0.08, 0.09, outline=0.004, bevel=0)
    box(f'tramwin{k}', M['window'], -0.4 + k * 0.23, TY - 0.042, G + 0.05, 0.18, 0.006, 0.03, outline=0, bevel=0)
    box(f'tramstripe{k}', M['tramstripe'], -0.4 + k * 0.23, TY - 0.042, G + 0.025, 0.2, 0.006, 0.012, outline=0, bevel=0)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
