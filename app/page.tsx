import { TrackerApp } from "@/app/components/TrackerApp";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  return <TrackerApp initialWeekId={week} />;
}
