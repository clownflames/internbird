import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  decimal,
  uniqueIndex,
  index,
  AnyPgColumn,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm/_relations";

/* =========================================================
   ENUMS
========================================================= */

/* =========================================================
   ENUMS (add these)
========================================================= */

export const internshipPricingEnum = pgEnum("internship_pricing", [
  "free",
  "paid",
]);

export const internshipPaymentTypeEnum = pgEnum("internship_payment_type", [
  "one_time",
  "monthly",
]);

export const connectionStatusEnum = pgEnum("connection_status", [
  "pending",
  "accepted",
  "rejected",
  "blocked",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "paid",
  "unpaid",
]);


export const projectStatusEnum = pgEnum("project_status", [
  "locked",        // end exam pass nahi hua, abhi access nahi
  "unlocked",      // end exam pass, project start kar sakta hai
  "in_progress",   // user ne start kiya
  "submitted",     // user ne submit kiya
  "under_review",  // admin review kar raha hai
  "approved",      // project approve ho gaya
  "rejected",      // project reject ho gaya, dobara karna hoga
  "completed",     // sab kuch ho gaya
]);

export const followStatusEnum = pgEnum("follow_status", [
  "active",
  "blocked",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "post_like",
  "post_comment",
  "comment_reply",
  "comment_like",
  "follow",
  "connection_request",
  "connection_accepted",
  "internship_registered",
  "exam_published",
  "certificate_issued",
  "offer_letter_issued",
  "mention",
  "system",
]);

export const internshipModeEnum = pgEnum("internship_mode", [
  "remote",
  "onsite",
  "hybrid",
]);

export const registrationStatusEnum = pgEnum("registration_status", [
  "pending",
  "active",
  "completed",
  "cancelled",
  "rejected",
]);

export const examTypeEnum = pgEnum("exam_type", [
  "pre",
  "end",
]);


export const postMediaTypeEnum = pgEnum("post_media_type", [
  "image",
  "video",
  "text",
  "mixed",
]);

export const postVisibilityEnum = pgEnum("post_visibility", [
  "public",
  "connections",
  "private",
]);


export const examSubmissionStatusEnum = pgEnum(
  "exam_submission_status",
  [
    "started",
    "submitted",
    "evaluated",
  ]
);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "success",
  "failed",
  "refunded",
  "cancelled",
]);

export const paymentProviderEnum = pgEnum("payment_provider", [
  "razorpay",
  "stripe",
  "cashfree",
  "other",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "issued",
  "revoked",
]);

export const offerLetterStatusEnum = pgEnum(
  "offer_letter_status",
  [
    "draft",
    "issued",
    "accepted",
    "rejected",
    "revoked",
  ]
);


/* =========================================================
   USERS
========================================================= */

/* =========================================================
   USERS
========================================================= */

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    email: varchar("email", {
      length: 255,
    }).notNull().unique(),

    phone: varchar("phone", {
      length: 20,
    }),

    password: text("password"),

    image: text("image"),
    coverImage: text("cover_image"),

    dob: timestamp("dob", {
      mode: "date",
    }),

    /* =====================================================
       PROFILE EXTRAS (LinkedIn style)
    ===================================================== */

    // e.g. "Full Stack Developer | MERN | DSA"
    headline: varchar("headline", {
      length: 255,
    }),

    // short "About" section
    bio: text("bio"),

    // e.g. "Mumbai, India"
    location: varchar("location", {
      length: 255,
    }),

    // personal website / portfolio / github
    website: varchar("website", {
      length: 255,
    }),

    /* =====================================================
       SOCIAL COUNTS (denormalized for fast reads)
       - followers/following = Instagram style
       - connections = LinkedIn style
    ===================================================== */

    followersCount: integer("followers_count")
      .default(0)
      .notNull(),

    followingCount: integer("following_count")
      .default(0)
      .notNull(),

    connectionsCount: integer("connections_count")
      .default(0)
      .notNull(),

    /* =====================================================
       TIMESTAMPS
    ===================================================== */

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("users_email_idx").on(table.email),
  ]
);


/* =========================================================
   INTERNSHIPS
========================================================= */




