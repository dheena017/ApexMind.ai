export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  provider: 'google' | 'email';
  verified: boolean;
  lastLoginAt?: string;
}

export interface GoogleAuthPayload {
  credential?: string;
  email?: string;
  name?: string;
  picture?: string;
  sub?: string;
}
