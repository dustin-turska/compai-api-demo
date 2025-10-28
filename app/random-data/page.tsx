'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Device {
  id: string;
  deviceName: string;
  userName: string;
  userId: string;
  deviceType: string;
  os: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  ipAddress: string;
  macAddress: string;
  status: string;
  lastSeen: string;
  installDate: string;
  securityScore: number;
  compliance: boolean;
  memoryGB: number;
  storageGB: number;
  storageUsedGB: number;
  location: string;
}

interface Statistics {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  compliantDevices: number;
  nonCompliantDevices: number;
  averageSecurityScore: number;
  totalUsers: number;
  activeUsers: number;
}

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  userName: string;
  deviceId: string;
  severity: string;
}

interface AlertsSummary {
  critical: number;
  warning: number;
  info: number;
}

interface ApiData {
  devices: Device[];
  statistics: Statistics;
  recentActivity: Activity[];
  alertsSummary: AlertsSummary;
}

interface ApiResponse {
  success: boolean;
  data: ApiData;
  timestamp: string;
  message: string;
}

export default function RandomDataPage() {
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('1234567890zxcvbmn');

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/random-data', {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }

      const result: ApiResponse = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStoragePercentage = (used: number, total: number) => {
    return Math.round((used / total) * 100);
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSecurityScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 75) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Device Management Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor and manage user devices with real-time data
          </p>
        </div>

        {/* API Configuration */}
        <Card className="p-6 mb-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Endpoint
              </label>
              <code className="block bg-gray-100 p-3 rounded-md text-sm">
                GET /api/random-data
              </code>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                God API Key
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter API key"
                />
                <Button onClick={fetchData} disabled={loading}>
                  {loading ? 'Loading...' : 'Fetch Data'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                God key: 1234567890zxcvbmn
              </p>
            </div>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Data Display */}
        {data && (
          <div className="space-y-6">
            {/* Statistics */}
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-semibold mb-4">Statistics Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Total Devices</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {data.statistics.totalDevices}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Online</p>
                  <p className="text-2xl font-bold text-green-900">
                    {data.statistics.onlineDevices}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Offline</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {data.statistics.offlineDevices}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Avg Security Score</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {data.statistics.averageSecurityScore}%
                  </p>
                </div>
                <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg">
                  <p className="text-sm text-teal-600 font-medium">Compliant</p>
                  <p className="text-2xl font-bold text-teal-900">
                    {data.statistics.compliantDevices}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">Non-Compliant</p>
                  <p className="text-2xl font-bold text-red-900">
                    {data.statistics.nonCompliantDevices}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
                  <p className="text-sm text-indigo-600 font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {data.statistics.totalUsers}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg">
                  <p className="text-sm text-pink-600 font-medium">Active Users</p>
                  <p className="text-2xl font-bold text-pink-900">
                    {data.statistics.activeUsers}
                  </p>
                </div>
              </div>
            </Card>

            {/* Alerts Summary */}
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-semibold mb-4">Alerts Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="text-3xl">🚨</div>
                  <div>
                    <p className="text-sm text-red-600 font-medium">Critical</p>
                    <p className="text-2xl font-bold text-red-900">{data.alertsSummary.critical}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div className="text-3xl">⚠️</div>
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Warning</p>
                    <p className="text-2xl font-bold text-yellow-900">{data.alertsSummary.warning}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="text-3xl">ℹ️</div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Info</p>
                    <p className="text-2xl font-bold text-blue-900">{data.alertsSummary.info}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Devices */}
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-semibold mb-4">Devices</h2>
              <div className="space-y-4">
                {data.devices.map((device) => (
                  <div
                    key={device.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {device.deviceName}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              device.status === 'online'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {device.status}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              device.compliance
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {device.compliance ? 'Compliant' : 'Non-Compliant'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {device.userName} • {device.deviceType}
                        </p>
                      </div>
                      <div className={`text-right ${getSecurityScoreBg(device.securityScore)} px-3 py-2 rounded-lg`}>
                        <p className="text-xs text-gray-600 font-medium">Security Score</p>
                        <p className={`text-2xl font-bold ${getSecurityScoreColor(device.securityScore)}`}>
                          {device.securityScore}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Manufacturer</p>
                        <p className="font-medium text-gray-900">{device.manufacturer}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Model</p>
                        <p className="font-medium text-gray-900">{device.model}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">OS</p>
                        <p className="font-medium text-gray-900">{device.os}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{device.location}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">IP Address</p>
                        <p className="font-mono text-xs text-gray-900">{device.ipAddress}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">MAC Address</p>
                        <p className="font-mono text-xs text-gray-900">{device.macAddress}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Serial Number</p>
                        <p className="font-mono text-xs text-gray-900">{device.serialNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Last Seen</p>
                        <p className="font-medium text-gray-900">
                          {new Date(device.lastSeen).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-600">Storage</span>
                            <span className="text-gray-900 font-medium">
                              {device.storageUsedGB} / {device.storageGB} GB ({getStoragePercentage(device.storageUsedGB, device.storageGB)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${getStoragePercentage(device.storageUsedGB, device.storageGB)}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium text-gray-900">{device.memoryGB} GB</span> RAM
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card className="p-6 bg-white">
              <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className={`w-2 h-2 mt-2 rounded-full ${
                        activity.severity === 'critical'
                          ? 'bg-red-500'
                          : activity.severity === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{activity.message}</p>
                      <p className="text-sm text-gray-600">
                        {activity.userName} • {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        activity.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : activity.severity === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {activity.severity}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && !data && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading device data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
