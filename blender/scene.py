"""Blender scény pro web — hero aréna, míč a koš.

Spuštění (Blender 5.x, bez okna):

    /Applications/Blender.app/Contents/MacOS/Blender -b --python blender/scene.py -- <režim> <výstupní_složka> [preview]

Režimy:
    arena  pozadí hero sekce: tmavá palubovka, reflektor shora a opar ve
           vzduchu. Čáry hřiště tu nejsou — kreslí je prohlížeč jako SVG,
           aby se daly animovat.
    ball   24 snímků míče otáčejícího se kolem osy pohledu (světlo stojí),
           průhledné pozadí. export.sh je složí do jednoho spritu.
    hoop   koš po vrstvách se stejnou kamerou: deska + zadní půlka obroučky,
           zadní půlka síťky, přední půlka síťky, přední půlka obroučky.
           Míč se na webu vkládá mezi zadní a přední vrstvy.

`preview` vykreslí rychlý náhled v poloviční velikosti a s málo vzorky.
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
MODE = argv[0] if argv else "arena"
OUT = os.path.abspath(argv[1] if len(argv) > 1 else "render")
PREVIEW = "preview" in argv[2:]
os.makedirs(OUT, exist_ok=True)


# ---------------------------------------------------------------------------
# Pomocné funkce
# ---------------------------------------------------------------------------

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for device in prefs.devices:
            device.use = True
        scene.cycles.device = "GPU"
    except Exception as error:  # CPU je pomalejší, ale funguje taky
        print("GPU nedostupné:", error)
    scene.cycles.use_denoising = True
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.color_depth = "8"
    return scene


def srgb(hex_value):
    """#rrggbb -> lineární RGBA pro Blender."""
    hex_value = hex_value.lstrip("#")
    channels = [int(hex_value[i:i + 2], 16) / 255 for i in (0, 2, 4)]

    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (*[lin(c) for c in channels], 1.0)


