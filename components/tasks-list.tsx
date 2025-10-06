'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/lib/types';
import { compAIClient, isDemoMode } from '@/lib/api';
import { TaskCard } from './task-card';
import { DemoBanner } from './demo-banner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle, CheckCircle2, Clock, Square, XCircle } from 'lucide-react';

export function TasksList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Task['status'] | 'all'>('all');

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    
    const response = await compAIClient.getTasks();
    
    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setTasks(response.data);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = filter === 'all' 
    ? tasks 
    : tasks.filter(task => task.status === filter);

  const getStatusCount = (status: Task['status']) => 
    tasks.filter(task => task.status === status).length;

  const statusFilters = [
    { key: 'all' as const, label: 'All Tasks', icon: null, count: tasks.length },
    { key: 'todo' as const, label: 'To Do', icon: Square, count: getStatusCount('todo') },
    { key: 'in_progress' as const, label: 'In Progress', icon: Clock, count: getStatusCount('in_progress') },
    { key: 'done' as const, label: 'Done', icon: CheckCircle2, count: getStatusCount('done') },
    { key: 'blocked' as const, label: 'Blocked', icon: XCircle, count: getStatusCount('blocked') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Tasks</AlertTitle>
        <AlertDescription className="mt-2">
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={fetchTasks}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Banner */}
      {isDemoMode && <DemoBanner />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Tasks</h1>
          <p className="text-gray-600 mt-2 text-lg">
            {tasks.length === 0 ? 'No tasks found' : `${tasks.length} task${tasks.length === 1 ? '' : 's'} in your organization`}
          </p>
        </div>
        <Button onClick={fetchTasks} variant="outline" className="shadow-sm hover:shadow-md transition-shadow">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-3">
        {statusFilters.map(({ key, label, icon: Icon, count }) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 shadow-sm hover:shadow-md transition-all ${
              filter === key 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "hover:bg-gray-50"
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
            <Badge 
              variant="secondary" 
              className={`ml-1 ${
                filter === key 
                  ? "bg-blue-500 text-white border-blue-400" 
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-300 mb-6">
            <Square className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            {filter === 'all' ? 'No tasks found' : `No ${statusFilters.find(f => f.key === filter)?.label.toLowerCase()} tasks`}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {filter === 'all' 
              ? 'There are no tasks to display in your organization.' 
              : `There are no tasks with the ${filter.replace('_', ' ')} status.`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
