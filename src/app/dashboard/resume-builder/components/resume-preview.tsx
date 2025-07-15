
import React, { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Mail, Phone, Linkedin as LinkedinIcon, Github } from 'lucide-react';

interface ResumePreviewProps {
    content: string;
    className?: string;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
    ({ content, className }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("bg-card text-card-foreground p-8 rounded-lg shadow-lg font-serif", className)}
            >
                <div className={cn(
                    "prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-headings:my-2",
                    "prose-headings:font-sans prose-headings:font-bold",
                    "prose-h1:text-center prose-h1:text-3xl prose-h1:mb-0",
                    "prose-h2:text-sm prose-h2:font-medium prose-h2:text-center prose-h2:mt-0 prose-h2:mb-1",
                    "prose-h3:text-base prose-h3:border-b prose-h3:pb-1 prose-h3:mt-4 prose-h3:mb-2",
                    "prose-h4:text-base prose-h4:font-bold",
                    "prose-a:no-underline hover:prose-a:underline",
                    "prose-li:text-sm"
                )}>
                    <ReactMarkdown>{content}</ReactMarkdown>
                </div>
            </div>
        );
    }
);

ResumePreview.displayName = 'ResumePreview';
