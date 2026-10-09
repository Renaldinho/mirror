# Dedicated pet dance frames

Generated with the built-in imagegen tool, then normalized with the user's explicit permission using `normalize-dance.ps1`. Processing is offline; there is no image-processing work on the Pi.

All eight `SPECIES/SPECIES-dance-v2.png` assets are transparent 512 × 1024 atlases (four columns, eight rows, 128 × 128 cells). Playback is 32 ordered frames at 5 fps, a 6.4-second loop. Collie and frog have 28 generated poses, blue-kit has 24; evenly spaced holds fill their playback frames. Other pets have 32 generated poses.

The script keeps the main connected silhouette, fixes height to 90 pixels (pigeon: 72 for wing clearance), aligns the foot baseline to 116 and centers the lower silhouette at x=64. Nearest-neighbor scaling preserves the pixel style.

```powershell
powershell.exe -ExecutionPolicy Bypass -File frontend/src/app/dashboard/pets/normalize-dance.ps1 -Source SOURCE.png -Destination OUTPUT.png
```

For pigeon add `-TargetHeight 72`.

## Image generation prompt

References were the previous dance atlas and the original interaction atlas. The generator sometimes supplied fewer rows than requested; normalization accepts six to eight rows.

Use case: identity-preserve. Asset type: transparent production pixel-art sprite sheet for a desktop pet game. Image 1 is the CURRENT DANCE atlas to revise; image 2 is the original interaction atlas for exact character identity and pixel-art style. Replace the jumpy coarse dance with a NEW restrained, very smooth 32-FRAME slow dance loop. Output a PORTRAIT image with aspect ratio 1:2, exactly FOUR COLUMNS by EIGHT ROWS of equal SQUARE cells, exactly one full character per cell. 32 distinct sequential frames read left-to-right, top-to-bottom. Do not output 16 frames, do not duplicate a row, and do not put two characters in a cell. No grid, labels, text, motion lines, hearts, background or extraneous objects. Real transparent RGBA background with clean alpha, no colored fringe or halo. Preserve the original character's exact colors, markings, outline, proportions, accessories and species. Keep character scale consistent: standing height around 65% of each cell, whole silhouette INCLUDING tail and lifted paws strictly within 75% of the cell width, at least 12% transparent padding on every edge, feet at the same 85% baseline. Same front-facing camera in all frames; NO zoom, NO turning into a different angle or changing proportions. Choreography is one gentle relaxed groove, not exaggerated dance poses. Frames 1-8 ease slowly from center toward a tiny left step, frames 9-16 ease gently back to center, frames 17-24 ease slowly into a tiny right step, frames 25-32 ease back to the starting pose. Only small changes between consecutive frames: carefully drawn anatomical IN-BETWEEN poses, one or two pixel increments rather than abrupt paw changes. Minimal vertical bounce, at most 3% of cell height, head tilt at most 5 degrees, small paw gestures only. The last frame must flow seamlessly into the first.

### capy

Output: `capy/capy-dance-v2.png`

Raw source: `C:\Users\Renars\.codex\generated_images\01a121b7-f78e-78f1-ad83-750f3378ad23\exec-5d746f94-8032-4ef7-8cb0-33250c0f7403.png`

Species direction: Tiny relaxed belly bobs and alternating paw taps, with its orange balanced on its head.

### collie

Output: `collie/collie-dance-v2.png`

Raw source: `C:\Users\Renars\.codex\generated_images\01a121b7-f78e-78f1-ad83-750f3378ad23\exec-2e50c29e-f649-4887-84ed-b28e62b9c4ac.png`

Species direction: Small front paw lifts and a soft tail wag, not big human-style arm waving.

### frog

Output: `frog/frog-dance-v2.png`

Raw source: `C:\Users\Renars\.codex\generated_images\01a121b7-f78e-78f1-ad83-750f3378ad23\exec-a73d6356-0562-4a91-a310-d48c58a517cb.png`

Species direction: Gentle frog knee bends and toe taps, no high jumps.

### shadow-cat

Output: `shadow-cat/shadow-cat-dance-v2.png`

Raw source: `C:\Users\Renars\.codex\generated_images\01a121b7-f78e-78f1-ad83-750f3378ad23\exec-395792c9-8673-4ca2-9442-da2a682047b8.png`

Species direction: Tiny paw taps, small shoulder sway and a slow curling tail.

### ginger

Output: `ginger/ginger-dance-v2.png`

Raw source: `C:\Users\Renars\.codex\generated_images\01a121b7-f78e-78f1-ad83-750f3378ad23\exec-7754601d-ac12-4369-893a-369a9bd1bdc7.png`

Species direction: A relaxed chunky-cat belly shimmy and toe taps, not energetic bouncing.

### blue-kit

Output: `blue-kit/blue-kit-dance-v2.png`

Raw source: `C:\Users\Renars\.codex\generated_images\01a121b7-f78e-78f1-ad83-750f3378ad23\exec-4d28e86c-905e-4f1e-bb54-911e1ec07ae5.png`

Species direction: Tiny alternating paw taps, a gentle head bob and a slow tail swish.

### diplodocus

Output: `diplodocus/diplodocus-dance-v2.png`

Raw source: `C:\Users\Renars\.codex\generated_images\01a121b7-f78e-78f1-ad83-750f3378ad23\exec-5efc4f93-6ef5-4606-b6a5-9adb61da13cd.png`

Species direction: Small alternating foot steps, a soft long-neck bob, tail kept folded comfortably inside its cell.

### pigeon

Output: `pigeon/pigeon-dance-v2.png`

Raw source: `C:\Users\Renars\.codex\generated_images\01a121b7-f78e-78f1-ad83-750f3378ad23\exec-6eed1b16-a648-4eb2-b8ab-b54f4a4d533c.png`

Species direction: Subtle head bobs, tiny foot steps and low half-raised wings, never a full wide wing spread.