export const internships = pgTable(
  "internships",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    name: varchar("name", {
      length: 200,
    }).notNull(),

    description: text("description"),

    image: text("image"),

    skills: jsonb("skills")
      .$type<string[]>()
      .default([])
      .notNull(),

    qualifications: jsonb("qualifications")
      .$type<string[]>()
      .default([])
      .notNull(),

    duration: varchar("duration", {
      length: 100,
    }),

    mode: internshipModeEnum("mode")
      .default("remote")
      .notNull(),

    location: varchar("location", {
      length: 255,
    }),

    /* =====================================================
       PRICING (free / paid)
    ===================================================== */

    pricing: internshipPricingEnum("pricing")
      .default("free")
      .notNull(),

    // sirf paid internships ke liye — amount
    price: decimal("price", {
      precision: 12,
      scale: 2,
    }),

    currency: varchar("currency", {
      length: 10,
    })
      .default("INR")
      .notNull(),

    // paid hone par ek baar ya monthly
    paymentType: internshipPaymentTypeEnum(
      "payment_type"
    ).default("one_time"),

    // discount / offer price (optional)
    discountPrice: decimal("discount_price", {
      precision: 12,
      scale: 2,
    }),

    // pricing ke baare me extra note
    pricingNote: text("pricing_note"),

    /* ===================================================== */

    registrationOpen: boolean("registration_open")
      .default(true)
      .notNull(),

    isActive: boolean("is_active")
      .default(true)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("internships_active_idx").on(table.isActive),
    index("internships_pricing_idx").on(table.pricing),
  ]
);


/* =========================================================
   INTERNSHIP REGISTRATIONS
========================================================= */

export const internshipRegistrations = pgTable(
  "internship_registrations",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    internshipId: uuid("internship_id")
      .notNull()
      .references(() => internships.id, {
        onDelete: "cascade",
      }),

    university: varchar("university", {
      length: 255,
    }).notNull(),

    collegeName: varchar("college_name", {
      length: 255,
    }).notNull(),

    branch: varchar("branch", {
      length: 150,
    }).notNull(),

    degree: varchar("degree", {
      length: 150,
    }).notNull(),

    academicYear: varchar("academic_year", {
      length: 50,
    }),

    semester: integer("semester"),

    passingYear: integer("passing_year"),

    address: text("address"),

    aboutUser: text("about_user"),

    status: registrationStatusEnum("status")
      .default("pending")
      .notNull(),

    registeredAt: timestamp("registered_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    uniqueIndex("user_internship_unique").on(
      table.userId,
      table.internshipId
    ),

    index("registration_user_idx").on(
      table.userId
    ),

    index("registration_internship_idx").on(
      table.internshipId
    ),

    index("registration_status_idx").on(
      table.status
    ),
  ]
);


/* =========================================================
   LEARNING PAGES
========================================================= */

export const learningPages = pgTable(
  "learning_pages",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    internshipId: uuid("internship_id")
      .notNull()
      .references(() => internships.id, {
        onDelete: "cascade",
      }),

    title: varchar("title", {
      length: 255,
    }).notNull(),

    description: text("description"),

    content: text("content"),

    image: text("image"),

    whatYouLearn: jsonb("what_you_learn")
      .$type<string[]>()
      .default([])
      .notNull(),

    order: integer("order")
      .default(0)
      .notNull(),

    isPublished: boolean("is_published")
      .default(true)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("learning_internship_idx").on(
      table.internshipId
    ),

    index("learning_order_idx").on(
      table.internshipId,
      table.order
    ),
  ]
);


/* =========================================================
   EXAMS
========================================================= */

export const exams = pgTable(
  "exams",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    internshipId: uuid("internship_id")
      .notNull()
      .references(() => internships.id, {
        onDelete: "cascade",
      }),

    title: varchar("title", {
      length: 255,
    }).notNull(),

    description: text("description"),

    type: examTypeEnum("type")
      .notNull(),

    duration: integer("duration")
      .notNull(),

    totalScore: integer("total_score")
      .notNull(),

    passingScore: integer("passing_score")
      .notNull(),

    maxAttempts: integer("max_attempts")
      .default(1)
      .notNull(),

    isPublished: boolean("is_published")
      .default(false)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("exam_internship_idx").on(
      table.internshipId
    ),
  ]
);


/* =========================================================
   EXAM QUESTIONS
========================================================= */

