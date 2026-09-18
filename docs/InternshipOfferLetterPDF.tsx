// components/pdf/InternshipOfferLetterPDF.tsx

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Link,
  Font,
} from "@react-pdf/renderer";

// Font.register({
//   family: "Helvetica",
//   fonts: [
//     {
//       src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2",
//       fontWeight: "normal",
//     },
//   ],
// });

export type InternshipMode = "remote" | "hybrid" | "onsite";
export type PaymentFrequency = "monthly" | "weekly" | "one-time";
export type Currency = "INR" | "USD" | "EUR" | "GBP" | string;

export interface WorkingDays {
  sunday: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
}

export interface InternshipOfferLetterData {
  // =========================
  // Offer Letter Information
  // =========================
  offerLetterId: string;
  issueDate: string;
  validUntil?: string;

  // =========================
  // Company Information
  // =========================
  companyName: string;
  companyLegalName?: string;
  companyLogo?: string;
  companyWebsite?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress: string;
  companyCity?: string;
  companyState?: string;
  companyCountry?: string;
  companyPostalCode?: string;
  companyRegistrationNumber?: string;
  companyGSTIN?: string;
  companyCIN?: string;

  // =========================
  // Intern Information
  // =========================
  name: string;
  employeeEmail: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;

  collegeName?: string;
  universityName?: string;
  course?: string;
  branch?: string;
  semester?: string;
  enrollmentNumber?: string;

  // =========================
  // Internship Information
  // =========================
  designation: string;
  department?: string;
  internshipType?: string;
  mode: InternshipMode;

  internshipLocation?: string;
  joiningLocation?: string;

  startDate: string;
  endDate: string;
  duration?: string;

  reportingManager?: string;
  reportingManagerDesignation?: string;
  reportingManagerEmail?: string;

  // =========================
  // Payment / Stipend
  // =========================
  isPaid: boolean;
  salary?: number;
  stipend?: number;
  currency?: Currency;
  paymentFrequency?: PaymentFrequency;
  paymentDate?: string;

  incentives?: string;
  benefits?: string[];

  // =========================
  // Working Schedule
  // =========================
  workingHours: string;
  workingDays: WorkingDays;

  shiftStartTime?: string;
  shiftEndTime?: string;
  breakDuration?: string;
  weeklyHours?: number;

  // =========================
  // Work Details
  // =========================
  jobDescription?: string;
  responsibilities?: string[];
  learningObjectives?: string[];
  technologies?: string[];
  projectName?: string;

  // =========================
  // Attendance / Leave
  // =========================
  minimumAttendancePercentage?: number;
  allowedLeaves?: number;
  leavePolicy?: string;

  // =========================
  // Internship Rules
  // =========================
  probationPeriod?: string;
  noticePeriod?: string;
  terminationPolicy?: string;
  codeOfConduct?: string;

  confidentialityRequired?: boolean;
  confidentialityClause?: string;

  intellectualPropertyClause?: string;
  nonDisclosureAgreementRequired?: boolean;

  // =========================
  // Performance
  // =========================
  performanceReview?: string;
  completionCriteria?: string;
  certificateEligibility?: string;

  // =========================
  // Assets
  // =========================
  companyAssetsProvided?: string[];

  // =========================
  // Additional Terms
  // =========================
  termsAndConditions?: string[];
  additionalNotes?: string;

  // =========================
  // Contact / HR
  // =========================
  hrName?: string;
  hrDesignation?: string;
  hrEmail?: string;
  hrPhone?: string;

  // =========================
  // Signature
  // =========================
  authorizedPersonName: string;
  authorizedPersonDesignation: string;
  authorizedSignature?: string;

  companyStamp?: string;

  // =========================
  // Acceptance
  // =========================
  acceptanceRequired?: boolean;
  acceptanceDeadline?: string;
}

