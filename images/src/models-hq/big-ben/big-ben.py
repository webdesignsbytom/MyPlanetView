# Big Ben (the Elizabeth Tower) in the high-quality look (hq.py), made afresh: the tower of honey
# limestone on its granite plinth, its corner shafts, each face panelled in tiers of pointed
# Gothic panels between ribs and string courses, with lancet windows; the clock stage with its four
# dials, each in a Prussian blue and gold surround with gilded spandrels, an opal glass face in
# black iron tracery (the rings, the twelve marks, the spokes), gilded hands at ten past ten and the
# gilded inscription above; the pierced parapet and corner pinnacles; the belfry's tall openings;
# the steep Prussian blue spire with gilded hips and bands, two tiers of dormers, the Ayrton Light's
# lantern and the gilded finial with its orb and cross. Behind, the Palace of Westminster: two
# ranges of buttressed bays with tiers of windows, pinnacles and iron cresting, the Central Tower's
# spire and the Victoria Tower with its turrets and the Union Flag; the Thames behind its
# embankment with a tour boat; in front a road with a red double-decker bus, a black cab, a red
# telephone box, lamp posts, Parliament Square's trees and people.
# Run: blender -b --factory-startup -P big-ben.py -- big-ben-1024.png 1024 big-ben.blend [samples]
import os, sys
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hq import *

setup()
rng = random.Random(1859)
M['ston'] = material('ston', '#dcc38f', 0.6, vary='#cdb27c', vary_scale=22, bump=0.08, bump_scale=160)
M['stonShade'] = material('stonShade', '#bea474', 0.65, vary='#b29766', vary_scale=22, bump=0.06, bump_scale=160)
M['prussian'] = material('prussian', '#24365a', 0.38, vary='#1f2f4f', vary_scale=20, metallic=0.35, coat=0.3)
M['gilt'] = material('gilt', '#e7b44a', 0.25, vary='#d49f36', vary_scale=30, metallic=1.0)
M['dial'] = material('dial', '#f7f2e3', 0.3, emission=('#fff4d8', 0.35))
M['ironBlack'] = material('ironBlack', '#1d2026', 0.45, metallic=0.5)
M['lancet'] = material('lancet', '#2b3241', 0.2, metallic=0.3, coat=0.4)
M['roofSlate'] = material('roofSlate', '#5a6474', 0.5, vary='#4f5868', vary_scale=14, bump=0.1, bump_scale=240)
M['asphalt'] = material('asphalt', '#55545a', 0.8, vary='#4b4a50', vary_scale=40, bump=0.1, bump_scale=300)
M['busRed'] = material('busRed', '#c8261e', 0.35, coat=0.5)
M['cabBlack'] = material('cabBlack', '#16181c', 0.25, coat=0.7, metallic=0.2)
M['tyre'] = material('tyre', '#1b1b1d', 0.8)
M['lamp'] = material('lamp', '#fff1c7', 0.3, emission=('#ffe9b0', 1.2))
M['flagBlue'] = material('flagBlue', '#1d3b7a', 0.6)
M['flagRed'] = material('flagRed', '#c8102e', 0.6)

FACES = ((0, -1), (1, 0), (0, 1), (-1, 0))
STONE_BARS, GILT_BARS, IRON_BARS = bmesh.new(), bmesh.new(), bmesh.new()
PANELS, LANCETS, DARK = [], [], []
PINS = bmesh.new()     # stone pinnacles, as one object


def member(bm, p0, p1, t):
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    if d.length < 1e-6:
        return
    rot = d.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((p0 + p1) / 2) @ rot @ Matrix.Diagonal((t, t, d.length, 1)))


def face_matrix(cx, cy, cz, nrm, out=0.0):
    """A frame on a wall: x to the right as you face it, y up, z out of the wall."""
    nx, ny = nrm
    tx, ty = -ny, nx
    return Matrix(((tx, 0, nx, cx + nx * out), (ty, 0, ny, cy + ny * out), (0, 1, 0, cz), (0, 0, 0, 1)))


def pinnacle(x, y, z, r, h):
    """A little square pinnacle: a shaft and a spirelet (into PINS)."""
    bmesh.ops.create_cube(PINS, size=1.0, matrix=Matrix.Translation((x, y, z + h * 0.2)) @ Matrix.Diagonal((r * 2, r * 2, h * 0.4, 1)))
    bmesh.ops.create_cone(PINS, cap_ends=True, segments=4, radius1=r * 1.25, radius2=0.0, depth=h * 0.6,
                          matrix=Matrix.Translation((x, y, z + h * 0.4 + h * 0.3)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))


