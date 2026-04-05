import { StudentCodeEditorWorkspace } from "../components/StudentCodeEditorWorkspace";
import { StudentShell } from "../components/StudentShell";

export function StudentCodeEditorPage() {
  return (
    <StudentShell
      activePath="/student/problems"
      hideFooter
      hideTopbar
      lockPageScroll
      topbarTitle="Code Studio"
      widePage
    >
      <StudentCodeEditorWorkspace />
    </StudentShell>
  );
}
