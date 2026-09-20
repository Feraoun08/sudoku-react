/**
 * Sits above the board and says what state the game is in. Deliberately not a
 * modal: when the player loses or gives up, the finished grid underneath is
 * the thing they came to see.
 */
const COPY = {
  won: {
    kanji: '完',
    title: 'Grille terminée',
    body: (t) => `Résolue en ${t}, sans dépasser la limite d'erreurs.`,
  },
  lost: {
    kanji: '終',
    title: 'Trois erreurs atteintes',
    body: () => 'La solution est affichée en dessous. Les cases en gris sont celles qui restaient.',
  },
  surrendered: {
    kanji: '降',
    title: 'Partie abandonnée',
    body: () => 'La solution est affichée en dessous. Les cases en gris sont celles qui restaient.',
  },
};

export default function StatusBanner({ status, elapsed }) {
  const copy = COPY[status];
  if (!copy) return null;

  return (
    <aside className={`banner banner--${status}`} role="status">
      <span className="banner__kanji" aria-hidden="true">{copy.kanji}</span>
      <div>
        <h2 className="banner__title">{copy.title}</h2>
        <p className="banner__body">{copy.body(elapsed)}</p>
      </div>
    </aside>
  );
}
