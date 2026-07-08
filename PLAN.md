# Nebula generation plan

## Goal

Create a procedural WebGL background that reads as layered astronomical gas rather than a field of particles.

The scene should contain three visual families:

**Pillars:** dense, vertical dust columns based on the Pillars of Creation.

**Blob nebulae:** broad, round or irregular clouds based on the Rosette and Orion nebulae.

**Background atmosphere:** faint colour fields, stars, stellar glow, and distant gas.

All gas should be built from overlapping soft sprites. Individual particles should disappear into the whole. No layer should look like a collection of hard circles.

The gas must remain dynamic. It should drift slowly, react to the mouse, and morph into SVG shapes while retaining its cloudy texture.

---

# Global scene layers

## 1. Deep-space background

Use a near-black background with a slight blue or violet bias rather than pure black.

Suggested colours:

```text
#020308
#040611
#080814
```

Add a very weak radial or directional gradient so the empty areas do not look flat.

Opacity should remain close to fully opaque. Colour variation should be subtle enough that it is only noticeable beside the stars and gas.

---

## 2. Distant stars

Scatter small stars across the full scene.

Most stars should be tiny, dim, and neutral white. A smaller number can be blue-white, warm yellow, or faint red.

Suggested colours:

```text
Neutral white: #DDE7F2
Blue-white:    #B8DFFF
Warm white:    #FFD5A0
Faint red:     #FF9A8D
```

Most stars should use low opacity:

```text
Dim background stars: 0.15–0.45
Normal stars:         0.45–0.75
Bright stars:         0.80–1.00
```

Only a few stars should have visible glow or diffraction spikes. Bright stars should remain sparse so they do not compete with the nebula.

---

## 3. Background emission fields

Behind the main clouds, render very large, low-resolution colour fields.

These should resemble distant illuminated gas rather than visible objects. They should be broad, soft, and uneven, with no clear outline.

Use low-frequency noise and overlapping gradients.

Suggested colours:

```text
Deep blue:       #12375A
Muted cyan:      #1B6C79
Dusty violet:    #563F68
Dark crimson:    #5A202A
Muted gold:      #75572C
```

Opacity should stay low:

```text
0.03–0.12
```

These fields should often occupy large parts of the screen, but remain almost invisible in dark areas.

---

# Area 1: Pillars

The pillars are the main foreground structure. They should feel dense, tall, heavy, and carved by light.

Their shape should be generated from curved, tapered columns. Each column should widen toward its base and narrow toward its tip. The silhouette should contain bulges, cuts, cavities, overhangs, and small secondary branches.

The reference colour structure is:

```text
Dark brown and burgundy inside
Grey-blue smoke across the surface
Warm amber along illuminated edges
Cyan or blue around exposed tips
Soft turquoise glow behind the columns
```

## 1. Volume

The volume layer establishes the full mass of each pillar.

Use large, round, very soft sprites. They should overlap heavily and form a continuous column.

The centre should be denser than the edge. The bottom should be broader and more opaque than the top.

Suggested colours:

```text
Dark brown:      #24161B
Dusty burgundy:  #3A1820
Smoky grey:      #42424A
Muted blue-grey: #344858
```

Suggested opacity per sprite:

```text
0.015–0.06
```

The layer becomes visible through accumulation rather than strong individual particles.

The edges should remain blurred. This layer should not define the silhouette sharply.

---

## 2. Body and fill

The body layer gives the pillar its visible texture and colour.

Use large, wide wisps mixed with soft round particles. The wisps should be thick and cloudy rather than narrow or string-like.

They should flow mostly upward along the pillar, but bend around cavities and protrusions.

Suggested colours:

```text
Deep red-brown:  #4A2027
Dusty plum:      #5B3440
Warm grey:       #62585A
Blue-grey:       #496274
Muted ochre:     #87633C
```

Suggested opacity:

```text
0.04–0.14
```

The darker colours should sit deeper inside the pillar. Grey, ochre, and blue-grey should appear closer to the surface.

Avoid even colour distribution. The reference pillars contain dark channels, pale smoky regions, and irregular warm patches.

---

## 3. Cavities and internal shadows

The pillars should contain negative space, not only added particles.

