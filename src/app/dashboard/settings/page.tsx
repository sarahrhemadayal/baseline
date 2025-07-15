import { PageHeader } from '../components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileUp, Github, Linkedin } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your connected accounts and import your professional data."
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Profile Import</CardTitle>
          <CardDescription>
            Populate your Baseline memory by connecting to external services or uploading your resume.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="flex items-center p-4">
            <Linkedin className="h-6 w-6 mr-4" />
            <div className="flex-grow">
              <h4 className="font-semibold">LinkedIn</h4>
              <p className="text-sm text-muted-foreground">Import your profile, experience, and education.</p>
            </div>
            <Button>Connect</Button>
          </Card>
           <Card className="flex items-center p-4">
            <Github className="h-6 w-6 mr-4" />
            <div className="flex-grow">
              <h4 className="font-semibold">GitHub</h4>
              <p className="text-sm text-muted-foreground">Import your project history and tech stack.</p>
            </div>
            <Button>Connect</Button>
          </Card>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Import from Resume</CardTitle>
          <CardDescription>
            Upload your existing resume to kickstart your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex w-full max-w-sm items-center space-x-2">
                <Input type="file" />
                <Button type="submit">
                    <FileUp className="h-4 w-4 mr-2" /> Upload
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
