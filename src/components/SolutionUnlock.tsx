import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Unlock } from 'lucide-react';
import { useTeacherUnlock } from '../hooks/useTeacherUnlock';

export function SolutionUnlock({ compact = false }: { compact?: boolean }) {
  const { unlocked, error, unlock, lock } = useTeacherUnlock();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await unlock(value);
    setBusy(false);
    if (ok) setValue('');
  };

  if (unlocked) {
    return (
      <div className={`solution-unlock${compact ? ' compact' : ''}`}>
        <p>
          <Unlock size={15} />
          Hints and worked solutions are visible in this tab.
        </p>
        <button type="button" className="secondary" onClick={lock}>
          <Lock size={14} />
          Lock solutions
        </button>
      </div>
    );
  }

  if (compact) {
    return (
      <form className="solution-unlock compact" onSubmit={submit}>
        <label className="sr-only" htmlFor="teacher-pass-compact">
          Teacher passphrase
        </label>
        <input
          id="teacher-pass-compact"
          type="password"
          autoComplete="current-password"
          placeholder="Teacher passphrase"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" disabled={busy || !value.trim()}>
          Unlock
        </button>
        {error && <span className="solution-unlock-error">{error}</span>}
        <Link to="/for-teachers" className="guide-back" style={{ marginLeft: 4 }}>
          For Teachers
        </Link>
      </form>
    );
  }

  return (
    <form className="solution-unlock glass-panel" onSubmit={submit}>
      <h2>Unlock solutions</h2>
      <p className="text-muted">
        Student pages hide hints and worked solutions. Enter the instructor passphrase to
        reveal them in this browser tab. Close the tab or lock before a student uses this
        machine.
      </p>
      <div className="solution-unlock-row">
        <label className="sr-only" htmlFor="teacher-pass">
          Teacher passphrase
        </label>
        <input
          id="teacher-pass"
          type="password"
          autoComplete="current-password"
          placeholder="Passphrase"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" disabled={busy || !value.trim()}>
          <Unlock size={15} />
          Unlock
        </button>
      </div>
      {error && <p className="solution-unlock-error">{error}</p>}
    </form>
  );
}

export function SolutionsLockedNote() {
  return (
    <p className="solutions-locked-note">
      Hints and worked solutions are hidden.{' '}
      <Link to="/for-teachers">Teachers can unlock them here.</Link>
    </p>
  );
}
