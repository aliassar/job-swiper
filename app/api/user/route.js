import { NextResponse } from 'next/server';

// In-memory storage for user settings (per user)
// In production, this would be stored in a database
const userSettingsStorage = new Map();

// GET - Get user settings
export async function GET(request) {
  try {
    const userId = 'default'; // In production, get from session
    
    const settings = userSettingsStorage.get(userId);
    
    return NextResponse.json({
      success: true,
      settings: settings || null
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

// PUT - Update user settings
export async function PUT(request) {
  try {
    const body = await request.json();
    const { settings } = body;
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }
    
    // Validate email if provided
    if (settings.email) {
      // Proper email validation using regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settings.email)) {
        return NextResponse.json(
          { error: 'Invalid email address format' },
          { status: 400 }
        );
      }
    }
    
    // Validate URLs if provided
    const urlFields = ['linkedIn', 'github', 'portfolio'];
    for (const field of urlFields) {
      if (settings[field] && settings[field].trim()) {
        try {
          new URL(settings[field]);
        } catch (e) {
          return NextResponse.json(
            { error: `Invalid URL for ${field}` },
            { status: 400 }
          );
        }
      }
    }
    
    const userId = 'default'; // In production, get from session
    
    // Get existing settings
    const existingSettings = userSettingsStorage.get(userId) || {};
    
    // If password change is requested, validate it
    if (settings.newPassword) {
      if (!settings.currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        );
      }
      
      if (settings.newPassword.length < 8) {
        return NextResponse.json(
          { error: 'New password must be at least 8 characters' },
          { status: 400 }
        );
      }
      
      // In production, you would:
      // 1. Verify current password against stored hash
      // 2. Hash and store new password
      // For now, we'll just simulate success
    }
    
    // Merge settings (excluding password fields from storage)
    const { currentPassword, newPassword, confirmPassword, ...settingsToStore } = settings;
    const updatedSettings = {
      ...existingSettings,
      ...settingsToStore,
      updatedAt: new Date().toISOString(),
    };
    
    userSettingsStorage.set(userId, updatedSettings);
    
    // If password was changed, include that in response
    const responseMessage = newPassword 
      ? 'Settings and password updated successfully'
      : 'Settings updated successfully';
    
    return NextResponse.json({
      success: true,
      message: responseMessage,
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings. Please try again.' },
      { status: 500 }
    );
  }
}
