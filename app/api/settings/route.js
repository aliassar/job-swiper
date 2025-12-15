import { NextResponse } from 'next/server';

// In-memory storage for settings (per session)
// In a real app, this would be stored in a database per user
const settingsStorage = new Map();

const DEFAULT_SETTINGS = {
  // General settings
  theme: 'system',
  notificationsEnabled: true,
  emailNotificationsEnabled: false,
  
  // Application automation settings
  automationStages: {
    syncing: true,
    beingApplied: true,
    applied: false,
  },
};

export async function GET(request) {
  // In a real app, you'd get the user ID from the session
  const userId = 'default';
  
  const settings = settingsStorage.get(userId) || DEFAULT_SETTINGS;
  
  return NextResponse.json({ settings });
}

export async function PUT(request) {
  try {
    const body = await request.json();
    
    // Support both flat body (new format) and wrapped body (legacy format)
    const settings = body.settings || body;
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }
    
    // In a real app, you'd get the user ID from the session
    const userId = 'default';
    
    // Merge with existing settings
    const existingSettings = settingsStorage.get(userId) || DEFAULT_SETTINGS;
    const updatedSettings = { ...existingSettings, ...settings };
    
    settingsStorage.set(userId, updatedSettings);
    
    return NextResponse.json({ 
      success: true,
      settings: updatedSettings 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
