# General

Q: Does the rough.js library let you draw stuff?
A: Yes, but only pre-defined geometric primitives (lines, rectangles, circles, arcs, paths) — you tell it "draw a rectangle here" and it renders that shape with jittered, hand-sketched styling. It doesn't capture user pointer input itself; Excalidraw's own code handles mouse/touch drawing and hands the resulting shapes to Rough.js for the sketchy rendering.

Q: Why does the emulator window always start off-screen and need to be dragged into view?
A: It remembers its last window position from a saved config file, and if that position no longer falls within the current monitor layout (resolution change, docking/undocking, etc.) it opens off-screen. Unrelated to the e2e script — it doesn't control the emulator's window placement.
