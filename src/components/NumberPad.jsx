/**
 * Digit entry, laid out 3x3 so it echoes a box of the grid.
 * A digit dims out once all nine of it are on the board.
 */
export default function NumberPad({ game }) {
  const { place, erase, remainingPerDigit, isOver } = game;

  return (
    <div className="pad">
      <div className="pad__keys">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <button
            key={d}
            type="button"
            className="pad__key"
            onClick={() => place(d)}
            disabled={isOver || remainingPerDigit[d] === 0}
            aria-label={`Placer le ${d}, ${remainingPerDigit[d]} restants`}
          >
            <span className="pad__digit">{d}</span>
            <span className="pad__count">{remainingPerDigit[d]}</span>
          </button>
        ))}
      </div>
      <button type="button" className="pad__erase" onClick={erase} disabled={isOver}>
        Effacer la case
      </button>
    </div>
  );
}
