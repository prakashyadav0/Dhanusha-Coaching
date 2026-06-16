// app/admin/courses/[courseId]/page.tsx

export default function CoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  return (
    <div>
      <h1>Course {params.courseId}</h1>
    </div>
  );
}