export const examQuestions = pgTable(
  "exam_questions",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, {
        onDelete: "cascade",
      }),

    question: text("question")
      .notNull(),

    options: jsonb("options")
      .$type<string[]>()
      .notNull(),

    correctOption: integer("correct_option")
      .notNull(),

    marks: integer("marks")
      .default(1)
      .notNull(),

    explanation: text("explanation"),

    order: integer("order")
      .default(0)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("question_exam_idx").on(
      table.examId
    ),

    index("question_order_idx").on(
      table.examId,
      table.order
    ),
  ]
);


/* =========================================================
   EXAM SUBMISSIONS
========================================================= */

export const examSubmissions = pgTable(
  "exam_submissions",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    attemptNumber: integer("attempt_number")
      .default(1)
      .notNull(),

    status: examSubmissionStatusEnum("status")
      .default("started")
      .notNull(),

    startedAt: timestamp("started_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    submittedAt: timestamp("submitted_at", {
      withTimezone: true,
    }),

    score: integer("score"),

    totalScore: integer("total_score"),

    percentage: decimal("percentage", {
      precision: 5,
      scale: 2,
    }),

    passed: boolean("passed"),

    timeTaken: integer("time_taken"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("submission_user_idx").on(
      table.userId
    ),

    index("submission_exam_idx").on(
      table.examId
    ),

    uniqueIndex("exam_user_attempt_unique").on(
      table.examId,
      table.userId,
      table.attemptNumber
    ),
  ]
);


/* =========================================================
   EXAM SUBMISSION ANSWERS
========================================================= */

export const examSubmissionAnswers = pgTable(
  "exam_submission_answers",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    submissionId: uuid("submission_id")
      .notNull()
      .references(() => examSubmissions.id, {
        onDelete: "cascade",
      }),

    questionId: uuid("question_id")
      .notNull()
      .references(() => examQuestions.id, {
        onDelete: "cascade",
      }),

    selectedOption: integer("selected_option"),

    isCorrect: boolean("is_correct"),

    marksObtained: integer("marks_obtained")
      .default(0)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    uniqueIndex("submission_question_unique").on(
      table.submissionId,
      table.questionId
    ),
  ]
);


/* =========================================================
   OFFER LETTERS
========================================================= */

export const offerLetters = pgTable(
  "offer_letters",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    internshipId: uuid("internship_id")
      .notNull()
      .references(() => internships.id, { onDelete: "cascade" }),

    registrationId: uuid("registration_id")
      .notNull()
      .references(() => internshipRegistrations.id, {
        onDelete: "cascade",
      }),

    offerNumber: varchar("offer_number", { length: 100 })
      .notNull()
      .unique(),

    position: varchar("position", { length: 200 }).notNull(),

    department: varchar("department", { length: 200 }),

    // 👇 NEW: paid / unpaid
    documentType: documentTypeEnum("document_type")
      .default("unpaid")
      .notNull(),

    startDate: timestamp("start_date", {
      withTimezone: true,
    }).notNull(),

    endDate: timestamp("end_date", {
      withTimezone: true,
    }),

    issueDate: timestamp("issue_date", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    stipend: decimal("stipend", {
      precision: 12,
      scale: 2,
    }),

    stipendCurrency: varchar("stipend_currency", {
      length: 10,
    }).default("INR"),

    terms: text("terms"),

    // ❌ documentUrl REMOVED — ab React PDF se generate hoga

    status: offerLetterStatusEnum("status")
      .default("draft")
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("offer_user_idx").on(table.userId),
    index("offer_internship_idx").on(table.internshipId),
    index("offer_document_type_idx").on(table.documentType), // 👈 NEW

    uniqueIndex("registration_offer_unique").on(table.registrationId),
  ]
);


/* =========================================================
   CERTIFICATES
========================================================= */
export const certificates = pgTable(
  "certificates",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    internshipId: uuid("internship_id")
      .notNull()
      .references(() => internships.id, { onDelete: "cascade" }),

    registrationId: uuid("registration_id")
      .notNull()
      .references(() => internshipRegistrations.id, {
        onDelete: "cascade",
      }),

    certificateNumber: varchar("certificate_number", { length: 150 })
      .notNull()
      .unique(),

    title: varchar("title", { length: 255 }).notNull(),

    studentName: varchar("student_name", { length: 255 }).notNull(),

    internshipName: varchar("internship_name", { length: 255 }).notNull(),

    position: varchar("position", { length: 200 }),

    // 👇 NEW: paid / unpaid
    documentType: documentTypeEnum("document_type")
      .default("unpaid")
      .notNull(),

    startDate: timestamp("start_date", {
      withTimezone: true,
    }),

    endDate: timestamp("end_date", {
      withTimezone: true,
    }),

    issueDate: timestamp("issue_date", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    skills: jsonb("skills")
      .$type<string[]>()
      .default([])
      .notNull(),

    grade: varchar("grade", { length: 50 }),

    score: decimal("score", {
      precision: 6,
      scale: 2,
    }),

    description: text("description"),

    verificationCode: varchar("verification_code", { length: 100 })
      .notNull()
      .unique(),

    // ❌ documentUrl REMOVED — ab React PDF se generate hoga

    status: documentStatusEnum("status")
      .default("draft")
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("certificate_user_idx").on(table.userId),
    index("certificate_verification_idx").on(table.verificationCode),
    index("certificate_document_type_idx").on(table.documentType), // 👈 NEW

    uniqueIndex("registration_certificate_unique").on(
      table.registrationId
    ),
  ]
);


