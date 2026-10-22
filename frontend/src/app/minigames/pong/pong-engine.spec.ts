import { BALL_RADIUS, COURT_HEIGHT, COURT_WIDTH, PADDLE_INSET, PADDLE_WIDTH, PongEngine, WINNING_SCORE } from './pong-engine';

describe('Pong match physics', () => {
  it('gives both sides a countdown before serving and keeps paddles in bounds', () => {
    const game = new PongEngine();
    for (let i = 0; i < 60; i++) game.step(1 / 120, -1000);
    expect(game.ball.vx).toBe(0);
    expect(game.playerY).toBe(game.mode.playerHeight / 2);
    for (let i = 0; i < 60; i++) game.step(1 / 120, 1000);
    expect(game.ball.vx).toBeLessThan(0);
    expect(game.playerY).toBe(COURT_HEIGHT - game.mode.playerHeight / 2);
    expect(game.aiY).toBeGreaterThanOrEqual(game.mode.aiHeight / 2);
  });

  it('reflects off a paddle once, changes angle based on impact, and caps speed', () => {
    const game = new PongEngine();
    game.serveRemaining = 0;
    const plane = PADDLE_INSET + PADDLE_WIDTH + BALL_RADIUS;
    game.ball = { x: plane + 2, y: game.playerY + 50, vx: -640, vy: 0 };
    expect(game.step(1 / 120, game.playerY)).toBe('bounce');
    expect(game.ball.vx).toBeGreaterThan(0);
    expect(game.ball.vy).toBeGreaterThan(0);
    expect(Math.hypot(game.ball.vx, game.ball.vy)).toBeCloseTo(game.mode.maxSpeed, 8);
    expect(game.bestRally).toBe(1);
    game.step(1 / 120, game.playerY);
    expect(game.rally).toBe(1);
  });

  it('bounces from the opponent and top wall without leaving the court', () => {
    const game = new PongEngine();
    game.serveRemaining = 0;
    const plane = COURT_WIDTH - PADDLE_INSET - PADDLE_WIDTH - BALL_RADIUS;
    game.ball = { x: plane - 2, y: game.aiY, vx: 500, vy: 0 };
    expect(game.step(1 / 120, game.playerY)).toBe('bounce');
    expect(game.ball.vx).toBeLessThan(0);
    game.ball = { x: 500, y: BALL_RADIUS + 1, vx: -400, vy: -300 };
    expect(game.step(1 / 120, game.playerY)).toBe('wall');
    expect(game.ball.vy).toBeGreaterThan(0);
    expect(game.ball.y).toBeGreaterThanOrEqual(BALL_RADIUS);
  });

  it('lets an off-target ball pass, scores once, and serves toward the player who conceded', () => {
    const game = new PongEngine();
    game.serveRemaining = 0;
    game.ball = { x: 63, y: 30, vx: -500, vy: 0 };
    expect(game.step(1 / 120, 300)).not.toBe('bounce');
    game.ball.x = -BALL_RADIUS - 1;
    expect(game.step(1 / 120, 300)).toBe('ai-point');
    expect(game.aiScore).toBe(1);
    expect(game.ball.x).toBe(COURT_WIDTH / 2);
    game.step(1 / 120, 300);
    expect(game.aiScore).toBe(1);
    for (let i = 0; i < 120; i++) game.step(1 / 120, 300);
    expect(game.ball.vx).toBeLessThan(0);
  });

  it('finishes at seven and never changes a completed match', () => {
    for (const playerWins of [true, false]) {
      const game = new PongEngine();
      game.serveRemaining = 0;
      game.playerScore = playerWins ? WINNING_SCORE - 1 : 0;
      game.aiScore = playerWins ? 0 : WINNING_SCORE - 1;
      game.ball = { x: playerWins ? COURT_WIDTH + BALL_RADIUS + 1 : -BALL_RADIUS - 1, y: 300, vx: playerWins ? 400 : -400, vy: 0 };
      expect(game.step(1 / 120, 300)).toBe(playerWins ? 'win' : 'lose');
      expect(game.over).toBe(true);
      expect(game.step(1 / 120, 0)).toBeNull();
      expect(Math.max(game.playerScore, game.aiScore)).toBe(WINNING_SCORE);
    }
  });

  it('keeps the AI beatable with a movement limit and gives Easy more room', () => {
    const easy = new PongEngine('easy');
    const hard = new PongEngine('hard');
    expect(easy.mode.playerHeight).toBeGreaterThan(hard.mode.playerHeight);
    expect(easy.mode.ballSpeed).toBeLessThan(hard.mode.ballSpeed);
    easy.ball = { x: 600, y: 500, vx: 400, vy: 0 };
    easy.step(1 / 120, 300);
    expect(easy.aiY - 300).toBeLessThanOrEqual(easy.mode.aiSpeed / 120);
    expect(easy.aiY).not.toBe(500);
  });
});
