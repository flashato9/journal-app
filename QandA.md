# Tooltip.tsx

**Q: Why do we need both `Text` elements in the tooltip?**
A: The visible one (in the black bubble) needs an explicit `width` because absolutely-positioned boxes shrink-to-fit unreliably on Android. The second, invisible one is a "ruler" — it measures the text's true width in an unambiguous layout context via `onLayout`, and that measured value is what makes the visible bubble's width reliable.

**Q: How does the measurement container text stay hidden from display?**
A: Two things together: `opacity: 0` makes it fully transparent, and `position: "absolute"` + `left: -9999` pushes it thousands of pixels off the left edge of the screen. `importantForAccessibility="no-hide-descendants"` on its wrapper also hides it from screen readers.