/* =========================================================
   LOR
========================================================= */

export const lors = pgTable(
  "lors",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    internshipId: uuid("internship_id")
      .notNull()
      .references(() => internships.id, {
        onDelete: "cascade",
      }),

    registrationId: uuid("registration_id")
      .notNull()
      .references(
        () => internshipRegistrations.id,
        {
          onDelete: "cascade",
        }
      ),

    lorNumber: varchar("lor_number", {
      length: 150,
    }).notNull().unique(),

    studentName: varchar("student_name", {
      length: 255,
    }).notNull(),

    university: varchar("university", {
      length: 255,
    }),

    collegeName: varchar("college_name", {
      length: 255,
    }),

    degree: varchar("degree", {
      length: 150,
    }),

    branch: varchar("branch", {
      length: 150,
    }),

    position: varchar("position", {
      length: 200,
    }),

    internshipName: varchar(
      "internship_name",
      {
        length: 255,
      }
    ),

    startDate: timestamp("start_date", {
      withTimezone: true,
    }),

    endDate: timestamp("end_date", {
      withTimezone: true,
    }),

    issueDate: timestamp("issue_date", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    performance: text("performance"),

    skills: jsonb("skills")
      .$type<string[]>()
      .default([])
      .notNull(),

    achievements: jsonb("achievements")
      .$type<string[]>()
      .default([])
      .notNull(),

    recommendationText: text(
      "recommendation_text"
    ).notNull(),

    recommenderName: varchar(
      "recommender_name",
      {
        length: 255,
      }
    ).notNull(),

    recommenderDesignation: varchar(
      "recommender_designation",
      {
        length: 200,
      }
    ),

    recommenderEmail: varchar(
      "recommender_email",
      {
        length: 255,
      }
    ),

    companyName: varchar("company_name", {
      length: 255,
    }),

    companyLogo: text("company_logo"),

    signatureUrl: text("signature_url"),

    documentUrl: text("document_url"),

    verificationCode: varchar(
      "verification_code",
      {
        length: 100,
      }
    ).notNull().unique(),

    status: documentStatusEnum("status")
      .default("draft")
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("lor_user_idx").on(
      table.userId
    ),

    index("lor_verification_idx").on(
      table.verificationCode
    ),

    uniqueIndex("registration_lor_unique").on(
      table.registrationId
    ),
  ]
);


/* =========================================================
   PAYMENTS
========================================================= */

export const payments = pgTable(
  "payments",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    registrationId: uuid("registration_id")
      .references(
        () => internshipRegistrations.id,
        {
          onDelete: "set null",
        }
      ),

    internshipId: uuid("internship_id")
      .references(() => internships.id, {
        onDelete: "set null",
      }),

    provider: paymentProviderEnum(
      "provider"
    ).notNull(),

    providerOrderId: varchar(
      "provider_order_id",
      {
        length: 255,
      }
    ),

    providerPaymentId: varchar(
      "provider_payment_id",
      {
        length: 255,
      }
    ),

    providerSignature: text(
      "provider_signature"
    ),

    amount: decimal("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    currency: varchar("currency", {
      length: 10,
    })
      .default("INR")
      .notNull(),

    status: paymentStatusEnum("status")
      .default("pending")
      .notNull(),

    description: text("description"),

    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),

    paidAt: timestamp("paid_at", {
      withTimezone: true,
    }),

    refundedAt: timestamp("refunded_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("payment_user_idx").on(
      table.userId
    ),

    index("payment_registration_idx").on(
      table.registrationId
    ),

    index("payment_status_idx").on(
      table.status
    ),
  ]
);


