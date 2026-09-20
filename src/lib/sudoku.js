/**
 * sudoku.js — the whole game engine, no React, no DOM.
 *
 * Grid representation used everywhere in this project:
 *   number[9][9], where 0 means "empty" and 1..9 are the digits.
 * (Your Python used strings with '.' for empty. `fromStrings` / `toStrings`
 *  at the bottom convert both ways, so LeetCode-style boards still work.)
 */

export const SIZE = 9;
export const BOX = 3;
export const EMPTY = 0;

const FULL_MASK = 0x1ff; // bits 0..8 stand for digits 1..9

// popcount[m] = how many digits mask m allows. 512 entries covers 9 bits.
const POPCOUNT = new Uint8Array(512);
for (let i = 1; i < 512; i++) POPCOUNT[i] = POPCOUNT[i >> 1] + (i & 1);

// BIT_TO_DIGIT[1 << (d-1)] = d
const BIT_TO_DIGIT = new Uint8Array(513);
for (let d = 1; d <= 9; d++) BIT_TO_DIGIT[1 << (d - 1)] = d;

export const boxIndex = (r, c) => ((r / 3) | 0) * 3 + ((c / 3) | 0);

export const emptyGrid = () =>
  Array.from({ length: SIZE }, () => new Array(SIZE).fill(EMPTY));

export const cloneGrid = (grid) => grid.map((row) => row.slice());

export const gridsEqual = (a, b) =>
  a.every((row, r) => row.every((v, c) => v === b[r][c]));

export const isComplete = (grid) => grid.every((row) => row.every((v) => v !== EMPTY));

/* ------------------------------------------------------------------ *
 * 1. Validator — your isValidSudoku, kept as-is in spirit.
 *    Answers "does this board break a rule?", not "is it solvable?".
 * ------------------------------------------------------------------ */

export function isValidSudoku(grid) {
  const rows = Array.from({ length: SIZE }, () => new Set());
  const cols = Array.from({ length: SIZE }, () => new Set());
  const boxes = Array.from({ length: SIZE }, () => new Set());

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const num = grid[r][c];
      if (num === EMPTY) continue;
      const b = boxIndex(r, c);
      if (rows[r].has(num) || cols[c].has(num) || boxes[b].has(num)) return false;
      rows[r].add(num);
      cols[c].add(num);
      boxes[b].add(num);
    }
  }
  return true;
}

/**
 * Every cell that currently clashes with another filled cell, as "r-c" keys.
 * Used to paint conflicts live while the player types.
 */
export function findConflicts(grid) {
  const conflicts = new Set();
  const seen = new Map(); // "unit:digit" -> "r-c" of the first cell seen

  const mark = (key, r, c) => {
    const first = seen.get(key);
    if (first === undefined) {
      seen.set(key, `${r}-${c}`);
    } else {
      conflicts.add(first);
      conflicts.add(`${r}-${c}`);
    }
  };

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (v === EMPTY) continue;
      mark(`r${r}:${v}`, r, c);
      mark(`c${c}:${v}`, r, c);
      mark(`b${boxIndex(r, c)}:${v}`, r, c);
    }
  }
  return conflicts;
}

/* ------------------------------------------------------------------ *
 * 2. Solver — your backtracker, with two upgrades:
 *    - bitmasks instead of rescanning 27 cells per candidate test
 *    - MRV: always branch on the cell with the fewest candidates left
 * ------------------------------------------------------------------ */

/** Builds the row/col/box masks. Returns null if the board already breaks a rule. */
function createState(grid) {
  const rows = new Int32Array(SIZE);
  const cols = new Int32Array(SIZE);
  const boxes = new Int32Array(SIZE);
  const empties = [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (v === EMPTY) {
        empties.push(r * 9 + c);
        continue;
      }
      const bit = 1 << (v - 1);
      const b = boxIndex(r, c);
      if (rows[r] & bit || cols[c] & bit || boxes[b] & bit) return null;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
    }
  }
  return { rows, cols, boxes, empties };
}