Create darker channels and holes by reducing particle density in selected regions.

These cavities should be elongated and irregular. Some should follow the direction of the pillar. Others should cut across it.

Use almost-black red and purple tones around cavity edges:

```text
#160D12
#211019
#2B1720
```

The cavities should not become flat black holes. Leave a small amount of low-opacity smoke inside them.

---

## 4. Detail and outline

This layer defines the pillar silhouette.

Use smaller, sharper wisps near the boundary. They should trace selected sections of the outer edge, exposed ridges, and the tops of the pillars.

Do not outline the entire pillar evenly. The illuminated side should be stronger than the shadow side.

Suggested warm edge colours:

```text
Amber:       #E6A64A
Pale gold:   #F2CC77
Warm cream:  #FFE5A5
Muted orange:#C87536
```

Suggested cool tip colours:

```text
Cyan:        #6EE4E8
Blue-cyan:   #58BFD8
Pale blue:   #A1EAF2
```

Suggested opacity:

```text
Warm edge details: 0.15–0.45
Blue tip details:  0.18–0.55
Shadow details:    0.06–0.20
```

The brightest lines should remain narrow and rare.

The blue and cyan colour should be concentrated around exposed tips and upper edges. It should fade quickly into the brown body.

---

## 5. Fine wisps and hanging material

Add a small number of thin strands below ledges and between columns.

These should look like torn gas or dust being pulled away.

Use dark red, grey, and faint blue.

Opacity should stay around:

```text
0.04–0.16
```

They should remain sparse. Too many strands will make the pillar look hairy rather than dense.

---

## 6. Emission glow

Render a separate soft glow behind the pillar edges and tips.

The strongest glow should sit behind the silhouette, not directly on top of the body.

Suggested colours:

```text
Turquoise:   #3BC3C7
Blue:        #397FAE
Pale cyan:   #8AE5DB
Muted gold:  #D8A94D
```

Suggested opacity:

```text
0.03–0.15
```

Use additive blending for this layer.

The glow should be broad and diffuse. It should make the pillar feel backlit without producing a neon outline.

---

# Area 2: Blob nebulae

Blob nebulae should feel broad, soft, layered, and luminous.

They should be built from overlapping elliptical cloud regions rather than a single circle.

Their outlines should dissolve into space. No sharp detail layer should trace their perimeter.

The Rosette reference suggests a circular shell with a cooler centre. The Orion reference suggests a bright, chaotic core with red, violet, blue, and grey gas spreading outward.

## 1. Volume

Use large round sprites to create the full outer shape.

Each cloud should contain several overlapping lobes with different sizes and orientations.

Suggested opacity:

```text
0.015–0.07
```

The outermost gas should be very soft and nearly transparent.

Suggested colours:

```text
Deep blue:      #183D5E
Muted teal:     #285E67
Dusty violet:   #503A64
Muted crimson:  #642937
Warm brown:     #674234
```

---

## 2. Body and core

The body should be denser toward the centre or around selected internal structures.

Use round sprites rather than pillar-like wisps.

Suggested opacity:

```text
0.05–0.18
```

For an Orion-style cloud, the brightest core can contain:

```text
Hot pink:       #D35D91
Magenta:        #A94D87
Pale violet:    #B995D8
Warm cream:     #F1C8A1
Blue-white:     #A9DCEA
```

For a Rosette-style cloud, use:

```text
Cool centre:    #4C94B5
Cyan shell:     #49AEB6
Warm rim:       #D58B46
Red dust:       #8A3D3E
Dark outer gas: #30232E
```

The brightest colour should occupy only a small part of the cloud.

---

## 3. Soft cloudy texture

Add broad internal variation using large, soft patches.

This layer should create the appearance of overlapping puffs, folds, and translucent gas.

It should not create visible dots or hard boundaries.

Use small changes in opacity and colour:

```text
Opacity variation: 0.02–0.08
Contrast change:   roughly 10–25%
```

Texture should occur at several broad scales. Large variation defines major cloud lobes. Medium variation creates puffy internal structure.

Avoid fine high-frequency noise in this layer.

---

## 4. Internal wisps

Add flowing wisps inside the brighter regions.

