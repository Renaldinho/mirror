import { PetSpriteAnimation, PetSpriteSheet } from './pet-types';

const IDLE: PetSpriteAnimation = { row: 0, frames: 4, fps: 2.4 };
const WALK: PetSpriteAnimation = {
  row: 1,
  frames: 4,
  fps: 8,
  directionRows: { right: 1, left: 2, up: 3, down: 4 },
};
const SLEEP: PetSpriteAnimation = { row: 5, frames: 4, fps: 1.8, loop: false };
const EAT: PetSpriteAnimation = { row: 6, frames: 4, fps: 3.2, loop: false };
const HAPPY: PetSpriteAnimation = { row: 7, frames: 4, fps: 4.5, loop: false };

const COMMON_ANIMATIONS: Readonly<Record<string, PetSpriteAnimation>> = {
  rest: IDLE,
  walk: WALK,
  sleep: SLEEP,
  eat: EAT,
  play: WALK,
  hop: WALK,
  curious: HAPPY,
  wave: HAPPY,
};

function sheet(cssClass: string): PetSpriteSheet {
  return {
    cssClass,
    columns: 4,
    rows: 8,
    frameWidth: 128,
    frameHeight: 128,
    displayWidth: 80,
    displayHeight: 80,
    animations: COMMON_ANIMATIONS,
    reactions: [HAPPY],
  };
}

export const CAPY_SPRITE = sheet('pet-sprite-capy');
export const COLLIE_SPRITE = sheet('pet-sprite-collie');
export const FROG_SPRITE = sheet('pet-sprite-frog');
export const SHADOW_CAT_SPRITE = sheet('pet-sprite-shadow-cat');
