export interface OnboardingProfile {
  fullName?: string;
  email?: string;
  primaryLanguage?: string;
  currentRole?: string;
  yearsOfExperience?: string;
  dailyCodingTime?: string;
  primaryGoal?: string;
  targetStack?: string;
  weeklyCommitment?: string;
  preferredCohortPace?: string;
  mentorInteractionMode?: string;
  timezone?: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  bio: string;
  city: string;
  country: string;
  roles: string[];
  onboardingProfile: OnboardingProfile | null;
  onboardingCompletedAt: string | null;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateUserProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  bio: string;
}
