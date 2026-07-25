# Desktop pet action-atlas prompts

Generated with the built-in ImageGen tool, using each previous sprite sheet as
an identity and pixel-art style reference. Final sheets were chroma-keyed,
repacked into square cells, and saved as transparent 4×8 PNG atlases.

## Shared prompt

> Use case: stylized-concept. Asset type: production desktop-pet pixel-art
> animation atlas. Create a clean replacement atlas based on the supplied
> identity reference. Exactly 4 equal columns by 8 rows: front idle; walk
> right; walk left; walk away/up-screen; walk toward/down-screen; settle and
> sleep; eat a pet-appropriate treat; happy affectionate reaction. Each row
> contains four sequential frames. Preserve the exact character, scale,
> markings, proportions, outline weight, palette, and pixel density across all
> 32 cells. Crisp polished original 16-bit pixel art, readable at 64–80 CSS
> pixels. Perfectly flat solid `#ff00ff` background with no shadows, gradients,
> floor, labels, grid, text, logo, watermark, extra characters, scenery,
> overlap, blank cells, or cropped body parts.

## Identity details

- Capy: rounded tan capybara, calm narrow eyes, dark muzzle, tiny orange with a
  green leaf on its head; leafy snack while eating.
- Lando: small black-and-white border collie with white blaze, muzzle, chest,
  paws and tail tip, warm brown eyes, floppy-tipped ears; biscuit while eating.
- Frog: compact bright-green frog with pale belly, large eyes and pink cheeks;
  no lily pad, directional movement reads as springy hops, tiny fly while eating.
- Shadow Kit: charcoal-black kitten with amber eyes, pink inner ears, tiny
  fangs, curled tail, and purple collar with violet tag; fish treat while eating.

## Fetch extension (v6)

The fetch interaction uses one shared red-and-cream stitched pixel-art ball
(`fetch-ball-v1.png`). Each `interactions-v6.png` preserves rows 0–13 from v5
unchanged and appends six four-frame rows:

1. Row 14 — front-facing pickup sequence.
2. Row 15 — carry right.
3. Row 16 — carry left.
4. Row 17 — carry away/up-screen.
5. Row 18 — carry toward/down-screen.
6. Row 19 — front-facing delivery sequence.

Each species extension was generated separately with its v5 atlas as the
identity/style reference and the shared ball as the toy reference. The shared
prompt requested an exact 4×6 grid on flat `#ff00ff`, four sequential frames
per row, stable scale/baseline, correct directional views, and no grid lines,
labels, scenery, shadows, blank cells, or cropped body parts. The generated
foreground column/row bands were detected before each frame was chroma-keyed,
nearest-neighbor packed into 128×128 cells, and appended to the v5 pixels.

## New companions (v1)

Ginger, Blue Kit, Diplo, and Pigeon use the same 4-by-20 atlas contract. Their
approved four-direction identity sheets were expanded with the built-in
ImageGen workflow into two source sheets per companion:

1. A 4-by-11 core sheet containing idle, four-direction movement, sleep, eat,
   happy, held, and two continuous play rows.
2. A 4-by-6 fetch sheet containing pickup, four-direction carry, and delivery
   with the shared stitched ball.

Both sources used a flat `#ff00ff` chroma background. The production pass
removed and despilled the key, detected each animation column and its ordered
poses, nearest-neighbor fit each pose into a 128-by-128 cell, and assembled the
final transparent 512-by-2560 atlas. Rows 9, 12, and 13 remain transparent.

Identity constraints:

- Ginger: chunky orange tabby, darker orange stripes, cream muzzle/chest/belly
  and paws, amber eyes, upright striped tail.
- Blue Kit: baby blue-gray mackerel tabby with green eyes; white only on the
  belly, feet, and anatomical-left side of the face, with no white chest bib.
- Diplo: four-legged baby diplodocus/longneck with bright green skin, cream
  underside, darker spots, small friendly head, long neck, and tapering tail.
- Pigeon: plump gray city pigeon with dark wing bars, green-purple neck
  iridescence, ruby eyes, pink-red feet, ground waddles, and brief play flutters.
