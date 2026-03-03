import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/AuthContext';

export const metadata: Metadata = {
    title: 'RevSync - Unlock Your Ride\'s True Potential',
    description: 'Professional grade ECU remapping at your fingertips. Safely increase horsepower, torque, and throttle response instantly.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html className="dark" lang="en">
            <body className="bg-background-dark font-body text-text-body antialiased">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
