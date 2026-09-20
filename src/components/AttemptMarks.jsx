/**
 * Three enso-style rings, one per attempt. A spent attempt gets an ink-red
 * fill and a brush stroke through it. In unlimited mode the rings give way to
 * a plain count, because there is nothing left to run out of.
 */
export default function AttemptMarks({ limited, attemptsLeft, attemptLimit, mistakes }) {
  if (!limited) {
    return (
      <p className="attempts attempts--open">
        <span className="attempts__value">{mistakes}</span>
        <span className="attempts__unit">erreur{mistakes === 1 ? '' : 's'} — aucune limite</span>
      </p>
    );
  }

  return (
    <div className="attempts" role="status" aria-label={`${attemptsLeft} essais restants sur ${attemptLimit}`}>
      {Array.from({ length: attemptLimit }, (_, i) => {
        const spent = i >= attemptsLeft;
        return (
          <svg key={i} className={`mark${spent ? ' mark--spent' : ''}`} viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="14" className="mark__ring" />
            {spent && <path d="M9 31 L31 9" className="mark__strike" />}
          </svg>
        );
      })}
      <span className="attempts__unit">essais</span>
    </div>
  );
}