These should bend around the core and follow curved paths. They should fade before reaching the outer boundary.

For Orion-style clouds, use pink, violet, blue-grey, and warm beige.

Suggested opacity:

```text
0.04–0.16
```

The wisps should feel embedded inside the cloud rather than drawn over it.

---

## 5. Dark dust lanes

Add broad, irregular dark bands through parts of the blob.

These should partially obscure the brighter gas underneath.

Suggested colours:

```text
Dark violet: #1D1424
Brown-black: #211619
Blue-black:  #101A24
```

Suggested opacity:

```text
0.04–0.18
```

These lanes create depth and stop the cloud from becoming a uniform colourful glow.

---

## 6. Emission glow

Add soft additive glow around bright cores and selected internal arcs.

Suggested colours:

```text
Pink glow:    #D95B91
Violet glow:  #8B66D1
Blue glow:    #4DAED0
Warm glow:    #E59A63
```

Suggested opacity:

```text
0.03–0.16
```

The glow should spread farther than the body particles but remain less opaque.

---

# Foreground stars and stellar objects

Place a small number of bright blue-white stars in front of the gas.

Some stars should sit inside the nebula, while others appear in empty space.

Use:

```text
Core:        #FFFFFF
Inner glow:  #CDEBFF
Outer glow:  #5AA8E8
```

The central star sprite can approach full opacity. The outer glow should remain around:

```text
0.03–0.20
```

Supernova-like objects should be rare. Use a bright centre, a soft coloured halo, and optional narrow diffraction spikes.

Do not place bright stars uniformly. Group some near active nebula regions and leave quieter parts of the scene sparse.

---

# Motion

All layers should move slowly.

The volume layers should drift at the lowest speed. Their motion should be broad and barely noticeable.

Body particles should move slightly faster and follow curved flow fields.

Detail wisps should react most strongly to local turbulence.

Stars should remain mostly fixed, with only subtle brightness variation.

The gas should never boil or jitter. Motion should resemble slow atmospheric circulation.

---

# Mouse interaction

The pointer should displace the gas locally.

Large volume particles should move slowly and over a wide radius.

Body particles should move more visibly.

Fine wisps should bend, trail, and return faster.

The pointer should create a soft wake rather than a circular hole. Gas near the centre of the pointer path should move aside, while nearby particles curl around the direction of travel.

After the pointer leaves, the cloud should return gradually to its original structure.

The interaction must preserve the overall silhouette. A pillar should bend and distort without breaking apart.

---

# SVG morphing

Each cloud should have a normal procedural position and an optional SVG target position.

When a hover or page event activates the morph, particles move toward sampled points inside the SVG shape.

Round volume particles fill the SVG interior.

Body particles create internal colour and density.

Detail particles move toward the SVG boundary only when the source cloud is a pillar.

Blob particles should keep a soft outer edge even while forming a symbol.

The morph should not produce a perfectly clean logo. Some particles should remain slightly displaced, and low-strength flow should continue inside the shape.

The result should look like a nebula temporarily taking the form of the SVG.

When the event ends, the gas should return to its original shape using the same slow, spring-like motion.

---

# Global colour rules

Avoid using fully saturated colours across large areas.

Most gas colours should be dark, muted, and partially transparent. Saturated cyan, gold, magenta, and blue should appear only around illuminated details, active cores, and stellar glow.

Warm and cool colours should overlap rather than occupy cleanly separated regions.

Dark layers should remain visible inside bright gas. This creates depth.

The scene should contain large areas of near-black space. The nebula should not fill every part of the canvas.

---

# Global opacity rules

Volume comes from accumulation.

A single particle should rarely be visible by itself.

Use very low opacity for large sprites, moderate opacity for body particles, and higher opacity only for narrow detail lines and star cores.

Approximate ranges:

```text
Background gas:     0.01–0.05
Volume gas:         0.015–0.07
Body particles:     0.04–0.18
Internal texture:   0.02–0.10
Detail wisps:       0.10–0.45
Emission glow:      0.03–0.16
Bright star cores:  0.75–1.00
```

Opacity should vary per particle. Uniform opacity will make the cloud look synthetic.

The final image should read first as large masses of gas, then reveal smaller texture and light when viewed closely.
