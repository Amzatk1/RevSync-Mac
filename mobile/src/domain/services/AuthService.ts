import { User } from '../entities/User';

export interface AuthResult {
    success: boolean;
    user?: User;
    error?: string;
}

export interface AuthService {
    signIn(email: string, password: string): Promise<AuthResult>;
    signUp(email: string, password: string): Promise<AuthResult>;
    signOut(): Promise<void>;
    getCurrentUser(): Promise<User | null>;
    resetPassword(email: string): Promise<boolean>;
}
