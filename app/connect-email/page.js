'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/lib/hooks/useSettings';
import { emailApi } from '@/lib/api';

export default function ConnectEmailPage() {
  const router = useRouter();
  const { settings, updateSetting } = useSettings();
  const [selectedProvider, setSelectedProvider] = useState(settings.emailProvider || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imapServer, setImapServer] = useState('');
  const [imapPort, setImapPort] = useState('993');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  const emailProviders = [
    {
      id: 'gmail',
      name: 'Gmail',
      logo: '📧',
      description: 'Connect your Google account',
      imapServer: 'imap.gmail.com',
      imapPort: '993',
    },
    {
      id: 'yahoo',
      name: 'Yahoo Mail',
      logo: '📮',
      description: 'Connect your Yahoo account',
      imapServer: 'imap.mail.yahoo.com',
      imapPort: '993',
    },
    {
      id: 'outlook',
      name: 'Outlook/Office 365',
      logo: '📬',
      description: 'Connect your Microsoft account',
      imapServer: 'outlook.office365.com',
      imapPort: '993',
    },
    {
      id: 'imap',
      name: 'Other (IMAP)',
      logo: '✉️',
      description: 'Connect using IMAP settings',
      imapServer: '',
      imapPort: '993',
    },
  ];

  const handleProviderSelect = (provider) => {
    setSelectedProvider(provider.id);
    setError('');
    
    // Pre-fill IMAP settings for known providers
    if (provider.id !== 'imap') {
      setImapServer(provider.imapServer);
      setImapPort(provider.imapPort);
    } else {
      setImapServer('');
      setImapPort('993');
    }
  };

  const handleConnect = async () => {
    setError('');
    
    // Validation
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    if (selectedProvider === 'imap' && (!imapServer || !imapPort)) {
      setError('Please enter IMAP server and port');
      return;
    }

    setConnecting(true);

    try {
      // Implement actual email connection with backend
      const response = await emailApi.connect(
        selectedProvider,
        email,
        password,
        selectedProvider === 'imap' ? imapServer : null,
        selectedProvider === 'imap' ? imapPort : null
      );
      
      if (response.success) {
        // Save the settings locally as well for UI state
        updateSetting('emailConnected', true);
        updateSetting('emailProvider', selectedProvider);
        updateSetting('connectedEmail', email);
        updateSetting('imapSettings', {
          server: response.connection.imapServer,
          port: response.connection.imapPort,
        });
        
        // Show success and redirect
        alert('Email connected successfully!');
        router.push('/settings');
      } else {
        setError('Failed to connect. Please check your credentials and try again.');
      }
      
    } catch (err) {
      console.error('Connection error:', err);
      // Use error message from API if available
      const errorMessage = err.message || 'Failed to connect. Please check your credentials and try again.';
      setError(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await emailApi.disconnect();
      
      // Update local settings
      updateSetting('emailConnected', false);
      updateSetting('emailProvider', '');
      updateSetting('connectedEmail', '');
      updateSetting('imapSettings', null);
      
      router.push('/settings');
    } catch (err) {
      console.error('Disconnect error:', err);
      alert('Failed to disconnect email. Please try again.');
    }
  };

  // If already connected, show disconnect option
  if (settings.emailConnected && settings.connectedEmail) {
    return (
      <div className="h-full overflow-y-auto bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>Back</span>
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Connection</h1>
          
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">Connected</h2>
                <p className="text-sm text-gray-600">{settings.connectedEmail}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Provider</span>
                  <p className="font-medium text-gray-900 capitalize">{settings.emailProvider}</p>
                </div>
                {settings.imapSettings && (
                  <>
                    <div>
                      <span className="text-gray-500">IMAP Server</span>
                      <p className="font-medium text-gray-900">{settings.imapSettings.server}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Port</span>
                      <p className="font-medium text-gray-900">{settings.imapSettings.port}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              Disconnect Email
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your email is securely connected. We'll use it to automatically track application status updates from recruiter emails.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Email</h1>
        <p className="text-sm text-gray-600 mb-6">
          Connect your email to automatically track application status updates
        </p>

        {/* Provider Selection */}
        {!selectedProvider && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Choose your email provider</h2>
            {emailProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderSelect(provider)}
                className="w-full bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{provider.logo}</div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">{provider.name}</h3>
                    <p className="text-xs text-gray-600">{provider.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Connection Form */}
        {selectedProvider && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="text-3xl">
                {emailProviders.find(p => p.id === selectedProvider)?.logo}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {emailProviders.find(p => p.id === selectedProvider)?.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedProvider('')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Change
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                {selectedProvider === 'gmail' && (
                  <p className="mt-1 text-xs text-gray-500">
                    Note: For Gmail, you may need to use an App Password. 
                    <a href="https://support.google.com/accounts/answer/185833" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                      Learn more
                    </a>
                  </p>
                )}
              </div>

              {/* IMAP Settings (for custom IMAP) */}
              {selectedProvider === 'imap' && (
                <>
                  <div>
                    <label htmlFor="imapServer" className="block text-sm font-medium text-gray-700 mb-1">
                      IMAP Server
                    </label>
                    <input
                      type="text"
                      id="imapServer"
                      value={imapServer}
                      onChange={(e) => setImapServer(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="imap.example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="imapPort" className="block text-sm font-medium text-gray-700 mb-1">
                      Port
                    </label>
                    <input
                      type="text"
                      id="imapPort"
                      value={imapPort}
                      onChange={(e) => setImapPort(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="993"
                    />
                  </div>
                </>
              )}

              {/* Connect Button */}
              <button
                onClick={handleConnect}
                disabled={connecting}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                  connecting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {connecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Connecting...
                  </span>
                ) : (
                  'Connect Email'
                )}
              </button>
            </div>

            {/* Security Note */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex gap-2">
                <div className="text-blue-500">🔒</div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600">
                    <strong>Your privacy matters:</strong> We use secure, encrypted connections to access your email. 
                    We only read emails related to job applications and never share your credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
