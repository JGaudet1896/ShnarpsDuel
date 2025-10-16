# iOS Quick Start Guide

## ✅ Your App is Ready for iOS!

Shnarps Card Game has been configured as an iOS app. Here's what you need to know:

## 🎯 What You Need

1. **Mac Computer** (required - iOS apps can only be built on Mac)
2. **Apple Developer Account** ($99/year) - [Sign up here](https://developer.apple.com)
3. **Xcode** (free from Mac App Store)

## 🚀 Quick Deploy Steps

### On This Computer (Replit):
```bash
# Build the web app
vite build

# Sync to iOS platform
npx cap sync ios
```

### On Your Mac:
```bash
# Install CocoaPods (one time)
sudo gem install cocoapods

# Open the iOS project in Xcode
npx cap open ios
```

### In Xcode:
1. Select your Apple Developer Team in "Signing & Capabilities"
2. Add app icons (Assets.xcassets > AppIcon)
3. Test on a simulator or device
4. Archive (Product > Archive)
5. Upload to App Store Connect

## 📁 Project Structure

- `ios/` - Your iOS native project (open in Xcode)
- `dist/public/` - Built web app (synced to iOS)
- `capacitor.config.ts` - Capacitor configuration

## 🔄 Making Updates

1. Make your changes in Replit
2. Build: `vite build`
3. Sync: `npx cap sync ios`
4. Test in Xcode
5. Upload new version to App Store

## 📱 App Details

- **App ID**: com.shnarps.cardgame
- **App Name**: Shnarps Card Game
- **Platform**: iOS (iPhone & iPad ready)

## ⚠️ Important Notes

### Multiplayer
- For production, deploy your backend server (not just Replit dev)
- Update WebSocket URLs to production server
- Use secure connections (HTTPS/WSS)

### In-Game Money
- Your game has a virtual wallet system
- This is fine as-is (virtual currency for scoring)
- If you want REAL money, you MUST use Apple In-App Purchases

### Testing
- Test all features on actual iOS devices
- Verify both local and online multiplayer work
- Check that cards, animations, and UI look good on different screen sizes

## 📚 Full Documentation

See `IOS_DEPLOYMENT_GUIDE.md` for complete details on:
- App Store submission process
- Screenshots and metadata requirements
- Privacy policy requirements
- Troubleshooting common issues

## 🆘 Need Help?

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Apple Developer Portal**: https://developer.apple.com
- **App Store Connect**: https://appstoreconnect.apple.com

---

**Ready to deploy?** Transfer this project to your Mac and follow the steps above!