def panelled(cx, cy, hw, tiers, bays, lancet_rows=(), rib=0.011):
    """A square shaft's four faces panelled: a pointed panel in every bay of every tier, ribs
    between the bays, a string course at every tier, and lancet windows in the middle bays."""
    for nrm in FACES:
        nx, ny = nrm
        tx, ty = -ny, nx
        fx, fy = cx + nx * hw, cy + ny * hw
        bw = 2 * hw / bays
        for t, (z0, z1) in enumerate(zip(tiers, tiers[1:])):
            for b in range(bays):
                u = -hw + (b + 0.5) * bw
                PANELS.append((fx + tx * u, fy + ty * u, z0 + 0.012, bw * 0.74, z1 - z0 - 0.026, nrm, 'pointed'))
                if t in lancet_rows and 0 < b < bays - 1:
                    LANCETS.append((fx + tx * u + nx * 0.002, fy + ty * u + ny * 0.002, z0 + (z1 - z0) * 0.22, bw * 0.3, (z1 - z0) * 0.5, nrm, 'pointed'))
        for b in range(1, bays):
            u = -hw + b * bw
            member(STONE_BARS, (fx + tx * u + nx * 0.003, fy + ty * u + ny * 0.003, tiers[0]), (fx + tx * u + nx * 0.003, fy + ty * u + ny * 0.003, tiers[-1]), rib)
    for z in tiers[1:-1]:
        box(f'course{cx:.2f}{z:.3f}', M['ston'], (cx, cy, z), (2 * hw + 0.016, 2 * hw + 0.016, 0.012), bevel=0.002)


# ------------------------------------------------------------------ the ground: the Thames, the road, the lawns
slab('thames', M['water'], rect(0, 1.17, 3.4, 0.86), G - 0.004, G + 0.004, margin=0.006)
slab('embankment', M['granite'], rect(0, 0.735, 3.4, 0.04), G - 0.004, G + 0.04, bevel=0.002, margin=0.006)
slab('terrace', M['paving'], rect(-0.45, 0.7, 1.4, 0.04), G - 0.002, G + 0.01, margin=0.01)
slab('road', M['asphalt'], rect(0, -0.86, 3.4, 0.27), G - 0.003, G + 0.006)
for s in (-1, 1):
    slab(f'pavement{s}', M['paving'], rect(0, -0.86 + s * 0.17, 3.4, 0.07), G - 0.003, G + 0.014, bevel=0.002)
x = -1.5
while x < 1.5:
    if math.hypot(abs(x) + 0.05, 0.86) < 1.4:
        box(f'dash{x:.2f}', M['white'], (x, -0.86, G + 0.0065), (0.07, 0.008, 0.002), bevel=0)
    x += 0.14
slab('yard', M['paving'], rect(0.05, -0.06, 0.9, 0.5), G - 0.002, G + 0.008, margin=0.05)
slab('palaceWalk', M['paving'], rect(-0.48, 0.12, 1.14, 0.1), G - 0.002, G + 0.008)

# ------------------------------------------------------------------ the Elizabeth Tower
BX, BY, HW = 0.3, -0.08, 0.17
Z1, Z2 = G + 1.62, G + 2.04        # the clock stage
Z3, Z4 = G + 2.09, G + 2.35        # the belfry
box('plinthBB', M['granite'], (BX, BY, G + 0.04), (2 * HW + 0.05, 2 * HW + 0.05, 0.08), bevel=0.004)
box('shaft', M['ston'], (BX, BY, (G + 0.08 + Z1) / 2), (2 * HW, 2 * HW, Z1 - G - 0.08), bevel=0.002)
panelled(BX, BY, HW, [G + 0.08, G + 0.32, G + 0.54, G + 0.76, G + 0.98, G + 1.2, G + 1.41, Z1], 4, lancet_rows=(1, 3, 5))
DARK.append((BX, BY - HW - 0.004, G + 0.08, 0.07, 0.14, (0, -1), 'pointed'))   # the doorway
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = BX + sx * (HW + 0.004), BY + sy * (HW + 0.004)
        cylinder(f'cornerShaft{sx}{sy}', M['ston'], 0.03, Z1 - G - 0.06, (x, y, G + 0.06), segs=8)
        for z in (G + 0.32, G + 0.76, G + 1.2):
            cylinder(f'cornerRing{sx}{sy}{z:.2f}', M['ston'], 0.036, 0.016, (x, y, z), segs=8)

