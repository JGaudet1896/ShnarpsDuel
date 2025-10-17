import { useState } from 'react';
import { useSettings } from '@/lib/stores/useSettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Trophy, Volume2, Bot } from 'lucide-react';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

export function Settings({ open, onClose }: SettingsProps) {
  const settings = useSettings();
  
  const [moneyPerPoint, setMoneyPerPoint] = useState(settings.moneyPerPoint);
  const [moneyPerPunt, setMoneyPerPunt] = useState(settings.moneyPerPunt);
  const [startingWallet, setStartingWallet] = useState(settings.startingWallet);
  const [startingScore, setStartingScore] = useState(settings.startingScore);
  const [winningScore, setWinningScore] = useState(settings.winningScore);
  const [eliminationScore, setEliminationScore] = useState(settings.eliminationScore);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [musicEnabled, setMusicEnabled] = useState(settings.musicEnabled);
  const [defaultAIDifficulty, setDefaultAIDifficulty] = useState(settings.defaultAIDifficulty);

  const handleSave = () => {
    settings.updateSettings({
      moneyPerPoint,
      moneyPerPunt,
      startingWallet,
      startingScore,
      winningScore,
      eliminationScore,
      soundEnabled,
      musicEnabled,
      defaultAIDifficulty
    });
    onClose();
  };

  const handleReset = () => {
    settings.resetToDefaults();
    setMoneyPerPoint(0.25);
    setMoneyPerPunt(1.00);
    setStartingWallet(100);
    setStartingScore(16);
    setWinningScore(0);
    setEliminationScore(32);
    setSoundEnabled(true);
    setMusicEnabled(true);
    setDefaultAIDifficulty('hard');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Game Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stakes" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stakes">
              <DollarSign className="w-4 h-4 mr-2" />
              Stakes
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Trophy className="w-4 h-4 mr-2" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="audio">
              <Volume2 className="w-4 h-4 mr-2" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Bot className="w-4 h-4 mr-2" />
              AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stakes" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="moneyPerPoint" className="text-base">Money Per Point</Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg">$</span>
                  <Input
                    id="moneyPerPoint"
                    type="number"
                    step="0.05"
                    min="0"
                    value={moneyPerPoint}
                    onChange={(e) => setMoneyPerPoint(parseFloat(e.target.value) || 0)}
                    className="max-w-[150px]"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Amount losers pay per point difference to the winner
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moneyPerPunt" className="text-base">Money Per Punt</Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg">$</span>
                  <Input
                    id="moneyPerPunt"
                    type="number"
                    step="0.25"
                    min="0"
                    value={moneyPerPunt}
                    onChange={(e) => setMoneyPerPunt(parseFloat(e.target.value) || 0)}
                    className="max-w-[150px]"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Amount losers pay per successful punt to the winner
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startingWallet" className="text-base">Starting Wallet</Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg">$</span>
                  <Input
                    id="startingWallet"
                    type="number"
                    step="10"
                    min="0"
                    value={startingWallet}
                    onChange={(e) => setStartingWallet(parseFloat(e.target.value) || 0)}
                    className="max-w-[150px]"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Amount of money each player starts with
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startingScore" className="text-base">Starting Score</Label>
                <Input
                  id="startingScore"
                  type="number"
                  min="1"
                  max="50"
                  value={startingScore}
                  onChange={(e) => setStartingScore(parseInt(e.target.value) || 16)}
                  className="max-w-[150px]"
                />
                <p className="text-sm text-muted-foreground">
                  Points each player starts with
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="winningScore" className="text-base">Winning Score</Label>
                <Input
                  id="winningScore"
                  type="number"
                  min="0"
                  max="50"
                  value={winningScore}
                  onChange={(e) => setWinningScore(parseInt(e.target.value) || 0)}
                  className="max-w-[150px]"
                />
                <p className="text-sm text-muted-foreground">
                  First player to reach this score wins
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="eliminationScore" className="text-base">Elimination Score</Label>
                <Input
                  id="eliminationScore"
                  type="number"
                  min="1"
                  max="100"
                  value={eliminationScore}
                  onChange={(e) => setEliminationScore(parseInt(e.target.value) || 32)}
                  className="max-w-[150px]"
                />
                <p className="text-sm text-muted-foreground">
                  Players are eliminated when reaching this score
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audio" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="soundEnabled" className="text-base">Sound Effects</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sound effects for game actions
                  </p>
                </div>
                <Switch
                  id="soundEnabled"
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="musicEnabled" className="text-base">Background Music</Label>
                  <p className="text-sm text-muted-foreground">
                    Play background music during gameplay
                  </p>
                </div>
                <Switch
                  id="musicEnabled"
                  checked={musicEnabled}
                  onCheckedChange={setMusicEnabled}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aiDifficulty" className="text-base">Default AI Difficulty</Label>
                <Select value={defaultAIDifficulty} onValueChange={(value: any) => setDefaultAIDifficulty(value)}>
                  <SelectTrigger className="max-w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Default difficulty when adding AI players
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
