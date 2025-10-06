import Link from 'next/link';
import { TasksList } from '@/components/tasks-list';
import { FileText, CheckSquare } from 'lucide-react';

export default function Home() {
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
                  className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                </Link>
                <Link 
                  href="/statement-of-applicability" 
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-gray-100"
                >
                  <FileText className="h-4 w-4" />
                  Statement of Applicability
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TasksList />
      </main>
    </div>
  );
}
