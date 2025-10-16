'use client';

import { Button } from '@/components/ui/button';
import { useApiConfig } from '@/lib/api-config-context';
import { X, Key, Zap, CheckCircle, XCircle } from 'lucide-react';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ApiConfigModal({ isOpen, onClose }: ApiConfigModalProps) {
  const {
    customApiKey,
    customOrgId,
    useCustomConfig,
    testingConnection,
    connectionTestResult,
    setCustomApiKey,
    setCustomOrgId,
    setUseCustomConfig,
    saveCustomConfig,
    clearCustomConfig,
    testConnection,
  } = useApiConfig();

  if (!isOpen) return null;

  const handleSave = () => {
    saveCustomConfig();
    onClose();
  };

  const handleClear = () => {
    clearCustomConfig();
    onClose();
  };

  const validateApiConfig = () => {
    if (!useCustomConfig) return true;
    
    const apiKeyValid = customApiKey.trim().length > 0;
    const orgIdValid = customOrgId.trim().length > 0;
    
    return apiKeyValid && orgIdValid;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">API Configuration</h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Key className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Custom API Configuration</p>
                <p>Configure your own Comp AI API credentials to access your organization&apos;s data instead of the demo data.</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="Enter your Comp AI API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization ID
              </label>
              <input
                type="text"
                value={customOrgId}
                onChange={(e) => setCustomOrgId(e.target.value)}
                placeholder="Enter your organization ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useCustomConfig"
                checked={useCustomConfig}
                onChange={(e) => setUseCustomConfig(e.target.checked)}
                className="w-4 h-4 text-accent-600 border-gray-300 rounded focus:ring-accent-500"
              />
              <label htmlFor="useCustomConfig" className="text-sm font-medium text-gray-700">
                Use custom API configuration
              </label>
            </div>
          </div>

          {/* Test Connection */}
          {useCustomConfig && customApiKey && customOrgId && (
            <div className="space-y-2">
              <Button
                onClick={testConnection}
                disabled={testingConnection || !validateApiConfig()}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {testingConnection ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-accent-600 mr-2"></div>
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              
              {connectionTestResult && (
                <div className={`p-2 rounded text-sm ${
                  connectionTestResult.success 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {connectionTestResult.success ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {connectionTestResult.message}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {connectionTestResult.message}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button 
              onClick={onClose}
              variant="outline" 
              size="sm"
            >
              Cancel
            </Button>
            {useCustomConfig && (
              <Button 
                onClick={handleClear}
                variant="outline" 
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Clear Custom Config
              </Button>
            )}
            <Button 
              onClick={handleSave}
              size="sm"
              className="bg-accent-600 hover:bg-accent-700"
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

