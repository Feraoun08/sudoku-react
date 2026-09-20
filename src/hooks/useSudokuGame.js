import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
  EMPTY,
  SIZE,
  DIFFICULTIES,
  cloneGrid,
  emptyGrid,
  findConflicts,
  generatePuzzle,
  gridsEqual,
  isComplete,
} from '../lib/sudoku';

/* Status machine:
 *   idle -> playing -> won
 *                   -> lost      (attempt limit reached)
 *                   -> surrendered
 * won / lost / surrendered are all "over": the board is frozen and, for the
 * last two, the solution has been written into every empty cell.
 */
export const OVER = ['won', 'lost', 'surrendered'];

const ATTEMPT_LIMIT = 3;

const initialState = {
  status: 'idle',
  puzzle: emptyGrid(), // the givens; 0 where the player must fill
  solution: emptyGrid(),
  board: emptyGrid(), // what is on screen right now
  revealed: new Set(), // "r-c" cells filled by the reveal, not the player
  mistakes: 0,
  limitAttempts: true,
  difficulty: 'medium',
  clues: DIFFICULTIES.medium.clues,
  cursor: { r: 0, c: 0 },
  seconds: 0,
  lastError: null, // "r-c" of the most recent wrong entry, for the shake
};

function reducer(state, action) {
  switch (action.type) {
    case 'start': {
      const { puzzle, solution, clues, difficulty } = action;
      return {
        ...state,
        status: 'playing',
        puzzle,
        solution,
        board: cloneGrid(puzzle),
        revealed: new Set(),
        mistakes: 0,
        clues,
        difficulty,
        cursor: firstEmptyCell(puzzle),
        seconds: 0,
        lastError: null,
      };
    }

    case 'select':
      return { ...state, cursor: { r: action.r, c: action.c } };

    case 'move': {
      const r = (state.cursor.r + action.dr + SIZE) % SIZE;
      const c = (state.cursor.c + action.dc + SIZE) % SIZE;
      return { ...state, cursor: { r, c } };
    }

    case 'erase': {
      const { r, c } = state.cursor;
      if (state.status !== 'playing' || state.puzzle[r][c] !== EMPTY) return state;
      if (state.board[r][c] === EMPTY) return state;
      const board = cloneGrid(state.board);
      board[r][c] = EMPTY;
      return { ...state, board, lastError: null };
    }

    case 'place': {
      const { r, c } = state.cursor;
      const value = action.value;
      if (state.status !== 'playing') return state;
      if (state.puzzle[r][c] !== EMPTY) return state; // givens are locked
      if (state.board[r][c] === value) return state; // no-op, no penalty

      const board = cloneGrid(state.board);
      board[r][c] = value;

      const correct = state.solution[r][c] === value;
      const mistakes = correct ? state.mistakes : state.mistakes + 1;
      const out = { ...state, board, mistakes, lastError: correct ? null : `${r}-${c}` };

      if (!correct && state.limitAttempts && mistakes >= ATTEMPT_LIMIT) {
        return { ...out, ...revealAll(state, board), status: 'lost' };
      }
      if (isComplete(board) && gridsEqual(board, state.solution)) {
        return { ...out, status: 'won' };
      }
      return out;
    }

    case 'surrender': {
      if (state.status !== 'playing') return state;
      return { ...state, ...revealAll(state, state.board), status: 'surrendered' };
    }

    case 'tick':
      return state.status === 'playing' ? { ...state, seconds: state.seconds + 1 } : state;

    case 'setLimitAttempts': {
      // Turning the limit on mid-game with the budget already blown ends it.
      const next = { ...state, limitAttempts: action.value };
      if (action.value && state.status === 'playing' && state.mistakes >= ATTEMPT_LIMIT) {
        return { ...next, ...revealAll(state, state.board), status: 'lost' };
      }
      return next;
    }

    case 'setDifficulty':
      return { ...state, difficulty: action.value, clues: DIFFICULTIES[action.value].clues };

    case 'setClues':
      return { ...state, clues: action.value, difficulty: 'custom' };

    default:
      return state;
  }
}

/** Writes the solution into every cell the player left empty or got wrong. */
function revealAll(state, currentBoard) {
  const board = cloneGrid(currentBoard);
  const revealed = new Set();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== state.solution[r][c]) {
        board[r][c] = state.solution[r][c];
        revealed.add(`${r}-${c}`);
      }
    }
  }
  return { board, revealed, lastError: null };
}

function firstEmptyCell(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) if (grid[r][c] === EMPTY) return { r, c };
  }
  return { r: 0, c: 0 };
}

export function useSudokuGame() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const settings = useRef({ difficulty: 'medium', clues: DIFFICULTIES.medium.clues });
  settings.current = { difficulty: state.difficulty, clues: state.clues };

  const newGame = useCallback(() => {
    const { difficulty, clues } = settings.current;
    const { puzzle, solution, clues: actual } = generatePuzzle({ clues });
    dispatch({ type: 'start', puzzle, solution, clues: actual, difficulty });
  }, []);

  // Deal the first hand on mount.
  useEffect(() => {
    newGame();
  }, [newGame]);

  // Clock, running only while the game is live.
  useEffect(() => {
    if (state.status !== 'playing') return undefined;
    const id = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(id);
  }, [state.status]);

  // Keyboard: arrows to move, 1-9 to place, 0/Backspace/Delete to erase.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const moves = {
        ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
        w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1],
      };
      if (moves[e.key]) {
        e.preventDefault();
        const [dr, dc] = moves[e.key];
        dispatch({ type: 'move', dr, dc });
      } else if (/^[1-9]$/.test(e.key)) {
        dispatch({ type: 'place', value: Number(e.key) });
      } else if (['0', 'Backspace', 'Delete'].includes(e.key)) {
        e.preventDefault();
        dispatch({ type: 'erase' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const conflicts = useMemo(() => findConflicts(state.board), [state.board]);

  // How many of each digit are still unplaced — drives the number pad.
  const remainingPerDigit = useMemo(() => {
    const counts = new Array(10).fill(SIZE);
    for (const row of state.board) for (const v of row) if (v !== EMPTY) counts[v]--;
    return counts;
  }, [state.board]);

  const isOver = OVER.includes(state.status);

  return {
    ...state,
    conflicts,
    remainingPerDigit,
    isOver,
    attemptsLeft: Math.max(0, ATTEMPT_LIMIT - state.mistakes),
    attemptLimit: ATTEMPT_LIMIT,
    newGame,
    select: (r, c) => dispatch({ type: 'select', r, c }),
    place: (value) => dispatch({ type: 'place', value }),
    erase: () => dispatch({ type: 'erase' }),
    surrender: () => dispatch({ type: 'surrender' }),
    setLimitAttempts: (value) => dispatch({ type: 'setLimitAttempts', value }),
    setDifficulty: (value) => dispatch({ type: 'setDifficulty', value }),
    setClues: (value) => dispatch({ type: 'setClues', value }),
  };
}