def new_material(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    return mat, mat.node_tree.nodes, mat.node_tree.links


def principled(nodes):
    return nodes.get("Principled BSDF")


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_camera(location, target, lens=50, ortho_scale=None):
    data = bpy.data.cameras.new("Camera")
    if ortho_scale:
        data.type = "ORTHO"
        data.ortho_scale = ortho_scale
    else:
        data.lens = lens
    cam = bpy.data.objects.new("Camera", data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = location
    look_at(cam, target)
    bpy.context.scene.camera = cam
    return cam


def add_area(name, location, target, size, energy, color="#ffffff", shape="DISK"):
    light = bpy.data.lights.new(name, "AREA")
    light.shape = shape
    light.size = size
    light.energy = energy
    light.color = srgb(color)[:3]
    obj = bpy.data.objects.new(name, light)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)
    return obj


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def mesh_object(name, bm):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    return link(bpy.data.objects.new(name, mesh))


def set_size(scene, width, height):
    scale = 0.5 if PREVIEW else 1.0
    scene.render.resolution_x = int(width * scale)
    scene.render.resolution_y = int(height * scale)
    scene.render.resolution_percentage = 100


def render(scene, filename):
    scene.render.filepath = os.path.join(OUT, filename)
    bpy.ops.render.render(write_still=True)
    print("vykresleno", scene.render.filepath)


# ---------------------------------------------------------------------------
# Aréna (pozadí hero sekce)
# ---------------------------------------------------------------------------

def build_arena():
    scene = reset()
    set_size(scene, 1200, 1500)
    scene.cycles.samples = 48 if PREVIEW else 256
    scene.render.film_transparent = False

    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#0d0d10")
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.04

    # Palubovka: tmavá, polomatná, s jemnou nerovností lesku, aby odraz
    # reflektoru nebyl plastový.
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0))
    floor = bpy.context.active_object
    mat, nodes, links = new_material("Floor")
    bsdf = principled(nodes)
    bsdf.inputs["Base Color"].default_value = srgb("#2c2c33")
    bsdf.inputs["Roughness"].default_value = 0.42
    noise = nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 3.0
    noise.inputs["Detail"].default_value = 8.0
    ramp = nodes.new("ShaderNodeMapRange")
    ramp.inputs["To Min"].default_value = 0.32
    ramp.inputs["To Max"].default_value = 0.58
    links.new(noise.outputs["Fac"], ramp.inputs["Value"])
    links.new(ramp.outputs["Result"], bsdf.inputs["Roughness"])
    # Pruhy desek palubovky — skoro neviditelné, jen je zachytí odlesk.
    wave = nodes.new("ShaderNodeTexWave")
    wave.wave_type = "BANDS"
    wave.bands_direction = "X"
    wave.inputs["Scale"].default_value = 9.0
    wave.inputs["Distortion"].default_value = 0.0
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.035
    links.new(wave.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    floor.data.materials.append(mat)

    # Zadní stěna daleko ve tmě, aby opar měl kde končit.
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 14, 0), rotation=(math.radians(90), 0, 0))
    wall = bpy.context.active_object
    wall_mat, wall_nodes, _ = new_material("Wall")
    principled(wall_nodes).inputs["Base Color"].default_value = srgb("#0b0b0d")
    principled(wall_nodes).inputs["Roughness"].default_value = 0.9
    wall.data.materials.append(wall_mat)

    # Opar: objemová kostka kolem scény. Paprsky reflektoru v ní vykreslí kužel.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 2, 5))
    haze = bpy.context.active_object
    haze.scale = (24, 28, 10)
    haze_mat, haze_nodes, haze_links = new_material("Haze")
    haze_nodes.remove(principled(haze_nodes))
    volume = haze_nodes.new("ShaderNodeVolumePrincipled")
    volume.inputs["Density"].default_value = 0.05
    volume.inputs["Anisotropy"].default_value = 0.2
    volume.inputs["Color"].default_value = srgb("#ffffff")
    haze_links.new(volume.outputs["Volume"], haze_nodes["Material Output"].inputs["Volume"])
    haze.data.materials.append(haze_mat)

    # Reflektor přímo nad hráčkou.
    spot = bpy.data.lights.new("Spot", "SPOT")
    spot.energy = 16000
    spot.spot_size = math.radians(11)
    spot.spot_blend = 0.45
    spot.shadow_soft_size = 0.25
    spot.color = srgb("#fff4e6")[:3]
    spot_obj = link(bpy.data.objects.new("Spot", spot))
    spot_obj.location = (0, 0.3, 8.5)
    look_at(spot_obj, (0, 0.1, 0))

    # Červené protisvětlo zezadu zprava — barva dresu, jen jako záře v oparu.
    back = bpy.data.lights.new("Back", "SPOT")
    back.energy = 1800
    back.spot_size = math.radians(30)
    back.spot_blend = 0.8
    back.color = srgb("#d62828")[:3]
    back_obj = link(bpy.data.objects.new("Back", back))
    back_obj.location = (5.5, 8, 6.0)
    look_at(back_obj, (1.2, 1.5, 0.8))

    # Kamera zhruba jako na fotce: ve výšce pasu, mírně dolů.
    add_camera((0, -4.2, 1.0), (0, 0, 1.12), lens=40)
    render(scene, "arena.png")


# ---------------------------------------------------------------------------
# Míč
# ---------------------------------------------------------------------------

