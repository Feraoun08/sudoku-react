import { EMPTY, boxIndex } from '../lib/sudoku';
import Cell from './Cell';

/**
 * The 9x9 grid. Owns the highlight rules:
 *   selected — the cursor
 *   peer     — shares a row, column or box with the cursor
 *   twin     — holds the same digit as the cursor
 */
export default function SudokuBoard({ game }) {
  const { board, puzzle, cursor, conflicts, revealed, lastError, isOver, select } = game;
  const activeValue = board[cursor.r][cursor.c];
  const activeBox = boxIndex(cursor.r, cursor.c);

  return (
    <div className={`board${isOver ? ' board--over' : ''}`} role="grid" aria-label="Grille de sudoku">
      {board.map((row, r) =>
        row.map((value, c) => {
          const peer = r === cursor.r || c === cursor.c || boxIndex(r, c) === activeBox;
          return (
            <Cell
              key={`${r}-${c}`}
              r={r}
              c={c}
              value={value}
              given={puzzle[r][c] !== EMPTY}
              revealed={revealed.has(`${r}-${c}`)}
              conflicted={conflicts.has(`${r}-${c}`)}
              shaking={lastError === `${r}-${c}`}
              selected={r === cursor.r && c === cursor.c}
              peer={peer}
              twin={value !== EMPTY && value === activeValue && !(r === cursor.r && c === cursor.c)}
              frozen={isOver}
              onSelect={select}
            />
          );
        })
      )}
    </div>
  );
}
