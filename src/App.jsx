import SudokuBoard from './components/SudokuBoard';
import NumberPad from './components/NumberPad';
import ControlRail, { formatTime } from './components/ControlRail';
import StatusBanner from './components/StatusBanner';
import { useSudokuGame } from './hooks/useSudokuGame';

export default function App() {
  const game = useSudokuGame();

  return (
    <div className="app">
      <header className="masthead">
        <h1 className="masthead__title">
          <span className="masthead__kanji" lang="ja">数独</span>
          <span className="masthead__roman">Sudoku</span>
        </h1>
        <p className="masthead__lede">
          Chaque ligne, chaque colonne et chaque bloc de neuf cases contient les
          chiffres 1 à 9, une seule fois.
        </p>
      </header>

      <main className="layout">
        <div className="layout__play">
          <StatusBanner status={game.status} elapsed={formatTime(game.seconds)} />
          <SudokuBoard game={game} />
          <NumberPad game={game} />
        </div>
        <ControlRail game={game} />
      </main>

      <footer className="footnote">
        Flèches ou WASD pour se déplacer · 1 à 9 pour écrire · Retour arrière pour effacer
      </footer>
    </div>
  );
}