/* =========================================================
   FOLLOWERS  (one-directional, Instagram/Twitter style)
========================================================= */

export const followers = pgTable(
  "followers",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    // jisko follow kiya ja raha hai
    followingId: uuid("following_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    // jo follow kar raha hai
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    status: followStatusEnum("status")
      .default("active")
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    // ek user kisi ko sirf ek baar follow kar sakta hai
    uniqueIndex("follower_following_unique").on(
      table.followerId,
      table.followingId
    ),

    index("follower_following_idx").on(table.followingId),
    index("follower_follower_idx").on(table.followerId),
  ]
);


/* =========================================================
   CONNECTIONS  (two-way, LinkedIn style)
========================================================= */

export const connections = pgTable(
  "connections",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    // request bhejne wala
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    // request receive karne wala
    addresseeId: uuid("addressee_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    status: connectionStatusEnum("status")
      .default("pending")
      .notNull(),

    // optional message with request
    message: text("message"),

    // jab accepted hui
    acceptedAt: timestamp("accepted_at", {
      withTimezone: true,
    }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    // ek pair ke beech sirf ek connection row
    uniqueIndex("connection_pair_unique").on(
      table.requesterId,
      table.addresseeId
    ),

    index("connection_requester_idx").on(table.requesterId),
    index("connection_addressee_idx").on(table.addresseeId),
    index("connection_status_idx").on(table.status),
  ]
);

/* =========================================================
   RELATIONS
========================================================= */

export const usersRelations = relations(
  users,
  ({ many }) => ({
    registrations: many(internshipRegistrations),
    examSubmissions: many(examSubmissions),
    payments: many(payments),
    certificates: many(certificates),
    offerLetters: many(offerLetters),
    lors: many(lors),

    posts: many(posts),
    postLikes: many(postLikes),
    postComments: many(postComments),
    commentLikes: many(commentLikes),

    // ===== followers / connections =====
    following: many(followers, {
      relationName: "user_following",
    }),
    followers: many(followers, {
      relationName: "user_followers",
    }),
    savedPosts: many(savedPosts),
    notifications: many(notifications, {
      relationName: "notification_recipient",
    }),
    triggeredNotifications: many(notifications, {
      relationName: "notification_actor",
    }),

    sentConnectionRequests: many(connections, {
      relationName: "connection_requester",
    }),
    receivedConnectionRequests: many(connections, {
      relationName: "connection_addressee",
    }),

    projectSubmissions: many(projectSubmissions, {
      relationName: "project_submission_user",
    }),
    reviewedProjectSubmissions: many(projectSubmissions, {
      relationName: "project_submission_reviewer",
    }),
  })
);

export const internshipsRelations = relations(
  internships,
  ({ many }) => ({
    registrations: many(
      internshipRegistrations
    ),

    projects: many(projects),
    learningPages: many(
      learningPages
    ),

    exams: many(exams),

    offerLetters: many(
      offerLetters
    ),

    certificates: many(
      certificates
    ),

    lors: many(lors),

    payments: many(payments),
  })
);


export const internshipRegistrationsRelations =
  relations(
    internshipRegistrations,
    ({ one, many }) => ({
      user: one(users, {
        fields: [
          internshipRegistrations.userId,
        ],
        references: [users.id],
      }),

      internship: one(internships, {
        fields: [
          internshipRegistrations.internshipId,
        ],
        references: [internships.id],
      }),

      offerLetter: one(offerLetters),

      certificate: one(certificates),
      projectSubmissions: many(projectSubmissions),

      lor: one(lors),

      payments: many(payments),
    })
  );


export const learningPagesRelations =
  relations(
    learningPages,
    ({ one }) => ({
      internship: one(internships, {
        fields: [
          learningPages.internshipId,
        ],
        references: [internships.id],
      }),
    })
  );


export const examsRelations = relations(
  exams,
  ({ one, many }) => ({
    internship: one(internships, {
      fields: [exams.internshipId],
      references: [internships.id],
    }),

    questions: many(examQuestions),
    projects: many(projects),

    submissions: many(
      examSubmissions
    ),
  })
);


export const examQuestionsRelations =
  relations(
    examQuestions,
    ({ one, many }) => ({
      exam: one(exams, {
        fields: [examQuestions.examId],
        references: [exams.id],
      }),

      answers: many(
        examSubmissionAnswers
      ),
    })
  );


export const examSubmissionsRelations =
  relations(
    examSubmissions,
    ({ one, many }) => ({
      exam: one(exams, {
        fields: [examSubmissions.examId],
        references: [exams.id],
      }),

      user: one(users, {
        fields: [
          examSubmissions.userId,
        ],
        references: [users.id],
      }),
      projectSubmissions: many(projectSubmissions),

      answers: many(
        examSubmissionAnswers
      ),
    })
  );


export const examSubmissionAnswersRelations =
  relations(
    examSubmissionAnswers,
    ({ one }) => ({
      submission: one(
        examSubmissions,
        {
          fields: [
            examSubmissionAnswers.submissionId,
          ],
          references: [
            examSubmissions.id,
          ],
        }
      ),

      question: one(
        examQuestions,
        {
          fields: [
            examSubmissionAnswers.questionId,
          ],
          references: [
            examQuestions.id,
          ],
        }
      ),
    })
  );


export const offerLettersRelations =
  relations(
    offerLetters,
    ({ one }) => ({
      user: one(users, {
        fields: [
          offerLetters.userId,
        ],
        references: [users.id],
      }),

      internship: one(internships, {
        fields: [
          offerLetters.internshipId,
        ],
        references: [internships.id],
      }),

      registration: one(
        internshipRegistrations,
        {
          fields: [
            offerLetters.registrationId,
          ],
          references: [
            internshipRegistrations.id,
          ],
        }
      ),
    })
  );


export const certificatesRelations =
  relations(
    certificates,
    ({ one }) => ({
      user: one(users, {
        fields: [
          certificates.userId,
        ],
        references: [users.id],
      }),

      internship: one(internships, {
        fields: [
          certificates.internshipId,
        ],
        references: [internships.id],
      }),

      registration: one(
        internshipRegistrations,
        {
          fields: [
            certificates.registrationId,
          ],
          references: [
            internshipRegistrations.id,
          ],
        }
      ),
    })
  );


export const lorsRelations = relations(
  lors,
  ({ one }) => ({
    user: one(users, {
      fields: [lors.userId],
      references: [users.id],
    }),

    internship: one(internships, {
      fields: [lors.internshipId],
      references: [internships.id],
    }),

    registration: one(
      internshipRegistrations,
      {
        fields: [
          lors.registrationId,
        ],
        references: [
          internshipRegistrations.id,
        ],
      }
    ),
  })
);


export const paymentsRelations =
  relations(
    payments,
    ({ one }) => ({
      user: one(users, {
        fields: [payments.userId],
        references: [users.id],
      }),

      internship: one(internships, {
        fields: [
          payments.internshipId,
        ],
        references: [internships.id],
      }),

      registration: one(
        internshipRegistrations,
        {
          fields: [
            payments.registrationId,
          ],
          references: [
            internshipRegistrations.id,
          ],
        }
      ),
    })
  );


/* =========================================================
 POSTS (LinkedIn style feed)
========================================================= */

export const posts = pgTable(
  "posts",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    caption: text("caption"),

    media: jsonb("media")
      .$type<
        {
          type: "image" | "video";
          url: string;
          thumbnail?: string;
          width?: number;
          height?: number;
          duration?: number;
        }[]
      >()
      .default([])
      .notNull(),

    mediaType: postMediaTypeEnum("media_type")
      .default("text")
      .notNull(),

    visibility: postVisibilityEnum("visibility")
      .default("public")
      .notNull(),

    location: varchar("location", {
      length: 255,
    }),

    tags: jsonb("tags")
      .$type<string[]>()
      .default([])
      .notNull(),

    likesCount: integer("likes_count")
      .default(0)
      .notNull(),

    commentsCount: integer("comments_count")
      .default(0)
      .notNull(),

    sharesCount: integer("shares_count")
      .default(0)
      .notNull(),

    isEdited: boolean("is_edited")
      .default(false)
      .notNull(),

    isDeleted: boolean("is_deleted")
      .default(false)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("post_user_idx").on(table.userId),
    index("post_created_idx").on(table.createdAt),
    index("post_visibility_idx").on(table.visibility),
  ]
);


