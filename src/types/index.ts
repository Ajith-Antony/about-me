export interface CheckpointInfo {
  id: number;
  progress: number;
  title: string;
  subtitle: string;
  tag: string;
  elevation: string;
  coords: string;
  iconName: string;
}

export interface SkillCategory {
  category: string;
  icon: string;
  description: string;
  skills: {
    name: string;
    level: number; // 1-100
    highlight?: boolean;
  }[];
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  badge: string;
  summary: string;
  highlights: string[];
  techStack: string[];
  impactMetric?: string;
}

export interface EducationInfo {
  degree: string;
  institution: string;
  period: string;
  location: string;
  score: string;
  details: string[];
}

export interface EngineeringPhilosophy {
  title: string;
  tagline: string;
  description: string;
  icon: string;
}

export interface AudioSettings {
  muted: boolean;
  windVolume: number;
  auroraVolume: number;
  footstepsEnabled: boolean;
}
