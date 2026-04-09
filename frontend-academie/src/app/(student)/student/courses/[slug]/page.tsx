import { LessonViewPage } from "@/features/lesson-view/LessonViewPage";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <LessonViewPage slug={slug} />;
}
