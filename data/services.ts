import {
  Code2,
  Palette,
  Cloud,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface Service {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

/**
 * Featured services strip directly under the hero — intro block plus four
 * equal service cards (Web & Mobile Dev, UI/UX, Cloud & DevOps, Consulting).
 *
 * Every card links to the services page, where the full detail lives.
 */
export const services: Service[] = [
  {
    icon: Code2,
    title: "Web & Mobile Development",
    description: "Modern, scalable applications built for performance.",
    href: "/services",
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    description: "Beautiful, user-centered designs that create real experiences.",
    href: "/services",
  },
  {
    icon: Cloud,
    title: "Cloud & DevOps",
    description: "Reliable infrastructure for a faster, more scalable future.",
    href: "/services",
  },
  {
    icon: BarChart3,
    title: "Digital Consulting",
    description: "Strategic guidance to turn your ideas into measurable results.",
    href: "/services",
  },
];