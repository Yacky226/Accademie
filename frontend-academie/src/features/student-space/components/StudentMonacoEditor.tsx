"use client";

import dynamic from "next/dynamic";
import styles from "../student-space.module.css";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className={styles.codeStudioMonacoLoading}>
      <span>Loading editor core...</span>
    </div>
  ),
});

interface StudentMonacoEditorProps {
  language: string;
  path: string;
  value: string;
  onChange: (nextValue: string) => void;
  wordWrap?: "off" | "on";
}

function defineArchitectTheme(monaco: typeof import("monaco-editor")) {
  monaco.editor.defineTheme("architect-academy-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "DBE8FF", background: "0D1320" },
      { token: "comment", foreground: "6B7890", fontStyle: "italic" },
      { token: "keyword", foreground: "7CB7FF" },
      { token: "string", foreground: "A7F3D0" },
      { token: "number", foreground: "F9A8D4" },
      { token: "type.identifier", foreground: "FDE68A" },
      { token: "delimiter", foreground: "94A3B8" },
    ],
    colors: {
      "editor.background": "#0D1320",
      "editor.foreground": "#DBE8FF",
      "editorLineNumber.foreground": "#526176",
      "editorLineNumber.activeForeground": "#C7D7F7",
      "editorCursor.foreground": "#4DA3FF",
      "editor.selectionBackground": "#1B3A70",
      "editor.inactiveSelectionBackground": "#132948",
      "editor.lineHighlightBackground": "#101A2B",
      "editor.lineHighlightBorder": "#00000000",
      "editorIndentGuide.background1": "#182131",
      "editorIndentGuide.activeBackground1": "#36527E",
      "editorGutter.background": "#0D1320",
      "minimap.background": "#0D1320",
      "scrollbarSlider.background": "#36527E88",
      "scrollbarSlider.hoverBackground": "#4A6DA788",
      "scrollbarSlider.activeBackground": "#5C86CF88",
    },
  });
}

export function StudentMonacoEditor({
  language,
  path,
  value,
  onChange,
  wordWrap = "off",
}: StudentMonacoEditorProps) {
  return (
    <div className={styles.codeStudioMonacoWrap}>
      <MonacoEditor
        beforeMount={defineArchitectTheme}
        height="100%"
        language={language}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        options={{
          automaticLayout: true,
          cursorBlinking: "smooth",
          fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontLigatures: true,
          fontSize: 14,
          glyphMargin: false,
          lineHeight: 24,
          minimap: { enabled: true, scale: 1, showSlider: "mouseover", size: "fit" },
          padding: { top: 18, bottom: 18 },
          renderLineHighlight: "gutter",
          roundedSelection: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          stickyScroll: { enabled: false },
          tabSize: 2,
          wordWrap,
        }}
        path={path}
        theme="architect-academy-dark"
        value={value}
      />
    </div>
  );
}
