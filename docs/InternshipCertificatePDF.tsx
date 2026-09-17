// components/pdf/InternshipCertificatePDF.tsx

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
import path from "path";

Font.register({
  family: "NotoSans",
  fonts: [
    {
      src: path.join(process.cwd(), "public/fonts/NotoSans-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), "public/fonts/NotoSans-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});

export interface InternshipCertificateData {
  // =========================
  // Certificate
  // =========================
  certificateId: string;
  issueDate: string;

  // =========================
  // Company
  // =========================
  companyName: string;
  companyLogo?: string;

  companyAddress?: string;
  companyWebsite?: string;
  companyEmail?: string;
  companyPhone?: string;

  // =========================
  // Intern
  // =========================
  internName: string;
  employeeId?: string;
  internEmail?: string;

  // =========================
  // Internship
  // =========================
  designation: string;
  department?: string;

  internshipType?: string;
  mode?: "remote" | "hybrid" | "onsite";

  startDate: string;
  endDate: string;
  duration?: string;

  // =========================
  // Performance
  // =========================
  performanceGrade?: string;

  projectName?: string;

  technologies?: string[];

  skills?: string[];

  // =========================
  // Certificate Text
  // =========================
  customDescription?: string;

  // =========================
  // Verification
  // =========================
  verificationUrl?: string;
  verificationCode?: string;

  // =========================
  // Signatures
  // =========================
  authorizedPersonName: string;
  authorizedPersonDesignation: string;
  authorizedSignature?: string;

  hrName?: string;
  hrDesignation?: string;
  hrSignature?: string;

  // =========================
  // Stamp
  // =========================
  companyStamp?: string;
}

interface Props {
  data: InternshipCertificateData;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    padding: 28,
    fontFamily: "NotoSans",
    color: "#111827",
  },

  // Outer certificate border
  outerBorder: {
    flex: 1,
    borderWidth: 3,
    borderColor: "#111827",
    padding: 7,
  },

  innerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#6B7280",
    paddingHorizontal: 35,
    paddingVertical: 24,
    position: "relative",
  },

  // Decorative corners
  cornerTL: {
    position: "absolute",
    left: 7,
    top: 7,
    width: 45,
    height: 45,
    borderLeftWidth: 3,
    borderTopWidth: 3,
    borderColor: "#111827",
  },

  cornerTR: {
    position: "absolute",
    right: 7,
    top: 7,
    width: 45,
    height: 45,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderColor: "#111827",
  },

  cornerBL: {
    position: "absolute",
    left: 7,
    bottom: 7,
    width: 45,
    height: 45,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: "#111827",
  },

  cornerBR: {
    position: "absolute",
    right: 7,
    bottom: 7,
    width: 45,
    height: 45,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: "#111827",
  },

  // Header
  header: {
    alignItems: "center",
  },

  logo: {
    width: 75,
    height: 48,
    objectFit: "contain",
    marginBottom: 5,
  },

  companyName: {
    fontSize: 17,
    fontWeight: 700,
    textAlign: "center",
    letterSpacing: 1,
  },

  companyInfo: {
    fontSize: 7.5,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 3,
  },

  divider: {
    width: 120,
    borderBottomWidth: 1.5,
    borderBottomColor: "#111827",
    marginTop: 10,
    marginBottom: 8,
  },

  // Certificate title
  certificateTitle: {
    fontSize: 29,
    fontWeight: 700,
    textAlign: "center",
    letterSpacing: 2,
    marginTop: 4,
  },

  subtitle: {
    textAlign: "center",
    fontSize: 9,
    color: "#6B7280",
    letterSpacing: 1.2,
    marginTop: 4,
  },

  // Main text
  presented: {
    textAlign: "center",
    fontSize: 10,
    marginTop: 17,
  },

  internName: {
    textAlign: "center",
    fontSize: 25,
    fontWeight: 700,
    marginTop: 6,
    marginBottom: 5,
    letterSpacing: 1,
  },

  nameLine: {
    width: 250,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    alignSelf: "center",
  },

  description: {
    textAlign: "center",
    fontSize: 9.5,
    lineHeight: 1.55,
    marginTop: 12,
    maxWidth: 650,
    zIndex: 3,
    alignSelf: "center",
  },

  // Internship details
  detailsBox: {
    marginTop: 13,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 0.8,
    borderColor: "#D1D5DB",
  },

  detailsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },

  detail: {
    fontSize: 8.5,
    textAlign: "center",
  },

  detailSeparator: {
    marginHorizontal: 9,
    fontSize: 8,
    color: "#9CA3AF",
  },

  bold: {
    fontWeight: 700,
  },

  // Performance
  performance: {
    marginTop: 8,
    alignItems: "center",
  },

  performanceText: {
    fontSize: 8,
    color: "#4B5563",
  },

  grade: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 2,
  },

  // Skills
  skills: {
    marginTop: 7,
    alignItems: "center",
  },

  skillsText: {
    fontSize: 7.5,
    color: "#4B5563",
  },

  // Bottom
  bottom: {
    position: "absolute",
    left: 35,
    right: 35,
    bottom: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  signatureBlock: {
    width: 150,
    alignItems: "center",
  },

  signatureImage: {
    width: 100,
    height: 35,
    objectFit: "contain",
    marginBottom: 2,
  },

  signatureLine: {
    width: 135,
    borderTopWidth: 0.8,
    borderTopColor: "#374151",
    marginBottom: 4,
  },

  signatureName: {
    fontSize: 8.5,
    fontWeight: 700,
    textAlign: "center",
  },

  signatureDesignation: {
    fontSize: 7,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 2,
  },

  stamp: {
    width: 95,
    // height: 60,
    objectFit: "contain",
    position: "absolute",
    // fill:"red",
    bottom: 92,
    zIndex: -99,

    left: 43,
  },

  // Certificate ID
  certificateMeta: {
    position: "absolute",
    top: 15,
    right: 20,
    alignItems: "flex-end",
  },

  certificateId: {
    fontSize: 7,
    color: "#6B7280",
  },

  issueDate: {
    fontSize: 7,
    color: "#6B7280",
    marginTop: 2,
  },

  // Verification
  verification: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  verificationText: {
    fontSize: 6.5,
    color: "#6B7280",
    textAlign: "center",
  },

  verificationCode: {
    fontSize: 7,
    fontWeight: 700,
    marginTop: 1,
  },

  link: {
    color: "#2563EB",
    textDecoration: "none",
    fontSize: 6.5,
  },
  watermark: {
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    left: "0",
    opacity: 0.15,
    objectFit: "contain",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  watermarksource: {
    width: "70%"
  }
});

