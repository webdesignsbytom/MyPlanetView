# A cartoon Big Ben (the Elizabeth Tower) for the country maps, built from primitives in the
# set's shared look (../toon.py: toon shading, outline, grass tile, camera, sun).
# Run: blender -b --factory-startup -P big-ben.py -- big-ben-1024.png 1024 big-ben.blend
# then, from the repo root: node images/src/tools/landmark-models.mjs
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from toon import *

setup()
M.update({
    'stone': toon('stone', '#ecc88c'),
    'stoneLight': toon('stoneLight', '#f6dcaa'),
    'stoneDark': toon('stoneDark', '#cf9f63'),
    'roof': toon('roof', '#3f5873', shadow_mul=(0.72, 0.72, 0.82), lift=0.22),
    'window': flat('window', '#4b3a55'),
})

# ---------- the tile ----------
GROUND_Z = tile()
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

render(GROUND_Z)
