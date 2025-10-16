"use client";

import { useCallback, useEffect, useState } from "react";
import { openAIClient } from "@/lib/api";
import { useApiConfig } from "@/lib/api-config-context";
import { ContextEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DemoBanner } from "@/components/demo-banner";
import {
  AlertCircle,
  Bot,
  Database,
  FileText,
} from "lucide-react";

export default function SystemsDescriptionPage() {
  const [contextEntries, setContextEntries] = useState<ContextEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"context" | "description">("context");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");

  // Use global API configuration
  const { getActiveCompAIClient, useCustomConfig } = useApiConfig();

  const fetchContextEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const client = getActiveCompAIClient();
      const response = await client.getContextEntries();
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data) {
        setContextEntries(response.data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load context entries");
    } finally {
      setLoading(false);
    }
  }, [getActiveCompAIClient]);

  useEffect(() => {
    fetchContextEntries();
  }, [fetchContextEntries, useCustomConfig]);

  const handleGenerate = async () => {
    if (contextEntries.length === 0) {
      setGenerationError("No context entries available. Please ensure context entries are loaded first.");
      return;
    }
    try {
      setIsGenerating(true);
      setGenerationError(null);
      const result = await openAIClient.generateSystemsDescription(contextEntries);
      setDescription(result);
      setActiveTab("description");
    } catch (e) {
      setGenerationError(e instanceof Error ? e.message : "Failed to generate systems description");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading organization context...</p>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Systems Description</h1>
              <p className="mt-2 text-gray-600">Generate a concise description of your platform based on organization context.</p>
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || contextEntries.length === 0} className="bg-accent-600 hover:bg-accent-700 flex items-center gap-2">
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Generate Description
                </>
              )}
            </Button>
          </div>

          {!useCustomConfig && <DemoBanner />}

          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("context")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "context"
                    ? "border-accent-500 text-accent-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Context Entries ({contextEntries.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("description")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "description"
                    ? "border-accent-500 text-accent-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Systems Description
                </div>
              </button>
            </nav>
          </div>

          {activeTab === "context" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Context Entries</h2>
                  <p className="text-gray-600 mt-1">These entries provide context about your organization for the generated description</p>
                </div>
                <div className="text-sm text-gray-500">Total: {contextEntries.length} entries</div>
              </div>
              {contextEntries.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No context entries</h3>
                  <p className="mt-1 text-sm text-gray-500">No context entries found for your organization.</p>
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

          {activeTab === "description" && (
            <div className="space-y-6">
              {generationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Generation Error</AlertTitle>
                  <AlertDescription>{generationError}</AlertDescription>
                </Alert>
              )}
              {description ? (
                <div className="bg-white p-6 rounded-lg border">
                  <div className="prose prose-gray max-w-none whitespace-pre-wrap">{description}</div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bot className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No description generated yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Click &quot;Generate Description&quot; to create a systems description based on your organization context.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


