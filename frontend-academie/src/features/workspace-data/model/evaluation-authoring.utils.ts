import type {
  CreateWorkspaceEvaluationQuestionPayload,
  WorkspaceEvaluationQuestionRecord,
  WorkspaceEvaluationQuestionType,
} from "./workspace-api.types";

export type EvaluationQuestionDraftRecord = {
  answerText: string;
  correctSelections: string[];
  id: string;
  optionText: string;
  points: number;
  position: number;
  questionType: WorkspaceEvaluationQuestionType;
  statement: string;
};

export const EVALUATION_QUESTION_TYPE_OPTIONS = [
  { value: "MULTIPLE_CHOICE", label: "Une seule reponse" },
  { value: "MULTIPLE_RESPONSE", label: "Plusieurs reponses" },
  { value: "FILL_BLANK", label: "Completer la reponse" },
  { value: "TEXT", label: "Texte libre" },
] as const;

function createLocalId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function parseEvaluationAuthoringLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createEmptyEvaluationQuestionDraft(position = 1): EvaluationQuestionDraftRecord {
  return {
    answerText: "",
    correctSelections: [],
    id: createLocalId(),
    optionText: "",
    points: 1,
    position,
    questionType: "MULTIPLE_CHOICE",
    statement: "",
  };
}

export function createEvaluationQuestionDraftFromRecord(
  question: WorkspaceEvaluationQuestionRecord,
): EvaluationQuestionDraftRecord {
  const correctAnswer = question.correctAnswer ?? "";
  let answerText = "";
  let correctSelections: string[] = [];

  if (question.questionType === "MULTIPLE_RESPONSE") {
    try {
      const parsed = JSON.parse(correctAnswer) as unknown;
      if (Array.isArray(parsed)) {
        correctSelections = parsed.filter(
          (value): value is string => typeof value === "string" && value.trim().length > 0,
        );
      }
    } catch {
      correctSelections = correctAnswer ? [correctAnswer] : [];
    }
  } else if (question.questionType === "FILL_BLANK") {
    try {
      const parsed = JSON.parse(correctAnswer) as unknown;
      answerText = Array.isArray(parsed)
        ? parsed
            .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
            .join("\n")
        : correctAnswer;
    } catch {
      answerText = correctAnswer;
    }
  } else if (question.questionType === "TEXT") {
    answerText = correctAnswer;
  } else {
    correctSelections = correctAnswer ? [correctAnswer] : [];
  }

  return {
    answerText,
    correctSelections,
    id: createLocalId(),
    optionText: (question.options ?? []).join("\n"),
    points: question.points,
    position: question.position,
    questionType:
      question.questionType === "MULTIPLE_CHOICE" ||
      question.questionType === "MULTIPLE_RESPONSE" ||
      question.questionType === "FILL_BLANK" ||
      question.questionType === "TEXT"
        ? question.questionType
        : "TEXT",
    statement: question.statement,
  };
}

export function buildEvaluationQuestionPayloadFromDraft(
  draft: EvaluationQuestionDraftRecord,
): { errorMessage?: string; payload?: CreateWorkspaceEvaluationQuestionPayload } {
  if (!draft.statement.trim()) {
    return {
      errorMessage: "Le libelle de la question est obligatoire.",
    };
  }

  const parsedOptions = parseEvaluationAuthoringLines(draft.optionText);

  if (draft.questionType === "MULTIPLE_CHOICE") {
    if (parsedOptions.length < 2) {
      return {
        errorMessage: "Ajoutez au moins deux options pour un QCM simple.",
      };
    }

    if (draft.correctSelections.length !== 1) {
      return {
        errorMessage: "Selectionnez une seule bonne reponse.",
      };
    }

    return {
      payload: {
        statement: draft.statement.trim(),
        questionType: draft.questionType,
        options: parsedOptions,
        correctAnswer: draft.correctSelections[0],
        points: draft.points,
        position: draft.position,
      },
    };
  }

  if (draft.questionType === "MULTIPLE_RESPONSE") {
    if (parsedOptions.length < 2) {
      return {
        errorMessage: "Ajoutez au moins deux options pour un QCM multiple.",
      };
    }

    if (draft.correctSelections.length === 0) {
      return {
        errorMessage: "Selectionnez au moins une bonne reponse.",
      };
    }

    return {
      payload: {
        statement: draft.statement.trim(),
        questionType: draft.questionType,
        options: parsedOptions,
        correctAnswer: JSON.stringify(
          parsedOptions.filter((option) => draft.correctSelections.includes(option)),
        ),
        points: draft.points,
        position: draft.position,
      },
    };
  }

  const acceptedAnswers = parseEvaluationAuthoringLines(draft.answerText);

  if (draft.questionType === "FILL_BLANK") {
    if (!acceptedAnswers.length) {
      return {
        errorMessage: "Ajoutez au moins une reponse acceptee.",
      };
    }

    return {
      payload: {
        statement: draft.statement.trim(),
        questionType: draft.questionType,
        options: [],
        correctAnswer:
          acceptedAnswers.length === 1 ? acceptedAnswers[0] : JSON.stringify(acceptedAnswers),
        points: draft.points,
        position: draft.position,
      },
    };
  }

  if (!draft.answerText.trim()) {
    return {
      errorMessage: "Ajoutez la reponse exacte attendue.",
    };
  }

  return {
    payload: {
      statement: draft.statement.trim(),
      questionType: draft.questionType,
      options: [],
      correctAnswer: draft.answerText.trim(),
      points: draft.points,
      position: draft.position,
    },
  };
}

export function formatEvaluationQuestionTypeLabel(type: string) {
  if (type === "MULTIPLE_CHOICE") {
    return "Une reponse";
  }

  if (type === "MULTIPLE_RESPONSE") {
    return "Plusieurs reponses";
  }

  if (type === "FILL_BLANK") {
    return "Completer";
  }

  return "Texte libre";
}

export function formatEvaluationCorrectAnswerPreview(correctAnswer: string | null | undefined) {
  if (!correctAnswer) {
    return "A definir";
  }

  try {
    const parsedAnswer = JSON.parse(correctAnswer) as unknown;

    if (Array.isArray(parsedAnswer)) {
      return parsedAnswer.join(", ");
    }

    if (typeof parsedAnswer === "string") {
      return parsedAnswer;
    }
  } catch {
    return correctAnswer;
  }

  return correctAnswer;
}

export function renumberEvaluationQuestionDrafts(
  questions: EvaluationQuestionDraftRecord[],
) {
  return questions.map((question, index) => ({
    ...question,
    position: index + 1,
  }));
}
