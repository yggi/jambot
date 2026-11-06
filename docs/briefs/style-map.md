# The Style sheet as a map of music

A mock for #598, part of the style epic (yggi/cells#536).
The mock is [`style-map/map.html`](style-map/map.html), one HTML file with no dependencies, in the app's tokens, light and dark; `?only=radio`, `?only=session` and `?only=glyph` show one frame each.
Its screenshots are `style-map/map-light.png` and `style-map/map-dark.png`.

What it shows:

- A preset is a place: a named point with a soft region, on two named axes, harmony across (a static vamp to moving, rich) and drive up (legato and sparse to staccato and dense, the mean of `artic` and `energy`).
- The third axis, groove (`sync`), is a strip below the map, with each preset's tick.
- The library's fragments are faint dots, so the map shows where the composer finds parts.
- The band's style is a point, and entropy is its reach, a ring around it, not a fifth slider.
- With the radio on, the trail of the last five sections and the place it drifts toward.
- In a session, each player's wish as an arrow from the point.
- Folded, the card's glyph is the map's frame and one marker where the style is, coloured by groove (blue on the beat, pink off it), in place of the radar: at 52 px only the position reads, so the places, the dots and the reach stay on the unfolded map.

The preset points and the fragments' points are cells' at 1f7fa74, written into the file.
The axes of the map are open: they follow yggi/cells#539's ruling on energy and articulation, and #598 compares three choices.