interface InternshipOfferLetterPDFProps {
  data: InternshipOfferLetterData;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 35,
    paddingBottom: 40,
    paddingHorizontal: 42,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    lineHeight: 1.45,
    color: "#111827",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#D1D5DB",
  },

  logo: {
    width: 80,
    // height: 45,
    objectFit: "contain",
  },

  companyInfo: {
    flex: 1,
    marginLeft: 14,
  },

  companyName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },

  companyMeta: {
    fontSize: 8,
    color: "#4B5563",
  },

  letterMeta: {
    width: 165,
    alignItems: "flex-end",
  },

  metaText: {
    fontSize: 8.5,
    marginBottom: 2,
  },

  title: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 18,
    textTransform: "uppercase",
  },

  greeting: {
    marginBottom: 10,
  },

  paragraph: {
    marginBottom: 9,
    textAlign: "justify",
  },

  bold: {
    fontFamily: "Helvetica-Bold",
  },

  section: {
    marginTop: 11,
    marginBottom: 5,
  },

  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 0.7,
    borderBottomColor: "#D1D5DB",
  },

  table: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginBottom: 8,
  },

  row: {
    flexDirection: "row",
    borderBottomWidth: 0.7,
    borderBottomColor: "#E5E7EB",
  },

  lastRow: {
    flexDirection: "row",
  },

  labelCell: {
    width: "34%",
    backgroundColor: "#F3F4F6",
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontFamily: "Helvetica-Bold",
  },

  valueCell: {
    width: "66%",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },

  listItem: {
    flexDirection: "row",
    marginBottom: 4,
  },

  bullet: {
    width: 12,
  },

  listText: {
    flex: 1,
  },

  workingDaysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },

  workingDay: {
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderWidth: 0.7,
    borderColor: "#D1D5DB",
    borderRadius: 2,
    marginRight: 3,
    marginBottom: 3,
    fontSize: 7.5,
  },

  activeDay: {
    backgroundColor: "#E5E7EB",
  },

  signatureSection: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  signatureBlock: {
    width: "44%",
  },

  signatureImage: {
    width: 100,
    height: 40,
    objectFit: "contain",
    marginBottom: 4,
  },

  signatureLine: {
    borderTopWidth: 0.8,
    borderTopColor: "#6B7280",
    marginTop: 30,
    paddingTop: 4,
  },

  stamp: {
    width: 65,
    height: 65,
    objectFit: "contain",
    marginTop: 5,
  },

  acceptanceBox: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  footer: {
    position: "absolute",
    bottom: 15,
    left: 42,
    right: 42,
    fontSize: 7,
    color: "#6B7280",
    borderTopWidth: 0.6,
    borderTopColor: "#D1D5DB",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  link: {
    color: "#2563EB",
    textDecoration: "none",
  },
});

const dayLabels: Record<keyof WorkingDays, string> = {
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
};

const formatCurrency = (
  value?: number,
  currency: Currency = "INR"
): string => {
  if (value === undefined || value === null) return "N/A";

  if (currency === "INR") {
    return `₹${value.toLocaleString("en-IN")}`;
  }

  return `${currency} ${value.toLocaleString()}`;
};

const InfoRow = ({
  label,
  value,
  last = false,
}: {
  label: string;
  value?: React.ReactNode;
  last?: boolean;
}) => (
  <View style={last ? styles.lastRow : styles.row}>
    <View style={styles.labelCell}>
      <Text>{label}</Text>
    </View>

    <View style={styles.valueCell}>
      {typeof value === "string" || typeof value === "number" ? (
        <Text>{value || "N/A"}</Text>
      ) : (
        value || <Text>N/A</Text>
      )}
    </View>
  </View>
);

