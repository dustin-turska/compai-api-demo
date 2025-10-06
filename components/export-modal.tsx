'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download } from 'lucide-react';
import { UserSelector } from '@/components/user-selector';
import { CompAIClient } from '@/lib/api';

export interface ExportUserData {
  id: string;
  name: string;
  email: string;
}

export interface ExportApprovalData {
  user: ExportUserData;
  title: string;
}

interface ExportModalProps {
  onExport: (companyName: string, preparedBy?: ExportUserData, approvedBy?: ExportApprovalData) => void;
  trigger: React.ReactNode;
  disabled?: boolean;
  compAIClient?: CompAIClient;
}

export function ExportModal({ onExport, trigger, disabled = false, compAIClient }: ExportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [preparedBy, setPreparedBy] = useState<ExportUserData | undefined>();
  const [approvedBy, setApprovedBy] = useState<ExportUserData | undefined>();
  const [approvedByTitle, setApprovedByTitle] = useState<string>('');

  const handleExport = async () => {
    if (!companyName.trim()) {
      return; // Don't export if company name is empty
    }

    setIsExporting(true);
    try {
      const approvalData = approvedBy && approvedByTitle.trim() 
        ? { user: approvedBy, title: approvedByTitle.trim() }
        : undefined;
      
      await onExport(companyName.trim(), preparedBy, approvalData);
      setIsOpen(false);
      setCompanyName(''); // Reset for next time
      setPreparedBy(undefined);
      setApprovedBy(undefined);
      setApprovedByTitle('');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCompanyName(''); // Reset when closing
      setPreparedBy(undefined);
      setApprovedBy(undefined);
      setApprovedByTitle('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            Export Statement of Applicability
          </DialogTitle>
          <DialogDescription>
            Configure the document details for your exported Excel file.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && companyName.trim()) {
                  handleExport();
                }
              }}
              autoFocus
            />
            {!companyName.trim() && (
              <p className="text-xs text-gray-500 mt-1">
                This will replace "[Company]" in the Excel file header
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prepared By
            </label>
            <UserSelector
              value={preparedBy?.id}
              onValueChange={(userId) => {}} // This will be set by onUserChange
              onUserChange={(user) => setPreparedBy(user || undefined)}
              placeholder="Select who prepared this document"
              className="w-full"
              compAIClient={compAIClient}
            />
            <p className="text-xs text-gray-500 mt-1">
              This person will be listed as the document preparer
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approved By
            </label>
            <div className="space-y-2">
              <UserSelector
                value={approvedBy?.id}
                onValueChange={(userId) => {}} // This will be set by onUserChange
                onUserChange={(user) => setApprovedBy(user || undefined)}
                placeholder="Select who approved this document"
                className="w-full"
                compAIClient={compAIClient}
              />
              {approvedBy && (
                <input
                  type="text"
                  value={approvedByTitle}
                  onChange={(e) => setApprovedByTitle(e.target.value)}
                  placeholder="Enter their title (e.g., Chief Information Officer)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {approvedBy 
                ? "Add the approver's title to be displayed in the document" 
                : "This person will be listed as the document approver"}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={!companyName.trim() || isExporting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isExporting ? (
                <>
                  <Download className="h-4 w-4 mr-2 animate-pulse" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel File
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
