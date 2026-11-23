# A cartoon Copán for the country maps, built in the set's shared look (../toon.py): the Maya city's
# lawn-green Great Plaza, the temple with its Hieroglyphic Stairway under its sheltering roof, the
# ball court's two sloping benches with their macaw-head markers, carved stelae standing in the
# plaza, a great ceiba tree, and scarlet macaws. Turned a little towards the camera.
# Run: blender -b --factory-startup -P copan.py -- copan-1024.png 1024 copan.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'lawn': toon('lawn', '#86c464', shadow_mul=(0.7, 0.78, 0.8), lift=0.25),
    'stone': toon('stone', '#b8ae96', shadow_mul=(0.8, 0.78, 0.84)),
    'stoneDark': toon('stoneDark', '#9a8f78', shadow_mul=(0.8, 0.78, 0.84)),
    'glyph': flat('glyph', '#6f6654'),
    'canvas': toon('canvas', '#e8dfc8', shadow_mul=(0.82, 0.8, 0.86), lift=0.2),
    'pole': toon('pole', '#8a6448'),
    'stela': toon('stela', '#c9b48a', shadow_mul=(0.82, 0.76, 0.76)),
    'ceiba': toon('ceiba', '#a8a49a', shadow_mul=(0.8, 0.8, 0.86)),
    'leaf': toon('leaf', '#4f9a4a', shadow_mul=(0.7, 0.78, 0.8)),
    'macawRed': toon('macawRed', '#e0302a'),
    'macawBlue': toon('macawBlue', '#2f6fd0', shadow_mul=(0.72, 0.72, 0.82)),
    'macawYellow': toon('macawYellow', '#f4c83c', shadow_mul=(0.8, 0.68, 0.55)),
    'beak': toon('beak', '#f4efe2', lift=0.2),
})

G = tile(M['lawn'])
before = set(bpy.data.objects)
rng = random.Random(283)

# ---------- the temple of the Hieroglyphic Stairway ----------
TX, TY, TW, TD, TH = -0.3, 0.55, 0.8, 0.55, 0.5
for k in range(5):
    w = TW - k * 0.1
    d = TD - k * 0.07
    box(f'temple{k}', M['stone'] if k % 2 == 0 else M['stoneDark'], TX, TY, G - 0.005 + k * TH / 5, w, d, TH / 5 + 0.002, outline=0.018, bevel=0)
STEPS = 14
SW = 0.3
for j in range(STEPS):
    t = j / STEPS
    half_d = (TD - (TD - 0.28) * t) / 2
    box(f'step{j}', M['stoneDark'], TX, TY - half_d - 0.04, G - 0.005 + TH * t, SW, 0.09, TH / STEPS + 0.004, outline=0.006, bevel=0)
    for g in range(5):
        box(f'glyph{j}{g}', M['glyph'], TX - 0.12 + g * 0.06, TY - half_d - 0.086, G + TH * t + 0.008, 0.03, 0.004, 0.018, outline=0, bevel=0)
# the roof that shelters the stairway
for sx in (-1, 1):
    for sy in (0, 1):
        x, y = TX + sx * 0.2, TY - 0.32 + sy * 0.32
        rod(f'shelterpole{sx}{sy}', M['pole'], (x, y, G), (x, y, G + 0.62), 0.008, segs=6, outline=0.003)
loft('shelter', M['canvas'], [[(TX - 0.24, TY - 0.36, G + 0.62), (TX + 0.24, TY - 0.36, G + 0.62), (TX + 0.24, TY + 0.04, G + 0.62), (TX - 0.24, TY + 0.04, G + 0.62)],
                              [(TX - 0.24, TY - 0.16, G + 0.7), (TX + 0.24, TY - 0.16, G + 0.7), (TX + 0.24, TY - 0.15, G + 0.7), (TX - 0.24, TY - 0.15, G + 0.7)]],
     outline=0.012)
box('templetop', M['stone'], TX, TY + 0.05, G + TH - 0.005, 0.3, 0.2, 0.12, outline=0.016, bevel=0)

# ---------- the ball court: two sloping benches with the alley between ----------
BX, BY = 0.55, 0.15
for s in (-1, 1):
    x_in, x_out = BX + s * 0.1, BX + s * 0.3
    loft(f'bench{s}', M['stone'], [[(x_in, BY - 0.35, G - 0.005), (x_out, BY - 0.35, G - 0.005), (x_out, BY + 0.35, G - 0.005), (x_in, BY + 0.35, G - 0.005)],
                                   [(x_in + s * 0.08, BY - 0.35, G + 0.16), (x_out, BY - 0.35, G + 0.16), (x_out, BY + 0.35, G + 0.16), (x_in + s * 0.08, BY + 0.35, G + 0.16)]],
         outline=0.016)
    for k, dy in enumerate((-0.2, 0.0, 0.2)):
        x = BX + s * 0.2
        box(f'markerneck{s}{k}', M['stela'], x, BY + dy, G + 0.155, 0.04, 0.04, 0.03, outline=0.006, bevel=0)
        box(f'macawhead{s}{k}', M['stela'], x - s * 0.01, BY + dy, G + 0.185, 0.06, 0.05, 0.05, outline=0.008, bevel=0.008)
        rod(f'macawbeak{s}{k}', M['stela'], (x - s * 0.04, BY + dy, G + 0.22), (x - s * 0.07, BY + dy, G + 0.19), 0.014, r2=0.004, segs=6, outline=0.004)