const BulletList = ({ items }: { items?: string[] }) => {
  if (!items?.length) return null;

  return (
    <View>
      {items.map((item, index) => (
        <View style={styles.listItem} key={`${item}-${index}`}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

export default function InternshipOfferLetterPDF({
  data,
}: InternshipOfferLetterPDFProps) {
  const compensation =
    data.salary !== undefined ? data.salary : data.stipend;

  return (
    <Document
      title={`Internship Offer Letter - ${data.name}`}
      author={data.companyName}
      subject="Internship Offer Letter"
      keywords="internship, offer letter"
    >
      <Page size="A4" style={styles.page}>
        {/* ================= COMPANY HEADER ================= */}

        <View style={styles.header}>
          {data.companyLogo && (
            <Image src={data.companyLogo} style={styles.logo} />
          )}

          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{data.companyName}</Text>

            <Text style={styles.companyMeta}>{data.companyAddress}</Text>

            {(data.companyCity ||
              data.companyState ||
              data.companyCountry ||
              data.companyPostalCode) && (
              <Text style={styles.companyMeta}>
                {[
                  data.companyCity,
                  data.companyState,
                  data.companyCountry,
                  data.companyPostalCode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            )}

            {data.companyEmail && (
              <Text style={styles.companyMeta}>
                Email: {data.companyEmail}
              </Text>
            )}

            {data.companyPhone && (
              <Text style={styles.companyMeta}>
                Phone: {data.companyPhone}
              </Text>
            )}

            {data.companyWebsite && (
              <Link src={data.companyWebsite} style={styles.link}>
                {data.companyWebsite}
              </Link>
            )}
          </View>

          <View style={styles.letterMeta}>
            <Text style={styles.metaText}>
              Offer ID: {data.offerLetterId}
            </Text>

            <Text style={styles.metaText}>
              Issue Date: {data.issueDate}
            </Text>

            {data.validUntil && (
              <Text style={styles.metaText}>
                Valid Until: {data.validUntil}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.title}>Internship Offer Letter</Text>

        {/* ================= RECIPIENT ================= */}

        <Text style={styles.greeting}>
          Dear <Text style={styles.bold}>{data.name}</Text>,
        </Text>

        <Text style={styles.paragraph}>
          We are pleased to offer you an internship opportunity with{" "}
          <Text style={styles.bold}>{data.companyName}</Text> for the position
          of <Text style={styles.bold}>{data.designation}</Text>
          {data.department
            ? ` in the ${data.department} department`
            : ""}
          . Your internship will be governed by the terms and conditions
          mentioned in this offer letter.
        </Text>

        {/* ================= INTERN DETAILS ================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intern Details</Text>

          <View style={styles.table}>
            <InfoRow label="Full Name" value={data.name} />

            <InfoRow
              label="Email Address"
              value={data.employeeEmail}
            />

            {data.phone && (
              <InfoRow label="Phone Number" value={data.phone} />
            )}

            {data.collegeName && (
              <InfoRow label="College" value={data.collegeName} />
            )}

            {data.universityName && (
              <InfoRow
                label="University"
                value={data.universityName}
              />
            )}

            {data.course && (
              <InfoRow label="Course" value={data.course} />
            )}

            {data.branch && (
              <InfoRow label="Branch" value={data.branch} />
            )}

            {data.enrollmentNumber && (
              <InfoRow
                label="Enrollment Number"
                value={data.enrollmentNumber}
                last
              />
            )}
          </View>
        </View>

        {/* ================= INTERNSHIP DETAILS ================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Internship Details</Text>

          <View style={styles.table}>
            <InfoRow
              label="Designation"
              value={data.designation}
            />

            {data.department && (
              <InfoRow label="Department" value={data.department} />
            )}

            {data.internshipType && (
              <InfoRow
                label="Internship Type"
                value={data.internshipType}
              />
            )}

            <InfoRow
              label="Work Mode"
              value={data.mode.toUpperCase()}
            />

            {data.internshipLocation && (
              <InfoRow
                label="Work Location"
                value={data.internshipLocation}
              />
            )}

            <InfoRow label="Start Date" value={data.startDate} />

            <InfoRow label="End Date" value={data.endDate} />

            {data.duration && (
              <InfoRow
                label="Duration"
                value={data.duration}
              />
            )}

            {data.reportingManager && (
              <InfoRow
                label="Reporting Manager"
                value={`${data.reportingManager}${
                  data.reportingManagerDesignation
                    ? ` (${data.reportingManagerDesignation})`
                    : ""
                }`}
              />
            )}

            {data.reportingManagerEmail && (
              <InfoRow
                label="Manager Email"
                value={data.reportingManagerEmail}
                last
              />
            )}
          </View>
        </View>

        {/* ================= COMPENSATION ================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Compensation & Benefits
          </Text>

          <View style={styles.table}>
            <InfoRow
              label="Internship Type"
              value={data.isPaid ? "Paid Internship" : "Unpaid Internship"}
            />

            {data.isPaid && (
              <>
                <InfoRow
                  label="Stipend / Salary"
                  value={formatCurrency(
                    compensation,
                    data.currency || "INR"
                  )}
                />

                {data.paymentFrequency && (
                  <InfoRow
                    label="Payment Frequency"
                    value={data.paymentFrequency}
                  />
                )}

                {data.paymentDate && (
                  <InfoRow
                    label="Payment Schedule"
                    value={data.paymentDate}
                  />
                )}
              </>
            )}

            {data.incentives && (
              <InfoRow
                label="Additional Incentives"
                value={data.incentives}
              />
            )}

            {data.benefits?.length ? (
              <InfoRow
                label="Benefits"
                value={data.benefits.join(", ")}
                last
              />
            ) : null}
          </View>
        </View>

        {/* ================= WORKING SCHEDULE ================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Working Schedule</Text>

          <View style={styles.table}>
            <InfoRow
              label="Working Hours"
              value={data.workingHours}
            />

            {data.shiftStartTime && data.shiftEndTime && (
              <InfoRow
                label="Shift Timing"
                value={`${data.shiftStartTime} - ${data.shiftEndTime}`}
              />
            )}

            {data.weeklyHours !== undefined && (
              <InfoRow
                label="Weekly Hours"
                value={`${data.weeklyHours} hours`}
              />
            )}

            {data.breakDuration && (
              <InfoRow
                label="Break Duration"
                value={data.breakDuration}
              />
            )}

            <InfoRow
              label="Working Days"
              last
              value={
                <View style={styles.workingDaysContainer}>
                  {(
                    Object.keys(
                      data.workingDays
                    ) as Array<keyof WorkingDays>
                  ).map((day) => (
                    <View
                      key={day}
                      style={[
                        styles.workingDay,
                        ...(data.workingDays[day]
                          ? [styles.activeDay]
                          : []),
                      ]}
                    >
                      <Text>
                        {dayLabels[day]}{" "}
                        {data.workingDays[day] ? "✓" : "✕"}
                      </Text>
                    </View>
                  ))}
                </View>
              }
            />
          </View>
        </View>

        {/* ================= RESPONSIBILITIES ================= */}

        {data.responsibilities?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Roles & Responsibilities
            </Text>

            <BulletList items={data.responsibilities} />
          </View>
        ) : null}

        {data.learningObjectives?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Learning Objectives
            </Text>

            <BulletList items={data.learningObjectives} />
          </View>
        ) : null}

        {data.technologies?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Technologies / Tools
            </Text>

            <Text>{data.technologies.join(", ")}</Text>
          </View>
        ) : null}

        {/* ================= ATTENDANCE ================= */}

        {(data.minimumAttendancePercentage ||
          data.allowedLeaves !== undefined ||
          data.leavePolicy) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Attendance & Leave Policy
            </Text>

            <View style={styles.table}>
              {data.minimumAttendancePercentage && (
                <InfoRow
                  label="Minimum Attendance"
                  value={`${data.minimumAttendancePercentage}%`}
                />
              )}

              {data.allowedLeaves !== undefined && (
                <InfoRow
                  label="Allowed Leaves"
                  value={`${data.allowedLeaves}`}
                />
              )}

              {data.leavePolicy && (
                <InfoRow
                  label="Leave Policy"
                  value={data.leavePolicy}
                  last
                />
              )}
            </View>
          </View>
        )}

        {/* ================= COMPANY ASSETS ================= */}

        {data.companyAssetsProvided?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Company Assets / Access
            </Text>

            <BulletList items={data.companyAssetsProvided} />
          </View>
        ) : null}

        {/* ================= TERMS ================= */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Terms & Conditions
          </Text>

          {data.confidentialityRequired && (
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                You must maintain confidentiality of all company,
                customer, project and business information accessed
                during the internship.
              </Text>
            </View>
          )}

          {data.confidentialityClause && (
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                {data.confidentialityClause}
              </Text>
            </View>
          )}

          {data.intellectualPropertyClause && (
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                {data.intellectualPropertyClause}
              </Text>
            </View>
          )}

          {data.noticePeriod && (
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Notice Period: {data.noticePeriod}
              </Text>
            </View>
          )}

          {data.probationPeriod && (
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Probation Period: {data.probationPeriod}
              </Text>
            </View>
          )}

          {data.terminationPolicy && (
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                {data.terminationPolicy}
              </Text>
            </View>
          )}

          {data.codeOfConduct && (
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                {data.codeOfConduct}
              </Text>
            </View>
          )}

          <BulletList items={data.termsAndConditions} />
        </View>

        {/* ================= COMPLETION ================= */}

        {(data.completionCriteria ||
          data.certificateEligibility ||
          data.performanceReview) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Performance & Completion
            </Text>

            {data.performanceReview && (
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>
                  Performance Review:{" "}
                </Text>
                {data.performanceReview}
              </Text>
            )}

            {data.completionCriteria && (
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>
                  Completion Criteria:{" "}
                </Text>
                {data.completionCriteria}
              </Text>
            )}

            {data.certificateEligibility && (
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>
                  Certificate Eligibility:{" "}
                </Text>
                {data.certificateEligibility}
              </Text>
            )}
          </View>
        )}

        {data.additionalNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Additional Information
            </Text>

            <Text style={styles.paragraph}>
              {data.additionalNotes}
            </Text>
          </View>
        )}

        {/* ================= ACCEPTANCE ================= */}

        {data.acceptanceRequired !== false && (
          <View style={styles.acceptanceBox}>
            <Text style={styles.bold}>Acceptance of Offer</Text>

            <Text style={{ marginTop: 6 }}>
              By accepting this offer, you confirm that you have read,
              understood and agreed to the terms and conditions
              mentioned in this internship offer letter.
            </Text>

            {data.acceptanceDeadline && (
              <Text style={{ marginTop: 5 }}>
                Acceptance Deadline:{" "}
                <Text style={styles.bold}>
                  {data.acceptanceDeadline}
                </Text>
              </Text>
            )}
          </View>
        )}

        {/* ================= SIGNATURE ================= */}

        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signatureBlock}>
            {data.authorizedSignature ? (
              <Image
                src={data.authorizedSignature}
                style={styles.signatureImage}
              />
            ) : (
              <View style={styles.signatureLine} />
            )}

            <Text style={styles.bold}>
              {data.authorizedPersonName}
            </Text>

            <Text>
              {data.authorizedPersonDesignation}
            </Text>

            <Text>{data.companyName}</Text>

            {data.companyStamp && (
              <Image src={data.companyStamp} style={styles.stamp} />
            )}
          </View>

          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />

            <Text style={styles.bold}>{data.name}</Text>
            <Text>Intern Signature</Text>

            <Text style={{ marginTop: 7 }}>
              Date: __________________
            </Text>
          </View>
        </View>

        {/* ================= HR CONTACT ================= */}

        {(data.hrName || data.hrEmail) && (
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.sectionTitle}>
              HR Contact
            </Text>

            {data.hrName && (
              <Text>
                {data.hrName}
                {data.hrDesignation
                  ? ` — ${data.hrDesignation}`
                  : ""}
              </Text>
            )}

            {data.hrEmail && (
              <Text>Email: {data.hrEmail}</Text>
            )}

            {data.hrPhone && (
              <Text>Phone: {data.hrPhone}</Text>
            )}
          </View>
        )}

        {/* ================= FOOTER ================= */}

        <View style={styles.footer} fixed>
          <Text>
            {data.companyName} • Offer ID: {data.offerLetterId}
          </Text>

          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}