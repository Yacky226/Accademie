import { CourseDetailsPage } from "@/features/course-catalog/CourseDetailsPage";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return <CourseDetailsPage slug={slug} />;
}
