import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';

export default function TravellerLayout() {
    // We can also enforce the data-role attribute here if needed, 
    // but CSS variables in the wrapper is cleaner for scoped theming.

    return (
        <div
            className="min-h-screen bg-background font-sans"
            style={{
                // Override Primary Color to Teal/Cyan for Traveller Experience
                // Tailwind Teal-500: #14b8a6 -> HSL 173 80 40
                '--primary': '173 80% 40%',
                '--primary-foreground': '0 0% 100%',
            } as React.CSSProperties}
        >
            <main className="min-h-screen relative">
                <Outlet />
            </main>
        </div>
    );
}
