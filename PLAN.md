# Nebula generation plan

## Goal

Create a procedural WebGL background made from layered blobular nebulae rather than simple puffy clouds.

Each nebula should have visible internal structure: a broad outer mass, a defined shell, darker cavities, inner circular formations, embedded wisps, and luminous regions. The result should resemble the Rosette and Orion nebulae, where gas forms rings, shells, arcs, and broken boundaries around brighter or darker centres.

Individual particles should disappear into the final image. The viewer should see continuous gas, not dots.

The nebulae must remain dynamic. They should drift slowly, deform around the mouse, and morph into SVG shapes while preserving their layered structure.

---

# Global scene

## Deep-space background

Use a near-black background with a slight blue, violet, or burgundy bias.

```text
#020308
#050611
#090812
```

Add broad, weak colour gradients behind the main nebulae. These should keep the empty space from appearing flat without making the whole screen colourful.

Background colour fields can use deep navy, muted violet, dark crimson, and faint teal at very low opacity.

```text
Opacity: 0.02–0.08
```

Large areas should remain almost black.

---

## Distant stars

Scatter small stars throughout the scene.

Most stars should be dim and tiny. Only a small number should be bright enough to have a visible halo or diffraction spikes.

```text
Neutral white: #DDE7F2
Blue-white:    #B8DFFF
Warm white:    #FFD5A0
Faint red:     #FF9A8D
```

```text
Dim stars:     0.15–0.40
Normal stars:  0.40–0.75
Bright stars:  0.80–1.00
```

The star distribution should be irregular. Nebula regions can contain more visible stars, while empty areas should remain sparse.

---

## Background emission

Behind each nebula, place a very broad colour field larger than the visible cloud.

This layer should suggest distant illuminated gas. It should not have a defined shape or edge.

```text
Deep blue:    #12375A
Muted cyan:   #1B6877
Dusty violet: #503B61
Dark crimson: #54232E
Muted gold:   #70542F
```

```text
Opacity: 0.03–0.12
```

This layer should move very slowly and should remain less detailed than the main nebula.

---

# Blobular nebula structure

Each nebula should be constructed from several overlapping elliptical or irregular regions rather than a single circle.

The overall shape can be round, oval, broken, asymmetric, or stretched. The structure should still suggest that the gas once expanded outward from a central region.

The visible nebula should contain seven distinct layers.

---

## 1. Outer volume

The outer volume establishes the full size and rough silhouette of the nebula.

Use very large, round, soft particles with heavy overlap. The outer boundary should dissolve gradually into the background.

The density should be uneven. Some sections should extend farther outward, while others should fade early or appear interrupted.

Suggested colours:

```text
Deep blue:      #183A57
Muted teal:     #28545D
Dusty violet:   #4D395B
Muted crimson:  #5F2D38
Warm brown:     #5B4036
```

Suggested opacity:

```text
0.01–0.06
```

This layer should be broad and quiet. It defines scale, not detail.

Avoid creating a clean circular edge.

---

## 2. Outer shell

The outer shell represents the expanding boundary of the nebula.

It should appear as an incomplete ring or collection of curved arcs around the outer volume. It may be stronger on one side, broken into several segments, or distorted into an oval.

This layer distinguishes the nebula from a generic cloud.

The shell should contain brighter gas along its inner-facing edge and darker material behind it. It should look like a thick wall of compressed gas rather than a thin outline.

Suggested colours:

```text
Warm orange:  #C8753B
Muted gold:   #D49B4A
Dusty red:    #8A3D43
Cool cyan:    #4A9DAA
Blue-grey:    #48677A
```

Suggested opacity:

```text
Main shell mass:   0.04–0.14
Brighter sections: 0.12–0.28
Faded sections:    0.02–0.07
```

The shell should vary in width. Some regions can be thick and cloudy, while others narrow into brighter arcs.

Do not trace the entire circumference. Leave gaps and allow the shell to merge back into the outer volume.

---

## 3. Body and core gas

The body fills the main interior of the nebula.

Use medium and large round particles concentrated around selected regions rather than evenly across the centre.

Some nebulae can have a bright central core. Others can have a darker centre surrounded by brighter gas.

For an Orion-style nebula:

```text
Hot pink:     #C95A88
Magenta:      #9C4C7F
Pale violet:  #AA8ACA
Warm cream:   #E8BE98
Blue-white:   #A7D7E5
```

For a Rosette-style nebula:

```text
Cool blue:    #4787A5
Cyan:         #4899A5
Warm amber:   #C68143
Dusty red:    #7D3C42
Dark violet:  #312434
```

Suggested opacity:

```text
0.04–0.18
```

The brightest colours should occupy small areas. Most of the body should use darker, muted versions of the palette.

The body should contain clear variation in density. Avoid filling the entire inner area with equal opacity.

---

## 4. Inner cavity and circular shell

Create a darker cavity or lower-density region inside the nebula.

Around that cavity, form one or more incomplete inner rings. These should resemble expanding bubbles, circular gas walls, or nested shells.

The inner circle should not be geometrically perfect. Distort it using broad noise so that it becomes irregular, broken, and different in thickness around its circumference.

The cavity can be dark blue, violet, brown, or nearly black.

```text
Dark blue:    #111B28
Dark violet:  #201526
Brown-black:  #241719
Muted grey:   #34363D
```

Suggested opacity for dark material:

```text
0.04–0.16
```

The surrounding inner shell can use brighter colours:

