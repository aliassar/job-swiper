'use client';

import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/lib/hooks/useSettings';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { settings, isLoading, updateSetting, updateAutomationStage } = useSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
          <p className="text-sm text-gray-600">
            Manage your preferences and account settings
          </p>
        </div>

        {/* Account Settings Section */}
        {status === 'authenticated' && session?.user && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account</h2>
            
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-4">
              {session.user.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <UserCircleIcon className="w-16 h-16 text-gray-400" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{session.user.name || 'User'}</p>
                <p className="text-sm text-gray-600">{session.user.email}</p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}

        {status !== 'authenticated' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account</h2>
            <p className="text-gray-600 mb-4">Sign in to sync your settings across devices</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              Sign In
            </button>
          </div>
        )}

        {/* General Settings Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">General Settings</h2>
          
          {/* Theme Setting */}
          <div className="mb-4">
            <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              id="theme"
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Choose your preferred color theme</p>
          </div>

          {/* Notifications Toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="notifications" className="block text-sm font-medium text-gray-700">
                  Notifications
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive in-app notifications
                </p>
              </div>
              <button
                id="notifications"
                type="button"
                onClick={() => updateSetting('notificationsEnabled', !settings.notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notificationsEnabled ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Email Notifications Toggle */}
          <div className="mb-0">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="email-notifications" className="block text-sm font-medium text-gray-700">
                  Email Notifications
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive email updates about applications
                </p>
              </div>
              <button
                id="email-notifications"
                type="button"
                onClick={() => updateSetting('emailNotificationsEnabled', !settings.emailNotificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.emailNotificationsEnabled ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.emailNotificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Application Automation Settings Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Application Automation</h2>
          <p className="text-sm text-gray-600 mb-4">
            Choose which application stages should be processed automatically without manual intervention
          </p>
          
          {/* Syncing Stage */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="auto-syncing" className="block text-sm font-medium text-gray-700">
                  Syncing Stage
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automatically sync applications with job boards
                </p>
              </div>
              <button
                id="auto-syncing"
                type="button"
                onClick={() => updateAutomationStage('syncing', !settings.automationStages.syncing)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.automationStages.syncing ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.automationStages.syncing ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Being Applied Stage */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="auto-being-applied" className="block text-sm font-medium text-gray-700">
                  Being Applied Stage
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automatically process application submissions
                </p>
              </div>
              <button
                id="auto-being-applied"
                type="button"
                onClick={() => updateAutomationStage('beingApplied', !settings.automationStages.beingApplied)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.automationStages.beingApplied ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.automationStages.beingApplied ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Applied Stage */}
          <div className="mb-0">
            <div className="flex items-center justify-between">
              <div>
                <label htmlFor="auto-applied" className="block text-sm font-medium text-gray-700">
                  Applied Stage
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Automatically mark as applied when submission is confirmed
                </p>
              </div>
              <button
                id="auto-applied"
                type="button"
                onClick={() => updateAutomationStage('applied', !settings.automationStages.applied)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.automationStages.applied ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.automationStages.applied ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
