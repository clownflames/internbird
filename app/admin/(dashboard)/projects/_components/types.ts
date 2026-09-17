export type Project = {
  id: string;
  internshipId: string;
  internshipName: string; // joined
  examId: string | null;
  examTitle: string | null; // joined

  title: string;
  description: string | null;
  image: string | null;
  requirements: string[];
  skills: string[];
  totalScore: number;
  passingScore: number;
  durationDays: number;
  resources: { title: string; url: string }[];
  attachments: { name: string; url: string }[];
  order: number;
  isPublished: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectInput = {
  internshipId: string;
  examId: string | null;
  title: string;
  description?: string | null;
  image?: string | null;
  requirements: string[];
  skills: string[];
  totalScore: number;
  passingScore: number;
  durationDays: number;
  resources: { title: string; url: string }[];
  attachments: { name: string; url: string }[];
  order: number;
  isPublished: boolean;
  isActive: boolean;
};

export const EMPTY_FORM: ProjectInput = {
  internshipId: "",
  examId: null,
  title: "",
  description: "",
  image: "",
  requirements: [],
  skills: [],
  totalScore: 100,
  passingScore: 40,
  durationDays: 7,
  resources: [],
  attachments: [],
  order: 0,
  isPublished: false,
  isActive: true,
};

export type InternshipOption = {
  id: string;
  name: string;
};

export type ExamOption = {
  id: string;
  title: string;
  type: "pre" | "end";
  internshipId: string;
};