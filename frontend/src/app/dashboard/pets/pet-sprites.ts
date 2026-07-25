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
const HELD: PetSpriteAnimation = { row: 8, frames: 4, fps: 3.2 };
const PLAY: PetSpriteAnimation = { row: 10, rowSequence: [10, 11], frames: 8, fps: 5.2 };
const PICKUP: PetSpriteAnimation = { row: 14, frames: 4, fps: 6, loop: false };
const CARRY: PetSpriteAnimation = {
  row: 15,
  frames: 4,
  fps: 8,
  directionRows: { right: 15, left: 16, up: 17, down: 18 },
};
const DELIVER: PetSpriteAnimation = { row: 19, frames: 4, fps: 6, loop: false };

const COMMON_ANIMATIONS: Readonly<Record<string, PetSpriteAnimation>> = {
  rest: IDLE,
  walk: WALK,
  sleep: SLEEP,
  eat: EAT,
  play: PLAY,
  hop: WALK,
  curious: HAPPY,
  wave: HAPPY,
  held: HELD,
  fetch: WALK,
  pickup: PICKUP,
  carry: CARRY,
  deliver: DELIVER,
};

function sheet(cssClass: string): PetSpriteSheet {
  return {
    cssClass,
    columns: 4,
    rows: 20,
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
export const GINGER_SPRITE = sheet('pet-sprite-ginger');
export const BLUE_KIT_SPRITE = sheet('pet-sprite-blue-kit');
export const DIPLODOCUS_SPRITE = sheet('pet-sprite-diplodocus');
export const PIGEON_SPRITE = sheet('pet-sprite-pigeon');
