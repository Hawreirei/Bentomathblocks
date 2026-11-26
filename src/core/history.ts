import { cloneState } from './state';
import type { GameState } from './types';

/** Undo stack of whole-state snapshots. Levels are tiny, so snapshots are cheap. */
export class History {
  private stack: GameState[] = [];

  push(state: GameState): void {
    this.stack.push(cloneState(state));
  }

  pop(): GameState | undefined {
    return this.stack.pop();
  }

  clear(): void {
    this.stack = [];
  }

  get size(): number {
    return this.stack.length;
  }
}