def ball_material():
    """Oranžová kůže s pupínky a černými drážkami.

    Drážky: rovník (z = 0), poledník (x = 0) a dva menší kruhy kolem osy x
    (|x| = 0,58) — to je klasický osmidílný míč.
    """
    mat, nodes, links = new_material("Ball")
    bsdf = principled(nodes)
    bsdf.inputs["Roughness"].default_value = 0.62
    bsdf.inputs["Coat Weight"].default_value = 0.12
    bsdf.inputs["Coat Roughness"].default_value = 0.35

    coords = nodes.new("ShaderNodeTexCoord")
    normalize = nodes.new("ShaderNodeVectorMath")
    normalize.operation = "NORMALIZE"
    links.new(coords.outputs["Object"], normalize.inputs[0])
    split = nodes.new("ShaderNodeSeparateXYZ")
    links.new(normalize.outputs["Vector"], split.inputs["Vector"])

    def op(operation, a, b=None, value=None):
        node = nodes.new("ShaderNodeMath")
        node.operation = operation
        links.new(a, node.inputs[0])
        if b is not None:
            links.new(b, node.inputs[1])
        elif value is not None:
            node.inputs[1].default_value = value
        return node.outputs[0]

    ax = op("ABSOLUTE", split.outputs["X"])
    az = op("ABSOLUTE", split.outputs["Z"])
    curved = op("ABSOLUTE", op("SUBTRACT", ax, value=0.58))
    seam = op("MINIMUM", op("MINIMUM", ax, az), curved)
    # 0 v drážce, 1 na kůži
    soft = nodes.new("ShaderNodeMapRange")
    soft.interpolation_type = "SMOOTHSTEP"
    soft.inputs["From Min"].default_value = 0.012
    soft.inputs["From Max"].default_value = 0.03
    links.new(seam, soft.inputs["Value"])
    skin = soft.outputs["Result"]

    # Barva kůže s jemnou variací
    tone = nodes.new("ShaderNodeTexNoise")
    tone.inputs["Scale"].default_value = 6.0
    tone_ramp = nodes.new("ShaderNodeValToRGB")
    tone_ramp.color_ramp.elements[0].color = srgb("#b9481a")
    tone_ramp.color_ramp.elements[1].color = srgb("#d9662a")
    links.new(tone.outputs["Fac"], tone_ramp.inputs["Fac"])
    # Mix: A = drážka, B = kůže, faktor = skin (1 na kůži)
    mix = nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs["A"].default_value = srgb("#1a1310")
    links.new(skin, mix.inputs["Factor"])
    links.new(tone_ramp.outputs["Color"], mix.inputs["B"])
    links.new(mix.outputs["Result"], bsdf.inputs["Base Color"])

    # Pupínky: Voronoi, v drážkách vypnuté
    pebble = nodes.new("ShaderNodeTexVoronoi")
    pebble.feature = "F1"
    pebble.inputs["Scale"].default_value = 230.0
    pebble_curve = nodes.new("ShaderNodeMapRange")
    pebble_curve.inputs["From Max"].default_value = 0.55
    pebble_curve.inputs["To Min"].default_value = 1.0
    pebble_curve.inputs["To Max"].default_value = 0.0
    links.new(pebble.outputs["Distance"], pebble_curve.inputs["Value"])
    height = op("MULTIPLY", pebble_curve.outputs["Result"], skin)
    # Drážka je zapuštěná: kůže = 1, drážka = 0, pupínky nahoře
    total = op("ADD", op("MULTIPLY", height, value=0.25), skin)
    bump = nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.5
    bump.inputs["Distance"].default_value = 0.004
    links.new(total, bump.inputs["Height"])
    links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])

    # Drážky méně lesklé
    rough = nodes.new("ShaderNodeMapRange")
    rough.inputs["To Min"].default_value = 0.85
    rough.inputs["To Max"].default_value = 0.6
    links.new(skin, rough.inputs["Value"])
    links.new(rough.outputs["Result"], bsdf.inputs["Roughness"])
    return mat


def build_ball():
    scene = reset()
    set_size(scene, 320, 320)
    scene.cycles.samples = 24 if PREVIEW else 160
    scene.render.film_transparent = True
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#1a1a1f")
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.35

    bpy.ops.mesh.primitive_uv_sphere_add(segments=96, ring_count=48, radius=0.12)
    ball = bpy.context.active_object
    bpy.ops.object.shade_smooth()
    ball.data.materials.append(ball_material())

    # Míč natočený tak, aby byly vidět rovník i obě zakřivené drážky.
    pivot = link(bpy.data.objects.new("Pivot", None))
    ball.parent = pivot
    ball.rotation_euler = (math.radians(24), math.radians(-18), math.radians(38))

    add_area("Key", (-0.9, -1.2, 1.1), (0, 0, 0), 0.9, 90, "#fff3e4")
    add_area("Rim", (1.1, 0.6, 0.35), (0, 0, 0), 0.6, 70, "#ff4a3a")
    add_area("Fill", (0.4, -1.4, -0.6), (0, 0, 0), 1.2, 12, "#c9d4ff")

    # Kamera kouká podél +Y, rotace kolem osy Y = rotace v rovině obrazu.
    add_camera((0, -2.0, 0), (0, 0, 0), ortho_scale=0.262)

    frames = 6 if PREVIEW else 24
    for frame in range(frames):
        pivot.rotation_euler = (0, math.radians(-360 * frame / frames), 0)
        render(scene, f"ball-{frame:02d}.png")


# ---------------------------------------------------------------------------
# Koš
# ---------------------------------------------------------------------------

RIM_R = 0.2375        # osa obroučky (vnitřní průměr 45 cm + drát)
RIM_WIRE = 0.0095
RIM_Z = 3.05
RIM_Y = 0.0           # střed obroučky
BOARD_Y = 0.151 + RIM_R + 0.03   # čelo desky za obroučkou


