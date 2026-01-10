# iOS App Setup Instructions

## Prerequisites

- macOS 14.0 or later
- Xcode 15.0 or later
- iOS 17.0+ target device or simulator
- Active Apple Developer Account (for device testing and App Store deployment)
- Existing Supabase project (shared with web frontend)

## Step 1: Create Xcode Project

Since the Swift files are already created, you need to create an Xcode project to tie everything together:

1. **Open Xcode**
2. **Create a new project**:
   - Choose "iOS" → "App"
   - Product Name: `Revelation`
   - Team: Select your Apple Developer team
   - Organization Identifier: `com.yourcompany` (use your identifier)
   - Interface: **SwiftUI**
   - Language: **Swift**
   - Storage: **None**
   - Include Tests: **Yes** (optional but recommended)

3. **Save the project** in the `ios-app/Revelation/` directory

## Step 2: Add Existing Swift Files

1. In Xcode, **delete** the auto-generated files:
   - `ContentView.swift`
   - `RevelationApp.swift` (the auto-generated one)

2. **Add existing files** to the project:
   - Right-click on the `Revelation` folder in Xcode
   - Select "Add Files to Revelation..."
   - Navigate to `ios-app/Revelation/Revelation/`
   - Select all subdirectories: `App/`, `Features/`, `Core/`, `UI/`, `Resources/`
   - Make sure "Copy items if needed" is **unchecked** (files are already in place)
   - Make sure "Create groups" is selected
   - Click "Add"

## Step 3: Add Supabase Swift SDK

### Option A: Using Swift Package Manager (Recommended)

1. In Xcode, go to **File → Add Package Dependencies...**
2. Enter the repository URL: `https://github.com/supabase/supabase-swift.git`
3. Select version: **2.0.0** or later
4. Click "Add Package"
5. Select the following products to add:
   - `Supabase`
6. Click "Add Package"

### Option B: Using the Package.swift (if using SPM outside Xcode)

The `Package.swift` file is already created in `ios-app/` directory with the Supabase dependency.

## Step 4: Configure Environment Variables

### Create Configuration File

1. In Xcode, right-click on the `Revelation` group
2. Select "New File..." → "Property List"
3. Name it `Config.plist`
4. Add the following keys:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>SUPABASE_URL</key>
       <string>YOUR_SUPABASE_PROJECT_URL</string>
       <key>SUPABASE_ANON_KEY</key>
       <string>YOUR_SUPABASE_ANON_KEY</string>
   </dict>
   </plist>
   ```

### Alternative: Use Info.plist

Add these keys directly to `Info.plist`:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key

**Important:** Add `Config.plist` or any file with credentials to `.gitignore`:
```
ios-app/**/Config.plist
ios-app/**/GoogleService-Info.plist
```

## Step 5: Configure App Capabilities

### Enable Background Modes (for Pomodoro timer)

1. In Xcode, select the project in the navigator
2. Select the `Revelation` target
3. Go to "Signing & Capabilities" tab
4. Click "+ Capability"
5. Add **Background Modes**
6. Check the following:
   - ✅ Audio, AirPlay, and Picture in Picture (for background timer)
   - ✅ Background fetch (for data sync)
   - ✅ Remote notifications (for push notifications)

### Enable Push Notifications (optional, for reminders)

1. Click "+ Capability"
2. Add **Push Notifications**

## Step 6: Update Info.plist

Add the following keys to support background execution:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>audio</string>
    <string>fetch</string>
    <string>remote-notification</string>
</array>

<key>NSUserNotificationsUsageDescription</key>
<string>We need notifications permission to remind you when your Pomodoro timer completes.</string>
```

## Step 7: Fix Import Issues

The `SupabaseClient.swift` file has a naming conflict. Update it:

```swift
// Change this line:
class SupabaseClient {
    static let shared = SupabaseClient()
    let client: SupabaseClient  // <- This conflicts!

// To this:
class SupabaseManager {
    static let shared = SupabaseManager()
    let client: Supabase.SupabaseClient  // <- Fully qualified
```

Or update the file to use a different name to avoid conflicts with the Supabase framework's `SupabaseClient`.

## Step 8: Build and Run

1. Select a simulator or connected device from the scheme menu
2. Press **Cmd + B** to build
3. Fix any compilation errors (there may be minor issues to resolve)
4. Press **Cmd + R** to run

## Step 9: Configure Signing

### For Development

1. In Xcode, select the project
2. Select the `Revelation` target
3. Go to "Signing & Capabilities"
4. Select your Team
5. Xcode will automatically manage signing

### For TestFlight/App Store

1. Create an App ID in Apple Developer Portal:
   - Go to [developer.apple.com](https://developer.apple.com)
   - Certificates, Identifiers & Profiles → Identifiers
   - Create new App ID: `com.yourcompany.revelation`
   - Enable capabilities: Push Notifications, Background Modes

2. Create provisioning profiles for development and distribution

3. Update bundle identifier in Xcode to match

## Common Issues & Solutions

### Issue: "Cannot find 'SupabaseClient' in scope"

**Solution:** Make sure the Supabase package is properly added via Swift Package Manager. Clean build folder (Cmd + Shift + K) and rebuild.

### Issue: "Type 'SupabaseClient' is ambiguous"

**Solution:** Rename the custom `SupabaseClient` class to `SupabaseManager` or use fully qualified names.

### Issue: Environment variables not found

**Solution:** Ensure `Config.plist` is added to the target and the keys are correct. Check that the file is in the "Copy Bundle Resources" build phase.

### Issue: Build errors in repository files

**Solution:** The Supabase Swift SDK API may differ from the implementation. Refer to the [official Supabase Swift documentation](https://github.com/supabase/supabase-swift) for the correct API usage.

## Next Steps

1. **Test Authentication**: Sign up and sign in with test credentials
2. **Create Goals**: Test the 3-tier goal system
3. **Add Tasks**: Create daily and one-time tasks
4. **Test Pomodoro**: Start a timer and verify functionality
5. **Check Calendar**: View the calendar and historical data

## Development Tips

### Hot Reload

SwiftUI supports live previews. Use `#Preview` macros to test individual views without running the full app.

### Debugging

- Use `print()` statements for quick debugging
- Set breakpoints in Xcode for step-through debugging
- Use Xcode's View Debugger (Debug → View Debugging → Capture View Hierarchy)

### Testing on Device

1. Connect iPhone/iPad via USB
2. Trust the computer on your device
3. Select device in Xcode scheme
4. Build and run (Xcode will install the app)

### Supabase Configuration

The app shares the same Supabase backend as the web app:
- Same database schema
- Same authentication
- Same Row Level Security policies
- Real-time sync between platforms

## Production Deployment

See `IOS_CONVERSION_PLAN.md` for:
- TestFlight beta testing
- App Store submission
- App Store screenshots and metadata
- Privacy policy requirements

---

**Need Help?** Check the main `IOS_CONVERSION_PLAN.md` for architecture details and implementation roadmap.
