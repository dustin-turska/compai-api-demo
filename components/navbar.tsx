'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, CheckSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiConfigModal } from '@/components/api-config-modal';
import { useApiConfig } from '@/lib/api-config-context';
import { Badge } from '@/components/ui/badge';

export function Navbar() {
  const pathname = usePathname();
  const [showApiConfig, setShowApiConfig] = useState(false);
  const { useCustomConfig } = useApiConfig();

  const navItems = [
    {
      href: '/',
      label: 'Tasks',
      icon: CheckSquare,
    },
    {
      href: '/statement-of-applicability',
      label: 'Statement of Applicability',
      icon: FileText,
    },
    {
      href: '/letter-of-engagement',
      label: 'Letter of Engagement',
      icon: FileText,
    },
    {
      href: '/systems-description',
      label: 'Systems Description',
      icon: FileText,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">🤖 AI CS Tools</h1>
              </div>
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 ${
                        active
                          ? 'bg-accent-100 text-accent-800'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {useCustomConfig && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Custom API
                </Badge>
              )}
              <Button
                onClick={() => setShowApiConfig(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                API Settings
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <ApiConfigModal 
        isOpen={showApiConfig}
        onClose={() => setShowApiConfig(false)}
      />
    </>
  );
}

