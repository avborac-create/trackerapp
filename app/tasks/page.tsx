import { getTaskItems, getTaskSections } from "@/app/lib/taskActions";
import { TaskManager } from "@/app/components/TaskManager";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [items, sections] = await Promise.all([getTaskItems(), getTaskSections()]);
  return <TaskManager initialItems={items} initialSections={sections} />;
}
