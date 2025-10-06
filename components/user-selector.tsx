'use client';

import { useState, useEffect } from 'react';
import { Member } from '@/lib/types';
import { compAIClient, CompAIClient } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UserSelectorProps {
  value?: string;
  onValueChange: (userId: string) => void;
  onUserChange?: (user: { id: string; name: string; email: string; } | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  compAIClient?: CompAIClient;
}

export function UserSelector({ 
  value, 
  onValueChange, 
  onUserChange,
  placeholder = "Select a user...",
  className = "",
  disabled = false,
  compAIClient: clientProp
}: UserSelectorProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeople = async () => {
    setLoading(true);
    setError(null);
    
    // Use the passed client or fallback to the default
    const client = clientProp || compAIClient;
    
    try {
      const response = await client.getPeople();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data?.data) {
        // Filter to only active members
        const activeMembers = response.data.data.filter(member => member.isActive);
        setMembers(activeMembers);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const selectedMember = members.find(member => member.user.id === value);

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <Button variant="outline" size="sm" onClick={fetchPeople}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <Select 
        value={value} 
        onValueChange={(userId) => {
          onValueChange(userId);
          const selectedMember = members.find(m => m.user.id === userId);
          if (selectedMember && onUserChange) {
            onUserChange({
              id: selectedMember.user.id,
              name: selectedMember.user.name,
              email: selectedMember.user.email
            });
          }
        }} 
        disabled={disabled || loading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loading ? "Loading users..." : placeholder}>
            {selectedMember && (
              <div className="flex items-center gap-2">
                {selectedMember.user.image ? (
                  <img 
                    src={selectedMember.user.image} 
                    alt={selectedMember.user.name}
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-gray-500" />
                  </div>
                )}
                <div className="flex flex-col items-start">
                  <span className="font-medium">{selectedMember.user.name}</span>
                  <span className="text-xs text-gray-500">{selectedMember.user.email}</span>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Loading users...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="flex items-center justify-center py-4">
              <span className="text-sm text-gray-500">No users found</span>
            </div>
          ) : (
            members.map((member) => (
              <SelectItem key={member.user.id} value={member.user.id}>
                <div className="flex items-center gap-3 w-full">
                  {member.user.image ? (
                    <img 
                      src={member.user.image} 
                      alt={member.user.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">{member.user.name}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{member.user.email}</span>
                      {member.role === 'admin' && (
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs font-medium">
                          Admin
                        </span>
                      )}
                      {member.department && (
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs">
                          {member.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
