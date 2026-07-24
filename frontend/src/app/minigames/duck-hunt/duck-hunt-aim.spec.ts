import { DuckHuntAim } from './duck-hunt-aim';

describe('DuckHuntAim', () => {
  it('keeps a deterministic offset stable for the whole wave', () => {
    const values = [0, .25, .5];
    const aim = new DuckHuntAim();
    aim.setBounds(1000, 700);
    aim.setRawPointer(400, 300);
    aim.beginWave(1, () => values.shift()!);

    const offset = aim.waveOffset();
    for (let index = 0; index < 20; index += 1) aim.update(.016, index * .016, 1);

    expect(offset.x).toBeCloseTo(0, 8);
    expect(offset.y).toBeCloseTo(45, 8);
    expect(aim.waveOffset()).toEqual(offset);
  });

  it('caps later-round parallax and keeps the visible scope on stage', () => {
    const aim = new DuckHuntAim();
    aim.setBounds(320, 180);
    aim.setRawPointer(319, 179);
    aim.beginWave(99, () => .99);

    const offset = aim.waveOffset();
    expect(Math.hypot(offset.x, offset.y)).toBeCloseTo(105, 5);

    for (let index = 0; index < 120; index += 1) aim.update(.016, index * .016, 99);
    expect(aim.point().x).toBeLessThanOrEqual(296);
    expect(aim.point().y).toBeLessThanOrEqual(156);
  });

  it('applies visible lag instead of teleporting to the raw pointer', () => {
    const aim = new DuckHuntAim();
    aim.setBounds(1000, 700);
    aim.setRawPointer(100, 100);
    aim.beginWave(1, () => 0);
    aim.update(.016, 0, 1);
    aim.setRawPointer(800, 500);
    aim.update(.016, .016, 1);

    expect(aim.point().x).toBeGreaterThan(100);
    expect(aim.point().x).toBeLessThan(800);
  });
});
