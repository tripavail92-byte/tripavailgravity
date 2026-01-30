import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    LogOut,
    UserCircle,
    AlignJustify,
    LogIn
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_NAVIGATION } from '@/config/navigation';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function RoleBasedDrawer() {
    const { user, activeRole, signOut, initialized } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleNavigation = (path: string) => {
        setIsOpen(false);
        navigate(path);
    };

    const handleSignOut = async () => {
        setIsOpen(false);
        await signOut();
        navigate('/');
    };

    const handleLogin = () => {
        setIsOpen(false);
        navigate('/auth');
    };

    // Loading state
    if (!initialized) {
        return (
            <Button variant="ghost" size="icon" className="rounded-full">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
            </Button>
        );
    }

    // Guest View
    if (!user || !activeRole) {
        return (
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <button className="flex items-center gap-2 border rounded-full p-1 pl-3 hover:shadow-md transition-shadow ml-1 group">
                        <AlignJustify className="w-4 h-4 text-foreground/80 group-hover:text-foreground" />
                        <div className="bg-muted text-muted-foreground bg-gray-500/10 rounded-full p-1 group-hover:bg-gray-500/20 transition-colors">
                            <UserCircle className="w-6 h-6 fill-current text-gray-500" />
                        </div>
                    </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                    <SheetHeader className="text-left">
                        <SheetTitle>Welcome to TripAvail</SheetTitle>
                        <SheetDescription>
                            Sign in to manage your trips and preferences.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 mt-8">
                        <Button onClick={handleLogin} className="w-full">
                            <LogIn className="mr-2 h-4 w-4" /> Log In / Sign Up
                        </Button>
                        <Separator />
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Or continue as:</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" onClick={() => navigate('/auth?role=hotel_manager')}>
                                    Hotel Partner
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => navigate('/auth?role=tour_operator')}>
                                    Tour Operator
                                </Button>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    // Role-Based View
    const navItems = ROLE_NAVIGATION[activeRole.role_type] || [];
    const roleLabel = activeRole.role_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <button className="flex items-center gap-2 border rounded-full p-1 pl-3 hover:shadow-md transition-shadow ml-1 group">
                    <AlignJustify className="w-4 h-4 text-foreground/80 group-hover:text-foreground" />
                    <div className="bg-muted text-muted-foreground bg-gray-500/10 rounded-full p-1 group-hover:bg-gray-500/20 transition-colors">
                        {/* Use User Avatar if available, else fallback */}
                        {user.user_metadata?.avatar_url ? (
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={user.user_metadata.avatar_url} />
                                <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        ) : (
                            <UserCircle className="w-6 h-6 fill-current text-gray-500" />
                        )}
                    </div>
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 flex flex-col h-full bg-background">
                {/* Header Profile Section */}
                <div className="p-6 border-b">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/10">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                {user.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-semibold truncate max-w-[180px]">
                                {user.user_metadata?.full_name || user.email?.split('@')[0]}
                            </h3>
                            <p className="text-xs text-muted-foreground capitalize bg-secondary px-2 py-0.5 rounded-full inline-block mt-1">
                                {roleLabel}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scrollable Navigation Items */}
                <ScrollArea className="flex-1 px-4 py-4">
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <Button
                                key={item.href}
                                variant="ghost"
                                className="justify-start gap-3 h-12 text-base font-normal"
                                onClick={() => handleNavigation(item.href)}
                            >
                                <item.icon className="h-5 w-5 text-muted-foreground" />
                                {item.label}
                            </Button>
                        ))}
                    </nav>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="p-6 border-t mt-auto space-y-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={handleSignOut}
                    >
                        <LogOut className="h-5 w-5" />
                        Log Out
                    </Button>
                    <div className="text-xs text-center text-muted-foreground pt-4">
                        TripAvail v1.0.0
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
