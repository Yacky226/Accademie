import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { studentCodeExercise } from "./student-code-editor.catalog";
import {
  createJudgeRun,
  createSubmission,
  fetchJudgeRun,
  fetchSubmissionEvaluation,
  fetchStudentCodeEditorBootstrap,
  fetchSubmission,
} from "../api/student-code-editor.service";
import type {
  RunCodePayload,
  StudentCodeEditorState,
  StudentCodeExecutionRecord,
  SubmitCodePayload,
} from "./student-code-editor.types";

const initialState: StudentCodeEditorState = {
  errorMessage: null,
  exercise: studentCodeExercise,
  latestRun: null,
  latestSubmission: null,
  problemId: null,
  problemSlug: null,
  runStatus: "idle",
  status: "idle",
  submitStatus: "idle",
};

function isExecutionPending(status: string) {
  return status === "PENDING" || status === "RUNNING";
}

function sleep(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export const fetchStudentCodeEditorBootstrapThunk = createAsyncThunk<
  {
    exercise: StudentCodeEditorState["exercise"];
    problemId: string | null;
    problemSlug: string | null;
  },
  string | null | undefined,
  { rejectValue: string }
>(
  "studentCodeEditor/fetchBootstrap",
  async (selectedProblemId, { rejectWithValue }) => {
    try {
      return await fetchStudentCodeEditorBootstrap(selectedProblemId);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to load the code editor workspace.",
      );
    }
  },
);

export const createJudgeRunThunk = createAsyncThunk<
  StudentCodeExecutionRecord,
  RunCodePayload,
  {
    state: {
      studentCodeEditor: StudentCodeEditorState;
    };
    rejectValue: string;
  }
>(
  "studentCodeEditor/createRun",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const state = getState().studentCodeEditor;
      return await createJudgeRun(
        payload,
        state.problemId,
        state.exercise.languages,
      );
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to run this code right now.",
      );
    }
  },
);

export const createSubmissionThunk = createAsyncThunk<
  StudentCodeExecutionRecord,
  SubmitCodePayload,
  {
    state: {
      studentCodeEditor: StudentCodeEditorState;
    };
    rejectValue: string;
  }
>(
  "studentCodeEditor/createSubmission",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const state = getState().studentCodeEditor;
      const submission = await createSubmission(
        payload,
        state.problemId,
        state.exercise.languages,
      );
      return isExecutionPending(submission.status)
        ? submission
        : await fetchSubmissionEvaluation(submission.id);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to submit this solution right now.",
      );
    }
  },
);

export const pollJudgeRunThunk = createAsyncThunk<
  StudentCodeExecutionRecord,
  string,
  { rejectValue: string }
>("studentCodeEditor/pollRun", async (runId, { rejectWithValue }) => {
  try {
    const maxAttempts = 60;
    const pollDelayMs = 1500;
    let latestRun = await fetchJudgeRun(runId);

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (!isExecutionPending(latestRun.status)) {
        return latestRun;
      }

      await sleep(pollDelayMs);
      latestRun = await fetchJudgeRun(runId);
    }

    return latestRun;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error
        ? error.message
        : "Unable to refresh this code run right now.",
    );
  }
});

export const pollSubmissionThunk = createAsyncThunk<
  StudentCodeExecutionRecord,
  string,
  { rejectValue: string }
>(
  "studentCodeEditor/pollSubmission",
  async (submissionId, { rejectWithValue }) => {
    try {
      const maxAttempts = 60;
      const pollDelayMs = 1500;
      let latestSubmission = await fetchSubmission(submissionId);

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (!isExecutionPending(latestSubmission.status)) {
          return fetchSubmissionEvaluation(latestSubmission.id);
        }

        await sleep(pollDelayMs);
        latestSubmission = await fetchSubmission(submissionId);
      }

      return isExecutionPending(latestSubmission.status)
        ? latestSubmission
        : await fetchSubmissionEvaluation(latestSubmission.id);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Unable to refresh this submission right now.",
      );
    }
  },
);

const studentCodeEditorSlice = createSlice({
  name: "studentCodeEditor",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchStudentCodeEditorBootstrapThunk.pending, (state) => {
        state.errorMessage = null;
        state.latestRun = null;
        state.latestSubmission = null;
        state.problemId = null;
        state.problemSlug = null;
        state.runStatus = "idle";
        state.status = "loading";
        state.submitStatus = "idle";
      })
      .addCase(
        fetchStudentCodeEditorBootstrapThunk.fulfilled,
        (state, action) => {
          state.errorMessage = null;
          state.exercise = action.payload.exercise;
          state.latestRun = null;
          state.latestSubmission = null;
          state.problemId = action.payload.problemId;
          state.problemSlug = action.payload.problemSlug;
          state.runStatus = "idle";
          state.status = "succeeded";
          state.submitStatus = "idle";
        },
      )
      .addCase(
        fetchStudentCodeEditorBootstrapThunk.rejected,
        (state, action) => {
          state.errorMessage =
            action.payload ?? "Unable to load the code editor workspace.";
          state.problemId = null;
          state.problemSlug = null;
          state.status = "failed";
        },
      )
      .addCase(createJudgeRunThunk.pending, (state) => {
        state.errorMessage = null;
        state.runStatus = "loading";
      })
      .addCase(createJudgeRunThunk.fulfilled, (state, action) => {
        state.latestRun = action.payload;
        state.runStatus = isExecutionPending(action.payload.status)
          ? "loading"
          : "succeeded";
      })
      .addCase(createJudgeRunThunk.rejected, (state, action) => {
        state.errorMessage =
          action.payload ?? "Unable to run this code right now.";
        state.runStatus = "failed";
      })
      .addCase(pollJudgeRunThunk.pending, (state) => {
        state.errorMessage = null;
        state.runStatus = "loading";
      })
      .addCase(pollJudgeRunThunk.fulfilled, (state, action) => {
        state.latestRun = action.payload;
        state.runStatus = isExecutionPending(action.payload.status)
          ? "loading"
          : "succeeded";
      })
      .addCase(pollJudgeRunThunk.rejected, (state, action) => {
        state.errorMessage =
          action.payload ?? "Unable to refresh this code run right now.";
        state.runStatus = "failed";
      })
      .addCase(createSubmissionThunk.pending, (state) => {
        state.errorMessage = null;
        state.submitStatus = "loading";
      })
      .addCase(createSubmissionThunk.fulfilled, (state, action) => {
        state.latestSubmission = action.payload;
        state.submitStatus = isExecutionPending(action.payload.status)
          ? "loading"
          : "succeeded";
      })
      .addCase(createSubmissionThunk.rejected, (state, action) => {
        state.errorMessage =
          action.payload ?? "Unable to submit this solution right now.";
        state.submitStatus = "failed";
      })
      .addCase(pollSubmissionThunk.pending, (state) => {
        state.errorMessage = null;
        state.submitStatus = "loading";
      })
      .addCase(pollSubmissionThunk.fulfilled, (state, action) => {
        state.latestSubmission = action.payload;
        state.submitStatus = isExecutionPending(action.payload.status)
          ? "loading"
          : "succeeded";
      })
      .addCase(pollSubmissionThunk.rejected, (state, action) => {
        state.errorMessage =
          action.payload ?? "Unable to refresh this submission right now.";
        state.submitStatus = "failed";
      });
  },
});

export const studentCodeEditorReducer = studentCodeEditorSlice.reducer;
