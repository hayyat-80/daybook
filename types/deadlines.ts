export type StudyDeadline = {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  dueDate: string;
  note?: string;
  done: boolean;
  /** Optional link to a course */
  courseId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeadlineDraft = {
  title: string;
  dueDate: string;
  note: string;
  courseId: string;
};
