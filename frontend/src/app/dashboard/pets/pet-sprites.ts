import { PetSpriteAnimation, PetSpriteSheet } from './pet-types';

const IDLE: PetSpriteAnimation = { row: 0, frames: 6, fps: 3 };
const WALK: PetSpriteAnimation = { row: 1, reverseRow: 2, frames: 8, fps: 9 };
const WAVE: PetSpriteAnimation = { row: 3, frames: 4, fps: 7, loop: false };
const HOP: PetSpriteAnimation = { row: 4, frames: 5, fps: 4.5 };
const POKE: PetSpriteAnimation = { row: 4, frames: 5, fps: 8, loop: false };
const SAD: PetSpriteAnimation = { row: 5, frames: 8, fps: 8, loop: false };
const CURIOUS: PetSpriteAnimation = { row: 6, frames: 6, fps: 4 };
const RUN: PetSpriteAnimation = { row: 7, frames: 6, fps: 11 };
const SPECIAL: PetSpriteAnimation = { row: 8, frames: 6, fps: 7, loop: false };

const COMMON_ANIMATIONS: Readonly<Record<string, PetSpriteAnimation>> = {
  rest: IDLE,
  walk: WALK,
  sleep: IDLE,
  play: RUN,
  hop: HOP,
  curious: CURIOUS,
  wave: WAVE,
};

function sheet(cssClass: string): PetSpriteSheet {
  return {
    cssClass,
    columns: 8,
    rows: 9,
    frameWidth: 192,
    frameHeight: 208,
    displayWidth: 96,
    displayHeight: 104,
    animations: COMMON_ANIMATIONS,
    reactions: [POKE, POKE, WAVE, WAVE, SPECIAL, SAD],
  };
}

export const CAPY_SPRITE = sheet('pet-sprite-capy');
export const COLLIE_SPRITE = sheet('pet-sprite-collie');
export const FROG_SPRITE = sheet('pet-sprite-frog');
export const SHADOW_CAT_SPRITE = sheet('pet-sprite-shadow-cat');