export const savedPosts = pgTable(
  "saved_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("saved_post_user_unique").on(table.userId, table.postId),
    index("saved_post_user_idx").on(table.userId),
    index("saved_post_post_idx").on(table.postId),
  ]
);

/* =========================================================
   POST LIKES
========================================================= */

export const postLikes = pgTable(
  "post_likes",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    // ek user ek post ko sirf ek baar like kar sakta hai
    uniqueIndex("post_user_like_unique").on(
      table.postId,
      table.userId
    ),

    index("post_like_post_idx").on(table.postId),
    index("post_like_user_idx").on(table.userId),
  ]
);


/* =========================================================
   POST COMMENTS
========================================================= */

export const postComments = pgTable(
  "post_comments",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    // reply support (self reference)
    parentId: uuid("parent_id")
      .references((): AnyPgColumn => postComments.id, {
        onDelete: "cascade",
      }),

    content: text("content").notNull(),

    likesCount: integer("likes_count")
      .default(0)
      .notNull(),

    isEdited: boolean("is_edited")
      .default(false)
      .notNull(),

    isDeleted: boolean("is_deleted")
      .default(false)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("comment_post_idx").on(table.postId),
    index("comment_user_idx").on(table.userId),
    index("comment_parent_idx").on(table.parentId),
    index("comment_created_idx").on(table.createdAt),
  ]
);



