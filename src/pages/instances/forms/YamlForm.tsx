import React, { FC, ReactNode, useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { updateMaxHeight } from "util/updateMaxHeight";
import useEventListener from "@use-it/event-listener";
import { editor } from "monaco-editor/esm/vs/editor/editor.api";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;

export interface YamlFormValues {
  yaml?: string;
}

interface Props {
  yaml: string;
  setYaml: (text: string) => void;
  children?: ReactNode;
  autoResize?: boolean;
}

const YamlForm: FC<Props> = ({
  yaml,
  setYaml,
  children,
  autoResize = false,
}) => {
  const [editor, setEditor] = useState<IStandaloneCodeEditor | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const updateFormHeight = () => {
    if (!editor || !containerRef.current) {
      return;
    }
    if (autoResize) {
      editor.layout();
      const contentHeight = editor.getContentHeight();
      containerRef.current.style.height = `${contentHeight}px`;
    } else {
      updateMaxHeight("code-editor-wrapper", "p-bottom-controls");
    }
    editor.layout();
  };
  useEventListener("resize", updateFormHeight);
  useEffect(updateFormHeight, [editor, containerRef.current, yaml]);

  return (
    <>
      {children}
<<<<<<< HEAD
      <div ref={containerRef} style={{
        height: !autoResize ? "32rem" : undefined,
      }}>
        <Editor defaultValue={yaml} language="yaml" onChange={(value) => setYaml(value!)}
          options={{
            fontSize: 18,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            wrappingStrategy: 'advanced',
            minimap: {
              enabled: false
            },
            overviewRulerLanes: 0,
          }}
          onMount={editor => {
            setEditor(editor);
          }} />
=======
      <div ref={containerRef} className="code-editor-wrapper">
        <Editor
          defaultValue={yaml}
          language="yaml"
          theme="vs-dark"
          onChange={(value) => value && setYaml(value)}
          options={{
            fontSize: 18,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            wrappingStrategy: "advanced",
            minimap: {
              enabled: false,
            },
            overviewRulerLanes: 0,
          }}
          onMount={(editor: IStandaloneCodeEditor) => {
            setEditor(editor);
          }}
        />
>>>>>>> f1dbf916f78f56640231d943527d17de9cf23ff8
      </div>
    </>
  );
};

export default YamlForm;
