import { getTaskItems } from "@/app/lib/taskActions";
import { CalendarView } from "@/app/components/CalendarView";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const items = await getTaskItems();
  const datedItems = items.filter((i) => i.date !== null);
  return <CalendarView initialItems={datedItems} />;
}
