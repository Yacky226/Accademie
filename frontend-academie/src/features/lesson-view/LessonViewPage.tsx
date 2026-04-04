import { lessonPlaylist, lessonResources } from "./lesson-view.data";
import styles from "./lesson-view.module.css";

export function LessonViewPage() {
  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <section className={styles.player}>
          <div className={styles.video}>
            <button
              aria-label="Play lesson"
              className={styles.play}
              type="button"
            >
              ►
            </button>
          </div>
          <div className={styles.lessonInfo}>
            <p className={styles.kicker}>Module 02 • Live coding</p>
            <h1>Event Streams And Side Effects In Modern Frontends</h1>
            <p>
              Learn to model asynchronous behavior safely, isolate mutation
              points, and design deterministic state updates.
            </p>
            <div className={styles.progress}>
              <span />
            </div>
          </div>
        </section>

        <aside className={styles.sidebar}>
          <div>
            <h2>Course Timeline</h2>
            <ul className={styles.playlist}>
              {lessonPlaylist.map((item) => (
                <li key={item.title}>
                  <span>{item.title}</span>
                  <strong>{item.done ? "Done" : item.duration}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2>Resources</h2>
            <ul className={styles.resources}>
              {lessonResources.map((resource) => (
                <li key={resource}>{resource}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
