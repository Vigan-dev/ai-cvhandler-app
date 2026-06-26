import type { Candidate } from "../../data/mock-data";
import { Icons } from "../icons";

export function SkillsPanel({ candidate }: { candidate: Candidate }) {
  return (
    <section
      className="card skills-card"
      id="candidate-panel-skills"
      role="tabpanel"
      aria-labelledby="candidate-tab-skills"
    >
      <div className="section-header">
        <div>
          <h2>Skills detected</h2>
          <p>{candidate.tags.length} skills found in readable CV text</p>
        </div>
      </div>
      <div className="skills-groups">
        <div>
          <h3>Detected skills</h3>
          <div className="tag-row large">
            {candidate.tags.length ? (
              candidate.tags.map((item) => (
                <span key={item}>
                  {item}
                  <i>
                    <Icons.check size={11} />
                  </i>
                </span>
              ))
            ) : (
              <span>No catalogued skills detected</span>
            )}
          </div>
        </div>
        <div>
          <h3>Education</h3>
          <div className="tag-row large subtle">
            <span>
              {candidate.educationText ??
                "Education details were not clearly identified"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
