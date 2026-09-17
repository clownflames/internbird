export type RegistrationStatus =
  | "pending"
  | "active"
  | "completed"
  | "cancelled"
  | "rejected";

export type Registration = {
  id: string;
  internshipId: string;

  university: string;
  collegeName: string;
  branch: string;
  degree: string;
  academicYear: string | null;
  semester: number | null;
  passingYear: number | null;
  address: string | null;
  aboutUser: string | null;

  status: RegistrationStatus;

  registeredAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  internshipName: string | null;
  internshipDescription: string | null;
  internshipImage: string | null;
  internshipSkills: string[];
  internshipQualifications: string[];
  internshipDuration: string | null;
  internshipMode: "remote" | "onsite" | "hybrid" | null;
  internshipLocation: string | null;
  // ❌ internshipStartDate REMOVED
  // ❌ internshipEndDate REMOVED
};