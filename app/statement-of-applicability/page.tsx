'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContextEntry } from '@/lib/types';
import { OpenAIAssessmentResponse } from '@/lib/api';
import { CompAIClient, openAIClient } from '@/lib/api';
import { EditableISO27001Control, loadISO27001Controls } from '@/lib/csv-parser';
import { exportToExcel, getExportStats } from '@/lib/excel-export';
import { ExportModal, ExportUserData, ExportApprovalData } from '@/components/export-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, FileText, Tag, Calendar, CheckSquare, Shield, Database, Check, X, Edit3, Save, XCircle, Download, Bot, Zap, Clock, CheckCircle, Settings, Key } from 'lucide-react';

export default function StatementOfApplicabilityPage() {
  const [contextEntries, setContextEntries] = useState<ContextEntry[]>([]);
  const [iso27001Controls, setIso27001Controls] = useState<EditableISO27001Control[]>([]);
  const [activeTab, setActiveTab] = useState<'context' | 'iso27001'>('context');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [controlsLoading, setControlsLoading] = useState(false);
  const [controlsError, setControlsError] = useState<string | null>(null);
  const [aiAssessmentLoading, setAiAssessmentLoading] = useState(false);
  const [aiAssessmentError, setAiAssessmentError] = useState<string | null>(null);
  const [lastAssessmentResult, setLastAssessmentResult] = useState<OpenAIAssessmentResponse | null>(null);
  
  // Custom API configuration state
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [customOrgId, setCustomOrgId] = useState('');
  const [useCustomConfig, setUseCustomConfig] = useState(false);
  const [customCompAIClient, setCustomCompAIClient] = useState<CompAIClient | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load saved custom configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('customApiConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setCustomApiKey(config.apiKey || '');
        setCustomOrgId(config.orgId || '');
        setUseCustomConfig(config.useCustom || false);
        
        if (config.useCustom && config.apiKey && config.orgId) {
          const client = new CompAIClient(undefined, config.apiKey, config.orgId);
          setCustomCompAIClient(client);
        }
      } catch (error) {
        console.error('Failed to load saved API config:', error);
      }
    }
  }, []);

  // Get the active CompAI client (custom or default)
  const getActiveCompAIClient = () => {
    return useCustomConfig && customCompAIClient ? customCompAIClient : new CompAIClient();
  };

  // Save custom configuration to localStorage
  const saveCustomConfig = () => {
    const config = {
      apiKey: customApiKey,
      orgId: customOrgId,
      useCustom: useCustomConfig
    };
    localStorage.setItem('customApiConfig', JSON.stringify(config));
    
    if (useCustomConfig && customApiKey && customOrgId) {
      const client = new CompAIClient(undefined, customApiKey, customOrgId);
      setCustomCompAIClient(client);
    } else {
      setCustomCompAIClient(null);
    }
    
    setShowApiConfig(false);
    setConnectionTestResult(null);
    
    // Refresh context entries with new configuration
    if (useCustomConfig) {
      fetchContextEntries();
    }
  };

  // Clear custom configuration
  const clearCustomConfig = () => {
    setCustomApiKey('');
    setCustomOrgId('');
    setUseCustomConfig(false);
    setCustomCompAIClient(null);
    setConnectionTestResult(null);
    localStorage.removeItem('customApiConfig');
    setShowApiConfig(false);
    
    // Refresh context entries with default configuration
    fetchContextEntries();
  };

  // Test API connection
  const testConnection = async () => {
    if (!customApiKey.trim() || !customOrgId.trim()) {
      setConnectionTestResult({
        success: false,
        message: 'Please enter both Organization ID and API Key'
      });
      return;
    }

    setTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const testClient = new CompAIClient(undefined, customApiKey, customOrgId);
      const response = await testClient.getContextEntries();

      if (response.error) {
        setConnectionTestResult({
          success: false,
          message: `Connection failed: ${response.error}`
        });
      } else {
        setConnectionTestResult({
          success: true,
          message: `Connection successful! Found ${response.data?.count || 0} context entries.`
        });
      }
    } catch (error) {
      setConnectionTestResult({
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Validate API configuration inputs
  const validateApiConfig = () => {
    if (!useCustomConfig) return true;
    
    const apiKeyValid = customApiKey.trim().length > 0;
    const orgIdValid = customOrgId.trim().length > 0;
    
    return apiKeyValid && orgIdValid;
  };

  const fetchContextEntries = async () => {
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
        setCount(response.data.count);
        console.log('✅ Context entries loaded:', response.data.count);
      }
    } catch (err) {
      console.error('❌ Failed to fetch context entries:', err);
      setError(err instanceof Error ? err.message : 'Failed to load context entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContextEntries();
  }, [useCustomConfig, customCompAIClient]);

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
        // Load from CSV and add some example &quot;Not Applicable&quot; entries
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

  const cancelEditing = (controlNumber: string) => {
    setIso27001Controls(controls => 
      controls.map(control => 
        control.controlNumber === controlNumber 
          ? { ...control, isEditing: false }
          : control
      )
    );
  };

  const saveControl = (controlNumber: string, updates: Partial<EditableISO27001Control>) => {
    setIso27001Controls(controls => 
      controls.map(control => 
        control.controlNumber === controlNumber 
          ? { ...control, ...updates, isEditing: false }
          : control
      )
    );
    
    // Save to localStorage for persistence
    const updatedControls = iso27001Controls.map(control => 
      control.controlNumber === controlNumber 
        ? { ...control, ...updates, isEditing: false }
        : control
    );
    localStorage.setItem('iso27001Controls', JSON.stringify(updatedControls));
    
    console.log('✅ Control updated:', controlNumber, updates);
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

    try {
      setAiAssessmentLoading(true);
      setAiAssessmentError(null);

      console.log('🤖 Starting OpenAI assessment...');
      console.log('Context entries:', contextEntries.length);
      console.log('Controls to assess:', iso27001Controls.length);

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
      const message = `OpenAI assessment completed successfully!\n\nResults:\n• Total Controls Assessed: ${result.totalProcessed}\n• Applicable: ${applicableCount}\n• Not Applicable: ${notApplicableCount}\n• Processing Time: ${(result.processingTime / 1000).toFixed(1)}s`;
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

  const EditableControl = ({ control }: { control: EditableISO27001Control }) => {
    const [editApplicable, setEditApplicable] = useState(control.isApplicable);
    const [editReason, setEditReason] = useState(control.notApplicableReason);
    const [editRequired, setEditRequired] = useState(control.isRequired);

    const handleSave = () => {
      // Validate that Not Applicable controls have a reason
      if (editApplicable === 'Not Applicable' && !editReason.trim()) {
        alert('Please provide a reason why this control is not applicable.');
        return;
      }

      // Auto-fill current date when values change
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      saveControl(control.controlNumber, {
        isApplicable: editApplicable,
        notApplicableReason: editReason,
        isRequired: editRequired,
        dateLastAssessed: currentDate,
      });
    };

    const handleCancel = () => {
      setEditApplicable(control.isApplicable);
      setEditReason(control.notApplicableReason);
      setEditRequired(control.isRequired);
      cancelEditing(control.controlNumber);
    };

    if (control.isEditing) {
      return (
        <Card className="border-accent-200 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg text-gray-900">
                {control.controlNumber} - {control.title}
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleSave} 
                  size="sm" 
                  className="bg-accent-600 hover:bg-accent-700"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button 
                  onClick={handleCancel} 
                  variant="outline" 
                  size="sm"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancel
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

              {/* Required Checkbox */}
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editRequired}
                    onChange={(e) => {
                      const isRequired = e.target.checked;
                      setEditRequired(isRequired);
                      // If not required, automatically set to Not Applicable
                      if (!isRequired) {
                        setEditApplicable('Not Applicable');
                      } else {
                        // If required, set to Applicable (user can still change it)
                        setEditApplicable('Applicable');
                      }
                    }}
                    className="w-4 h-4 text-accent-600 border-gray-300 rounded focus:ring-accent-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Is this control required?
                  </span>
                </label>
                {!editRequired && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Controls marked as not required will be set to &quot;Not Applicable&quot;
                  </p>
                )}
              </div>

              {/* Applicability Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Applicability Status
                  {!editRequired && (
                    <span className="text-xs text-gray-500 ml-2">(automatically set when not required)</span>
                  )}
                </label>
                <Select 
                  value={editApplicable} 
                  onValueChange={(value: 'Applicable' | 'Not Applicable') => setEditApplicable(value)}
                  disabled={!editRequired}
                >
                  <SelectTrigger className={`w-full ${!editRequired ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Applicable">Applicable</SelectItem>
                    <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reason for Not Applicable */}
              {editApplicable === 'Not Applicable' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Reason for Not Applicable <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 font-normal ml-2">(required)</span>
                  </label>
                  <textarea
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    placeholder="Explain why this control is not applicable..."
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                      !editReason.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    rows={3}
                    required
                  />
                  {!editReason.trim() && (
                    <p className="text-xs text-red-600">
                      Please provide a justification for why this control is not applicable.
                    </p>
                  )}
                </div>
              )}

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
            </div>
          </CardContent>
        </Card>
      );
    }

    // Regular display mode
    return (
      <Card className="hover:shadow-md transition-shadow">
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

            {/* Assessment date */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <span className="font-medium">Last assessed:</span> {control.dateLastAssessed || 'Not assessed'}
                {control.dateLastAssessed && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                    ✓ Current
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-gray-900">🤖 AI CS Tools</h1>
                </div>
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link 
                    href="/" 
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-100"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Tasks
                  </Link>
                  <Link 
                    href="/statement-of-applicability" 
                    className="bg-accent-100 text-accent-800 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Statement of Applicability
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <FileText className="h-8 w-8 text-accent-600" />
              <h1 className="text-3xl font-bold text-gray-900">Statement of Applicability</h1>
            </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-xl font-bold text-gray-900">🤖 AI CS Tools</h1>
                </div>
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link 
                    href="/" 
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-100"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Tasks
                  </Link>
                  <Link 
                    href="/statement-of-applicability" 
                    className="bg-accent-100 text-accent-800 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Statement of Applicability
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <FileText className="h-8 w-8 text-accent-600" />
              <h1 className="text-3xl font-bold text-gray-900">Statement of Applicability</h1>
            </div>
          
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">🤖 AI CS Tools</h1>
              </div>
              <div className="ml-10 flex items-baseline space-x-4">
                <Link 
                  href="/" 
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-100"
                >
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                </Link>
                <Link 
                  href="/statement-of-applicability" 
                  className="bg-accent-100 text-accent-800 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Statement of Applicability
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="h-8 w-8 text-accent-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Statement of Applicability</h1>
                <p className="text-gray-600 mt-2">
                  Organization compliance and security documentation
                </p>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 justify-between">
                <div className="flex space-x-8">
                  <button
                    onClick={() => handleTabChange('context')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === 'context'
                        ? 'border-accent-500 text-accent-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Database className="h-4 w-4" />
                    Context Entries ({count})
                  </button>
                  <button
                    onClick={() => handleTabChange('iso27001')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === 'iso27001'
                        ? 'border-accent-500 text-accent-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    ISO 27001 Controls ({iso27001Controls.length})
                  </button>
                </div>
                
                {/* API Configuration Button */}
                <div className="flex items-center">
                  <Button 
                    onClick={() => setShowApiConfig(!showApiConfig)}
                    variant="outline" 
                    size="sm"
                    className={`flex items-center gap-2 ${
                      useCustomConfig ? 'border-accent-300 text-accent-700 hover:bg-accent-50' : ''
                    }`}
                  >
                    <Settings className="h-3 w-3" />
                    API Config
                    {useCustomConfig && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs ml-1">
                        Custom
                      </Badge>
                    )}
                  </Button>
                </div>
              </nav>
            </div>

            {/* API Configuration Panel */}
            {showApiConfig && (
              <Card className="mb-6 border-accent-200 bg-accent-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent-900">
                    <Key className="h-5 w-5" />
                    Comp AI API Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure custom Organization ID and API Key instead of using environment variables.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Toggle for custom configuration */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="useCustomConfig"
                        checked={useCustomConfig}
                        onChange={(e) => {
                          setUseCustomConfig(e.target.checked);
                          setConnectionTestResult(null);
                        }}
                        className="w-4 h-4 text-accent-600 border-gray-300 rounded focus:ring-accent-500"
                      />
                      <label htmlFor="useCustomConfig" className="text-sm font-medium text-gray-700">
                        Use custom API configuration
                      </label>
                    </div>

                    {useCustomConfig && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Organization ID Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Organization ID <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={customOrgId}
                            onChange={(e) => {
                              setCustomOrgId(e.target.value);
                              setConnectionTestResult(null);
                            }}
                            placeholder="Enter your organization ID"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          />
                        </div>

                        {/* API Key Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comp AI API Key <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={customApiKey}
                            onChange={(e) => {
                              setCustomApiKey(e.target.value);
                              setConnectionTestResult(null);
                            }}
                            placeholder="Enter your Comp AI API key"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Test Connection Button */}
                    {useCustomConfig && customApiKey.trim() && customOrgId.trim() && (
                      <div className="space-y-3">
                        <Button 
                          onClick={testConnection}
                          disabled={testingConnection}
                          variant="outline" 
                          size="sm"
                          className="w-full"
                        >
                          {testingConnection ? (
                            <>
                              <Clock className="h-3 w-3 mr-2 animate-spin" />
                              Testing Connection...
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3 mr-2" />
                              Test Connection
                            </>
                          )}
                        </Button>

                        {/* Connection Test Result */}
                        {connectionTestResult && (
                          <Alert variant={connectionTestResult.success ? "default" : "destructive"}>
                            {connectionTestResult.success ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            <AlertDescription>
                              {connectionTestResult.message}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t border-accent-200">
                      <Button 
                        onClick={() => setShowApiConfig(false)}
                        variant="outline" 
                        size="sm"
                      >
                        Cancel
                      </Button>
                      {useCustomConfig && (
                        <Button 
                          onClick={clearCustomConfig}
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Clear Custom Config
                        </Button>
                      )}
                      <Button 
                        onClick={saveCustomConfig}
                        size="sm"
                        className="bg-accent-600 hover:bg-accent-700"
                        disabled={!validateApiConfig()}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save Configuration
                      </Button>
                    </div>

                    {/* Configuration Status */}
                    {useCustomConfig && (
                      <div className="mt-4 p-3 bg-white border border-accent-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800">
                            Using custom configuration
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          Organization ID: {customOrgId ? `${customOrgId.substring(0, 8)}...` : 'Not set'}
                        </div>
                        <div className="text-xs text-gray-600">
                          API Key: {customApiKey ? `${customApiKey.substring(0, 8)}...` : 'Not set'}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        {/* Tab Content */}
        {activeTab === 'context' && (
          <div className="space-y-6">
            {/* OpenAI Integration Info Banner */}
            {contextEntries.length > 0 && (
              <Card className="bg-white border-accent-200">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <Bot className="h-5 w-5 text-accent-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-accent-900">
                        AI-Powered Assessment Available
                      </p>
                      <p className="text-xs text-accent-800">
                        These context entries will be used by OpenAI to automatically assess ISO 27001 control applicability. 
                        Switch to the ISO 27001 Controls tab to run the assessment.
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-accent-800">
                      {contextEntries.length} entries ready
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {contextEntries.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No context entries found</p>
                    <p className="text-sm">Your organization hasn&apos;t added any context entries yet.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              contextEntries.map((entry) => (
                <Card key={entry.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900">
                      {entry.question}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created: {formatDate(entry.createdAt)}
                      </span>
                      {entry.updatedAt !== entry.createdAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Updated: {formatDate(entry.updatedAt)}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Answer */}
                      <div>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {entry.answer}
                        </p>
                      </div>

                      {/* Tags */}
                      {entry.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag className="h-4 w-4 text-gray-500" />
                          {entry.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Entry ID for reference */}
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                          Entry ID: {entry.id}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ISO 27001 Controls Tab */}
        {activeTab === 'iso27001' && (
          <div className="space-y-6">
            {/* OpenAI Assessment Section */}
            {contextEntries.length > 0 && iso27001Controls.length > 0 && (
              <Card className="bg-white border-accent-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-accent-900">
                    <Bot className="h-5 w-5" />
                    Statement of Applicability AI Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Assessment Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Database className="h-4 w-4" />
                          {contextEntries.length} context entries available
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          {iso27001Controls.length} controls to assess
                        </span>
                      </div>
                      
                      <Button 
                        onClick={runOpenAIAssessment}
                        disabled={aiAssessmentLoading || contextEntries.length === 0 || iso27001Controls.length === 0}
                        className="bg-accent-600 hover:bg-accent-700"
                      >
                        {aiAssessmentLoading ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Assessing...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Run AI Assessment
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Assessment Error */}
                    {aiAssessmentError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {aiAssessmentError}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Last Assessment Results */}
                    {lastAssessmentResult && (
                      <div className="space-y-4">
                        {/* Assessment Summary */}
                        <div className="bg-white border border-accent-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">Last Assessment Completed</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="font-medium text-gray-900">{lastAssessmentResult.totalProcessed}</div>
                              <div className="text-gray-600">Controls Processed</div>
                            </div>
                            <div>
                              <div className="font-medium text-green-700">
                                {lastAssessmentResult.results.filter(r => r.isRequired).length}
                              </div>
                              <div className="text-gray-600">Applicable</div>
                            </div>
                            <div>
                              <div className="font-medium text-red-700">
                                {lastAssessmentResult.results.filter(r => !r.isRequired).length}
                              </div>
                              <div className="text-gray-600">Not Applicable</div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Processing time: {(lastAssessmentResult.processingTime / 1000).toFixed(1)}s
                          </div>
                        </div>

                        {/* Assessment Results Table */}
                        <div className="bg-white border border-accent-200 rounded-lg overflow-hidden">
                          <div className="flex items-center gap-2 p-4 border-b border-accent-200">
                            <Shield className="h-4 w-4 text-accent-600" />
                            <span className="font-medium text-accent-800">Detailed Assessment Results</span>
                            <Badge variant="secondary" className="bg-purple-100 text-accent-800 text-xs">
                              {lastAssessmentResult.results.length} Controls
                            </Badge>
                          </div>
                          
                          <div className="overflow-x-auto assessment-table-mobile">
                            <table className="w-full assessment-table">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Control
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Title
                                  </th>
                                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    AI Assessment Reasoning
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {lastAssessmentResult.results.map((result, index) => {
                                  const control = iso27001Controls.find(c => c.controlNumber === result.controlNumber);
                                  return (
                                    <tr key={result.controlNumber} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {result.controlNumber}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        <div className="max-w-xs control-title">
                                          <div className="font-medium text-gray-900 mb-1">
                                            {control?.title || 'Unknown Control'}
                                          </div>
                                          <div className="text-xs text-gray-500 line-clamp-2">
                                            {control?.objective && control.objective.length > 100 
                                              ? `${control.objective.substring(0, 100)}...` 
                                              : control?.objective || 'No objective available'
                                            }
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <Badge 
                                          variant={result.isRequired ? 'default' : 'secondary'}
                                          className={`inline-flex items-center gap-1 ${
                                            result.isRequired 
                                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                              : 'bg-red-100 text-red-800'
                                          }`}
                                        >
                                          {result.isRequired ? (
                                            <Check className="h-3 w-3" />
                                          ) : (
                                            <X className="h-3 w-3" />
                                          )}
                                          {result.isRequired ? 'Applicable' : 'Not Applicable'}
                                        </Badge>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-gray-600">
                                        <div className="max-w-md reasoning-col">
                                          {result.reason ? (
                                            <div className="bg-gray-50 rounded-md p-2 border-l-2 border-gray-300">
                                              <p className="text-xs leading-relaxed">
                                                {result.reason}
                                              </p>
                                            </div>
                                          ) : (
                                            <span className="text-gray-400 italic text-xs">
                                              No reasoning provided
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Table footer with summary */}
                          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">
                                Showing {lastAssessmentResult.results.length} assessment results
                              </span>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-xs text-gray-600">
                                    {lastAssessmentResult.results.filter(r => r.isRequired).length} Applicable
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="text-xs text-gray-600">
                                    {lastAssessmentResult.results.filter(r => !r.isRequired).length} Not Applicable
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Systems Description */}
                        {lastAssessmentResult.organizationalProfile && (
                          <div className="bg-white border border-accent-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Database className="h-4 w-4 text-accent-600" />
                              <span className="font-medium text-accent-800">Systems Description</span>
                              <Badge variant="secondary" className="bg-accent-100 text-accent-800 text-xs">
                                AI Analysis
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <div className="font-medium text-gray-700 mb-1">Business Model</div>
                                <div className="text-gray-600">{lastAssessmentResult.organizationalProfile.businessModel}</div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-700 mb-1">Technology Stack</div>
                                <div className="text-gray-600">{lastAssessmentResult.organizationalProfile.technologyStack}</div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-700 mb-1">Organizational Size</div>
                                <div className="text-gray-600">{lastAssessmentResult.organizationalProfile.organizationalSize}</div>
                              </div>
                              <div>
                                <div className="font-medium text-gray-700 mb-1">Industry Context</div>
                                <div className="text-gray-600">{lastAssessmentResult.organizationalProfile.industryContext}</div>
                              </div>
                              <div className="md:col-span-2">
                                <div className="font-medium text-gray-700 mb-1">Security Practices</div>
                                <div className="text-gray-600">{lastAssessmentResult.organizationalProfile.securityPractices}</div>
                              </div>
                              <div className="md:col-span-2">
                                <div className="font-medium text-gray-700 mb-2">Key Characteristics</div>
                                <div className="flex flex-wrap gap-1">
                                  {lastAssessmentResult.organizationalProfile.keyCharacteristics.map((char: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                                      {char}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <ExportModal
                onExport={handleExportToExcel}
                disabled={iso27001Controls.length === 0}
                compAIClient={getActiveCompAIClient()}
                trigger={
                  <Button 
                    variant="default" 
                    size="sm"
                    className="bg-accent-600 hover:bg-accent-700"
                    disabled={iso27001Controls.length === 0}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Export to Excel
                  </Button>
                }
              />
              <Button 
                onClick={reloadControls}
                variant="outline" 
                size="sm"
                className="text-accent-600 hover:text-accent-800"
              >
                <Shield className="h-3 w-3 mr-1" />
                Reload from CSV
              </Button>
            </div>

            {/* Summary Stats */}
            {iso27001Controls.length > 0 && (
              <div className="bg-accent-50 border border-accent-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-accent-900">{iso27001Controls.length}</div>
                      <div className="text-xs text-accent-600">Total Controls</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {iso27001Controls.filter(c => c.isApplicable === 'Applicable').length}
                      </div>
                      <div className="text-xs text-green-600">Applicable</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-700">
                        {iso27001Controls.filter(c => c.isApplicable === 'Not Applicable').length}
                      </div>
                      <div className="text-xs text-red-600">Not Applicable</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-accent-900">
                      {Math.round((iso27001Controls.filter(c => c.isApplicable === 'Applicable').length / iso27001Controls.length) * 100)}%
                    </div>
                    <div className="text-xs text-accent-600">Applicability Rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* {controlsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : controlsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {controlsError}
                </AlertDescription>
              </Alert>
            ) : iso27001Controls.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No ISO 27001 controls found</p>
                    <p className="text-sm">Unable to load the ISO 27001 Statement of Applicability.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              iso27001Controls.map((control) => (
                <EditableControl key={control.controlNumber} control={control} />
              ))
            )} */}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
