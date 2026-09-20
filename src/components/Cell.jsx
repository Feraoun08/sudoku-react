import { memo } from 'react';
import { EMPTY, boxIndex } from '../lib/sudoku';

/**
 * One square of the grid. Purely presentational — every decision about how it
 * should look is passed in, so the board can be re-rendered cheaply.
 */
function Cell({ r, c, value, given, revealed, conflicted, shaking, selected, peer, twin, frozen, onSelect }) {
  const classes = ['cell'];
  if (given) classes.push('cell--given');
  if (revealed) classes.push('cell--revealed');
  if (conflicted) classes.push('cell--conflict');
  if (shaking) classes.push('cell--shake');
  if (selected) classes.push('cell--selected');
  else if (peer) classes.push('cell--peer');
  if (twin) classes.push('cell--twin');
  if (c % 3 === 2 && c !== 8) classes.push('cell--edge-right');
  if (r % 3 === 2 && r !== 8) classes.push('cell--edge-bottom');

  const label = value === EMPTY
    ? `Case vide, ligne ${r + 1}, colonne ${c + 1}`
    : `${value}, ligne ${r + 1}, colonne ${c + 1}${given ? ', indice de depart' : ''}`;

  return (
    <button
      type="button"
      className={classes.join(' ')}
      onClick={() => onSelect(r, c)}
      tabIndex={-1}
      aria-label={label}
      aria-disabled={frozen || undefined}
      data-box={boxIndex(r, c)}
      style={revealed ? { '--reveal-delay': `${(r + c) * 28}ms` } : undefined}
    >
      {value === EMPTY ? '' : value}
    </button>
  );
}

export default memo(Cell);
