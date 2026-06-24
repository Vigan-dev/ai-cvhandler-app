import { CandidateDetailsPage } from "../../components/candidate-details-page";

export default async function CandidateDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CandidateDetailsPage candidateId={Number(id)} />;
}