export const projects = pgTable(
  "projects",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    internshipId: uuid("internship_id")
      .notNull()
      .references(() => internships.id, {
        onDelete: "cascade",
      }),

    // kis exam ke baad unlock hoga (usually end exam)
    examId: uuid("exam_id")
      .references(() => exams.id, {
        onDelete: "set null",
      }),

    title: varchar("title", {
      length: 255,
    }).notNull(),

    description: text("description"),

    // project requirements / instructions
    requirements: jsonb("requirements")
      .$type<string[]>()
      .default([])
      .notNull(),

    // skills jo project me use hongi
    skills: jsonb("skills")
      .$type<string[]>()
      .default([])
      .notNull(),

    // project kitne marks ka hai
    totalScore: integer("total_score")
      .default(100)
      .notNull(),

    passingScore: integer("passing_score")
      .default(40)
      .notNull(),

    // kitne din me complete karna hai
    durationDays: integer("duration_days")
      .default(7)
      .notNull(),

    // reference material / links
    resources: jsonb("resources")
      .$type<{ title: string; url: string }[]>()
      .default([])
      .notNull(),

    // attachments (starter files, etc.)
    attachments: jsonb("attachments")
      .$type<{ name: string; url: string }[]>()
      .default([])
      .notNull(),

    image: text("image"),

    order: integer("order")
      .default(0)
      .notNull(),

    isPublished: boolean("is_published")
      .default(false)
      .notNull(),

    isActive: boolean("is_active")
      .default(true)
      .notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("project_internship_idx").on(table.internshipId),
    index("project_exam_idx").on(table.examId),
    index("project_active_idx").on(table.isActive),
    index("project_order_idx").on(
      table.internshipId,
      table.order
    ),
  ]
);


/* =========================================================
   PROJECT SUBMISSIONS
   (user ka project submission + admin review)
========================================================= */

export const projectSubmissions = pgTable(
  "project_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    registrationId: uuid("registration_id").references(
      () => internshipRegistrations.id,
      { onDelete: "set null" }
    ),

    examSubmissionId: uuid("exam_submission_id").references(
      () => examSubmissions.id,
      { onDelete: "set null" }
    ),

    status: projectStatusEnum("status").default("locked").notNull(),

    // 👇 ye 3 text hone chahiye
    submissionUrl: text("submission_url"),
    githubUrl: text("github_url"),
    liveUrl: text("live_url"),

    submissionFiles: jsonb("submission_files")
      .$type<
        {
          name: string;
          url: string;
          type?: string;
          size?: number;
        }[]
      >()
      .default([])
      .notNull(),

    submissionNotes: text("submission_notes"),

    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),

    score: integer("score"),
    feedback: text("feedback"),

    startedAt: timestamp("started_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_project_unique").on(table.userId, table.projectId),
    index("project_submission_user_idx").on(table.userId),
    index("project_submission_project_idx").on(table.projectId),
    index("project_submission_status_idx").on(table.status),
  ]
);


