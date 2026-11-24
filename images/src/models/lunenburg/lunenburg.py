# A cartoon Lunenburg for the country maps, built in the set's shared look (../toon.py): the old
# fishing town on Nova Scotia's coast, the big red wooden fish sheds and warehouses along its
# waterfront wharves, the houses up the hill painted in every colour, the dark Gothic wooden church
# of St John's, and the black-hulled schooner Bluenose II with her two tall masts tied up at the
# wharf. Turned a little towards the camera.
# Run: blender -b --factory-startup -P lunenburg.py -- lunenburg-1024.png 1024 lunenburg.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'water': toon('water', '#3a7ab0', lift=0.3),
    'wharf': toon('wharf', '#9a7a5a'),
    'red': toon('red', '#b83a2e', lift=0.12),
    'yellow': toon('yellow', '#f0c850', lift=0.12),
    'blue': toon('blue', '#5a8ac8', lift=0.12),
    'green': toon('green', '#6ab07a', lift=0.12),
    'orange': toon('orange', '#e8884a', lift=0.12),
    'white': toon('white', '#f6f4ee', lift=0.22),
    'roofDark': toon('roofDark', '#3a3e46'),
    'churchRed': toon('churchRed', '#8a2e2e'),
    'hull': toon('hull', '#1e2228'),
    'mast': toon('mast', '#c8a070'),
    'sail': toon('sail', '#f2ece0', lift=0.3),
    'dark': flat('dark', '#2e2a2a'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)


def strip(y0, y1, r, z):
    a0, a1 = math.asin(y0 / r), math.asin(y1 / r)
    right = [(r * math.cos(a0 + (a1 - a0) * k / 12), r * math.sin(a0 + (a1 - a0) * k / 12), z) for k in range(13)]
    left = [(-r * math.cos(a1 + (a0 - a1) * k / 12), r * math.sin(a1 + (a0 - a1) * k / 12), z) for k in range(13)]
    return right + left


def house(name, x, y, w, d, h, wall, roof, roof_h):
    box(name, M[wall], x, y, G - 0.005, w, d, h, outline=0.005, bevel=0)
    n = max(1, int(w / 0.09))
    for j in range(n):
        wx = x - w / 2 + (j + 0.5) * w / n
        box(f'{name}win{j}', M['white'], wx, y - d / 2 - 0.004, G + h * 0.5, 0.035, 0.006, 0.045, outline=0, bevel=0)
        box(f'{name}pane{j}', M['dark'], wx, y - d / 2 - 0.007, G + h * 0.5 + 0.006, 0.025, 0.006, 0.033, outline=0, bevel=0)
    loft(f'{name}roof', M[roof], [[(x - w / 2 - 0.01, y - d / 2 - 0.01, G + h - 0.005), (x + w / 2 + 0.01, y - d / 2 - 0.01, G + h - 0.005), (x + w / 2 + 0.01, y + d / 2 + 0.01, G + h - 0.005), (x - w / 2 - 0.01, y + d / 2 + 0.01, G + h - 0.005)],
                                  [(x - 0.004, y - d / 2 - 0.01, G + h + roof_h), (x + 0.004, y - d / 2 - 0.01, G + h + roof_h), (x + 0.004, y + d / 2 + 0.01, G + h + roof_h), (x - 0.004, y + d / 2 + 0.01, G + h + roof_h)]], outline=0.004)


