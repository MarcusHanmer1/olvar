"use client";

import { useState } from "react";
import AssessSetup, { type SetupQuestion } from "./AssessSetup";
import MarkGrid, { type GridQuestion, type GridStudent } from "./MarkGrid";

interface Config {
  title: string;
  date: string;
  questions: GridQuestion[];
}

interface Props {
  classId: string;
  students: GridStudent[];
}

export default function AssessmentFlow({ classId, students }: Props) {
  const [config, setConfig] = useState<Config | null>(null);

  if (!config) {
    return (
      <AssessSetup
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
