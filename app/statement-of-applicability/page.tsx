'use client';

import { useState, useEffect, useCallback } from 'react';
import { ContextEntry } from '@/lib/types';
import { openAIClient, OpenAIAssessmentResponse } from '@/lib/api';
import { useApiConfig } from '@/lib/api-config-context';
import { EditableISO27001Control, loadISO27001Controls } from '@/lib/csv-parser';
import { exportToExcel, getExportStats } from '@/lib/excel-export';
import { ExportModal, ExportUserData, ExportApprovalData } from '@/components/export-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Shield, Database, Check, X, Edit3, Download, Bot, CheckCircle, User } from 'lucide-react';
import { DemoBanner } from '@/components/demo-banner';
import { UserSelector } from '@/components/user-selector';

export default function StatementOfApplicabilityPage() {
  const [contextEntries, setContextEntries] = useState<ContextEntry[]>([]);
  const [iso27001Controls, setIso27001Controls] = useState<EditableISO27001Control[]>([]);
  const [activeTab, setActiveTab] = useState<'context' | 'iso27001'>('context');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [, setControlsLoading] = useState(false);
  const [, setControlsError] = useState<string | null>(null);
  const [aiAssessmentLoading, setAiAssessmentLoading] = useState(false);
  const [aiAssessmentError, setAiAssessmentError] = useState<string | null>(null);
  const [lastAssessmentResult, setLastAssessmentResult] = useState<OpenAIAssessmentResponse | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string; } | null>(null);
  
  // Use global API configuration
  const { getActiveCompAIClient, useCustomConfig } = useApiConfig();

  const fetchContextEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching context entries...');
      const client = getActiveCompAIClient();
      const response = await client.getContextEntries();
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        setContextEntries(response.data.data);
        console.log('✅ Context entries loaded:', response.data.count);
      }
    } catch (err) {
      console.error('❌ Failed to fetch context entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load context entries');
    } finally {
      setLoading(false);
    }
  }, [getActiveCompAIClient]);

  useEffect(() => {
    fetchContextEntries();
  }, [fetchContextEntries, useCustomConfig]);

  const loadControls = async (forceReload = false) => {
    if (iso27001Controls.length > 0 && !forceReload) return; // Already loaded
    
    try {
      setControlsLoading(true);
      setControlsError(null);
      
      console.log('🔄 Loading ISO 27001 controls...');
      
      // Helper function to ensure controls have the drivers property
      const ensureDriversProperty = (controls: EditableISO27001Control[]): EditableISO27001Control[] => {
        return controls.map(control => {
          if (!control.drivers) {
            // Add drivers property for legacy controls
            control.drivers = {
              business: true,  // Default to Yes for business driver
              risk: true,      // Default to Yes for risk driver  
              legal: control.controlNumber.startsWith('5.31') || control.controlNumber.startsWith('5.32') || control.controlNumber.startsWith('5.34'), // Legal controls
              contract: false  // Default to No for contract driver
            };
          }
          return control;
        });
      };

      // Check for saved controls in localStorage first (unless forcing reload)
      const savedControls = localStorage.getItem('iso27001Controls');
      if (savedControls && !forceReload) {
        console.log('📦 Loading saved controls from localStorage');
        const parsedControls = JSON.parse(savedControls);
        // Ensure saved controls have drivers property
        const migratedControls = ensureDriversProperty(parsedControls);
        setIso27001Controls(migratedControls);
        // Re-save the migrated controls to localStorage
        localStorage.setItem('iso27001Controls', JSON.stringify(migratedControls));
      } else {
        // Load from CSV and add some example "Not Applicable" entries
        const controls = await loadISO27001Controls();
        
        // Add some example non-applicable controls for demonstration
        const enhancedControls = controls.map((control, index) => {
          if (index === 5) { // Make 5.6 not applicable as example
            return {
              ...control,
              isApplicable: 'Not Applicable' as const,
              notApplicableReason: 'Our organization does not engage with special interest groups due to our small size and limited scope.'
            };
          }
          if (index === 12) { // Make 5.13 not applicable as example
            return {
              ...control,
              isApplicable: 'Not Applicable' as const,
              notApplicableReason: 'Information labelling is not required as all information is handled at the same classification level.'
            };
          }
          return control;
        });
        
        // Ensure loaded controls have drivers property
        const migratedEnhancedControls = ensureDriversProperty(enhancedControls);
        setIso27001Controls(migratedEnhancedControls);
      }
      
      console.log('✅ ISO 27001 controls loaded:', iso27001Controls.length);
    } catch (err) {
      console.error('❌ Failed to load ISO 27001 controls:', err);
      setControlsError(err instanceof Error ? err.message : 'Failed to load ISO 27001 controls');
    } finally {
      setControlsLoading(false);
    }
  };

  const handleTabChange = (tab: 'context' | 'iso27001') => {
    setActiveTab(tab);
    if (tab === 'iso27001') {
      loadControls();
    }
  };

  const startEditing = (controlNumber: string) => {
    setIso27001Controls(controls => 
      controls.map(control => 
        control.controlNumber === controlNumber 
          ? { ...control, isEditing: true }
          : control
      )
    );
  };

  

  const reloadControls = async () => {
    localStorage.removeItem('iso27001Controls');
    setIso27001Controls([]);
    await loadControls(true);
  };

  const runOpenAIAssessment = async () => {
    if (contextEntries.length === 0) {
      setAiAssessmentError('No context entries available. Please ensure context entries are loaded first.');
      return;
    }

    if (iso27001Controls.length === 0) {
      setAiAssessmentError('No ISO 27001 controls loaded. Please load the controls first.');
      return;
    }

    if (!selectedUser) {
      setAiAssessmentError('Please select a user who is performing the assessment.');
      return;
    }

    try {
      setAiAssessmentLoading(true);
      setAiAssessmentError(null);

      console.log('🤖 Starting OpenAI assessment...');
      console.log('Context entries:', contextEntries.length);
      console.log('Controls to assess:', iso27001Controls.length);
      console.log('Assessed by:', selectedUser.name);

      const assessmentRequest = {
        contextEntries,
        controls: iso27001Controls.map(control => ({
          controlNumber: control.controlNumber,
          title: control.title,
          objective: control.objective
        }))
      };

      const result = await openAIClient.assessControls(assessmentRequest);
      setLastAssessmentResult(result);

      console.log('✅ OpenAI assessment completed:', result);

      // Apply the assessment results to the controls
      const updatedControls = iso27001Controls.map(control => {
        const assessment = result.results.find(r => r.controlNumber === control.controlNumber);
        if (assessment) {
          const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });

          return {
            ...control,
            isRequired: assessment.isRequired,
            isApplicable: assessment.isRequired ? 'Applicable' as const : 'Not Applicable' as const,
            notApplicableReason: assessment.isRequired ? '' : (assessment.reason || control.notApplicableReason),
            dateLastAssessed: currentDate,
            assessedBy: selectedUser,
          };
        }
        return control;
      });

      setIso27001Controls(updatedControls);
      
      // Save to localStorage for persistence
      localStorage.setItem('iso27001Controls', JSON.stringify(updatedControls));

      // Show success message
      const applicableCount = result.results.filter(r => r.isRequired).length;
      const notApplicableCount = result.results.filter(r => !r.isRequired).length;
      const message = `OpenAI assessment completed successfully!\n\nResults:\n• Total Controls Assessed: ${result.totalProcessed}\n• Applicable: ${applicableCount}\n• Not Applicable: ${notApplicableCount}\n• Assessed by: ${selectedUser.name}\n• Processing Time: ${(result.processingTime / 1000).toFixed(1)}s`;
      alert(message);

    } catch (error) {
      console.error('❌ OpenAI assessment failed:', error);
      setAiAssessmentError(error instanceof Error ? error.message : 'Assessment failed');
    } finally {
      setAiAssessmentLoading(false);
    }
  };

  const handleExportToExcel = (companyName: string, preparedBy?: ExportUserData, approvedBy?: ExportApprovalData) => {
    if (iso27001Controls.length === 0) {
      alert('No controls to export. Please load the controls first.');
      return;
    }

    const stats = getExportStats(iso27001Controls);
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_Statement_of_Applicability_ISO_27001_${timestamp}.xlsx`;
    
    exportToExcel(iso27001Controls, companyName, filename, preparedBy, approvedBy);
    
    // Show success message with stats
    const message = `Excel file exported successfully!\n\nCompany: ${companyName}\nSummary:\n• Total Controls: ${stats.total}\n• Applicable: ${stats.applicable} (${stats.applicablePercentage}%)\n• Not Applicable: ${stats.notApplicable} (${stats.notApplicablePercentage}%)`;
    alert(message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        {/* Loading Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading ISO 27001 controls...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        {/* Error Content */}
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Data</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Statement of Applicability</h1>
              <p className="mt-2 text-gray-600">
                Manage your ISO 27001 controls and their applicability to your organization
              </p>
            </div>
            <div className="flex gap-3">
              <ExportModal
                onExport={handleExportToExcel}
                compAIClient={getActiveCompAIClient()}
                trigger={
                  <Button className="bg-accent-600 hover:bg-accent-700">
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                }
              />
            </div>
          </div>
          
          {/* Demo Banner */}
          {!useCustomConfig && (
            <DemoBanner />
          )}

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => handleTabChange('context')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'context'
                    ? 'border-accent-500 text-accent-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Context Entries ({contextEntries.length})
                </div>
              </button>
              <button
                onClick={() => handleTabChange('iso27001')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'iso27001'
                    ? 'border-accent-500 text-accent-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  ISO 27001 Controls ({iso27001Controls.length})
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'context' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Context Entries</h2>
                  <p className="text-gray-600 mt-1">
                    These entries provide context about your organization for AI assessment
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  Total: {contextEntries.length} entries
                </div>
              </div>

              {contextEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No context entries</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No context entries found for your organization.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {contextEntries.map((entry, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border">
                      <h3 className="font-medium text-gray-900">{entry.question}</h3>
                      <p className="text-gray-600 mt-1">{entry.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'iso27001' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">ISO 27001 Controls</h2>
                    <p className="text-gray-600 mt-1">
                      Review and manage the applicability of ISO 27001 Annex A controls
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                      Total: {iso27001Controls.length} controls
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={reloadControls}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Database className="h-4 w-4" />
                        Reload Controls
                      </Button>
                    </div>
                  </div>
                </div>

                {/* AI Assessment Section */}
                <Card className="border-accent-200 bg-accent-50/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 flex-1">
                        <User className="h-4 w-4 text-gray-600" />
                        <label className="text-sm font-medium text-gray-700">
                          Assessment performed by:
                        </label>
                        <UserSelector
                          value={selectedUserId}
                          onValueChange={setSelectedUserId}
                          onUserChange={setSelectedUser}
                          placeholder="Select user..."
                          className="flex-1 max-w-xs"
                          compAIClient={getActiveCompAIClient()}
                        />
                      </div>
                      <Button
                        onClick={runOpenAIAssessment}
                        disabled={aiAssessmentLoading || contextEntries.length === 0 || !selectedUser}
                        size="sm"
                        className="bg-accent-600 hover:bg-accent-700 flex items-center gap-2"
                      >
                        {aiAssessmentLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Assessing...
                          </>
                        ) : (
                          <>
                            <Bot className="h-4 w-4" />
                            Run AI Assessment
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* AI Assessment Error */}
              {aiAssessmentError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Assessment Error</AlertTitle>
                  <AlertDescription>{aiAssessmentError}</AlertDescription>
                </Alert>
              )}

              {/* Last Assessment Result */}
              {lastAssessmentResult && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Assessment Complete</AlertTitle>
                  <AlertDescription className="text-green-800">
                    <div className="mt-2 space-y-1">
                      <p>✅ Processed {lastAssessmentResult.totalProcessed} controls in {(lastAssessmentResult.processingTime / 1000).toFixed(1)}s</p>
                      <p>📊 Results: {lastAssessmentResult.results.filter(r => r.isRequired).length} applicable, {lastAssessmentResult.results.filter(r => !r.isRequired).length} not applicable</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Controls List */}
              {iso27001Controls.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No controls loaded</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Click &quot;Reload Controls&quot; to load the ISO 27001 controls.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {iso27001Controls.map((control) => (
                    <Card key={control.controlNumber} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-lg text-gray-900">
                            {control.controlNumber} - {control.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={control.isApplicable === 'Applicable' ? 'default' : 'secondary'}
                              className={`flex items-center gap-1 ${
                                control.isApplicable === 'Applicable' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {control.isApplicable === 'Applicable' ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                              {control.isApplicable}
                            </Badge>
                            <Button 
                              onClick={() => startEditing(control.controlNumber)} 
                              variant="outline" 
                              size="sm"
                              className="text-accent-600 hover:text-accent-700 hover:bg-accent-50"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-4">
                          {/* Objective */}
                          <div>
                            <p className="text-gray-700 leading-relaxed">
                              {control.objective}
                            </p>
                          </div>

                          {/* Required Status */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600">Required:</span>
                            <Badge 
                              variant={control.isRequired ? 'default' : 'secondary'}
                              className={`text-xs ${
                                control.isRequired 
                                  ? 'bg-accent-100 text-accent-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {control.isRequired ? 'Yes' : 'No'}
                            </Badge>
                          </div>

                          {/* Not applicable reason */}
                          {control.isApplicable === 'Not Applicable' && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <X className="h-5 w-5 text-red-500 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-800 mb-1">
                                    Not Applicable
                                  </p>
                                  <p className="text-sm text-red-700">
                                    {control.notApplicableReason || 'No reason provided'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Assessment date and user */}
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-xs text-gray-500">
                                  <span className="font-medium">Last assessed:</span> {control.dateLastAssessed || 'Not assessed'}
                                  {control.dateLastAssessed && (
                                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                      ✓ Current
                                    </span>
                                  )}
                                </p>
                                {control.assessedBy && (
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span className="font-medium">Assessed by:</span> {control.assessedBy.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}