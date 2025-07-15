
'use client';

import { useUserProfile } from '@/lib/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GraduationCap, Briefcase, FileText, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MilestonesListProps {
  onSelectMilestone: (milestone: string) => void;
}

const iconMap = {
  education: <GraduationCap className="h-4 w-4 mr-3 text-primary" />,
  work_experience: <Briefcase className="h-4 w-4 mr-3 text-primary" />,
  project: <FileText className="h-4 w-4 mr-3 text-primary" />,
};

export function MilestonesList({ onSelectMilestone }: MilestonesListProps) {
  const { profile, loading } = useUserProfile();

  const getCompletedMilestones = () => {
    if (!profile) return [];

    const workMilestones = (profile.work_experience || []).map((item: any) => ({
      type: 'work_experience',
      title: `${item.role} at ${item.company}`,
      description: `Completed work as a ${item.role} at ${item.company}. Key achievement: ${item.details[0] || 'Gained valuable experience.'}`,
    }));

    const projectMilestones = (profile.projects || []).map((item: any) => ({
      type: 'project',
      title: item.name,
      description: `Completed the project: ${item.name}. ${item.description}`,
    }));

    const educationMilestones = (profile.education || []).map((item: any) => ({
      type: 'education',
      title: item.degree,
      description: `Completed ${item.degree} from ${item.institution}`,
    }));

    return [...workMilestones, ...projectMilestones, ...educationMilestones];
  };

  const milestones = getCompletedMilestones();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recent Milestones
        </CardTitle>
        <CardDescription>Click one to generate a post.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[550px]">
          <div className="space-y-3 pr-4">
            {loading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : milestones.length > 0 ? (
              milestones.map((milestone, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors flex items-start"
                  onClick={() => onSelectMilestone(milestone.description)}
                >
                  {iconMap[milestone.type as keyof typeof iconMap]}
                  <div>
                    <p className="font-semibold text-sm">{milestone.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{milestone.description}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex items-center justify-center h-40">
                <p className="text-sm text-muted-foreground italic text-center">
                  No completed milestones found in your profile yet.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
