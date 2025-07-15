import { PageHeader } from '../components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkillAnalysis } from './components/skill-analysis';

export default function SkillsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills Analysis"
        description="Track your skill progression and identify gaps to reach your career goals."
      />
      <Tabs defaultValue="tracker">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="tracker">Skill Tracker</TabsTrigger>
          <TabsTrigger value="gap-analysis">Gap Analysis</TabsTrigger>
        </TabsList>
        <TabsContent value="tracker">
          <SkillAnalysis feature="tracker" />
        </TabsContent>
        <TabsContent value="gap-analysis">
          <SkillAnalysis feature="gap-analysis" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