function shuffleInPlace(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (rng() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Counts solutions up to `limit`, writing them into `grid` as it goes.
 * Once the limit is reached it returns immediately without undoing the last
 * branch — so `search(grid, st, 1)` leaves a finished solution sitting in grid.
 * `rng` non-null randomises candidate order (that is what makes generation vary).
 */
function search(grid, st, limit, rng) {
  const { rows, cols, boxes, empties } = st;
  if (empties.length === 0) return 1;

  // MRV: scan the remaining empties for the most constrained one.
  let bestI = -1;
  let bestMask = 0;
  let bestCount = 10;
  for (let i = 0; i < empties.length; i++) {
    const cell = empties[i];
    const r = (cell / 9) | 0;
    const c = cell % 9;
    const mask = FULL_MASK & ~(rows[r] | cols[c] | boxes[boxIndex(r, c)]);
    const count = POPCOUNT[mask];
    if (count < bestCount) {
      bestI = i;
      bestMask = mask;
      bestCount = count;
      if (count <= 1) break; // 0 = dead end, 1 = forced move; stop looking
    }
  }
  if (bestCount === 0) return 0;

  // Remove the chosen cell in O(1) by swapping it to the end.
  const last = empties.length - 1;
  const cell = empties[bestI];
  empties[bestI] = empties[last];
  empties[last] = cell;
  empties.pop();

  const r = (cell / 9) | 0;
  const c = cell % 9;
  const b = boxIndex(r, c);

  const candidates = [];
  for (let m = bestMask; m; ) {
    const bit = m & -m;
    m ^= bit;
    candidates.push(bit);
  }
  if (rng) shuffleInPlace(candidates, rng);

  let found = 0;
  for (const bit of candidates) {
    rows[r] |= bit;
    cols[c] |= bit;
    boxes[b] |= bit;
    grid[r][c] = BIT_TO_DIGIT[bit];

    found += search(grid, st, limit - found, rng);
    if (found >= limit) return found; // leave grid as-is; caller is done

    rows[r] ^= bit;
    cols[c] ^= bit;
    boxes[b] ^= bit;
  }

  // Exhausted: put the cell back exactly where it was.
  grid[r][c] = EMPTY;
  empties.push(cell);
  empties[last] = empties[bestI];
  empties[bestI] = cell;
  return found;
}

/** Fills `grid` in place with the first solution found. Returns false if unsolvable. */
export function solve(grid, rng = null) {
  const st = createState(grid);
  if (!st) return false;
  return search(grid, st, 1, rng) === 1;
}

/** Non-mutating convenience wrapper. Returns a solved copy, or null. */
export function solved(grid) {
  const copy = cloneGrid(grid);
  return solve(copy) ? copy : null;
}

/** How many solutions does this puzzle have? Stops counting at `limit`. */
export function countSolutions(grid, limit = 2) {
  const work = cloneGrid(grid);
  const st = createState(work);
  if (!st) return 0;
  return search(work, st, limit, null);
}

/* ------------------------------------------------------------------ *
 * 3. Generator
 * ------------------------------------------------------------------ */

export const DIFFICULTIES = {
  easy: { label: 'Débutant', kanji: '初', clues: 45 },
  medium: { label: 'Intermédiaire', kanji: '中', clues: 36 },
  hard: { label: 'Avancé', kanji: '上', clues: 30 },
  expert: { label: 'Maître', kanji: '極', clues: 25 },
};

export const MIN_CLUES = 22;
export const MAX_CLUES = 60;

/** A complete, valid, randomly shuffled 9x9 grid. */
export function generateSolvedGrid(rng = Math.random) {
  const grid = emptyGrid();
  solve(grid, rng);
  return grid;
}

/**
 * Digs holes out of a full grid, refusing any removal that would make the
 * puzzle ambiguous. That uniqueness check is what separates a real Sudoku
 * from a randomly hole-punched grid.
 *
 * `clues` is a target, not a promise: below ~24 the generator often cannot
 * reach it without creating a second solution, so it stops early and reports
 * the count it actually achieved.
 */
function digPuzzle({ clues = 36, rng = Math.random } = {}) {
  const target = Math.min(MAX_CLUES, Math.max(17, clues));
  const solution = generateSolvedGrid(rng);
  const puzzle = cloneGrid(solution);

  const order = shuffleInPlace(
    Array.from({ length: SIZE * SIZE }, (_, i) => i),
    rng
  );

  let remaining = SIZE * SIZE;
  for (const cell of order) {
    if (remaining <= target) break;
    const r = (cell / 9) | 0;
    const c = cell % 9;
    const backup = puzzle[r][c];
    if (backup === EMPTY) continue;

    puzzle[r][c] = EMPTY;
    if (countSolutions(puzzle, 2) === 1) {
      remaining--;
    } else {
      puzzle[r][c] = backup; // ambiguous — keep the clue
    }
  }

  return { puzzle, solution, clues: remaining };
}

const GENERATE_RETRY_LIMIT = 5;

/**
 * Public entry point. Wraps digPuzzle with a final invariant check before
 * anything reaches the player: every given must match the solution, no two
 * givens may clash, and the puzzle must have exactly one solution. None of
 * this has ever tripped in extensive testing, but a silently broken deal is
 * bad enough (and rare enough to be hard to catch by playing) that it's
 * worth the ~1ms this costs to make it structurally impossible to ship one.
 * On failure it regenerates from scratch, up to GENERATE_RETRY_LIMIT times.
 */
export function generatePuzzle(options = {}) {
  let last = null;
  for (let attempt = 0; attempt < GENERATE_RETRY_LIMIT; attempt++) {
    const result = digPuzzle(options);
    last = result;
    if (isSoundPuzzle(result.puzzle, result.solution)) return result;
  }
  // Practically unreachable — surface it loudly rather than serve a bad grid.
  console.error('sudoku: generatePuzzle failed its own validity check', GENERATE_RETRY_LIMIT, 'times in a row; serving the last attempt.', last);
  return last;
}

function isSoundPuzzle(puzzle, solution) {
  if (!isComplete(solution) || !isValidSudoku(solution)) return false;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (puzzle[r][c] !== EMPTY && puzzle[r][c] !== solution[r][c]) return false;
    }
  }
  if (findConflicts(puzzle).size > 0) return false;
  return countSolutions(puzzle, 2) === 1;
}

/* ------------------------------------------------------------------ *
 * 4. LeetCode interop — '.' / '1'..'9' string boards
 * ------------------------------------------------------------------ */

export const fromStrings = (board) =>
  board.map((row) => row.map((ch) => (ch === '.' ? EMPTY : Number(ch))));

export const toStrings = (grid) =>
  grid.map((row) => row.map((v) => (v === EMPTY ? '.' : String(v))));

/** Solves a string board in place, exactly like your Python solveSudoku. */
export function solveSudoku(board) {
  const grid = fromStrings(board);
  if (!solve(grid)) return;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) board[r][c] = String(grid[r][c]);
  }
}