box('alley', M['stone'], BX, BY, G - 0.005, 0.2, 0.7, 0.012, outline=0, bevel=0)

# ---------- carved stelae in the plaza ----------
for k, (x, y) in enumerate(((-0.35, -0.3), (0.0, -0.55), (0.35, -0.75), (-0.7, -0.6))):
    box(f'stela{k}', M['stela'], x, y, G - 0.005, 0.09, 0.06, 0.34, outline=0.014, bevel=0.004)
    box(f'stelaface{k}', M['glyph'], x, y - 0.032, G + 0.2, 0.05, 0.005, 0.06, outline=0, bevel=0)
    box(f'stelabody{k}', M['glyph'], x, y - 0.032, G + 0.05, 0.03, 0.005, 0.12, outline=0, bevel=0)
    box(f'stelacap{k}', M['stela'], x, y, G + 0.33, 0.11, 0.08, 0.035, outline=0.01, bevel=0)
    box(f'altar{k}', M['stoneDark'], x, y - 0.12, G - 0.005, 0.08, 0.08, 0.05, outline=0.01, bevel=0.01)

# ---------- a great ceiba ----------
CX, CY = 0.95, -0.4
rod('ceibatrunk', M['ceiba'], (CX, CY, G), (CX, CY, G + 0.5), 0.05, r2=0.035, segs=10, outline=0.012)
for k in range(4):
    a = 2 * math.pi * k / 4 + 0.3
    rod(f'buttress{k}', M['ceiba'], (CX, CY, G + 0.12), (CX + 0.1 * math.cos(a), CY + 0.1 * math.sin(a), G), 0.025, r2=0.012, segs=6, outline=0.006)
crown = ball('ceibacrown', M['leaf'], 0, 0, 0, 0.3, outline=0.024)
crown.scale = (1, 1, 0.38)
crown.location = (CX, CY, G + 0.55)


# ---------- scarlet macaws ----------
def macaw(name, x, y, z, deg, flying=False, size=1.8):
    made = set(bpy.data.objects)
    a = math.radians(deg)
    fx, fy = math.cos(a), math.sin(a)
    body = ball(f'{name}body', M['macawRed'], 0, 0, 0, 0.028, outline=0.006)
    body.scale = (1.4, 1, 1)
    body.rotation_euler = (0, 0, a)
    body.location = (x, y, z)
    ball(f'{name}head', M['macawRed'], x + fx * 0.04, y + fy * 0.04, z + 0.02, 0.018, outline=0.005)
    rod(f'{name}beak', M['beak'], (x + fx * 0.055, y + fy * 0.055, z + 0.022), (x + fx * 0.07, y + fy * 0.07, z + 0.008), 0.008, r2=0.002, segs=6, outline=0)
    bar(f'{name}tail', M['macawRed'], (x - fx * 0.03, y - fy * 0.03, z), (x - fx * 0.12, y - fy * 0.12, z - (0.0 if flying else 0.06)), 0.014, outline=0.004)
    for side in (-1, 1):
        px, py = -fy * side, fx * side
        if flying:
            bar(f'{name}wing{side}', M['macawBlue'], (x + px * 0.02, y + py * 0.02, z + 0.01), (x + px * 0.11, y + py * 0.11, z + 0.05), 0.022, outline=0.004)
            bar(f'{name}wingband{side}', M['macawYellow'], (x + px * 0.02, y + py * 0.02, z + 0.005), (x + px * 0.07, y + py * 0.07, z + 0.03), 0.012, outline=0)
        else:
            bar(f'{name}wing{side}', M['macawBlue'], (x + px * 0.025, y + py * 0.025, z + 0.01), (x + px * 0.025 - fx * 0.06, y + py * 0.025 - fy * 0.06, z - 0.03),
                0.016, outline=0.004)
    # scaled up about its own middle, so it reads at map size
    bpy.context.view_layer.update()
    grow = Matrix.Translation((x, y, z)) @ Matrix.Scale(size, 4) @ Matrix.Translation((-x, -y, -z))
    for ob in set(bpy.data.objects) - made:
        ob.matrix_world = grow @ ob.matrix_world


macaw('macaw1', -0.35, -0.3, G + 0.42, -120)
macaw('macaw2', 0.0, 0.0, G + 0.85, -150, flying=True)
macaw('macaw3', CX - 0.12, CY - 0.1, G + 0.68, -100)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
