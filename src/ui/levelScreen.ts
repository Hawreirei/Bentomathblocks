import { applyStroke, piecesCrossed, rotatedPiece, turnSentence } from '../core/cut';
import { History } from '../core/history';
import { canPlaceOnBoard, checkBoxPlacement, filledCells } from '../core/place';
import { isSolved, labelText, starsFor } from '../core/rules';
import { compartmentToppings, initialState } from '../core/state';
import type { GameState, LevelDef, Orientation, Piece, Sentence, Topping } from '../core/types';
import { STRINGS } from '../data/strings';
import { ghostSvg, ICONS, KIND_COLORS, starSvg, toppingSvg } from './art';

export interface LevelScreenOptions {
  root: HTMLElement;
  level: LevelDef;
  worldTitle: string;
  hasNext: boolean;
  onBack(): void;
  onNext(): void;
  onSolved(stars: number): void;
}

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Layout {
  cs: number;
  stageW: number;
  stageH: number;
  board: Rect;
  /** Top-left pixel of board cell (0, 0). */
  boardGrid: { left: number; top: number };
  box: Rect;
  /** Top-left pixel of box cell (0, 0). */
  boxGrid: { left: number; top: number };
}

type ToastTone = 'info' | 'good' | 'warn';

interface Toast {
  tone: ToastTone;
  text: string;
  sentences: Sentence[];
}

type Drag =
  | { type: 'piece'; id: number; el: HTMLElement; startX: number; startY: number; dx: number; dy: number; pointerId: number }
  | { type: 'knife'; startX: number; startY: number; orientation: Orientation | null; line: number; pointerId: number };

const BOARD_PAD = 12;
const BOX_PAD = 20;
const BOX_PAD_TOP = 30;
const GAP = 44;
const MAX_CELL = 60;
const PIECE_INSET = 2;
const TAP_DISTANCE = 6;

function computeLayout(level: LevelDef, available: number): Layout {
  const { board, box } = level;
  let cs = Math.floor((available - GAP - 2 * BOARD_PAD - 2 * BOX_PAD) / (board.w + box.w));
  const sideBySide = cs >= 36;
  if (!sideBySide) cs = Math.floor((available - 2 * BOX_PAD) / Math.max(board.w, box.w));
  cs = Math.max(24, Math.min(MAX_CELL, cs));

  const boardW = board.w * cs + 2 * BOARD_PAD;
  const boardH = board.h * cs + 2 * BOARD_PAD;
  const boxW = box.w * cs + 2 * BOX_PAD;
  const boxH = box.h * cs + BOX_PAD_TOP + BOX_PAD;

  let boardRect: Rect;
  let boxRect: Rect;
  let stageW: number;
  let stageH: number;
  if (sideBySide) {
    stageW = boardW + GAP + boxW;
    stageH = Math.max(boardH, boxH);
    boardRect = { left: 0, top: (stageH - boardH) / 2, width: boardW, height: boardH };
    boxRect = { left: boardW + GAP, top: (stageH - boxH) / 2, width: boxW, height: boxH };
  } else {
    stageW = Math.max(boardW, boxW);
    stageH = boxH + GAP / 2 + boardH;
    boxRect = { left: (stageW - boxW) / 2, top: 0, width: boxW, height: boxH };
    boardRect = { left: (stageW - boardW) / 2, top: boxH + GAP / 2, width: boardW, height: boardH };
  }
  return {
    cs,
    stageW,
    stageH,
    board: boardRect,
    boardGrid: { left: boardRect.left + BOARD_PAD, top: boardRect.top + BOARD_PAD },
    box: boxRect,
    boxGrid: { left: boxRect.left + BOX_PAD, top: boxRect.top + BOX_PAD_TOP },
  };
}

const px = (n: number) => `${Math.round(n * 10) / 10}px`;

function inside(r: Rect, x: number, y: number): boolean {
  return x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height;
}

