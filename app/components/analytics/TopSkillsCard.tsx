import type { AnalyticsData } from "../../hooks/use-analytics-data";
import { SectionHeader } from "../ui";

export function TopSkillsCard({
  skills,
}: {
  skills: AnalyticsData["skills"];
}) {
  return (
    <section className="card skills-analytics-card">
      <SectionHeader
        title="Top skills detected"
        subtitle="Most common skills in the selected profiles"
      />
      <div className="top-skills-list">
        {skills.length ? (
          skills.map((skill, index) => (
            <div className="top-skill-row" key={skill.name}>
              <span className="skill-rank">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <div>
                  <strong>{skill.name}</strong>
                  <span>
                    {skill.count} candidate{skill.count === 1 ? "" : "s"}
                  </span>
                </div>
                <i>
                  <b style={{ width: `${skill.percent}%` }} />
                </i>
              </div>
              <small>{skill.percent}%</small>
            </div>
          ))
        ) : (
          <div className="empty-state compact">
            <p>No skills are available for this selection.</p>
          </div>
        )}
      </div>
    </section>
  );
}
