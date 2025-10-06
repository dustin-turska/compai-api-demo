'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, ExternalLink } from 'lucide-react';

export function DemoBanner() {
  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Info className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900">Demo Mode Active</AlertTitle>
      <AlertDescription className="text-blue-800 mt-2">
        <div className="space-y-3">
          <p>
            You're viewing sample data because no valid API key is configured. 
            To see real data from your Comp AI organization, you'll need to set up your API credentials.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <a 
                href="https://trycomp.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                Get API Key
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <a 
                href="https://trycomp.ai/docs/api-reference/tasks/get-all-tasks" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                API Documentation
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
          <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded font-mono">
            <strong>Setup:</strong> Add your API key to <code>.env.local</code> → <code>COMPAI_API_KEY=your_key_here</code>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
