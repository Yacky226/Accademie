import type { RootState } from "@/core/store/app-store";

export const selectStudentCodeEditorState = (state: RootState) => state.studentCodeEditor;
export const selectStudentCodeExercise = (state: RootState) => state.studentCodeEditor.exercise;
export const selectStudentCodeEditorStatus = (state: RootState) => state.studentCodeEditor.status;
export const selectStudentCodeEditorError = (state: RootState) =>
  state.studentCodeEditor.errorMessage;
export const selectStudentCodeEditorProblemId = (state: RootState) =>
  state.studentCodeEditor.problemId;
export const selectStudentCodeEditorProblemSlug = (state: RootState) =>
  state.studentCodeEditor.problemSlug;
export const selectStudentCodeEditorRunStatus = (state: RootState) =>
  state.studentCodeEditor.runStatus;
export const selectStudentCodeEditorSubmitStatus = (state: RootState) =>
  state.studentCodeEditor.submitStatus;
export const selectLatestJudgeRun = (state: RootState) => state.studentCodeEditor.latestRun;
export const selectLatestSubmission = (state: RootState) =>
  state.studentCodeEditor.latestSubmission;