```text
Cyan:         #55B3BD
Blue:         #4A84B0
Warm orange:  #D18348
Pink:         #BC5E83
Pale cream:   #E8C697
```

Suggested opacity:

```text
0.08–0.24
```

The cavity should not be completely empty. Leave faint gas and occasional stars inside it.

The inner shell can overlap the main body, disappear behind dust lanes, and reappear elsewhere.

---

## 5. Soft cloudy texture

Add broad internal variation across the body, shell, and cavity.

This layer should create large puffs, translucent folds, and gradual changes in density.

Use large texture regions rather than small noise.

```text
Opacity variation: 0.02–0.08
Contrast variation: 10–25%
```

The texture should operate at several broad scales.

Large variation defines the major lobes of the nebula. Medium variation creates internal cloud structure. Fine variation should remain weak.

This layer should not produce hard dots or visible particle edges.

---

## 6. Internal wisps and circular filaments

Add curved wisps inside the nebula.

Many of these wisps should follow the inner rings and shell arcs. Others can spiral around the central cavity or connect different bright regions.

The filaments should be embedded inside the gas rather than drawn over the top.

Suggested colours:

```text
Dusty pink:    #A75074
Muted violet:  #725581
Blue-grey:     #527080
Warm beige:    #B88D6B
Pale cyan:     #7BC4C7
Dark crimson:  #552532
```

Suggested opacity:

```text
0.03–0.16
```

The wisps should vary in thickness. Most should be wide and soft. A small number can be narrower and brighter near active regions.

They should fade before reaching empty space. They should not form a sharp outer outline.

Some filaments can form partial circles inside the nebula. These should reinforce the impression of nested shells and expanding gas.

---

## 7. Emission glow

Render soft additive glow around bright shell sections, inner rings, stellar regions, and active cores.

The glow should extend farther than the visible gas but use lower opacity.

Suggested colours:

```text
Pink glow:    #D55D91
Violet glow:  #8963C4
Blue glow:    #4CA3C2
Cyan glow:    #58C2C5
Warm glow:    #DB8E57
```

Suggested opacity:

```text
0.02–0.14
```

The strongest glow should appear around small active regions rather than across the full nebula.

Do not increase body opacity to simulate light. Keep the emission layer separate.

---

# Dark dust lanes

Dark dust should cross through the body, shells, and inner circles.

These lanes create depth by obscuring brighter layers underneath.

They should be wide, irregular, and partially transparent.

```text
Dark violet: #1B1320
Brown-black: #211619
Blue-black:  #101923
```

```text
Opacity: 0.04–0.18
```

Dust lanes can divide the inner ring, hide parts of the shell, or create dark channels through the core.

They should not appear as solid black lines.

---

# Colour behaviour

Avoid fully saturated colour across large areas.

Most colours should be dark, muted, and translucent. Brighter cyan, gold, magenta, and blue should be limited to shell edges, inner rings, stars, and active cores.

Warm and cool colours should overlap. A shell can move from red to amber, then disappear into blue-grey gas.

Colour should also change with density.

Dense gas should become darker and less saturated. Thin illuminated gas can become brighter and more colourful.

The nebula should contain neutral greys, browns, and dark blues between the brighter colours. Without these neutral regions, it will look like a rainbow cloud.

---

# Opacity behaviour

The image should gain density through overlapping particles.

A single gas particle should rarely be visible.

```text
Background emission: 0.02–0.08
Outer volume:        0.01–0.06
Outer shell:         0.04–0.28
Body and core:       0.04–0.18
Inner shell:         0.08–0.24
Cloud texture:       0.02–0.08
Internal wisps:      0.03–0.16
Dark dust:           0.04–0.18
Emission glow:       0.02–0.14
```

Opacity should vary between particles and across regions.

The outside of the nebula should fade gradually. Shells and inner rings can be clearer, but should still feel gaseous rather than sharply drawn.

---

# Motion

The entire nebula should move slowly.

The outer volume should drift at the lowest speed.

The outer shell should expand, contract, or shift almost imperceptibly.

The body should circulate through broad flow fields.

Inner rings and filaments should move along curved paths around the cavity.

Fine wisps should react more visibly than the main gas.

The motion should never jitter or boil. It should resemble very slow atmospheric circulation.

The nested shells should retain their general shape while moving. They can deform, but should not dissolve.

---

# Mouse interaction

The pointer should displace gas locally.

The outer volume should move slowly and over a broad area.

Shell sections should bend rather than scatter.

Internal filaments should trail behind the pointer and curl around its path.

The pointer should produce a soft wake rather than a clean circular hole.

When the pointer passes through an inner ring, the ring should stretch and distort while remaining connected.

After the pointer leaves, the gas should return gradually to its original structure.

The return should be slower for the outer volume and faster for internal wisps.

---

# SVG morphing

Each nebula particle should have a normal procedural position and an optional SVG target.

When an event activates the morph, the nebula moves toward the SVG shape while retaining its internal layers.

The outer volume should create a soft boundary around the SVG.

The outer shell should move toward the outer edge of the SVG shape.

The body particles should fill its interior.

The inner cavity and ring particles should form smaller internal shapes or nested contours within the SVG.

Internal wisps should remain curved and irregular inside the result.

The SVG should not become perfectly clean or flat. Some gas should extend beyond its boundary, and low-strength motion should continue throughout the morph.

When the event ends, all layers should return to the original nebula while preserving their roles.

The result should look like a structured nebula temporarily taking the form of the SVG, not a generic particle cloud filling a mask.
