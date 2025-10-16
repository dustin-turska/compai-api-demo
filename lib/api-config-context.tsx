'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CompAIClient } from './api';

interface ApiConfig {
  apiKey: string;
  orgId: string;
  useCustom: boolean;
}

interface ApiConfigContextType {
  customApiKey: string;
  customOrgId: string;
  useCustomConfig: boolean;
  customCompAIClient: CompAIClient | null;
  testingConnection: boolean;
  connectionTestResult: { success: boolean; message: string } | null;
  
  setCustomApiKey: (key: string) => void;
  setCustomOrgId: (id: string) => void;
  setUseCustomConfig: (use: boolean) => void;
  saveCustomConfig: () => void;
  clearCustomConfig: () => void;
  testConnection: () => Promise<void>;
  getActiveCompAIClient: () => CompAIClient;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

export function ApiConfigProvider({ children }: { children: ReactNode }) {
  const [customApiKey, setCustomApiKey] = useState('');
  const [customOrgId, setCustomOrgId] = useState('');
  const [useCustomConfig, setUseCustomConfig] = useState(false);
  const [customCompAIClient, setCustomCompAIClient] = useState<CompAIClient | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load saved configuration from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('customApiConfig');
    if (savedConfig) {
      try {
        const config: ApiConfig = JSON.parse(savedConfig);
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
  const getActiveCompAIClient = useCallback(() => {
    return useCustomConfig && customCompAIClient ? customCompAIClient : new CompAIClient();
  }, [useCustomConfig, customCompAIClient]);

  // Save custom configuration to localStorage
  const saveCustomConfig = useCallback(() => {
    const config: ApiConfig = {
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
    
    setConnectionTestResult(null);
  }, [customApiKey, customOrgId, useCustomConfig]);

  // Clear custom configuration
  const clearCustomConfig = useCallback(() => {
    setCustomApiKey('');
    setCustomOrgId('');
    setUseCustomConfig(false);
    setCustomCompAIClient(null);
    setConnectionTestResult(null);
    localStorage.removeItem('customApiConfig');
  }, []);

  // Test API connection
  const testConnection = useCallback(async () => {
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
  }, [customApiKey, customOrgId]);

  const value: ApiConfigContextType = {
    customApiKey,
    customOrgId,
    useCustomConfig,
    customCompAIClient,
    testingConnection,
    connectionTestResult,
    setCustomApiKey,
    setCustomOrgId,
    setUseCustomConfig,
    saveCustomConfig,
    clearCustomConfig,
    testConnection,
    getActiveCompAIClient,
  };

  return (
    <ApiConfigContext.Provider value={value}>
      {children}
    </ApiConfigContext.Provider>
  );
}

export function useApiConfig() {
  const context = useContext(ApiConfigContext);
  if (context === undefined) {
    throw new Error('useApiConfig must be used within an ApiConfigProvider');
  }
  return context;
}

