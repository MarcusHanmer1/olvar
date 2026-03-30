"use client";

import { useState } from "react";
import AssessSetup, { type SetupQuestion } from "./AssessSetup";
import MarkGrid, { type GridQuestion, type GridStudent } from "./MarkGrid";
import type { Template } from "./template-actions";

interface Config {
  title: string;
  date: string;
  questions: GridQuestion[];
}

interface Props {
  classId: string;
  students: GridStudent[];
  templates: Template[];
}

export default function AssessmentFlow({ classId, students, templates }: Props) {
  const [config, setConfig] = useState<Config | null>(null);

  if (!config) {
    return (
      <AssessSetup
        templates={templates}
        onStart={(title: string, date: string, questions: SetupQuestion[]) =>
          setConfig({ title, date, questions })
        }
      />
    );
  }

  return (
    <MarkGrid
      classId={classId}
      title={config.title}
      date={config.date}
      questions={config.questions}
      students={students}
      onBack={() => setConfig(null)}
    />
  );
}
