import { getAllNodesAction } from "@/app/lib/actions";
import { HabitsSubNav } from "@/app/components/HabitsSubNav";
import { StatusBoard } from "@/app/components/StatusBoard";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const nodes = await getAllNodesAction();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4">
      <HabitsSubNav />
      <StatusBoard initialNodes={nodes} />
    </div>
  );
}
