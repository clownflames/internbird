export type SubmissionStatus =
  | "locked"
  | "unlocked"
  | "in_progress"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "completed";

export type AdminSubmission = {
  id: string;

  // project
  projectId: string;
  projectTitle: string;
  projectImage: string | null;
  projectTotalScore: number;
  projectPassingScore: number;
  projectDurationDays: number;

  // internship
  internshipId: string;
  internshipName: string;

  // user
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string | null;
  userHeadline: string | null;

  // submission
  status: SubmissionStatus;
  submissionUrl: string | null;
  githubUrl: string | null;
  liveUrl: string | null;
  submissionNotes: string | null;
  submissionFiles: {
    name: string;
    url: string;
    type?: string;
    size?: number;
  }[];

  // timeline
  startedAt: string | null;
  submittedAt: string | null;
  deadlineAt: string | null;
  reviewedAt: string | null;
  completedAt: string | null;

  // review
  reviewedBy: string | null;
  reviewedByName: string | null;
  score: number | null;
  feedback: string | null;
};

export type SubmissionFilters = {
  status?: SubmissionStatus | "all" | "pending_review";
  internshipId?: string;
  search?: string;
};

export type FilterCounts = {
  all: number;
  pending_review: number;
  approved: number;
  rejected: number;
};