export default function InternshipCertificatePDF({
  data,
}: Props) {
  const description =
    data.customDescription ||
    `This is to certify that ${data.internName} has successfully completed an internship with ${data.companyName} as a ${data.designation}${data.department
      ? ` in the ${data.department} department`
      : ""
    } from ${data.startDate} to ${data.endDate}${data.duration ? ` for a duration of ${data.duration}` : ""
    }. During the internship, the intern demonstrated professionalism, commitment, and satisfactory performance in assigned responsibilities.`;

  return (
    <Document
      title={`Internship Certificate - ${data.internName}`}
      author={data.companyName}
      subject="Internship Completion Certificate"
    >
      <Page
        size="A4"
        orientation="landscape"
        style={styles.page}
      >

        <View style={styles.watermark}>
          <Image style={styles.watermarksource} src={data.companyLogo} />
        </View>


        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>

            {/* Decorative Corners */}
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />

            {/* Certificate Metadata */}
            <View style={styles.certificateMeta}>
              <Text style={styles.certificateId}>
                Certificate ID: {data.certificateId}
              </Text>

              <Text style={styles.issueDate}>
                Issued: {data.issueDate}
              </Text>
            </View>

            {/* ================= HEADER ================= */}

            <View style={styles.header}>
              {data.companyLogo && (
                <Image
                  src={data.companyLogo}
                  style={styles.logo}
                />
              )}

              <Text style={styles.companyName}>
                {data.companyName}
              </Text>

              {(data.companyAddress ||
                data.companyWebsite) && (
                  <Text style={styles.companyInfo}>
                    {[
                      data.companyAddress,
                      data.companyWebsite,
                    ]
                      .filter(Boolean)
                      .join(" • ")}
                  </Text>
                )}

              <View style={styles.divider} />
            </View>

            {/* ================= TITLE ================= */}

            <Text style={styles.certificateTitle}>
              CERTIFICATE
            </Text>

            <Text style={styles.subtitle}>
              OF INTERNSHIP COMPLETION
            </Text>

            {/* ================= PERSON ================= */}

            <Text style={styles.presented}>
              This certificate is proudly presented to
            </Text>

            <Text style={styles.internName}>
              {data.internName}
            </Text>

            <View style={styles.nameLine} />

            {/* ================= DESCRIPTION ================= */}

            <Text style={styles.description}>
              {description}
            </Text>

            {/* ================= DETAILS ================= */}

            <View style={styles.detailsBox}>
              <View style={styles.detailsRow}>
                <Text style={styles.detail}>
                  <Text style={styles.bold}>
                    Designation:
                  </Text>{" "}
                  {data.designation}
                </Text>

                <Text style={styles.detailSeparator}>
                  |
                </Text>

                <Text style={styles.detail}>
                  <Text style={styles.bold}>
                    Duration:
                  </Text>{" "}
                  {data.duration ||
                    `${data.startDate} - ${data.endDate}`}
                </Text>

                {data.mode && (
                  <>
                    <Text style={styles.detailSeparator}>
                      |
                    </Text>

                    <Text style={styles.detail}>
                      <Text style={styles.bold}>
                        Mode:
                      </Text>{" "}
                      {data.mode.toUpperCase()}
                    </Text>
                  </>
                )}
              </View>

              <View
                style={[
                  styles.detailsRow,
                  { marginBottom: 0 },
                ]}
              >
                <Text style={styles.detail}>
                  <Text style={styles.bold}>
                    Period:
                  </Text>{" "}
                  {data.startDate} — {data.endDate}
                </Text>

                {data.department && (
                  <>
                    <Text
                      style={styles.detailSeparator}
                    >
                      |
                    </Text>

                    <Text style={styles.detail}>
                      <Text style={styles.bold}>
                        Department:
                      </Text>{" "}
                      {data.department}
                    </Text>
                  </>
                )}

                {data.employeeId && (
                  <>
                    <Text
                      style={styles.detailSeparator}
                    >
                      |
                    </Text>

                    <Text style={styles.detail}>
                      <Text style={styles.bold}>
                        ID:
                      </Text>{" "}
                      {data.employeeId}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* ================= PERFORMANCE ================= */}

            {data.performanceGrade && (
              <View style={styles.performance}>
                <Text style={styles.performanceText}>
                  Performance
                </Text>

                <Text style={styles.grade}>
                  {data.performanceGrade}
                </Text>
              </View>
            )}

            {/* ================= PROJECT ================= */}

            {data.projectName && (
              <Text
                style={[
                  styles.description,
                  {
                    marginTop: 7,
                    fontSize: 8,
                  },
                ]}
              >
                Project:{" "}
                <Text style={styles.bold}>
                  {data.projectName}
                </Text>
              </Text>
            )}

            {/* ================= SKILLS ================= */}

            {(
              data.technologies?.length ||
              data.skills?.length
            ) ? (
              <View style={styles.skills}>
                <Text style={styles.skillsText}>
                  {[
                    ...(data.technologies || []),
                    ...(data.skills || []),
                  ].join(" • ")}
                </Text>
              </View>
            ) : null}

            {/* ================= SIGNATURES ================= */}

            <View
              style={styles.bottom}
              wrap={false}
            >
              {/* Authorized Person */}

              <View style={styles.signatureBlock}>
                {data.authorizedSignature ? (
                  <Image
                    src={data.authorizedSignature}
                    style={styles.signatureImage}
                  />
                ) : (
                  <View style={{ height: 37 }} />
                )}

                <View style={styles.signatureLine} />

                <Text style={styles.signatureName}>
                  {data.authorizedPersonName}
                </Text>

                <Text
                  style={styles.signatureDesignation}
                >
                  {data.authorizedPersonDesignation}
                </Text>
              </View>

              {/* Company Stamp */}

              {data.companyStamp && (
                <Image
                  src={data.companyStamp}
                  style={styles.stamp}
                />
              )}

              {/* HR */}

              <View style={styles.signatureBlock}>
                {data.hrSignature ? (
                  <Image
                    src={data.hrSignature}
                    style={styles.signatureImage}
                  />
                ) : (
                  <View style={{ height: 37 }} />
                )}

                <View style={styles.signatureLine} />

                <Text style={styles.signatureName}>
                  {data.hrName || "HR Department"}
                </Text>

                <Text
                  style={styles.signatureDesignation}
                >
                  {data.hrDesignation ||
                    "Human Resources"}
                </Text>
              </View>
            </View>

            {/* ================= VERIFICATION ================= */}

            {(data.verificationCode ||
              data.verificationUrl) && (
                <View style={styles.verification}>
                  {data.verificationCode && (
                    <Text style={styles.verificationText}>
                      Verify this certificate using
                      Certificate ID:
                    </Text>
                  )}

                  {data.verificationCode && (
                    <Text style={styles.verificationCode}>
                      {data.verificationCode}
                    </Text>
                  )}

                  {data.verificationUrl && (
                    <Link
                      src={data.verificationUrl}
                      style={styles.link}
                    >
                      {data.verificationUrl}
                    </Link>
                  )}
                </View>
              )}
          </View>
        </View>
      </Page>
    </Document>
  );
}