# ---------- the harbour and the wharves ----------
loft('harbour', M['water'], [strip(-1.31, -0.45, 1.32, G - 0.004), strip(-1.31, -0.45, 1.32, G + 0.008)], outline=0.002)
box('quay', M['wharf'], 0.0, -0.42, G - 0.005, 2.3, 0.08, 0.03, outline=0.003, bevel=0)
for k, x in enumerate((-0.6, 0.42)):
    box(f'wharf{k}', M['wharf'], x, -0.62, G - 0.005, 0.14, 0.36, 0.03, outline=0.003, bevel=0)
    for j in range(4):
        rod(f'piling{k}{j}', M['wharf'], (x + (0.06 if j % 2 else -0.06), -0.48 - (j // 2) * 0.3, G - 0.004), (x + (0.06 if j % 2 else -0.06), -0.48 - (j // 2) * 0.3, G + 0.05), 0.01, segs=6, outline=0.001)

# ---------- the red fish sheds along the waterfront, gables to the harbour ----------
for k, (x, wall) in enumerate(((-0.78, 'red'), (-0.5, 'red'), (-0.22, 'yellow'), (0.08, 'red'), (0.36, 'red'), (0.64, 'blue'))):
    house(f'shed{k}', x, -0.25, 0.24, 0.24, 0.16, wall, 'roofDark', 0.12)

# ---------- the colourful houses up the hill ----------
COLS = ('yellow', 'blue', 'green', 'orange', 'white', 'red')
for k in range(8):
    x = -0.75 + k * 0.21
    y = 0.15 + 0.12 * (k % 2)
    if math.hypot(abs(x) + 0.1, y + 0.1) > 1.2:
        continue
    house(f'house{k}', x, y, 0.16, 0.14, 0.12, COLS[k % 6], 'roofDark', 0.08)

# ---------- St John's Church ----------
SX, SY = 0.1, 0.65
house('church', SX, SY, 0.3, 0.2, 0.16, 'churchRed', 'roofDark', 0.14)
box('churchtower', M['churchRed'], SX, SY - 0.12, G - 0.005, 0.09, 0.09, 0.3, outline=0.004, bevel=0)
lathe('churchspire', M['roofDark'], ((0.06, 0), (0.003, 0.22)), G + 0.295, SX, SY - 0.12, segs=8, outline=0.003, smooth=False)
for s in (-1, 1):
    lathe(f'churchpinnacle{s}', M['white'], ((0.01, 0), (0.002, 0.06)), G + 0.295, SX + s * 0.045, SY - 0.165, segs=6, outline=0.001, smooth=False)

# ---------- Bluenose II at the wharf ----------
BX, BY = -0.2, -0.65
loft('hull', M['hull'], [[(BX - 0.26, BY - 0.03, G - 0.002), (BX + 0.22, BY - 0.03, G - 0.002), (BX + 0.28, BY, G - 0.002), (BX + 0.22, BY + 0.03, G - 0.002), (BX - 0.26, BY + 0.03, G - 0.002)],
                         [(BX - 0.29, BY - 0.055, G + 0.06), (BX + 0.24, BY - 0.055, G + 0.06), (BX + 0.36, BY, G + 0.07), (BX + 0.24, BY + 0.055, G + 0.06), (BX - 0.29, BY + 0.055, G + 0.06)]], outline=0.004)
box('deckhouse', M['white'], BX - 0.08, BY, G + 0.055, 0.08, 0.05, 0.03, outline=0.002, bevel=0)
bar('bowsprit', M['mast'], (BX + 0.34, BY, G + 0.065), (BX + 0.48, BY, G + 0.085), 0.008, outline=0.001)
for k, (mx, h) in enumerate(((BX + 0.1, 0.52), (BX - 0.12, 0.48))):
    rod(f'mast{k}', M['mast'], (mx, BY, G + 0.05), (mx, BY, G + h), 0.008, segs=8, outline=0.001)
    bar(f'boom{k}', M['mast'], (mx, BY, G + 0.1), (mx - 0.2, BY, G + 0.1), 0.007, outline=0.001)
    loft(f'sail{k}', M['sail'], [[(mx - 0.19, BY - 0.003, G + 0.105), (mx - 0.01, BY - 0.003, G + 0.105), (mx - 0.01, BY - 0.003, G + h - 0.05), (mx - 0.16, BY - 0.003, G + h - 0.15)],
                                 [(mx - 0.19, BY + 0.003, G + 0.105), (mx - 0.01, BY + 0.003, G + 0.105), (mx - 0.01, BY + 0.003, G + h - 0.05), (mx - 0.16, BY + 0.003, G + h - 0.15)]], outline=0.002)
loft('jib', M['sail'], [[(BX + 0.12, BY - 0.003, G + 0.1), (BX + 0.44, BY - 0.003, G + 0.09), (BX + 0.12, BY - 0.003, G + 0.42)],
                        [(BX + 0.12, BY + 0.003, G + 0.1), (BX + 0.44, BY + 0.003, G + 0.09), (BX + 0.12, BY + 0.003, G + 0.42)]], outline=0.002)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
