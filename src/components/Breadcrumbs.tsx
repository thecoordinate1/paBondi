
"use client";

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbSegment {
  title: string;
  href?: string;
}

interface BreadcrumbsProps {
  segments: BreadcrumbSegment[];
  className?: string;
}

const Breadcrumbs = ({ segments, className }: BreadcrumbsProps) => {
  if (!segments || segments.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-muted-foreground mb-4", className)}>
      <ol className="flex items-center space-x-1.5">
        {segments.map((segment, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <ChevronRight size={16} className="mx-1.5 text-muted-foreground/70" />}
            {segment.href ? (
              <Link href={segment.href} className="hover:text-primary transition-colors">
                {segment.title}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{segment.title}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
