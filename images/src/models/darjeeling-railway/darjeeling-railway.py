# A cartoon Darjeeling Himalayan Railway for the country maps, built in the set's shared look
# (../toon.py): the toy train at the Batasia Loop, its little blue steam engine with the tall
# chimney pulling two blue carriages round the circle of narrow-gauge track, the war memorial in the
# garden inside the loop, the tea gardens' rows of bushes on the hills, and the snows of
# Kangchenjunga behind. Turned a little towards the camera.
# Run: blender -b --factory-startup -P darjeeling-railway.py -- darjeeling-railway-1024.png 1024 darjeeling-railway.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys, random
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'grass': toon('grass2', '#7cb85a', shadow_mul=(0.7, 0.78, 0.8), lift=0.2),
    'garden': toon('garden', '#8ac860'),
    'tea': toon('tea', '#3f8a40', shadow_mul=(0.7, 0.78, 0.8)),
    'hill': toon('hill', '#6aa54a', shadow_mul=(0.72, 0.8, 0.74)),
    'mountain': toon('mountain', '#8a96a8', shadow_mul=(0.8, 0.84, 0.92)),
    'snow': toon('snow', '#f6f8fa', lift=0.3),
    'ballast': toon('ballast', '#a89c8a'),
    'rail': toon('rail', '#5a5a60'),
    'blue': toon('blue', '#2a5ab0', lift=0.1),
    'blueDark': toon('blueDark', '#1e3a7a'),
    'black': toon('black', '#2a2a2e'),
    'red': toon('red', '#c43a2a'),
    'white': toon('white', '#f4f0e6', lift=0.15),
    'window': flat('window', '#3a4a5a'),
    'stone': toon('stone', '#c8c0b0'),
})

G = tile(M['grass'])
before = set(bpy.data.objects)

for k, (x, y, r, h) in enumerate(((-0.4, 0.88, 0.34, 0.55), (0.25, 0.95, 0.3, 0.64), (0.75, 0.68, 0.3, 0.45))):
    mt = lathe(f'mountain{k}', M['mountain'], ((r, 0), (r * 0.6, h * 0.55), (r * 0.28, h * 0.85), (0.004, h)), G - 0.01, x, y, segs=10, outline=0.008, smooth=False)
    mt.visible_shadow = False
    lathe(f'snow{k}', M['snow'], ((r * 0.47, 0), (r * 0.31, h * 0.15), (0.004, h * 0.3 + 0.012)), G - 0.01 + h * 0.7, x, y, segs=10, outline=0.004, smooth=False)
for k, (x, y, r) in enumerate(((-0.8, 0.3, 0.34), (0.85, 0.15, 0.3))):
    hl = lathe(f'teahill{k}', M['hill'], ((r, 0), (r * 0.7, 0.1), (r * 0.35, 0.16)), G - 0.01, x, y, segs=24, outline=0.006)
    hl.visible_shadow = False
    for j, (rr, z) in enumerate(((r * 0.86, 0.04), (r * 0.6, 0.1), (r * 0.38, 0.145))):
        for i in range(14):
            a = 2 * math.pi * i / 14
            ball(f'tea{k}{j}{i}', M['tea'], x + rr * math.cos(a), y + rr * math.sin(a), G + z, 0.025, outline=0.002)

# ---------- the loop ----------
LX, LY, R = 0.0, -0.12, 0.5
lathe('loopgarden', M['garden'], ((R - 0.05, 0), (R - 0.05, 0.008)), G - 0.004, LX, LY, segs=40, outline=0.002)
n = 40
for i in range(n):
    a0, a1 = 2 * math.pi * i / n, 2 * math.pi * (i + 1) / n
    bar(f'ballast{i}', M['ballast'], (LX + R * math.cos(a0), LY + R * math.sin(a0), G + 0.004), (LX + R * math.cos(a1), LY + R * math.sin(a1), G + 0.004), 0.08, outline=0)
    for rr in (R - 0.022, R + 0.022):
        bar(f'rail{i}{rr}', M['rail'], (LX + rr * math.cos(a0), LY + rr * math.sin(a0), G + 0.014), (LX + rr * math.cos(a1), LY + rr * math.sin(a1), G + 0.014), 0.008, outline=0)
lathe('memorialbase', M['stone'], ((0.08, 0), (0.08, 0.03), (0.05, 0.05)), G - 0.004, LX, LY, segs=8, outline=0.003, smooth=False)
lathe('memorial', M['stone'], ((0.022, 0), (0.014, 0.2), (0.004, 0.23)), G + 0.045, LX, LY, segs=4, outline=0.002, smooth=False)
for k in range(6):
    a = 2 * math.pi * k / 6
    ball(f'flowers{k}', M['red'], LX + 0.25 * math.cos(a), LY + 0.25 * math.sin(a), G + 0.02, 0.03, outline=0.002)

# ---------- the train ----------
def place(objs, ang):
    bpy.context.view_layer.update()
    x, y = LX + R * math.cos(ang), LY + R * math.sin(ang)
    m = Matrix.Translation((x, y, 0)) @ Matrix.Rotation(ang + math.pi / 2, 4, 'Z')
    for o in objs:
        o.matrix_world = m @ o.matrix_world


Z = G + 0.02
mark = set(bpy.data.objects)
box('engineframe', M['blueDark'], 0, 0, Z, 0.17, 0.07, 0.02, outline=0.002, bevel=0)
cyl('boiler', M['blue'], 0.03, 0.11, segs=14, outline=0.003, matrix=Matrix.Translation((0.03, 0, Z + 0.05)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
rod('chimney', M['black'], (0.075, 0, Z + 0.07), (0.075, 0, Z + 0.13), 0.012, r2=0.016, segs=10, outline=0.002)
box('cab', M['blue'], -0.055, 0, Z + 0.015, 0.06, 0.07, 0.08, outline=0.003, bevel=0)
box('cabroof', M['blueDark'], -0.055, 0, Z + 0.095, 0.07, 0.08, 0.012, outline=0.002, bevel=0)
box('cabwindow', M['window'], -0.055, -0.037, Z + 0.06, 0.03, 0.004, 0.025, outline=0, bevel=0)
for dx in (-0.05, 0.0, 0.05):
    for s in (-1, 1):
        cyl(f'wheel{dx}{s}', M['red'], 0.016, 0.008, segs=12, outline=0.001, matrix=Matrix.Translation((dx, s * 0.038, Z + 0.006)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
place([o for o in bpy.data.objects if o not in mark], math.radians(250))
for c, ang in enumerate((math.radians(222), math.radians(196))):
    mark = set(bpy.data.objects)
    box(f'carriage{c}', M['blue'], 0, 0, Z, 0.15, 0.07, 0.08, outline=0.003, bevel=0)
    box(f'carriageroof{c}', M['white'], 0, 0, Z + 0.08, 0.16, 0.08, 0.012, outline=0.002, bevel=0)
    for j in range(3):
        box(f'carriagewin{c}{j}', M['window'], -0.045 + j * 0.045, -0.037, Z + 0.035, 0.03, 0.004, 0.025, outline=0, bevel=0)
    place([o for o in bpy.data.objects if o not in mark], ang)

bpy.context.view_layer.update()
turn(before, -20)
render(G)
