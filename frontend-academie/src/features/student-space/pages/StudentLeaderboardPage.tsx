"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  leaderboardMembers,
  leaderboardPodium,
  leaderboardStats,
} from "../model/student-workspace.catalog";
import styles from "../student-space.module.css";
import { StudentShell } from "../components/StudentShell";

export function StudentLeaderboardPage() {
  const [period, setPeriod] = useState<"monthly" | "all-time">("monthly");

  const activeCount = useMemo(() => {
    return period === "monthly" ? "1,204" : "8,932";
  }, [period]);

  return (
    <StudentShell activePath="/student/leaderboard" topbarTitle="Leaderboard">
      <section className={styles.heroRow}>
        <div>
          <p className={styles.leaderboardKicker}>Performance Analytics</p>
          <h1 className={styles.heroTitle}>Elite Rankings</h1>
          <p className={styles.heroSub}>
            Compare your progression with the most consistent architects.
          </p>
        </div>

        <div className={styles.leaderboardToggle}>
          <button
            type="button"
            className={
              period === "monthly"
                ? styles.leaderboardToggleActive
                : styles.leaderboardToggleBtn
            }
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={
              period === "all-time"
                ? styles.leaderboardToggleActive
                : styles.leaderboardToggleBtn
            }
            onClick={() => setPeriod("all-time")}
          >
            All-time
          </button>
        </div>
      </section>

      <section className={styles.leaderboardPodium}>
        {leaderboardPodium.map((member) => (
          <article
            key={member.rank}
            className={
              member.rank === 1
                ? styles.leaderboardPodiumFirst
                : styles.leaderboardPodiumCard
            }
            >
              <span className={styles.leaderboardRank}>
                {String(member.rank).padStart(2, "0")}
              </span>
              <Image
                alt={member.name}
                className={styles.leaderboardAvatar}
                height={120}
                sizes="76px"
                src={member.avatarUrl}
                width={120}
              />
            <h3>{member.name}</h3>
            <p>{member.specialty}</p>
            <strong>{member.xp}</strong>
            <span className={styles.leaderboardChip}>{member.streakLabel}</span>
          </article>
        ))}
      </section>

      <section className={styles.leaderboardTableWrap}>
        <header className={styles.leaderboardTableHead}>
          <h2>Cohort Consensus</h2>
          <span className={styles.leaderboardOnline}>
            {activeCount} active today
          </span>
        </header>

        <div className={styles.leaderboardScroller}>
          <table className={styles.leaderboardTable}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Architect</th>
                <th>Streak</th>
                <th>Badges</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardMembers.map((member) => (
                <tr
                  key={member.rank}
                  className={
                    member.isCurrentUser ? styles.leaderboardRowCurrent : ""
                  }
                >
                  <td>{String(member.rank).padStart(2, "0")}</td>
                  <td>
                    <div className={styles.leaderboardUserCell}>
                      <Image
                        alt={member.name}
                        height={64}
                        sizes="40px"
                        src={member.avatarUrl}
                        width={64}
                      />
                      <div>
                        <strong>{member.name}</strong>
                        <p>{member.role}</p>
                      </div>
                    </div>
                  </td>
                  <td>{member.streak}</td>
                  <td>
                    <div className={styles.leaderboardBadges}>
                      {member.badges.map((badge) => (
                        <span key={`${member.rank}-${badge}`}>{badge}</span>
                      ))}
                    </div>
                  </td>
                  <td className={styles.leaderboardPoints}>{member.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.leaderboardStatsGrid}>
        <article className={styles.leaderboardMilestone}>
          <h3>Upcoming Milestone</h3>
          <p>Master Architect Badge</p>
          <div className={styles.leaderboardProgressBar}>
            <span />
          </div>
          <small>190 / 250 XP to unlock</small>
        </article>

        {leaderboardStats.map((stat) => (
          <article key={stat.label} className={styles.leaderboardStatCard}>
            <p>{stat.label}</p>
            <strong>{stat.value}</strong>
            <span>{stat.detail}</span>
          </article>
        ))}
      </section>
    </StudentShell>
  );
}
