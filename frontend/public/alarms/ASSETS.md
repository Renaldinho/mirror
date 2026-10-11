# Alarm ringtone assets

Each ringtone pairs a looping sound with the face shown in the ringing popup
(see `src/app/widgets/ringtones.ts`). Distinct filenames prevent kiosk browsers
from reusing a previous picture or sound from their cache.

## Petah Gryffin
- `peter-laugh-T1G4wNahcFA.m4a`: audio track from the user-selected [Peter Griffins Laugh Sound Effect](https://www.youtube.com/watch?v=T1G4wNahcFA). The complete 10-second clip is bundled without altering the sound.
- `peter-low-quality.jpg`: low-quality Peter Griffin thumbnail from Google's static image CDN (`encrypted-tbn0.gstatic.com`), per the user's request to swap in that specific low-quality render. (Replaces the earlier DeviantArt PNG.)

## Imperial Star Destroyer
- `star-destroyer-7ejH_BihwFQ.m4a`: complete 60-second audio track from the user-selected [Imperial Alert/Death Star Alarm (Clean)](https://www.youtube.com/watch?v=7ejH_BihwFQ), downloaded without altering the sound. Replaces the earlier pineapple clip.
- `star-destroyer.png`: Imperial Star Destroyer render from the English Wikipedia article (`upload.wikimedia.org/wikipedia/en/d/d9/ImperialstarDestroyer480ppx.png`).
- The requested replacement [Imperial I-Class image](https://static.wikia.nocookie.net/swse/images/a/af/Imperial_I-Class_Star_Destroyer.jpg/revision/latest/scale-to-width-down/1200?cb=20171117223746) is blocked by its host's browser challenge. The existing picture remains until the exact replacement can be supplied.

## Faaaah
- `faaaah-0ohfbAPupk0.m4a`: complete audio track from the user-selected [Fahh Long Sound Effect](https://www.youtube.com/watch?v=0ohfbAPupk0), downloaded without altering the sound.
- `faaaah-squirrel-tenor.png`: the user's exact [Tenor disintegrating-squirrel image](https://media.tenor.com/XGlEFMjkstQAAAAe/disintegrating-squirrel.png), downloaded without editing. Replaces the earlier matching search result.

## Good Morning Pineapple
- `good-morning-pineapple-DHXlkTpT0Vg.m4a`: complete audio track from the user-selected [Good morning pineapple looking very good very nice](https://www.youtube.com/watch?v=DHXlkTpT0Vg), downloaded without altering the sound.
- `good-morning-pineapple.jpg`: the user's exact [Pinterest-hosted picture](https://i.pinimg.com/236x/10/9e/be/109ebe46418d5df7c9a88dc708118e3d.jpg), downloaded without editing.

These are existing character/franchise assets bundled locally for offline playback and display; no ownership or open license is claimed, for a personal meme mirror.

To use a photoshopped "Petah on a Star Destroyer" instead, drop the file here and point the `star-destroyer` ringtone's `image` at it in `ringtones.ts`.
