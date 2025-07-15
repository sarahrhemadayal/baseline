
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export const useUserProfile = () => {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const loadProfile = useCallback(() => {
        setLoading(true);
        try {
            const localProfile = localStorage.getItem('userProfile');
            if (localProfile) {
                const parsedProfile = JSON.parse(localProfile);
                setProfile(parsedProfile);
            } else {
                // If no profile, redirect to onboarding.
                router.push('/onboarding');
            }
        } catch (error) {
            console.error("Failed to parse user profile from local storage", error);
            // Handle error, maybe clear storage and redirect
            localStorage.removeItem('userProfile');
            router.push('/onboarding');
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    const saveProfile = async (updatedProfile: any) => {
        setLoading(true);
        try {
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
            setProfile(updatedProfile);
        } catch (error) {
            console.error("Failed to save profile to localStorage", error);
        } finally {
            setLoading(false);
        }
    };
    
    return { profile, loading, saveProfile, reloadProfile: loadProfile };
};
