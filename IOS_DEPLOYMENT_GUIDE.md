# iOS App Store Deployment Guide for Shnarps Card Game

## ✅ Setup Complete!

Your Shnarps card game is now configured as an iOS app using Capacitor! Here's everything you need to know to deploy it to the Apple App Store.

## 📱 What's Been Set Up

- **App ID**: `com.shnarps.cardgame`
- **App Name**: Shnarps Card Game
- **iOS Platform**: Added and configured in the `ios/` folder
- **Build Configuration**: Web app builds to `dist/public` and syncs to iOS

## 🚀 Building and Deploying to App Store

### Prerequisites

1. **Mac Computer** (required for iOS development)
2. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com
3. **Xcode** (latest version)
   - Download from Mac App Store
4. **CocoaPods** (for iOS dependencies)
   ```bash
   sudo gem install cocoapods
   ```

### Step-by-Step Deployment Process

#### 1. Build Your Web App

On Replit or locally, run:
```bash
npm run build
# Or just build the client:
vite build
```

This creates the production-ready web app in `dist/public/`.

#### 2. Sync to iOS Platform

```bash
npx cap sync ios
```

This copies your web app to the iOS project and updates native dependencies.

#### 3. Open in Xcode (Mac Only)

```bash
npx cap open ios
```

This opens your iOS project in Xcode.

#### 4. Configure App in Xcode

**a. Set Your Team:**
- Select the project in Xcode's left sidebar
- Go to "Signing & Capabilities" tab
- Select your Apple Developer Team

**b. Update Bundle Identifier (if needed):**
- Change `com.shnarps.cardgame` to your preferred identifier
- Must be unique in the App Store

**c. Set App Version:**
- Update Version (e.g., 1.0.0)
- Update Build number (e.g., 1)

**d. Add App Icons:**
- Create app icons in these sizes:
  - 1024×1024 (App Store)
  - 180×180, 167×167, 152×152, 120×120, 87×87, 80×80, 76×76, 60×60, 58×58, 40×40, 29×29, 20×20
- Add them in Assets.xcassets > AppIcon

**e. Add Launch Screen:**
- Customize the splash screen in Assets.xcassets

#### 5. Test on Device/Simulator

- Select a device or simulator in Xcode
- Click the Play button (▶️) to build and run
- Test all game features

#### 6. Archive and Upload to App Store

**a. Archive Your App:**
- In Xcode menu: Product > Archive
- Wait for archive to complete

**b. Upload to App Store Connect:**
- Click "Distribute App"
- Choose "App Store Connect"
- Follow the prompts to upload

#### 7. App Store Connect Setup

1. Go to https://appstoreconnect.apple.com
2. Create a new app
3. Fill in app information:
   - Name: Shnarps Card Game
   - Category: Games > Card
   - Description, keywords, screenshots
4. Set pricing (free or paid)
5. Submit for review

## 📝 Important Configurations

### App Capabilities

You may want to add these in Xcode:
- **Game Center** (for leaderboards/achievements)
- **In-App Purchases** (if monetizing)
- **Push Notifications** (for multiplayer invites)

### Privacy & Data

Create a privacy policy and declare:
- What data you collect
- How you use it
- Third-party services used

### App Store Screenshots

Required sizes (use iPhone simulator):
- 6.7" Display (iPhone 14 Pro Max): 1290×2796
- 6.5" Display (iPhone 11 Pro Max): 1242×2688
- 5.5" Display (iPhone 8 Plus): 1242×2208

Take screenshots showing:
- Main menu
- Game in progress
- Multiplayer lobby
- Score/victory screen

## 🔄 Updating Your App

When you make changes:

1. **Update Your Code** (on Replit or locally)
2. **Build Web App**: `vite build`
3. **Sync to iOS**: `npx cap sync ios`
4. **Increment Version** in Xcode
5. **Test Thoroughly**
6. **Archive & Upload** new version

## 🛠️ Useful Commands

```bash
# Build web app only
vite build

# Sync web app to iOS (after building)
npx cap sync ios

# Open in Xcode (Mac only)
npx cap open ios

# Update iOS dependencies
cd ios/App && pod install && cd ../..

# Clean and rebuild
npx cap sync ios --deployment
```

## 📱 Live Updates vs App Store

**Current Setup:**
- Changes require App Store review (1-3 days)

**Alternative - Live Updates:**
- Use Capacitor Live Updates (paid service)
- Push updates instantly without App Store review
- https://capacitorjs.com/docs/guides/live-updates

## 🐛 Common Issues

### "CocoaPods not installed"
```bash
sudo gem install cocoapods
cd ios/App && pod install
```

### "Developer Team not set"
- Open Xcode
- Go to Signing & Capabilities
- Select your team from dropdown

### "Bundle identifier already exists"
- Change `com.shnarps.cardgame` to unique ID
- Update in both `capacitor.config.ts` and Xcode

### "App icons missing"
- Add all required icon sizes in Xcode
- Use a tool like: https://www.appicon.co

## 🎮 Multiplayer Considerations

Your game has multiplayer with WebSockets. For production:

1. **Deploy Backend** to a permanent server (not Replit dev)
2. **Update WebSocket URL** in your app to production URL
3. **Use HTTPS/WSS** for secure connections
4. **Consider Using:**
   - Replit Deployments (for hosting backend)
   - Firebase/Supabase (for real-time data)
   - Custom server (AWS, DigitalOcean, etc.)

## 💰 Money/Wallet System

Your app has in-game currency. Important:
- If using REAL money, you MUST use In-App Purchases
- Virtual currency is OK as long as it's not purchasable
- Add disclaimer that money is virtual/for game purposes only

## 📋 App Store Review Checklist

- [ ] App functions properly on iOS
- [ ] All features work offline (or handle network errors gracefully)
- [ ] Follows Apple's Human Interface Guidelines
- [ ] No crashes or major bugs
- [ ] Privacy policy created and linked
- [ ] Screenshots and descriptions ready
- [ ] App icons and launch screen set
- [ ] Appropriate age rating selected
- [ ] Contact information provided

## 🔗 Helpful Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Apple Developer**: https://developer.apple.com
- **App Store Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Xcode Help**: https://developer.apple.com/xcode/

## 🎉 Next Steps

1. **Transfer project to Mac** (or use Mac for development)
2. **Install Xcode and CocoaPods**
3. **Open project**: `npx cap open ios`
4. **Configure signing** with your Apple Developer account
5. **Test on real device**
6. **Archive and submit** to App Store!

---

**Questions?** The iOS project is in the `ios/` folder. All your game logic and UI from the web version will work in the iOS app!
