import type { CSSProperties } from "react";
import Link from "next/link";
import styles from "../home.module.css";
import type { CourseCard } from "../home.types";

interface FeaturedCoursesSectionProps {
  courses: CourseCard[];
}

export function FeaturedCoursesSection({
  courses,
}: FeaturedCoursesSectionProps) {
  return (
    <section className={styles.featured} id="courses">
      <div className={styles.container}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Programmes d Excellence</h2>
            <p>
              Des cursus concus pour les ingenieurs qui refusent la mediocrite.
              Maitrisez les fondements et les architectures du futur.
            </p>
          </div>
          <Link className={styles.inlineLink} href="/formations">
            Voir tous les cours
          </Link>
        </div>

        <div className={styles.courseGrid}>
          {courses.map((course, index) => (
            <article
              key={course.title}
              className={styles.courseCard}
              style={{ "--reveal-index": index } as CSSProperties}
            >
              <div className={styles.courseImageWrap}>
                <img src={course.imageUrl} alt={course.imageAlt} />
                <span className={styles.courseTag}>{course.category}</span>
              </div>
              <h3 className={styles.courseTitle}>{course.title}</h3>
              <p className={styles.courseDesc}>{course.description}</p>
              <div className={styles.courseMeta}>
                <span className={styles.courseHours}>{course.hours}</span>
                <span className={styles.courseRating}>Rating {course.rating}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
