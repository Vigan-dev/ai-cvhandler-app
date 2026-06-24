"use client";

import Link from "next/link";
import { usePersistentState } from "../hooks/use-persistent-state";
import { downloadCsv } from "../utils/download-csv";
import { candidates, recentUploads } from "../data/mock-data";
import { CandidateMiniRow, PageHeader, SectionHeader } from "./ui";
import { Icons } from "./icons";

const stats = [
  { label: "Total CVs", value: "1,248", trend: "+12.5%", detail: "vs last month", icon: Icons.file, tone: "violet" },
  { label: "Average match score", value: "78.4", suffix: "/100", trend: "+4.2%", detail: "vs last month", icon: Icons.sparkles, tone: "blue" },
  { label: "Shortlisted", value: "186", trend: "+18.7%", detail: "vs last month", icon: Icons.users, tone: "green" },
  { label: "Time saved", value: "96", suffix: " hrs", trend: "+8.1%", detail: "this month", icon: Icons.chart, tone: "orange" },
];

export function DashboardPage() {
  const [pipelineRange, setPipelineRange] = usePersistentState("talentlens-pipeline-range", "Last 7 months");

  function exportReport() {
    downloadCsv("talentlens-dashboard-report.csv", [
      ["Metric", "Value", "Change"],
      ...stats.map((stat) => [stat.label, `${stat.value}${stat.suffix ?? ""}`, stat.trend]),
    ]);
  }

  return (
    <>
      <PageHeader
        eyebrow="Wednesday, June 24"
        title="Good morning, Vigan"
        description="Here’s what’s happening with your candidate pipeline today."
        actions={
          <>
            <button className="button secondary" onClick={exportReport}><Icons.download size={17} /> Export report</button>
            <Link className="button primary" href="/upload"><Icons.upload size={17} /> Upload CVs</Link>
          </>
        }
      />

      <section className="stats-grid" aria-label="Recruitment overview">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="stat-card" key={stat.label}>
              <div className={`stat-icon stat-${stat.tone}`}><Icon size={20} /></div>
              <div className="stat-top">
                <span>{stat.label}</span>
                <button className="ghost-icon" aria-label={`More options for ${stat.label}`}><Icons.more size={18} /></button>
              </div>
              <div className="stat-value">{stat.value}<small>{stat.suffix}</small></div>
              <div className="stat-trend"><span><Icons.arrowUp size={12} /> {stat.trend}</span> {stat.detail}</div>
            </article>
          );
        })}
      </section>

      <div className="dashboard-grid">
        <section className="card pipeline-card">
          <SectionHeader
            title="Candidate pipeline"
            subtitle="CV activity over the last 7 months"
            action={
              <button className="select-button" onClick={() => setPipelineRange((value) => value === "Last 7 months" ? "Last 30 days" : "Last 7 months")}>{pipelineRange} <Icons.chevronDown size={15} /></button>
            }
          />
          <div className="chart-legend">
            <span><i className="legend-dot received" /> Received</span>
            <span><i className="legend-dot shortlisted" /> Shortlisted</span>
          </div>
          <div className="line-chart" role="img" aria-label="Candidate pipeline: received CVs increased from 90 to 210, shortlisted candidates increased from 32 to 112">
            <div className="chart-y-labels"><span>240</span><span>180</span><span>120</span><span>60</span><span>0</span></div>
            <div className="chart-area">
              <div className="grid-line g1" /><div className="grid-line g2" /><div className="grid-line g3" /><div className="grid-line g4" />
              <svg viewBox="0 0 700 230" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="receivedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6953d7" stopOpacity=".20" />
                    <stop offset="100%" stopColor="#6953d7" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="chart-fill" d="M0,170 C55,158 65,130 116,138 C165,145 185,105 233,112 C280,120 303,76 350,82 C400,88 415,64 466,70 C520,76 535,42 583,51 C630,60 646,25 700,30 L700,230 L0,230 Z" />
                <path className="line received-line" d="M0,170 C55,158 65,130 116,138 C165,145 185,105 233,112 C280,120 303,76 350,82 C400,88 415,64 466,70 C520,76 535,42 583,51 C630,60 646,25 700,30" />
                <path className="line shortlisted-line" d="M0,205 C55,201 72,187 116,190 C165,193 190,170 233,174 C280,178 310,150 350,158 C400,166 425,139 466,144 C515,150 548,119 583,127 C625,135 660,100 700,108" />
                <circle cx="700" cy="30" r="5" className="point received-point" />
                <circle cx="700" cy="108" r="5" className="point shortlisted-point" />
              </svg>
              <div className="chart-x-labels"><span>Dec</span><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></div>
            </div>
          </div>
        </section>

        <section className="card top-candidates-card">
          <SectionHeader
            title="Top candidates"
            subtitle="Highest AI match scores"
            action={<Link href="/candidates" className="text-link">View all <Icons.arrowRight size={14} /></Link>}
          />
          <div className="candidate-mini-list">
            {candidates.slice(0, 4).map((candidate, index) => (
              <CandidateMiniRow key={candidate.id} candidate={candidate} rank={index + 1} />
            ))}
          </div>
        </section>
      </div>

      <section className="card recent-card">
        <SectionHeader
          title="Recent uploads"
          subtitle="Latest CVs added to your workspace"
          action={<Link href="/upload" className="text-link">Upload more <Icons.arrowRight size={14} /></Link>}
        />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>File</th><th>Candidate</th><th>Size</th><th>Uploaded</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {recentUploads.map((upload) => (
                <tr key={upload.file}>
                  <td><span className="file-cell"><i><Icons.file size={17} /></i><strong>{upload.file}</strong></span></td>
                  <td>{upload.candidate}</td>
                  <td className="muted-cell">{upload.size}</td>
                  <td className="muted-cell">{upload.time}</td>
                  <td><span className={`process-badge ${upload.status.toLowerCase()}`}><i />{upload.status}</span></td>
                  <td><button className="ghost-icon" aria-label={`Options for ${upload.file}`}><Icons.more size={18} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
