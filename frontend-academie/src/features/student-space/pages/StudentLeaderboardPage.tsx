"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useCurrentAuthSession } from "@/features/auth/model/useCurrentAuthSession";
import {
  fetchWorkspaceLeaderboard,
  fetchWorkspaceMyGamification,
} from "@/features/workspace-data/api/workspace-api.client";
import type {
  WorkspaceGamificationSummaryRecord,
  WorkspaceLeaderboardRecord,
} from "@/features/workspace-data/model/workspace-api.types";
import { formatWorkspaceDate } from "@/features/workspace-data/model/workspace-ui.utils";
import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

function formatXp(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} XP`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function StudentLeaderboardPage() {
  const { user } = useCurrentAuthSession();
  const [leaderboard, setLeaderboard] = useState<WorkspaceLeaderboardRecord[]>([]);
  const [summary, setSummary] = useState<WorkspaceGamificationSummaryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const podium = leaderboard.slice(0, 3);
  const currentUserEntry = useMemo(() => {
    if (summary) {
      return summary;
    }

    return leaderboard.find((entry) => entry.student.id === user?.id) ?? null;
  }, [leaderboard, summary, user?.id]);

  const leaderXp = leaderboard[0]?.totalXp ?? 0;
  const myXpProgress = currentUserEntry
    ? Math.max(
        0,
        Math.min(
          100,
          leaderXp > 0
            ? Math.round((currentUserEntry.totalXp / leaderXp) * 100)
            : currentUserEntry.totalXp > 0
              ? 100
              : 0,
        ),
      )
    : 0;

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  async function loadLeaderboard() {
    setLoading(true);

    try {
      const [nextLeaderboard, nextSummary] = await Promise.all([
        fetchWorkspaceLeaderboard(),
        fetchWorkspaceMyGamification(),
      ]);
      setLeaderboard(nextLeaderboard);
      setSummary(nextSummary);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Impossible de charger le classement.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <StudentShell activePath="/student/leaderboard" topbarTitle="Leaderboard">
      <section className={styles.heroRow}>
        <div>
          <p className={styles.leaderboardKicker}>Performance Analytics</p>
          <h1 className={styles.heroTitle}>Classement et gamification</h1>
          <p className={styles.heroSub}>
            Le classement combine maintenant notes publiees, problemes resolus, soumissions
            acceptees et regularite d activite.
          </p>
          {errorMessage ? (
            <p className={`${styles.heroSub} ${styles.messageError}`}>{errorMessage}</p>
          ) : null}
        </div>
      </section>

      <section className={styles.leaderboardPodium}>
        {podium.map((entry) => (
          <article
            key={entry.rank}
            className={
              entry.rank === 1
                ? styles.leaderboardPodiumFirst
                : styles.leaderboardPodiumCard
            }
          >
            <span className={styles.leaderboardRank}>
              {String(entry.rank).padStart(2, "0")}
            </span>
            {entry.student.avatarUrl ? (
              <Image
                alt={entry.student.fullName}
                className={styles.leaderboardAvatar}
                height={120}
                sizes="76px"
                src={entry.student.avatarUrl}
                width={120}
              />
            ) : (
              <div className={styles.leaderboardAvatar} />
            )}
            <h3>{entry.student.fullName}</h3>
            <p>
              Niveau {entry.level} / {entry.levelLabel}
            </p>
            <strong>{formatXp(entry.totalXp)}</strong>
            <span className={styles.leaderboardChip}>
              {entry.acceptedSubmissionsCount} soumission(s) acceptee(s)
            </span>
            {entry.badges.length > 0 ? (
              <div className={styles.leaderboardBadgeList}>
                {entry.badges.map((badge) => (
                  <span key={`${entry.student.id}-${badge}`} className={styles.leaderboardBadge}>
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <section className={styles.leaderboardTableWrap}>
        <header className={styles.leaderboardTableHead}>
          <h2>Classement detaille</h2>
          <span className={styles.leaderboardOnline}>
            {leaderboard.length} etudiant(s) classes
          </span>
        </header>

        <div className={styles.leaderboardScroller}>
          <table className={styles.leaderboardTable}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Etudiant</th>
                <th>XP</th>
                <th>Niveau</th>
                <th>Serie</th>
                <th>Problemes</th>
                <th>Moyenne</th>
                <th>Derniere activite</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr
                  key={entry.student.id}
                  className={
                    entry.student.id === user?.id ? styles.leaderboardRowCurrent : ""
                  }
                >
                  <td>{String(entry.rank).padStart(2, "0")}</td>
                  <td>
                    <div className={styles.leaderboardUserCell}>
                      {entry.student.avatarUrl ? (
                        <Image
                          alt={entry.student.fullName}
                          height={64}
                          sizes="40px"
                          src={entry.student.avatarUrl}
                          width={64}
                        />
                      ) : (
                        <div className={styles.leaderboardAvatarPlaceholder} />
                      )}
                      <div>
                        <strong>{entry.student.fullName}</strong>
                        <p>
                          {entry.acceptedSubmissionsCount} acceptes /{" "}
                          {formatPercent(entry.acceptanceRate)} taux de reussite
                        </p>
                        {entry.badges.length > 0 ? (
                          <div className={styles.leaderboardBadgeList}>
                            {entry.badges.map((badge) => (
                              <span
                                key={`${entry.student.id}-${badge}`}
                                className={styles.leaderboardBadge}
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className={styles.leaderboardPoints}>{formatXp(entry.totalXp)}</td>
                  <td>
                    L{entry.level} / {entry.levelLabel}
                  </td>
                  <td>{entry.activityStreakDays} j</td>
                  <td>{entry.solvedProblemsCount}</td>
                  <td>{formatPercent(entry.averagePercentage)}</td>
                  <td>{formatWorkspaceDate(entry.lastActivityAt)}</td>
                </tr>
              ))}
              {!loading && leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8}>Aucune activite publiee disponible pour le classement.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.leaderboardStatsGrid}>
        <article className={styles.leaderboardMilestone}>
          <h3>Mon rang</h3>
          <p>
            {currentUserEntry?.rank
              ? `Position ${currentUserEntry.rank}`
              : "Pas encore classe"}
          </p>
          <div className={styles.leaderboardProgressBar}>
            <span style={{ width: `${myXpProgress}%` }} />
          </div>
          <small>
            {currentUserEntry
              ? `${formatXp(currentUserEntry.totalXp)} sur ${formatXp(leaderXp || currentUserEntry.totalXp)} pour atteindre le leader.`
              : "Commencez par soumettre un QCM ou un probleme de code."}
          </small>
        </article>

        <article className={styles.leaderboardStatCard}>
          <p>Mon XP</p>
          <strong>{currentUserEntry ? formatXp(currentUserEntry.totalXp) : "--"}</strong>
          <span>Score global de progression</span>
        </article>

        <article className={styles.leaderboardStatCard}>
          <p>Mon niveau</p>
          <strong>{currentUserEntry ? `L${currentUserEntry.level}` : "--"}</strong>
          <span>
            {currentUserEntry?.levelLabel ?? "Le niveau apparait des vos premieres activites"}
          </span>
        </article>

        <article className={styles.leaderboardStatCard}>
          <p>Serie active</p>
          <strong>{currentUserEntry?.activityStreakDays ?? 0} j</strong>
          <span>Consecutive days avec activite</span>
        </article>

        <article className={styles.leaderboardStatCard}>
          <p>Problemes resolus</p>
          <strong>{currentUserEntry?.solvedProblemsCount ?? 0}</strong>
          <span>
            {currentUserEntry
              ? `${currentUserEntry.acceptedSubmissionsCount} soumission(s) acceptee(s)`
              : "Les resolutions acceptees apparaitront ici"}
          </span>
        </article>

        <article className={styles.leaderboardMilestone}>
          <h3>Derniers achievements</h3>
          <div className={styles.achievementList}>
            {summary?.achievements.length ? (
              summary.achievements.slice(0, 5).map((achievement) => (
                <div key={achievement.key} className={styles.achievementItem}>
                  <span
                    className={`${styles.achievementTone} ${
                      achievement.tone === "streak"
                        ? styles.achievementToneStreak
                        : achievement.tone === "solver"
                          ? styles.achievementToneSolver
                          : achievement.tone === "grade"
                            ? styles.achievementToneGrade
                            : achievement.tone === "rank"
                              ? styles.achievementToneRank
                              : styles.achievementToneXp
                    }`}
                  >
                    {achievement.label}
                  </span>
                  <div className={styles.achievementCopy}>
                    <strong>{achievement.description}</strong>
                    <p>{formatWorkspaceDate(achievement.unlockedAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.achievementItem}>
                <span className={`${styles.achievementTone} ${styles.achievementToneXp}`}>
                  A venir
                </span>
                <div className={styles.achievementCopy}>
                  <strong>Vos prochains achievements apparaitront ici.</strong>
                  <p>
                    Continuez vos cours, vos QCM et vos problemes pour debloquer les
                    prochains paliers.
                  </p>
                </div>
              </div>
            )}
          </div>
        </article>
      </section>
    </StudentShell>
  );
}
