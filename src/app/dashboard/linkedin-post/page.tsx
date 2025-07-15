
'use client';

import { useState } from 'react';
import { PageHeader } from '../components/page-header';
import LinkedinPostForm from './components/linkedin-post-form';
import { MilestonesList } from './components/milestones-list';

export default function LinkedinPostPage() {
  const [selectedMilestone, setSelectedMilestone] = useState('');

  return (
    <div className="space-y-6">
      <PageHeader
        title="LinkedIn Post Generator"
        description="Select a recent achievement to generate an engaging LinkedIn post, or write your own."
      />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LinkedinPostForm
            selectedMilestone={selectedMilestone}
            onMilestoneChange={setSelectedMilestone}
          />
        </div>
        <div className="lg:col-span-1">
          <MilestonesList onSelectMilestone={setSelectedMilestone} />
        </div>
      </div>
    </div>
  );
}
