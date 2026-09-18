export type ExamResult = {
  id: string;

  // exam
  examId: string;
  examTitle: string;
  examType: "pre" | "end";
  examTotalScore: number;
  examPassingScore: number;

  // internship
  internshipId: string;
  internshipName: string;

  // user
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;

  // submission
  attemptNumber: number;
  status: "started" | "submitted" | "evaluated";
  startedAt: Date;
  submittedAt: Date | null;

  score: number | null;
  totalScore: number | null;
  percentage: string | null;
  passed: boolean | null;
  timeTaken: number | null;

  createdAt: Date;
};

export type ExamResultFilters = {
  search?: string;
  examId?: string;
  internshipId?: string;
  status?: "all" | "started" | "submitted" | "evaluated";
  passed?: "all" | "passed" | "failed";
};

export type ExamOption = {
  id: string;
  title: string;
  type: "pre" | "end";
};

export type InternshipOption = {
  id: string;
  name: string;
};