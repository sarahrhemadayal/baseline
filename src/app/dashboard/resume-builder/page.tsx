
'use client';

import { PageHeader } from '../components/page-header';
import ResumeBuilderForm from './components/resume-builder-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ResumeBuilderPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Generator"
        description="Create a general CV or a resume and cover letter tailored to a specific job."
      />
      <Tabs defaultValue="cv" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="cv">CV Builder</TabsTrigger>
          <TabsTrigger value="tailored">Tailored Resume</TabsTrigger>
        </TabsList>
        <TabsContent value="cv">
          <ResumeBuilderForm mode="cv" />
        </TabsContent>
        <TabsContent value="tailored">
          <ResumeBuilderForm mode="tailored" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