# the clock stage and its dials
H2 = HW + 0.018
box('corbel', M['ston'], (BX, BY, Z1 + 0.012), (2 * H2 + 0.012, 2 * H2 + 0.012, 0.024), bevel=0.003)
box('clockStage', M['ston'], (BX, BY, (Z1 + Z2) / 2), (2 * H2, 2 * H2, Z2 - Z1), bevel=0.002)
ZC, DR = Z1 + 0.215, 0.128
for nrm in FACES:
    nx, ny = nrm
    fm = face_matrix(BX + nx * H2, BY + ny * H2, ZC, nrm)
    box_m(f'surround{nrm}', M['prussian'], fm @ Matrix.Translation((0, 0, 0.004)), (0.33, 0.33, 0.012), bevel=0.002)
    for (u, v, w, h) in ((0, 0.166, 0.34, 0.012), (0, -0.166, 0.34, 0.012), (0.166, 0, 0.012, 0.34), (-0.166, 0, 0.012, 0.34)):
        box_m(f'surroundGilt{nrm}{u}{v}', M['gilt'], fm @ Matrix.Translation((u, v, 0.011)), (w, h, 0.006), bevel=0.001)
    bm = bmesh.new()
    for cu, cv in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        a, b_ = 0.158, 0.075
        tri = [(cu * a, cv * a), (cu * (a - b_), cv * a), (cu * a, cv * (a - b_))]
        add_prism(bm, [bm.verts.new(fm @ Vector((u, v, 0.01))) for u, v in tri], [bm.verts.new(fm @ Vector((u, v, 0.016))) for u, v in tri])
    finish(f'spandrels{nrm}', bm, M['gilt'], smooth_sides=False)
    cylinder(f'dial{nrm}', M['dial'], DR, 0.008, (0, 0, 0.008), segs=64, matrix=fm)
    annulus(f'dialRim{nrm}', M['ironBlack'], DR, DR - 0.009, 0.016, 0.021, segs=64, matrix=fm)
    annulus(f'dialRing{nrm}', M['ironBlack'], DR - 0.03, DR - 0.035, 0.016, 0.02, segs=64, matrix=fm)
    annulus(f'dialInner{nrm}', M['ironBlack'], 0.06, 0.055, 0.016, 0.02, segs=48, matrix=fm)
    for k in range(12):
        a = 2 * math.pi * k / 12
        d = Vector((math.sin(a), math.cos(a), 0))
        member(IRON_BARS, fm @ (d * (DR - 0.028) + Vector((0, 0, 0.018))), fm @ (d * (DR - 0.012) + Vector((0, 0, 0.018))), 0.009 if k % 3 == 0 else 0.006)
        member(IRON_BARS, fm @ (d * 0.018 + Vector((0, 0, 0.017))), fm @ (d * 0.056 + Vector((0, 0, 0.017))), 0.003)
    # gilded hands at ten past ten, and the boss
    for ang, ln, th in ((-60, 0.06, 0.011), (60, 0.1, 0.008)):
        a = math.radians(ang)
        member(GILT_BARS, fm @ Vector((0, 0, 0.026)), fm @ Vector((math.sin(a) * ln, math.cos(a) * ln, 0.026)), th)
    cylinder(f'boss{nrm}', M['gilt'], 0.013, 0.012, (0, 0, 0.018), segs=16, matrix=fm)
    # the gilded inscription above, and the band below
    box_m(f'inscription{nrm}', M['gilt'], fm @ Matrix.Translation((0, 0.188, 0.004)), (0.3, 0.014, 0.006))
    box_m(f'inscriptionBelow{nrm}', M['gilt'], fm @ Matrix.Translation((0, -0.19, 0.004)), (0.24, 0.01, 0.006))