/* =========================================================
   NOTIFICATIONS
========================================================= */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // jisko notification mil rahi hai
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // kaun trigger kiya (system notifications me null)
    actorId: uuid("actor_id").references(() => users.id, {
      onDelete: "cascade",
    }),

    type: notificationTypeEnum("type").notNull(),

    title: varchar("title", { length: 255 }).notNull(),

    message: text("message"),

    // related entity (post / comment / connection / internship ...)
    entityId: uuid("entity_id"),

    entityType: varchar("entity_type", { length: 50 }),

    // link jahan click karne pe jaana hai
    link: varchar("link", { length: 500 }),

    // extra data (post preview, etc.)
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),

    isRead: boolean("is_read").default(false).notNull(),

    readAt: timestamp("read_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    index("notification_user_idx").on(table.userId),
    index("notification_read_idx").on(table.userId, table.isRead),
    index("notification_created_idx").on(table.createdAt),
  ]
);

/* =========================================================
   NOTIFICATIONS RELATIONS
========================================================= */

export const notificationsRelations = relations(
  notifications,
  ({ one }) => ({
    user: one(users, {
      fields: [notifications.userId],
      references: [users.id],
      relationName: "notification_recipient",
    }),

    actor: one(users, {
      fields: [notifications.actorId],
      references: [users.id],
      relationName: "notification_actor",
    }),
  })
);

/* =========================================================
   COMMENT LIKES
========================================================= */

export const commentLikes = pgTable(
  "comment_likes",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    commentId: uuid("comment_id")
      .notNull()
      .references(() => postComments.id, {
        onDelete: "cascade",
      }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },

  (table) => [
    uniqueIndex("comment_user_like_unique").on(
      table.commentId,
      table.userId
    ),

    index("comment_like_comment_idx").on(table.commentId),
    index("comment_like_user_idx").on(table.userId),
  ]
);



/* =========================================================
   POSTS RELATIONS
========================================================= */

export const postsRelations = relations(
  posts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [posts.userId],
      references: [users.id],
    }),

    // ❌ internship relation REMOVE — posts ka internship se koi rishta nahi

    likes: many(postLikes),
    comments: many(postComments),
    savedBy: many(savedPosts),
  })
);

export const postLikesRelations = relations(
  postLikes,
  ({ one }) => ({
    post: one(posts, {
      fields: [postLikes.postId],
      references: [posts.id],
    }),

    user: one(users, {
      fields: [postLikes.userId],
      references: [users.id],
    }),
  })
);

export const postCommentsRelations = relations(
  postComments,
  ({ one, many }) => ({
    post: one(posts, {
      fields: [postComments.postId],
      references: [posts.id],
    }),

    user: one(users, {
      fields: [postComments.userId],
      references: [users.id],
    }),

    parent: one(postComments, {
      fields: [postComments.parentId],
      references: [postComments.id],
      relationName: "comment_replies",
    }),

    replies: many(postComments, {
      relationName: "comment_replies",
    }),

    likes: many(commentLikes),
  })
);

export const commentLikesRelations = relations(
  commentLikes,
  ({ one }) => ({
    comment: one(postComments, {
      fields: [commentLikes.commentId],
      references: [postComments.id],
    }),

    user: one(users, {
      fields: [commentLikes.userId],
      references: [users.id],
    }),
  })
);

export const savedPostsRelations = relations(savedPosts, ({ one }) => ({
  user: one(users, {
    fields: [savedPosts.userId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [savedPosts.postId],
    references: [posts.id],
  }),
}));


/* =========================================================
   PROJECTS RELATIONS
========================================================= */

export const projectsRelations = relations(
  projects,
  ({ one, many }) => ({
    internship: one(internships, {
      fields: [projects.internshipId],
      references: [internships.id],
    }),

    exam: one(exams, {
      fields: [projects.examId],
      references: [exams.id],
    }),

    submissions: many(projectSubmissions),
  })
);


export const projectSubmissionsRelations = relations(
  projectSubmissions,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectSubmissions.projectId],
      references: [projects.id],
    }),

    user: one(users, {
      fields: [projectSubmissions.userId],
      references: [users.id],
      relationName: "project_submission_user",
    }),

    reviewer: one(users, {
      fields: [projectSubmissions.reviewedBy],
      references: [users.id],
      relationName: "project_submission_reviewer",
    }),

    registration: one(internshipRegistrations, {
      fields: [projectSubmissions.registrationId],
      references: [internshipRegistrations.id],
    }),

    examSubmission: one(examSubmissions, {
      fields: [projectSubmissions.examSubmissionId],
      references: [examSubmissions.id],
    }),
  })
);