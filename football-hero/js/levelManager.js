// Objective evaluation and star rating for a level attempt.
import { GOAL } from './config.js';
import { describeObjective } from './levels.js';

// ctx: { goal, scorerIsHero, assistByHero, passes, actions, finish, oneTouch, target:{x,y}, curl, shotDist, attempt, freeKick }
export function checkCondition(o, ctx) {
  switch (o.type) {
    case 'score': return !!ctx.goal;
    case 'heroScores': return !!ctx.goal && ctx.scorerIsHero;
    case 'header': return !!ctx.goal && ctx.finish === 'header';
    case 'oneTouch': return !!ctx.goal && ctx.oneTouch;
    case 'passesThenScore': return !!ctx.goal && ctx.passes >= o.n;
    case 'assist': return !!ctx.goal && !ctx.scorerIsHero && ctx.assistByHero;
    case 'longShot': return !!ctx.goal && ctx.shotDist >= 20;
    case 'maxActions': return !!ctx.goal && ctx.actions <= o.n;
    case 'firstAttempt': return !!ctx.goal && ctx.attempt === 1;
    case 'corner': return !!ctx.goal && ctx.target && Math.abs(ctx.target.x) > GOAL.halfWidth - 1.6;
    case 'topCorner': return !!ctx.goal && ctx.target && Math.abs(ctx.target.x) > GOAL.halfWidth - 1.5 && ctx.target.y > 1.45;
    case 'curve': return !!ctx.goal && Math.abs(ctx.curl || 0) > 1.0;
    default: return false;
  }
}

export function evaluate(level, ctx) {
  const primary = level.objective.map((o) => ({ text: describeObjective(o), ok: checkCondition(o, ctx) }));
  const success = primary.every((p) => p.ok);
  const extra = level.stars.map((o) => ({ text: describeObjective(o), ok: success && checkCondition(o, ctx) }));
  const stars = success ? 1 + extra.filter((e) => e.ok).length : 0;
  return { success, stars, primary, extra };
}

// Live progress text for the HUD, e.g. "Passes 1/3"
export function progressText(level, ctx) {
  const parts = [];
  for (const o of level.objective) {
    if (o.type === 'passesThenScore') parts.push(`Passes ${Math.min(ctx.passes, o.n)}/${o.n}`);
    if (o.type === 'maxActions') parts.push(`Ações ${ctx.actions}/${o.n}`);
  }
  return parts.join(' · ');
}

// Can the attempt still succeed? (used to end attempts early)
export function isAttemptDoomed(level, ctx) {
  for (const o of level.objective) {
    if (o.type === 'maxActions' && ctx.actions >= o.n) return 'Sem ações restantes';
  }
  return null;
}