# the pierced parapet and the corner pinnacles
box('parapet', M['ston'], (BX, BY, Z2 + 0.022), (2 * H2 + 0.02, 2 * H2 + 0.02, 0.044), bevel=0.002)
for nrm in FACES:
    nx, ny = nrm
    tx, ty = -ny, nx
    for i in range(9):
        u = -H2 + (i + 0.5) * 2 * H2 / 9
        DARK.append((BX + nx * (H2 + 0.012) + tx * u, BY + ny * (H2 + 0.012) + ty * u, Z2 + 0.01, 0.02, 0.022, nrm, 'round'))
for sx in (-1, 1):
    for sy in (-1, 1):
        pinnacle(BX + sx * (H2 + 0.005), BY + sy * (H2 + 0.005), Z2, 0.022, 0.15)

# the belfry
H3 = HW - 0.01
box('belfry', M['ston'], (BX, BY, (Z2 + Z4) / 2), (2 * H3, 2 * H3, Z4 - Z2), bevel=0.002)
for nrm in FACES:
    nx, ny = nrm
    tx, ty = -ny, nx
    for u in (-0.095, 0.0, 0.095):
        DARK.append((BX + nx * H3 + tx * u, BY + ny * H3 + ty * u, Z3, 0.07, Z4 - Z3 - 0.04, nrm, 'pointed'))
    for u in (-0.0475, 0.0475):
        member(STONE_BARS, (BX + nx * (H3 + 0.005) + tx * u, BY + ny * (H3 + 0.005) + ty * u, Z3), (BX + nx * (H3 + 0.005) + tx * u, BY + ny * (H3 + 0.005) + ty * u, Z4 - 0.03), 0.012)
box('belfryCornice', M['ston'], (BX, BY, Z4 - 0.006), (2 * H3 + 0.024, 2 * H3 + 0.024, 0.02), bevel=0.002)
for sx in (-1, 1):
    for sy in (-1, 1):
        pinnacle(BX + sx * (H3 + 0.008), BY + sy * (H3 + 0.008), Z4, 0.018, 0.13)

# the spire: Prussian blue iron, gilded hips and bands, two tiers of dormers, the Ayrton Light
SP = [(0.172, 0.0), (0.172, 0.016), (0.152, 0.05), (0.118, 0.17), (0.084, 0.32), (0.054, 0.46), (0.04, 0.52)]
spire_m = Matrix.Translation((BX, BY, Z4)) @ Matrix.Rotation(math.pi / 4, 4, 'Z')
lathe('spireRoof', M['prussian'], [(r * math.sqrt(2), z) for r, z in SP], (0, 0, 0), segs=4, matrix=spire_m)
for sx in (-1, 1):
    for sy in (-1, 1):
        tube(f'spireHip{sx}{sy}', M['gilt'], [(BX + sx * r, BY + sy * r, Z4 + z) for r, z in SP[1:]], 0.0045)
