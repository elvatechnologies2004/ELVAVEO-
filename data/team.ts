export interface TeamMember {
  name: string;
  role: string;
  description: string;
  initials?: string;
  image?: string;
  linkedin?: string;
}

/**
 * Team members list for the "Meet Our Team" section on the About page.
 * You can add, remove, or edit members here anytime.
 */
export const teamMembers: TeamMember[] = [
  {
    name: "Syed Hussain Ali",
    role: "Founder & Lead",
    initials: "SHA",
    description:
      "Building digital products and software solutions with a focus on practical innovation and long-term value.",
    linkedin: "https://www.linkedin.com/",
  },
  {
    name: "Team Member 1",
    role: "Lead Full-Stack Engineer",
    initials: "FE",
    description:
      "Specializing in modern web technologies, performant architectures, and scalable cloud solutions.",
    linkedin: "https://www.linkedin.com/",
  },
  {
    name: "Team Member 2",
    role: "UI/UX & Product Designer",
    initials: "PD",
    description:
      "Designing clean, human-centered interfaces and intuitive design systems for web and mobile products.",
    linkedin: "https://www.linkedin.com/",
  },
  {
    name: "Team Member 3",
    role: "Mobile App Developer",
    initials: "MD",
    description:
      "Crafting seamless cross-platform mobile experiences with smooth animations and high reliability.",
    linkedin: "https://www.linkedin.com/",
  },
];