export function mountLevel(opts: LevelScreenOptions): () => void {
  const { root, level } = opts;
  let state: GameState = initialState(level);
  const history = new History();
  let toast: Toast = { tone: 'info', text: STRINGS.toast.start, sentences: [] };
  let found: Sentence[] = [];
  let solved = false;
  let layout = computeLayout(level, availableWidth());
  let drag: Drag | null = null;
  let flashCell: { x: number; y: number } | null = null;

  function availableWidth(): number {
    return Math.min(1180, document.documentElement.clientWidth - 32);
  }

  // ---------- rendering ----------

  function pieceOrigin(p: Piece): { left: number; top: number } {
    const g = p.area === 'board' ? layout.boardGrid : layout.boxGrid;
    return { left: g.left + p.x * layout.cs + PIECE_INSET, top: g.top + p.y * layout.cs + PIECE_INSET };
  }

  function pieceHtml(p: Piece): string {
    const { left, top } = pieceOrigin(p);
    const colors = KIND_COLORS[p.kind];
    const cells: string[] = [];
    for (let r = 0; r < p.h; r++) {
      for (let c = 0; c < p.w; c++) {
        const t = p.toppings[r].charAt(c) as Topping;
        cells.push(`<div class="cell" style="background:${colors.fill}">${toppingSvg(t)}</div>`);
      }
    }
    const turnable = level.rules.rotation && p.area === 'board';
    return `<div class="piece${turnable ? ' turnable' : ''}" data-id="${p.id}" role="img"
      aria-label="${STRINGS.piece(colors.name, p.h, p.w)}"
      style="left:${px(left)};top:${px(top)};width:${px(p.w * layout.cs - 2 * PIECE_INSET)};height:${px(p.h * layout.cs - 2 * PIECE_INSET)};
      grid-template-columns:repeat(${p.w},1fr);grid-template-rows:repeat(${p.h},1fr);background:${colors.edge}">
      ${cells.join('')}
      <span class="size-tag">${p.h} × ${p.w}</span>
    </div>`;
  }

  function boxHtml(): string {
    const { cs, boxGrid } = layout;
    const out: string[] = [];
    level.compartments.forEach((comp, i) => {
      out.push(`<div class="compartment" style="left:${px(boxGrid.left + comp.x * cs + 3)};top:${px(boxGrid.top + comp.y * cs + 3)};
        width:${px(comp.w * cs - 6)};height:${px(comp.h * cs - 6)}"></div>`);
      const need = compartmentToppings(comp);
      for (let r = 0; r < comp.h; r++) {
        for (let c = 0; c < comp.w; c++) {
          const x = comp.x + c;
          const y = comp.y + r;
          const flash = flashCell && flashCell.x === x && flashCell.y === y ? ' flash' : '';
          out.push(`<div class="slot${flash}" style="left:${px(boxGrid.left + x * cs + 5)};top:${px(boxGrid.top + y * cs + 5)};
            width:${px(cs - 10)};height:${px(cs - 10)}">${ghostSvg(need[r].charAt(c) as Topping)}</div>`);
        }
      }
      const filled = filledCells(state, comp);
      const area = comp.w * comp.h;
      const full = filled === area;
      out.push(`<div class="label${full ? ' full' : ''}" data-comp="${i}"
        style="left:${px(boxGrid.left + (comp.x + comp.w / 2) * cs)};top:${px(boxGrid.top + comp.y * cs)}">
        <b>${labelText(comp, full)}</b><span>${full ? ICONS.check : `${filled}/${area}`}</span></div>`);
    });
    return out.join('');
  }

  function knifeHtml(): string {
    if (!drag || drag.type !== 'knife' || !drag.orientation) return '';
    const { cs, board, boardGrid } = layout;
    const miss = piecesCrossed(state, drag.orientation, drag.line).length === 0 ? ' miss' : '';
    if (drag.orientation === 'vertical') {
      return `<div class="knife vertical${miss}" style="left:${px(boardGrid.left + drag.line * cs - 2)};top:${px(board.top - 8)};height:${px(board.height + 16)}"></div>`;
    }
    return `<div class="knife horizontal${miss}" style="top:${px(boardGrid.top + drag.line * cs - 2)};left:${px(board.left - 8)};width:${px(board.width + 16)}"></div>`;
  }

  function stageHtml(): string {
    const { cs, board, box, boardGrid } = layout;
    const gridOffset = `${px(boardGrid.left - board.left)} ${px(boardGrid.top - board.top)}`;
    return `
      <div class="board" aria-label="${STRINGS.board}" style="left:${px(board.left)};top:${px(board.top)};width:${px(board.width)};height:${px(board.height)};
        background-size:${px(cs)} ${px(cs)};background-position:${gridOffset}"></div>
      <div class="box" aria-label="${STRINGS.box}" style="left:${px(box.left)};top:${px(box.top)};width:${px(box.width)};height:${px(box.height)}"></div>
      ${boxHtml()}
      ${state.pieces.map(pieceHtml).join('')}
      ${knifeHtml()}`;
  }

  function toastHtml(): string {
    // One stroke can make the same sentence several times; show each once with a count.
    const groups = new Map<string, { s: Sentence; n: number }>();
    for (const s of toast.sentences) {
      const g = groups.get(s.factors);
      if (g) g.n += 1;
      else groups.set(s.factors, { s, n: 1 });
    }
    const sentences = [...groups.values()]
      .map(
        ({ s, n }) =>
          `<div class="sentence"><span class="factors">${s.factors}</span><span class="totals">${s.totals}</span>${
            n > 1 ? `<span class="times" aria-label="${n} times">× ${n}</span>` : ''
          }</div>`,
      )
      .join('');
    return `<p class="toast-text">${toast.text}</p><div class="sentences${groups.size > 1 ? ' multi' : ''}">${sentences}</div>`;
  }

  function winHtml(): string {
    if (!solved) return '';
    const stars = starsFor(state.cuts, level.par);
    const list = found.length
      ? `<ul class="win-sentences">${found.map((s) => `<li><b>${s.factors}</b><span>${s.totals}</span></li>`).join('')}</ul>`
      : `<p class="muted">${STRINGS.win.none}</p>`;
    return `<div class="overlay"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="win-title">
      <h2 id="win-title">${STRINGS.win.title}</h2>
      <div class="win-stars" role="img" aria-label="${stars} of 3 stars">${[1, 2, 3].map((n) => starSvg(n <= stars, 48)).join('')}</div>
      <p class="muted">${STRINGS.win.summary(state.cuts, level.par)}</p>
      <h3>${STRINGS.win.sentences}</h3>
      ${list}
      ${opts.hasNext ? '' : `<p class="muted">${STRINGS.win.finished}</p>`}
      <div class="dialog-actions">
        <button type="button" class="btn ghost" data-action="map">${STRINGS.win.map}</button>
        <button type="button" class="btn ghost" data-action="replay">${STRINGS.win.replay}</button>
        ${opts.hasNext ? `<button type="button" class="btn primary" data-action="next">${STRINGS.win.next} ${ICONS.next}</button>` : ''}
      </div>
    </div></div>`;
  }

  function render(): void {
    const stars = starsFor(state.cuts, level.par);
    const help = [STRINGS.boardHelpCut, level.rules.rotation ? STRINGS.boardHelpTurn : ''].filter(Boolean).join(' ');
    root.innerHTML = `
      <div class="screen level-screen">
        <header class="topbar">
          <div class="topbar-left">
            <button type="button" class="icon-btn" data-action="back" aria-label="${STRINGS.back}">${ICONS.back}</button>
            <div class="title-block">
              <span class="eyebrow">${opts.worldTitle}</span>
              <h1>${STRINGS.level(level.id)} · ${level.title}</h1>
            </div>
          </div>
          <div class="topbar-right">
            <span class="pill stars" role="img" aria-label="On track for ${stars} of 3 stars">${[1, 2, 3].map((n) => starSvg(n <= stars, 22)).join('')}</span>
            <span class="pill">${STRINGS.cutsPar(state.cuts, level.par)}</span>
            <button type="button" class="btn" data-action="undo" ${history.size === 0 ? 'disabled' : ''}>${ICONS.undo}${STRINGS.undo}</button>
            <button type="button" class="icon-btn" data-action="restart" aria-label="${STRINGS.restart}">${ICONS.restart}</button>
          </div>
        </header>
        <div class="toast ${toast.tone}" aria-live="polite">${toastHtml()}</div>
        <div class="stage" style="width:${px(layout.stageW)};height:${px(layout.stageH)}">${stageHtml()}</div>
        <p class="hint">${level.hint} <span class="muted">${help}</span></p>
      </div>
      ${winHtml()}`;
    if (solved) root.querySelector<HTMLButtonElement>('.dialog .primary, .dialog [data-action="replay"]')?.focus();
  }

  function renderKnife(): void {
    const stage = root.querySelector('.stage');
    if (!stage) return;
    stage.querySelector('.knife')?.remove();
    stage.insertAdjacentHTML('beforeend', knifeHtml());
  }

  // ---------- actions ----------

  function commit(next: GameState, newToast: Toast): void {
    history.push(state);
    state = next;
    toast = newToast;
    flashCell = null;
    if (isSolved(level, state)) {
      solved = true;
      opts.onSolved(starsFor(state.cuts, level.par));
    }
    render();
  }

  function warn(text: string, cell: { x: number; y: number } | null = null): void {
    toast = { tone: 'warn', text, sentences: [] };
    flashCell = cell;
    render();
  }

  function restart(): void {
    state = initialState(level);
    history.clear();
    found = [];
    solved = false;
    flashCell = null;
    toast = { tone: 'info', text: STRINGS.toast.start, sentences: [] };
    render();
  }

  function undo(): void {
    const prev = history.pop();
    if (!prev) return;
    state = prev;
    solved = false;
    flashCell = null;
    toast = { tone: 'info', text: STRINGS.toast.start, sentences: [] };
    render();
  }

  function stroke(orientation: Orientation, line: number): void {
    const result = applyStroke(state, orientation, line);
    if (!result) {
      warn(STRINGS.toast.missed);
      return;
    }
    found = [...found, ...result.sentences];
    commit(result.state, { tone: 'good', text: STRINGS.toast.cut(result.sentences.length), sentences: result.sentences });
  }

  function turn(piece: Piece): void {
    if (!level.rules.rotation) {
      warn(STRINGS.toast.noTurn);
      return;
    }
    if (piece.w === piece.h && piece.toppings.join('') === '.'.repeat(piece.w * piece.h)) return;
    const turned = rotatedPiece(piece);
    if (!canPlaceOnBoard(level, state, turned, turned.x, turned.y)) {
      warn(STRINGS.toast.noRoom);
      return;
    }
    const next = { ...state, pieces: state.pieces.map((p) => (p.id === piece.id ? turned : p)) };
    commit(next, { tone: 'good', text: STRINGS.toast.turn, sentences: [turnSentence(piece.h, piece.w)] });
  }

  function drop(piece: Piece, left: number, top: number): void {
    const { cs } = layout;
    const cellLeft = left - PIECE_INSET;
    const cellTop = top - PIECE_INSET;
    const cx = cellLeft + (piece.w * cs) / 2;
    const cy = cellTop + (piece.h * cs) / 2;

    if (inside(layout.box, cx, cy)) {
      const x = Math.round((cellLeft - layout.boxGrid.left) / cs);
      const y = Math.round((cellTop - layout.boxGrid.top) / cs);
      if (piece.area === 'box' && piece.x === x && piece.y === y) return render();
      const check = checkBoxPlacement(level, state, piece, x, y);
      if (!check.ok) {
        warn(STRINGS.toast[check.reason], check.cell ?? null);
        return;
      }
      const next = { ...state, pieces: state.pieces.map((p) => (p.id === piece.id ? { ...p, area: 'box' as const, x, y } : p)) };
      commit(next, { tone: 'info', text: toast.tone === 'warn' ? STRINGS.toast.start : toast.text, sentences: toast.tone === 'warn' ? [] : toast.sentences });
      return;
    }

    if (inside(layout.board, cx, cy)) {
      const x = Math.max(0, Math.min(level.board.w - piece.w, Math.round((cellLeft - layout.boardGrid.left) / cs)));
      const y = Math.max(0, Math.min(level.board.h - piece.h, Math.round((cellTop - layout.boardGrid.top) / cs)));
      if (piece.area === 'board' && piece.x === x && piece.y === y) return render();
      if (!canPlaceOnBoard(level, state, piece, x, y)) {
        warn(STRINGS.toast.boardFull);
        return;
      }
      const next = { ...state, pieces: state.pieces.map((p) => (p.id === piece.id ? { ...p, area: 'board' as const, x, y } : p)) };
      commit(next, toast);
      return;
    }
    render();
  }

  // ---------- input ----------

  function stagePoint(e: PointerEvent): { x: number; y: number } | null {
    const stage = root.querySelector('.stage');
    if (!stage) return null;
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function onPointerDown(e: PointerEvent): void {
    if (solved || drag || e.button > 0) return;
    const target = e.target as HTMLElement;
    const pt = stagePoint(e);
    if (!pt || !target.closest('.stage')) return;
    const pieceEl = target.closest<HTMLElement>('.piece');
    if (pieceEl) {
      e.preventDefault();
      drag = { type: 'piece', id: Number(pieceEl.dataset.id), el: pieceEl, startX: pt.x, startY: pt.y, dx: 0, dy: 0, pointerId: e.pointerId };
      pieceEl.classList.add('dragging');
      root.setPointerCapture(e.pointerId);
      return;
    }
    if (inside(layout.board, pt.x, pt.y)) {
      e.preventDefault();
      drag = { type: 'knife', startX: pt.x, startY: pt.y, orientation: null, line: 0, pointerId: e.pointerId };
      root.setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const pt = stagePoint(e);
    if (!pt) return;
    if (drag.type === 'piece') {
      drag.dx = pt.x - drag.startX;
      drag.dy = pt.y - drag.startY;
      drag.el.style.transform = `translate(${drag.dx}px, ${drag.dy}px)`;
      return;
    }
    const dx = pt.x - drag.startX;
    const dy = pt.y - drag.startY;
    if (!drag.orientation && Math.hypot(dx, dy) < 12) return;
    const orientation: Orientation = Math.abs(dy) >= Math.abs(dx) ? 'vertical' : 'horizontal';
    const { cs, boardGrid } = layout;
    const line =
      orientation === 'vertical'
        ? Math.round(((drag.startX + pt.x) / 2 - boardGrid.left) / cs)
        : Math.round(((drag.startY + pt.y) / 2 - boardGrid.top) / cs);
    const max = orientation === 'vertical' ? level.board.w - 1 : level.board.h - 1;
    const clamped = Math.max(1, Math.min(max, line));
    if (orientation !== drag.orientation || clamped !== drag.line) {
      drag.orientation = orientation;
      drag.line = clamped;
      renderKnife();
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const d = drag;
    drag = null;
    if (root.hasPointerCapture(e.pointerId)) root.releasePointerCapture(e.pointerId);
    if (d.type === 'knife') {
      if (d.orientation) stroke(d.orientation, d.line);
      else renderKnife();
      return;
    }
    const piece = state.pieces.find((p) => p.id === d.id);
    if (!piece) return render();
    if (Math.hypot(d.dx, d.dy) < TAP_DISTANCE) {
      d.el.classList.remove('dragging');
      d.el.style.transform = '';
      if (piece.area === 'board') turn(piece);
      return;
    }
    const origin = pieceOrigin(piece);
    drop(piece, origin.left + d.dx, origin.top + d.dy);
  }

  function onPointerCancel(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.pointerId) return;
    drag = null;
    render();
  }

  function onClick(e: MouseEvent): void {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')?.dataset.action;
    switch (action) {
      case 'back':
      case 'map':
        opts.onBack();
        break;
      case 'undo':
        undo();
        break;
      case 'restart':
      case 'replay':
        restart();
        break;
      case 'next':
        opts.onNext();
        break;
    }
  }

  function onKey(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !solved) {
      e.preventDefault();
      undo();
    }
  }

  let resizeTimer = 0;
  function onResize(): void {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (drag) return;
      layout = computeLayout(level, availableWidth());
      render();
    }, 120);
  }

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('pointercancel', onPointerCancel);
  root.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', onResize);
  render();

  return () => {
    root.removeEventListener('pointerdown', onPointerDown);
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerup', onPointerUp);
    root.removeEventListener('pointercancel', onPointerCancel);
    root.removeEventListener('click', onClick);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
    window.clearTimeout(resizeTimer);
  };
}
