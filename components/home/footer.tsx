"use client";

import Link from "next/link";
import {
  Mail,
  MapPin,
} from "lucide-react";

import {FiGithub as Github,FiTwitter as Twitter,FiLinkedin as Linkedin,FiInstagram as Instagram} from 'react-icons/fi'

import { Separator } from "@/components/ui/separator";

/* =========================================================
   DATA
========================================================= */

const footerLinks = {
  platform: [
    { label: "Home", href: "/" },
    { label: "Internships", href: "/internships" },
    { label: "Learning Pages", href: "/learning" },
    { label: "Exams", href: "/dashboard/exams" },
    { label: "Certificates", href: "/dashboard/documents/certificates" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
    { label: "Blog", href: "/blog" },
    { label: "Partners", href: "/partners" },
  ],
  resources: [
    { label: "Help Center", href: "/help" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Verification", href: "/verify" },
    { label: "FAQs", href: "/faqs" },
  ],
};

const socialLinks = [
  { label: "GitHub", href: "https://github.com", icon: Github },
  { label: "Twitter", href: "https://twitter.com", icon: Twitter },
  { label: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
  { label: "Instagram", href: "https://instagram.com", icon: Instagram },
];

/* =========================================================
   FOOTER
========================================================= */

export default function Footer() {
  return (
    <footer className="mt-8 border-t bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6 lg:py-10">
        {/* ================= TOP : BRAND + LINK COLUMNS ================= */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-1.5">
              <img src={"/internbird.png"} className="w-50" alt="INTERNBIRD LOGO" />
            </Link>

            <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Empowering students with real-world internships, certifications,
              and career opportunities — all in one platform.
            </p>

            {/* contact */}
            <div className="mt-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a
                  href="mailto:support@sqrock.com"
                  className="hover:text-foreground hover:underline"
                >
                  support@sqrock.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span>India</span>
              </div>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Platform
            </h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Company
            </h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Resources
            </h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-6" />

        {/* ================= BOTTOM : COPYRIGHT + SOCIALS ================= */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            © {new Date().getFullYear()} SQRock Alpha Challenger. All rights
            reserved.
          </p>

          {/* socials */}
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}