import { Link } from 'react-router-dom';
import { aboutPage } from '../content/forTeachers';
import { usePageTitle } from '../hooks/usePageTitle';

export default function About() {
  usePageTitle('About · SN1 Mechanics');

  const { title, eyebrow, lead, author, projectNotes, acknowledgements, repoNote } = aboutPage;

  return (
    <div className="teachers-page">
      <header className="teachers-hero glass-panel" style={{ borderLeftColor: 'var(--primary)' }}>
        <p className="home-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="home-lede textbook-font">{lead}</p>
      </header>

      <section className="glass-panel">
        <h2>Author</h2>
        <p className="textbook-font" style={{ marginBottom: 12 }}>
          <strong>{author.name}</strong>
          <br />
          {author.role}
        </p>
        <ul className="guide-list">
          <li>
            Office {author.office}, local {author.local}
          </li>
          <li>
            <a href={`mailto:${author.email}`}>{author.email}</a>
          </li>
        </ul>
      </section>

      <section className="glass-panel">
        <h2>About this suite</h2>
        <ul className="guide-list">
          {projectNotes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <section className="glass-panel">
        <h2>Acknowledgements</h2>
        <p className="textbook-font" style={{ margin: 0 }}>
          {acknowledgements}
        </p>
      </section>

      <section className="glass-panel">
        <h2>Source</h2>
        <p className="textbook-font" style={{ marginBottom: 16 }}>
          {repoNote}
        </p>
        <div className="home-card-actions">
          <Link to="/for-teachers" className="btn-link">
            For Teachers
          </Link>
          <Link to="/" className="btn-link secondary">
            Home
          </Link>
        </div>
      </section>
    </div>
  );
}
