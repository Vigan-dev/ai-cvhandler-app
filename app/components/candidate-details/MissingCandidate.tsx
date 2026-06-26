import Link from "next/link";
import { Icons } from "../icons";

export function MissingCandidate({ hydrated }: { hydrated: boolean }) {
  return (
    <section className="card empty-state">
      <span>
        <Icons.users size={26} />
      </span>
      <h2>{hydrated ? "Candidate not found" : "Loading candidate..."}</h2>
      <p>
        {hydrated
          ? "This candidate is not available in local storage."
          : "Reading locally stored candidate data."}
      </p>
      {hydrated && (
        <Link href="/candidates" className="button secondary">
          Back to candidates
        </Link>
      )}
    </section>
  );
}
