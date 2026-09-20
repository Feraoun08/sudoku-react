import { useEffect, useState } from 'react';
import { DIFFICULTIES, MAX_CLUES, MIN_CLUES } from '../lib/sudoku';
import AttemptMarks from './AttemptMarks';

const pad = (n) => String(n).padStart(2, '0');
export const formatTime = (s) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

export default function ControlRail({ game }) {
  const {
    difficulty, clues, seconds, mistakes, attemptsLeft, attemptLimit,
    limitAttempts, status, isOver, newGame, surrender, setDifficulty, setClues, setLimitAttempts,
  } = game;

  // Surrender asks twice: giving up is irreversible and one stray click
  // would throw away the whole grid.
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { setConfirming(false); }, [status]);

  return (
    <aside className="rail">
      <section className="rail__block">
        <h2 className="rail__heading">Partie</h2>
        <dl className="stats">
          <div className="stats__row">
            <dt>Temps</dt>
            <dd className="stats__time">{formatTime(seconds)}</dd>
          </div>
          <div className="stats__row">
            <dt>Indices</dt>
            <dd>{clues} / 81</dd>
          </div>
        </dl>
        <AttemptMarks
          limited={limitAttempts}
          attemptsLeft={attemptsLeft}
          attemptLimit={attemptLimit}
          mistakes={mistakes}
        />
      </section>

      <section className="rail__block">
        <h2 className="rail__heading">Règle du jeu</h2>
        <div className="toggle" role="radiogroup" aria-label="Limite d'erreurs">
          <button
            type="button"
            role="radio"
            aria-checked={limitAttempts}
            className={`toggle__option${limitAttempts ? ' is-active' : ''}`}
            onClick={() => setLimitAttempts(true)}
          >
            3 essais
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={!limitAttempts}
            className={`toggle__option${!limitAttempts ? ' is-active' : ''}`}
            onClick={() => setLimitAttempts(false)}
          >
            Illimité
          </button>
        </div>
        <p className="rail__note">
          {limitAttempts
            ? 'À la troisième erreur, la grille se dévoile.'
            : 'Les erreurs sont comptées mais ne terminent pas la partie.'}
        </p>
      </section>

      <section className="rail__block">
        <h2 className="rail__heading">Nouvelle grille</h2>
        <div className="levels">
          {Object.entries(DIFFICULTIES).map(([key, d]) => (
            <button
              key={key}
              type="button"
              className={`level${difficulty === key ? ' is-active' : ''}`}
              onClick={() => setDifficulty(key)}
            >
              <span className="level__kanji" aria-hidden="true">{d.kanji}</span>
              <span className="level__label">{d.label}</span>
              <span className="level__clues">{d.clues}</span>
            </button>
          ))}
        </div>

        <label className="slider" htmlFor="clue-count">
          <span className="slider__label">
            Indices de départ
            <output htmlFor="clue-count" className="slider__value">{clues}</output>
          </span>
          <input
            id="clue-count"
            type="range"
            min={MIN_CLUES}
            max={MAX_CLUES}
            value={clues}
            onChange={(e) => setClues(Number(e.target.value))}
          />
        </label>
        <p className="rail__note">
          Moins d'indices, grille plus dure. Sous 24, le générateur s'arrête dès
          qu'un retrait de plus rendrait la solution ambiguë.
        </p>

        <button type="button" className="btn btn--primary" onClick={newGame}>
          Distribuer une grille
        </button>
      </section>

      <section className="rail__block">
        {confirming ? (
          <div className="confirm">
            <p className="confirm__text">Afficher la solution et terminer la partie ?</p>
            <div className="confirm__actions">
              <button type="button" className="btn btn--danger" onClick={surrender}>
                Oui, montrer
              </button>
              <button type="button" className="btn btn--quiet" onClick={() => setConfirming(false)}>
                Continuer
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn--quiet"
            onClick={() => setConfirming(true)}
            disabled={isOver}
          >
            Abandonner
          </button>
        )}
      </section>
    </aside>
  );
}
