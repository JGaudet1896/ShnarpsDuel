import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface TutorialProps {
  open: boolean;
  onClose: () => void;
}

const tutorialSteps = [
  {
    title: "Welcome to Shnarps!",
    content: (
      <div className="space-y-3">
        <p>Shnarps is a trick-taking card game for 4-8 players where you start at 16 points and race to reach 0 or below to win!</p>
        <p className="font-semibold text-blue-600">Goal: Be the first to reach 0 points (or lower)</p>
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p className="text-sm">⚠️ <strong>Watch out!</strong> If you go over 32 points, you're eliminated!</p>
        </div>
      </div>
    )
  },
  {
    title: "Game Setup",
    content: (
      <div className="space-y-3">
        <p><strong>Players:</strong> 4-8 players (humans or AI)</p>
        <p><strong>Starting Score:</strong> Everyone starts at 16 points</p>
        <p><strong>The Deck:</strong> Standard 52-card deck</p>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm"><strong>Card Order (Highest to Lowest):</strong></p>
          <p className="text-sm">A, K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2</p>
        </div>
      </div>
    )
  },
  {
    title: "Phase 1: Bidding",
    content: (
      <div className="space-y-3">
        <p>Players take turns bidding on how many tricks they think they can win (1-5) or they can pass.</p>
        <div className="space-y-2">
          <div className="bg-green-50 p-2 rounded">
            <p className="text-sm"><strong>Bid 1-5:</strong> You think you can win that many tricks</p>
          </div>
          <div className="bg-purple-50 p-2 rounded">
            <p className="text-sm"><strong>Pass/Punt (0):</strong> You don't want to win ANY tricks</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">The highest bidder wins the bid and gets to choose the trump suit!</p>
      </div>
    )
  },
  {
    title: "Phase 2: Trump Selection",
    content: (
      <div className="space-y-3">
        <p>The highest bidder chooses one suit to be <strong>trump</strong>.</p>
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <p className="text-sm"><strong>What is Trump?</strong></p>
          <p className="text-sm">Trump cards beat all other suits, no matter the rank!</p>
          <p className="text-sm mt-2">Example: A 2 of trump beats an Ace of any other suit</p>
        </div>
      </div>
    )
  },
  {
    title: "Phase 3: Sit or Play",
    content: (
      <div className="space-y-3">
        <p>After trump is chosen, each player (except the bidder) decides:</p>
        <div className="space-y-2">
          <div className="bg-blue-50 p-2 rounded">
            <p className="text-sm"><strong>Play:</strong> Compete to win tricks</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <p className="text-sm"><strong>Sit:</strong> Skip this round (no risk, no reward)</p>
          </div>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-2">
          <p className="text-sm"><strong>Musty Rule:</strong> If you sit 3 rounds in a row, you MUST play the next round!</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-2">
          <p className="text-sm"><strong>Bonus:</strong> If you sit while at 4 points or less, you get +1 point!</p>
        </div>
      </div>
    )
  },
  {
    title: "Phase 4: Playing Tricks",
    content: (
      <div className="space-y-3">
        <p>Players who chose to play now compete in tricks:</p>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Lead player plays any card</li>
          <li>Other players must <strong>follow suit</strong> if possible</li>
          <li>If you can't follow suit, play any card (including trump!)</li>
          <li>Highest card of the lead suit wins... <strong>unless trump is played!</strong></li>
          <li>Highest trump card wins the trick</li>
        </ol>
      </div>
    )
  },
  {
    title: "Scoring",
    content: (
      <div className="space-y-3">
        <p className="font-semibold">The goal is to reach 0 or lower!</p>
        <div className="space-y-2">
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-sm font-semibold">Punt (bid 0):</p>
            <p className="text-sm">✅ Win 0 tricks = <strong>+5 points</strong></p>
            <p className="text-sm">❌ Win any tricks = <strong>-1 per trick</strong></p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-semibold">Regular Bid (1-5):</p>
            <p className="text-sm"><strong>-1 point per trick won</strong> (regardless of bid)</p>
          </div>
        </div>
        <div className="bg-red-50 p-3 rounded-lg border border-red-200 mt-3">
          <p className="text-sm"><strong>⚠️ Elimination:</strong> Go over 32 points and you're out!</p>
        </div>
      </div>
    )
  },
  {
    title: "Special Rules",
    content: (
      <div className="space-y-3">
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p className="text-sm font-semibold">🎯 Everyone Sat Out:</p>
          <p className="text-sm">If everyone sits, the bidder chooses:</p>
          <p className="text-sm">• Take -5 points themselves, OR</p>
          <p className="text-sm">• Give +5 points to everyone else</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <p className="text-sm font-semibold">🏆 Spading Out (Instant Win):</p>
          <p className="text-sm">Win all tricks when spades are trump = instant victory!</p>
        </div>
      </div>
    )
  },
  {
    title: "Strategy Tips",
    content: (
      <div className="space-y-2">
        <p className="font-semibold mb-2">💡 Pro Tips:</p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Punting is risky but gives big rewards if successful</li>
          <li>Watch your opponents' scores - prevent them from winning!</li>
          <li>High cards are powerful, but trump beats everything</li>
          <li>Sitting can be strategic when you have a bad hand</li>
          <li>Don't forget the musty rule - plan ahead!</li>
          <li>At 4 points or less, sitting gives you a bonus point</li>
        </ul>
      </div>
    )
  },
  {
    title: "Ready to Play!",
    content: (
      <div className="space-y-3 text-center">
        <p className="text-lg font-semibold">You're all set! 🎉</p>
        <p>Start a game and put your skills to the test.</p>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm font-semibold">Quick Recap:</p>
          <p className="text-sm">Bid → Choose Trump → Sit/Play → Win Tricks → Score Points</p>
          <p className="text-sm mt-2"><strong>Goal: Reach 0 points first!</strong></p>
        </div>
      </div>
    )
  }
];

export default function Tutorial({ open, onClose }: TutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{tutorialSteps[currentStep].title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground">
              {currentStep + 1}/{tutorialSteps.length}
            </span>
          </div>
        </DialogHeader>

        <div className="py-4">
          {tutorialSteps[currentStep].content}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button onClick={handleNext}>
            {currentStep === tutorialSteps.length - 1 ? (
              "Start Playing!"
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
