import { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ChevronRight, X } from 'lucide-react';

interface AppWalkthroughProps {
  open: boolean;
  onClose: () => void;
}

const walkthroughSteps = [
  {
    title: "Welcome to Shnarps! 🎴",
    content: (
      <div className="space-y-4">
        <p className="text-lg">Let's show you around the app!</p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm">This quick walkthrough will help you understand:</p>
          <ul className="list-disc list-inside text-sm mt-2 space-y-1">
            <li>How to start a game</li>
            <li>Game modes available</li>
            <li>Customizing your avatar</li>
            <li>Navigating the interface</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    title: "Choose Your Game Mode",
    content: (
      <div className="space-y-3">
        <p>When you start, you'll see two options:</p>
        <div className="space-y-3">
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <p className="font-semibold">🏠 Local Game</p>
            <p className="text-sm mt-1">Play on one device with friends or AI players. Perfect for:</p>
            <ul className="list-disc list-inside text-sm mt-1 ml-2">
              <li>Playing solo with AI</li>
              <li>Pass-and-play with friends nearby</li>
              <li>Learning the game</li>
            </ul>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="font-semibold">🌐 Online Multiplayer</p>
            <p className="text-sm mt-1">Play with friends online using room codes:</p>
            <ul className="list-disc list-inside text-sm mt-1 ml-2">
              <li>Create a room and share the code</li>
              <li>Join a friend's room with their code</li>
              <li>Add AI players to fill empty spots</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Customize Your Avatar",
    content: (
      <div className="space-y-3">
        <p>Make your player unique with custom avatars!</p>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-semibold mb-2">How to customize:</p>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>Click on your avatar when joining a game</li>
            <li>Choose from 8 different colors</li>
            <li>Pick your favorite icon (24 options!)</li>
            <li>Save and see it throughout the game</li>
          </ol>
        </div>
        <p className="text-sm text-muted-foreground">Your avatar appears next to your name and score everywhere in the game!</p>
      </div>
    )
  },
  {
    title: "Setting Up a Game",
    content: (
      <div className="space-y-3">
        <p className="font-semibold">Local Game Setup:</p>
        <ol className="list-decimal list-inside text-sm space-y-2">
          <li>Enter your name and customize your avatar</li>
          <li>Click "Join Game"</li>
          <li>Add 3-7 more players (human or AI)</li>
          <li>Select AI difficulty (Easy, Medium, Hard)</li>
          <li>Click "Start Game" when ready</li>
        </ol>
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-3">
          <p className="text-sm">💡 <strong>Tip:</strong> You need at least 4 players total to start a game!</p>
        </div>
      </div>
    )
  },
  {
    title: "Online Multiplayer",
    content: (
      <div className="space-y-3">
        <p className="font-semibold">Creating a Room:</p>
        <ol className="list-decimal list-inside text-sm space-y-1 mb-3">
          <li>Choose "Online Multiplayer"</li>
          <li>Click "Create Room"</li>
          <li>Share the 6-character room code with friends</li>
          <li>As host, you can add AI players and start the game</li>
        </ol>
        <p className="font-semibold">Joining a Room:</p>
        <ol className="list-decimal list-inside text-sm space-y-1">
          <li>Choose "Online Multiplayer"</li>
          <li>Click "Join Room"</li>
          <li>Enter your friend's room code</li>
          <li>Wait for the host to start the game</li>
        </ol>
      </div>
    )
  },
  {
    title: "Game Interface Overview",
    content: (
      <div className="space-y-3">
        <p>Once the game starts, here's what you'll see:</p>
        <div className="space-y-2">
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-sm"><strong>Top Left:</strong> Round number and current game phase</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-sm"><strong>Top Right:</strong> All player scores with avatars</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-sm"><strong>Center:</strong> Game board with current cards</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-sm"><strong>Bottom:</strong> Your hand of cards</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-sm"><strong>History Button:</strong> View past rounds and scores</p>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Mobile-Friendly",
    content: (
      <div className="space-y-3">
        <p>The game works great on mobile devices!</p>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm font-semibold mb-2">Mobile Features:</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Larger cards optimized for touch</li>
            <li>Horizontal scrolling for your hand</li>
            <li>Touch-friendly buttons (minimum 44px)</li>
            <li>Responsive dialogs and menus</li>
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">Play anywhere, on any device!</p>
      </div>
    )
  },
  {
    title: "Tips & Tricks",
    content: (
      <div className="space-y-3">
        <p className="font-semibold">App Tips:</p>
        <ul className="list-disc list-inside text-sm space-y-2">
          <li><strong>History:</strong> Click the history button to review previous rounds and scoring</li>
          <li><strong>AI Difficulty:</strong> Easy AI makes mistakes, Medium is balanced, Hard plays optimally</li>
          <li><strong>Room Codes:</strong> Online room codes are case-insensitive and easy to share</li>
          <li><strong>Auto-Save:</strong> Your game progress is automatically saved</li>
        </ul>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-3">
          <p className="text-sm">✅ You can access the game rules tutorial anytime from the main menu!</p>
        </div>
      </div>
    )
  },
  {
    title: "You're Ready!",
    content: (
      <div className="space-y-4 text-center">
        <p className="text-xl font-semibold">All Set! 🎉</p>
        <p>You now know how to navigate the app and set up games.</p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-semibold mb-2">Don't know how to play yet?</p>
          <p className="text-sm">Check out the <strong>Game Tutorial</strong> from the main menu to learn the rules!</p>
        </div>
        <p className="text-sm text-muted-foreground">Have fun playing Shnarps!</p>
      </div>
    )
  }
];

export default function AppWalkthrough({ open, onClose }: AppWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < walkthroughSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark walkthrough as completed in localStorage
      localStorage.setItem('shnarps_walkthrough_completed', 'true');
      onClose();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('shnarps_walkthrough_completed', 'true');
    setCurrentStep(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleSkip}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{walkthroughSteps[currentStep].title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleSkip} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentStep + 1) / walkthroughSteps.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1}/{walkthroughSteps.length}
            </span>
          </div>
        </DialogHeader>

        <div className="py-4">
          {walkthroughSteps[currentStep].content}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button onClick={handleSkip} variant="ghost">
            Skip Tour
          </Button>
          <Button onClick={handleNext}>
            {currentStep === walkthroughSteps.length - 1 ? (
              "Get Started!"
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