for z, r in ((0.05, 0.155), (0.17, 0.121), (0.32, 0.087)):
    lathe(f'spireBand{z}', M['gilt'], [(r * math.sqrt(2), 0), (r * math.sqrt(2), 0.008)], (0, 0, 0), segs=4, matrix=Matrix.Translation((BX, BY, Z4 + z - 0.004)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
for nrm in FACES:
    nx, ny = nrm
    for z, off, w, h in ((0.07, 0.128, 0.07, 0.07), (0.235, 0.088, 0.05, 0.055)):
        x, y = BX + nx * off, BY + ny * off
        fm = face_matrix(x, y, Z4 + z, nrm)
        box_m(f'dormer{nrm}{z}', M['prussian'], fm @ Matrix.Translation((0, h / 2, 0.0)), (w, h, 0.05), bevel=0.002)
        windows(f'dormerWindow{nrm}{z}', M['lancet'], [(x + nx * 0.026, y + ny * 0.026, Z4 + z + h * 0.15, w * 0.45, h * 0.6, nrm, 'pointed')], depth=0.004)
        bm = bmesh.new()
        tri = [(-w / 2 - 0.006, h), (w / 2 + 0.006, h), (0, h + w * 0.7)]
        add_prism(bm, [bm.verts.new(fm @ Vector((u, v, -0.03))) for u, v in tri], [bm.verts.new(fm @ Vector((u, v, 0.028))) for u, v in tri])
        finish(f'dormerGable{nrm}{z}', bm, M['prussian'], smooth_sides=False)
        member(GILT_BARS, fm @ Vector((0, h + w * 0.7, 0.028)), fm @ Vector((0, h + w * 0.7 + 0.03, 0.028)), 0.005)
Z5 = Z4 + 0.52
box('lanternBase', M['gilt'], (BX, BY, Z5 + 0.006), (0.09, 0.09, 0.012), bevel=0.002)
box('lanternGlass', M['lamp'], (BX, BY, Z5 + 0.05), (0.06, 0.06, 0.07), bevel=0.002)
for sx in (-1, 1):
    for sy in (-1, 1):
        member(GILT_BARS, (BX + sx * 0.036, BY + sy * 0.036, Z5 + 0.012), (BX + sx * 0.036, BY + sy * 0.036, Z5 + 0.09), 0.01)
lathe('lanternSpire', M['prussian'], [(0.055 * math.sqrt(2), 0), (0.055 * math.sqrt(2), 0.01), (0.0, 0.16)], (0, 0, 0), segs=4, matrix=Matrix.Translation((BX, BY, Z5 + 0.088)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
lathe('finialOrb', M['gilt'], [(0.0, 0), (0.016, 0.008), (0.02, 0.022), (0.014, 0.036), (0.0, 0.042)], (BX, BY, Z5 + 0.24), segs=20, smooth=True)
member(GILT_BARS, (BX, BY, Z5 + 0.28), (BX, BY, Z5 + 0.36), 0.008)
member(GILT_BARS, (BX - 0.024, BY, Z5 + 0.33), (BX + 0.024, BY, Z5 + 0.33), 0.007)


# ------------------------------------------------------------------ the Palace of Westminster
def gothic_range(name, x0, x1, y0, y1, h, bay=0.085, roof_rise=0.13):
    """A range of the palace: buttressed bays with three tiers of windows, string courses, a pierced
    parapet with a pinnacle on every buttress, a slate roof with iron cresting."""
    box(name, M['ston'], ((x0 + x1) / 2, (y0 + y1) / 2, G + h / 2), (x1 - x0, y1 - y0, h), bevel=0.002)
    for z in (G + 0.02, G + 0.19, G + 0.39):
        if z < G + h - 0.05:
            box(f'{name}Course{z:.2f}', M['ston'], ((x0 + x1) / 2, (y0 + y1) / 2, z), (x1 - x0 + 0.012, y1 - y0 + 0.012, 0.012), bevel=0.001)
    box(f'{name}Parapet', M['ston'], ((x0 + x1) / 2, (y0 + y1) / 2, G + h + 0.022), (x1 - x0 + 0.012, y1 - y0 + 0.012, 0.044), bevel=0.002)
    rows = [r for r in ((G + 0.04, 0.12), (G + 0.215, 0.15), (G + 0.415, 0.11)) if r[0] + r[1] < G + h - 0.03]
    for nrm, (ax, ay, bx, by) in (((0, -1), (x0, y0, x1, y0)), ((1, 0), (x1, y0, x1, y1)), ((0, 1), (x1, y1, x0, y1)), ((-1, 0), (x0, y1, x0, y0))):
        nx, ny = nrm
        tx, ty = -ny, nx
        L = math.hypot(bx - ax, by - ay)
        n = max(1, round(L / bay))
        for i in range(n + 1):
            f = i / n
            px, py = ax + (bx - ax) * f, ay + (by - ay) * f
            box(f'{name}Buttress{nrm}{i}', M['ston'], (px + nx * 0.009, py + ny * 0.009, G + h / 2), (0.022 if ny else 0.018, 0.018 if ny else 0.022, h), bevel=0.001)
            pinnacle(px + nx * 0.009, py + ny * 0.009, G + h + 0.04, 0.012, 0.1)
        for i in range(n):
            f = (i + 0.5) / n
            px, py = ax + (bx - ax) * f, ay + (by - ay) * f
            w = L / n * 0.5
            for z0, hh in rows:
                LANCETS.append((px, py, z0, w, hh, nrm, 'pointed'))
                member(STONE_BARS, (px + nx * 0.004, py + ny * 0.004, z0), (px + nx * 0.004, py + ny * 0.004, z0 + hh - w * 0.4), 0.005)
                member(STONE_BARS, (px + nx * 0.004 - tx * w / 2, py + ny * 0.004 - ty * w / 2, z0 + hh * 0.5), (px + nx * 0.004 + tx * w / 2, py + ny * 0.004 + ty * w / 2, z0 + hh * 0.5), 0.005)
            for k in range(3):
                g = (i + (k + 0.5) / 3) / n
                DARK.append((ax + (bx - ax) * g + nx * 0.006, ay + (by - ay) * g + ny * 0.006, G + h + 0.01, L / n * 0.18, 0.02, nrm, 'rect'))
    gable_roof(name + 'Roof', M['roofSlate'], x0, x1, y0, y1, G + h + 0.004, roof_rise, over=0.006)
    ym = (y0 + y1) / 2
    x = x0 + 0.02
    while x < x1 - 0.01:
        member(IRON_BARS, (x, ym, G + h + roof_rise), (x, ym, G + h + roof_rise + 0.035), 0.004)
        x += 0.03
    member(IRON_BARS, (x0, ym, G + h + roof_rise + 0.02), (x1, ym, G + h + roof_rise + 0.02), 0.004)


PH = 0.6
gothic_range('frontRange', -1.0, 0.0, 0.17, 0.42, PH)
gothic_range('riverRange', -1.0, 0.0, 0.42, 0.68, PH)
gothic_range('link', 0.0, 0.14, 0.04, 0.3, 0.44, bay=0.07, roof_rise=0.09)

# the Central Tower: an octagonal lantern with tall windows, pinnacles, and its spire
CX, CY = -0.42, 0.42
CZ = G + PH + 0.08
lathe('centralBase', M['ston'], [(0.13, 0), (0.13, 0.08)], (CX, CY, G + PH), segs=8)
lathe('centralLantern', M['ston'], [(0.11, 0), (0.11, 0.34)], (CX, CY, CZ), segs=8)
d8, w8 = 0.11 * math.cos(math.pi / 8), 2 * 0.11 * math.sin(math.pi / 8)
for k in range(8):
    a = math.pi / 8 + k * math.pi / 4
    LANCETS.append((CX + d8 * math.cos(a), CY + d8 * math.sin(a), CZ + 0.05, w8 * 0.5, 0.24, (math.cos(a), math.sin(a)), 'pointed'))
    b = 2 * math.pi * k / 8
    pinnacle(CX + 0.112 * math.cos(b), CY + 0.112 * math.sin(b), CZ + 0.34, 0.014, 0.12)
lathe('centralCornice', M['ston'], [(0.122, 0), (0.122, 0.018)], (CX, CY, CZ + 0.33), segs=8)
lathe('centralSpire', M['ston'], [(0.1, 0), (0.1, 0.01), (0.012, 0.4), (0.0, 0.42)], (CX, CY, CZ + 0.35), segs=8)
lathe('centralFinial', M['gilt'], [(0.0, 0), (0.012, 0.01), (0.008, 0.03), (0.0, 0.06)], (CX, CY, CZ + 0.76), segs=12, smooth=True)

# the Victoria Tower: panelled, its corner turrets, the Sovereign's Entrance, the Union Flag
VX, VY, VW = -0.82, 0.42, 0.17
VZ = G + 1.72
box('victoria', M['ston'], (VX, VY, (G + VZ) / 2), (2 * VW, 2 * VW, VZ - G), bevel=0.002)
panelled(VX, VY, VW, [G + PH + 0.06, G + 0.86, G + 1.12, G + 1.36, G + 1.56, VZ], 4, lancet_rows=(0, 2, 4))
box('victoriaParapet', M['ston'], (VX, VY, VZ + 0.025), (2 * VW + 0.016, 2 * VW + 0.016, 0.05), bevel=0.002)
for nrm in FACES:
    nx, ny = nrm
    tx, ty = -ny, nx
    for i in range(7):
        u = -VW + (i + 0.5) * 2 * VW / 7
        DARK.append((VX + nx * (VW + 0.008) + tx * u, VY + ny * (VW + 0.008) + ty * u, VZ + 0.012, 0.022, 0.026, nrm, 'round'))
for sx in (-1, 1):
    for sy in (-1, 1):
        x, y = VX + sx * VW, VY + sy * VW
        lathe(f'vTurret{sx}{sy}', M['ston'], [(0.036, 0), (0.036, VZ - G - PH + 0.16)], (x, y, G + PH), segs=8)
        lathe(f'vTurretCap{sx}{sy}', M['ston'], [(0.042, 0), (0.042, 0.02), (0.0, 0.14)], (x, y, VZ + 0.16), segs=8)
        lathe(f'vTurretTip{sx}{sy}', M['gilt'], [(0.0, 0), (0.008, 0.008), (0.0, 0.03)], (x, y, VZ + 0.29), segs=8, smooth=True)
cylinder('flagpole', M['white'], 0.005, 0.36, (VX, VY, VZ), segs=8)
fm = Matrix.Translation((VX + 0.08, VY - 0.002, VZ + 0.3)) @ Matrix.Rotation(math.radians(-20), 4, 'Z')
box_m('flag', M['flagBlue'], fm, (0.15, 0.004, 0.085))
for ang in (math.atan2(0.085, 0.15), -math.atan2(0.085, 0.15)):
    box_m(f'flagSaltire{ang:.2f}', M['white'], fm @ Matrix.Translation((0, -0.0028, 0)) @ Matrix.Rotation(ang, 4, 'Y'), (0.17, 0.0016, 0.016))
    box_m(f'flagSaltireRed{ang:.2f}', M['flagRed'], fm @ Matrix.Translation((0, -0.0038, 0)) @ Matrix.Rotation(ang, 4, 'Y'), (0.17, 0.0016, 0.006))
box_m('flagCrossW', M['white'], fm @ Matrix.Translation((0, -0.0048, 0)), (0.15, 0.0016, 0.026))
box_m('flagCrossW2', M['white'], fm @ Matrix.Translation((0, -0.0048, 0)), (0.026, 0.0016, 0.085))
box_m('flagCrossR', M['flagRed'], fm @ Matrix.Translation((0, -0.0058, 0)), (0.15, 0.0016, 0.015))
box_m('flagCrossR2', M['flagRed'], fm @ Matrix.Translation((0, -0.0058, 0)), (0.015, 0.0016, 0.085))


# ------------------------------------------------------------------ the street: a bus, a cab, a phone box, lamps, trees, people
def bus(name, x, y, rot):
    m = Matrix.Translation((x, y, G + 0.006)) @ Matrix.Rotation(rot, 4, 'Z')
    box_m(name, M['busRed'], m @ Matrix.Translation((0, 0, 0.068)), (0.25, 0.064, 0.118), bevel=0.008)
    box_m(name + 'Roof', M['busRed'], m @ Matrix.Translation((0, 0, 0.13)), (0.245, 0.06, 0.008), bevel=0.003)
    for s in (-1, 1):
        for z0, h in ((0.05, 0.03), (0.098, 0.03)):
            box_m(f'{name}Windows{s}{z0}', M['lancet'], m @ Matrix.Translation((0.005, s * 0.0325, z0 + h / 2)), (0.22, 0.002, h))
        box_m(f'{name}Band{s}', M['white'], m @ Matrix.Translation((0, s * 0.0326, 0.088)), (0.24, 0.002, 0.006))
        for wx in (-0.08, 0.08):
            cylinder(f'{name}Wheel{s}{wx}', M['tyre'], 0.018, 0.012, (0, 0, -0.006), segs=16, matrix=m @ Matrix.Translation((wx, s * 0.03, 0.018)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))
    box_m(name + 'Windscreen', M['lancet'], m @ Matrix.Translation((0.1255, 0, 0.06)), (0.002, 0.054, 0.04))
    box_m(name + 'UpperFront', M['lancet'], m @ Matrix.Translation((0.1255, 0, 0.11)), (0.002, 0.054, 0.028))


def cab(name, x, y, rot):
    m = Matrix.Translation((x, y, G + 0.006)) @ Matrix.Rotation(rot, 4, 'Z')
    box_m(name, M['cabBlack'], m @ Matrix.Translation((0, 0, 0.022)), (0.1, 0.044, 0.03), bevel=0.008)
    box_m(name + 'Top', M['cabBlack'], m @ Matrix.Translation((-0.005, 0, 0.045)), (0.06, 0.04, 0.026), bevel=0.007)
    box_m(name + 'Glass', M['lancet'], m @ Matrix.Translation((-0.005, 0, 0.046)), (0.062, 0.041, 0.016))
    box_m(name + 'Sign', M['lamp'], m @ Matrix.Translation((-0.002, 0, 0.061)), (0.014, 0.012, 0.007))
    for s in (-1, 1):
        for wx in (-0.03, 0.03):
            cylinder(f'{name}Wheel{s}{wx}', M['tyre'], 0.011, 0.008, (0, 0, -0.004), segs=12, matrix=m @ Matrix.Translation((wx, s * 0.021, 0.011)) @ Matrix.Rotation(math.pi / 2, 4, 'X'))


bus('bus', -0.25, -0.91, 0.0)
cab('cab', 0.45, -0.8, math.pi)
# the red telephone box
PBX, PBY = 0.72, -0.64
box('phoneBox', M['busRed'], (PBX, PBY, G + 0.075), (0.05, 0.05, 0.13), bevel=0.003)
lathe('phoneBoxTop', M['busRed'], [(0.03 * math.sqrt(2), 0), (0.03 * math.sqrt(2), 0.008), (0.012, 0.022), (0.0, 0.024)], (0, 0, 0), segs=4,
      matrix=Matrix.Translation((PBX, PBY, G + 0.14)) @ Matrix.Rotation(math.pi / 4, 4, 'Z'))
windows('phonePanes', M['lancet'], [(PBX + nx * 0.025, PBY + ny * 0.025, G + 0.04, 0.03, 0.075, (nx, ny), 'rect') for nx, ny in FACES], depth=0.003)
windows('phoneSigns', M['lamp'], [(PBX + nx * 0.0255, PBY + ny * 0.0255, G + 0.124, 0.034, 0.008, (nx, ny), 'rect') for nx, ny in FACES], depth=0.002)
for k, x in enumerate((-0.82, 0.12, 0.92)):
    cylinder(f'lampPost{k}', M['ironBlack'], 0.005, 0.2, (x, -0.67, G + 0.014), segs=8)
    box(f'lampHead{k}', M['lamp'], (x, -0.67, G + 0.225), (0.022, 0.022, 0.03), bevel=0.003)
    lathe(f'lampCap{k}', M['ironBlack'], [(0.018, 0), (0.0, 0.014)], (x, -0.67, G + 0.24), segs=4)
for k, (x, y, r) in enumerate(((-1.18, -0.38, 0.1), (-1.08, 0.06, 0.09), (1.16, -0.4, 0.09), (0.98, 0.0, 0.1), (1.0, 0.46, 0.09))):
    tree(f'squareTree{k}', x, y, h=0.22, r=r)
for k, (x, y, shirt) in enumerate(((-0.6, -0.68, 'red'), (-0.52, -0.66, 'blue'), (0.3, -0.68, 'yellow'), (0.55, -1.04, 'green'),
                                   (-0.1, -1.03, 'red'), (0.15, -0.3, 'blue'), (0.42, -0.32, 'yellow'), (-0.3, 0.0, 'green'))):
    person(f'p{k}', x, y, rng.random() * 6, shirt)
# a tour boat on the Thames
m = Matrix.Translation((-0.25, 0.98, G)) @ Matrix.Rotation(0.05, 4, 'Z')
bm = bmesh.new()
hull = [(-0.16, -0.035), (0.12, -0.035), (0.18, 0.0), (0.12, 0.035), (-0.16, 0.035)]
add_prism(bm, [bm.verts.new(m @ Vector((u, v, -0.004))) for u, v in hull], [bm.verts.new(m @ Vector((u, v, 0.025))) for u, v in hull])
finish('boatHull', bm, M['white'], bevel=0.003, smooth_sides=False)
box_m('boatCabin', M['lancet'], m @ Matrix.Translation((-0.02, 0, 0.042)), (0.2, 0.058, 0.035), bevel=0.004)
box_m('boatRoof', M['white'], m @ Matrix.Translation((-0.02, 0, 0.062)), (0.21, 0.064, 0.008), bevel=0.003)

# ------------------------------------------------------------------ the batched details
windows('panels', M['stonShade'], PANELS, depth=0.006)
windows('lancets', M['lancet'], LANCETS, depth=0.008)
windows('openings', M['shadow'], DARK, depth=0.01)
finish('stoneBars', STONE_BARS, M['ston'], smooth_sides=False)
finish('giltBars', GILT_BARS, M['gilt'], smooth_sides=False)
finish('ironBars', IRON_BARS, M['ironBlack'], smooth_sides=False)
finish('pinnacles', PINS, M['ston'], smooth_sides=False)

render('big-ben')