def ring_mesh(name, radius, wire, keep):
    """Torus rozpůlený podle osy y. keep: 'front' (y < 0), 'back', 'all'."""
    bm = bmesh.new()
    bmesh.ops.create_circle(bm, cap_ends=False, radius=wire, segments=20)
    # kružnici průřezu postavíme do roviny XZ na poloměru radius
    for v in bm.verts:
        x, y, _ = v.co
        v.co = Vector((radius + x, 0, y))
    geom = bm.verts[:] + bm.edges[:]
    bmesh.ops.spin(bm, geom=geom, cent=(0, 0, 0), axis=(0, 0, 1), angle=math.radians(360), steps=96, use_duplicate=False)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    obj = mesh_object(name, bm)
    obj.location = (0, RIM_Y, RIM_Z)
    if keep != "all":
        bisect(obj, keep)
    return obj


def bisect(obj, keep):
    """Odřízne polovinu objektu rovinou y = střed obroučky (ve světě)."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    local_plane = obj.matrix_world.inverted() @ Vector((0, RIM_Y, 0))
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    clear_outer = keep == "front"   # front = ponechat y < 0
    bmesh.ops.bisect_plane(
        bm, geom=geom, dist=1e-6,
        plane_co=local_plane, plane_no=(0, 1, 0),
        clear_outer=clear_outer, clear_inner=not clear_outer,
    )
    bm.to_mesh(obj.data)
    bm.free()


def net_object(name, keep):
    """Síťka: kosočtverečná mřížka ze šikmých provázků, zužující se dolů."""
    columns, rows = 12, 7
    length = 0.43
    bm = bmesh.new()
    verts = []
    for i in range(rows + 1):
        t = i / rows
        radius = RIM_R * (1 - 0.42 * (t ** 0.85))
        z = -length * t
        offset = 0.5 * (i % 2)
        ring = []
        for j in range(columns):
            angle = 2 * math.pi * (j + offset) / columns
            ring.append(bm.verts.new((radius * math.cos(angle), radius * math.sin(angle), z)))
        verts.append(ring)
    for i in range(rows):
        for j in range(columns):
            a = verts[i][j]
            if i % 2 == 0:
                b, c = verts[i + 1][j], verts[i + 1][(j - 1) % columns]
            else:
                b, c = verts[i + 1][j], verts[i + 1][(j + 1) % columns]
            bm.edges.new((a, b))
            bm.edges.new((a, c))
    obj = mesh_object(name, bm)
    obj.location = (0, RIM_Y, RIM_Z - 0.005)
    # hrany -> křivka s tloušťkou -> zpět na síť, aby šla rozpůlit
    bpy.context.view_layer.objects.active = obj
    for o in bpy.context.selected_objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.ops.object.convert(target="CURVE")
    obj.data.bevel_depth = 0.0042
    obj.data.bevel_resolution = 2
    bpy.ops.object.convert(target="MESH")
    if keep != "all":
        bisect(obj, keep)
    return obj


def build_hoop():
    scene = reset()
    set_size(scene, 900, 900)
    scene.cycles.samples = 32 if PREVIEW else 200
    scene.render.film_transparent = True
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#202026")
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.6

    rim_mat, rim_nodes, _ = new_material("Rim")
    principled(rim_nodes).inputs["Base Color"].default_value = srgb("#d9481c")
    principled(rim_nodes).inputs["Metallic"].default_value = 0.35
    principled(rim_nodes).inputs["Roughness"].default_value = 0.32

    net_mat, net_nodes, _ = new_material("Net")
    principled(net_nodes).inputs["Base Color"].default_value = srgb("#f1efe9")
    principled(net_nodes).inputs["Roughness"].default_value = 0.8
    principled(net_nodes).inputs["Subsurface Weight"].default_value = 0.2

    glass_mat, glass_nodes, _ = new_material("Glass")
    # Sklo jako skoro průhledná vrstva s odlesky. Principled s přenosem se
    # na průhledném pozadí vykreslí neprůhledně, alfa kanál tohle obchází.
    glass = principled(glass_nodes)
    glass.inputs["Base Color"].default_value = srgb("#dfe6ea")
    glass.inputs["Roughness"].default_value = 0.06
    glass.inputs["Alpha"].default_value = 0.07

    paint_mat, paint_nodes, _ = new_material("Paint")
    principled(paint_nodes).inputs["Base Color"].default_value = srgb("#f4f2ee")
    principled(paint_nodes).inputs["Roughness"].default_value = 0.5

    steel_mat, steel_nodes, _ = new_material("Steel")
    principled(steel_nodes).inputs["Base Color"].default_value = srgb("#2a2a30")
    principled(steel_nodes).inputs["Metallic"].default_value = 0.8
    principled(steel_nodes).inputs["Roughness"].default_value = 0.4

    parts = {}

    # Deska 1,8 × 1,05 m, spodní hrana 15 cm pod obroučkou.
    board_bottom = RIM_Z - 0.15
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, BOARD_Y + 0.015, board_bottom + 0.525))
    board = bpy.context.active_object
    board.scale = (1.8, 0.03, 1.05)
    board.data.materials.append(glass_mat)

    # Bílé orámování desky a obdélník nad obroučkou (59 × 45 cm).
    def frame_rect(name, width, height, cz, bar, y):
        pieces = []
        for (sx, sz, px, pz) in (
            (width, bar, 0, cz - height / 2 + bar / 2),
            (width, bar, 0, cz + height / 2 - bar / 2),
            (bar, height - 2 * bar, -width / 2 + bar / 2, cz),
            (bar, height - 2 * bar, width / 2 - bar / 2, cz),
        ):
            bpy.ops.mesh.primitive_cube_add(size=1, location=(px, y, pz))
            piece = bpy.context.active_object
            piece.scale = (sx, 0.006, sz)
            piece.data.materials.append(paint_mat)
            pieces.append(piece)
        return pieces

    board_lines = frame_rect("BoardEdge", 1.8, 1.05, board_bottom + 0.525, 0.05, BOARD_Y - 0.004)
    board_lines += frame_rect("Square", 0.59, 0.45, RIM_Z + 0.225, 0.05, BOARD_Y - 0.004)

    # Konzola mezi deskou a obroučkou.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, (RIM_R + BOARD_Y) / 2 + 0.01, RIM_Z - 0.03))
    bracket = bpy.context.active_object
    bracket.scale = (0.2, BOARD_Y - RIM_R, 0.05)
    bracket.data.materials.append(steel_mat)

    parts["rim_back"] = ring_mesh("RimBack", RIM_R, RIM_WIRE, "back")
    parts["rim_front"] = ring_mesh("RimFront", RIM_R, RIM_WIRE, "front")
    for key in ("rim_back", "rim_front"):
        parts[key].data.materials.append(rim_mat)
        bpy.context.view_layer.objects.active = parts[key]
        bpy.ops.object.select_all(action="DESELECT")
        parts[key].select_set(True)
        bpy.ops.object.shade_smooth()

    parts["net_back"] = net_object("NetBack", "back")
    parts["net_front"] = net_object("NetFront", "front")
    for key in ("net_back", "net_front"):
        parts[key].data.materials.append(net_mat)

    board_group = [board, bracket] + board_lines

    add_area("Key", (-2.2, -3.0, 5.2), (0, 0, RIM_Z), 2.5, 900, "#fff3e4")
    add_area("Rim", (2.6, 1.2, 3.8), (0, 0, RIM_Z - 0.2), 1.2, 260, "#ff5a44")
    add_area("Fill", (1.5, -3.5, 1.6), (0, 0, RIM_Z - 0.3), 3.0, 120, "#cfd8ff")

    # Kamera zepředu, mírně z boku a kousek pod úrovní obroučky.
    add_camera((0.5, -4.0, RIM_Z + 0.55), (0, 0.02, RIM_Z - 0.1), lens=105)

    layers = {
        "hoop-0-board": board_group + [parts["rim_back"]],
        "hoop-1-net-back": [parts["net_back"]],
        "hoop-2-net-front": [parts["net_front"]],
        "hoop-3-rim-front": [parts["rim_front"]],
    }
    everything = board_group + list(parts.values())

    for name, visible in layers.items():
        for obj in everything:
            obj.hide_render = obj not in visible
        render(scene, f"{name}.png")

    for obj in everything:
        obj.hide_render = False
    render(scene, "hoop-full.png")


{"arena": build_arena, "ball": build_ball, "hoop": build_hoop}[MODE]()
