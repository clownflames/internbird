export type Certificate = {
  id: string;
  userId: string;
  internshipId: string;
  registrationId: string;

  certificateNumber: string;
  title: string;
  studentName: string;
  internshipName: string;
  position: string | null;
  documentType: "paid" | "unpaid";

  startDate: Date | null;
  endDate: Date | null;
  issueDate: Date;

  skills: string[];
  grade: string | null;
  score: string | null;
  description: string | null;

  verificationCode: string;

  status: "draft" | "issued" | "revoked";

  createdAt: Date;
  updatedAt: Date;

  // joined
  userName: string | null;
  userEmail: string | null;
  internshipMode: "remote" | "onsite" | "hybrid" | null;
  internshipDuration: string | null;
};

export type CertificateInput = {
  registrationId: string;
  position: string;
  department?: string | null;
  documentType: "paid" | "unpaid";
  startDate: string;
  endDate?: string | null;
  grade?: string | null;
  score?: string | null;
  skills: string[];
  description?: string | null;
  status: "draft" | "issued" | "revoked";
};

export const EMPTY_FORM: CertificateInput = {
  registrationId: "",
  position: "",
  department: "",
  documentType: "unpaid",
  startDate: "",
  endDate: "",
  grade: "",
  score: "",
  skills: [],
  description: "",
  status: "issued",
};

export type RegistrationResult = {
  id: string;
  userId: string;
  internshipId: string;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
  internshipName: string | null;
  internshipMode: string | null;
  internshipLocation: string | null;
  internshipDuration: string | null;
  university: string | null;
  collegeName: string | null;
  degree: string | null;
  branch: string | null;
  academicYear: string | null;
  status: string;
};


export type OfferLetterResult = {
  offerLetterId: string;
  offerNumber: string;
  offerStatus: string;
  offerPosition: string;
  offerDepartment: string | null;
  offerDocumentType: "paid" | "unpaid";
  offerStartDate: Date | null;
  offerEndDate: Date | null;

  registrationId: string;
  userId: string;
  internshipId: string;

  userName: string | null;
  userEmail: string | null;
  userImage: string | null;

  internshipName: string | null;
  internshipMode: string | null;
  internshipLocation: string | null;
  internshipDuration: string | null;

  university: string | null;
  collegeName: string | null;
  degree: string | null;
  branch: string | null;
  academicYear: string | null;
};