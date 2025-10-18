import { useState } from 'react';
import { useSettings } from '@/lib/stores/useSettings';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Trophy, Volume2, Bot, Users } from 'lucide-react';

interface SettingsProps {
  open: boolean;
  onClose: () => void;
}

export function Settings({ open, onClose }: SettingsProps) {
  const settings = useSettings();
  
  const [moneyPerPoint, setMoneyPerPoint] = useState(settings.moneyPerPoint);
  const [moneyPerPunt, setMoneyPerPunt] = useState(settings.moneyPerPunt);
  const [startingScore, setStartingScore] = useState(settings.startingScore);
  const [winningScore, setWinningScore] = useState(settings.winningScore);
  const [eliminationScore, setEliminationScore] = useState(settings.eliminationScore);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [musicEnabled, setMusicEnabled] = useState(settings.musicEnabled);
  const [defaultAIDifficulty, setDefaultAIDifficulty] = useState(settings.defaultAIDifficulty);
  const [turnTimeLimit, setTurnTimeLimit] = useState(settings.turnTimeLimit);
  const [autoPlayDisconnected, setAutoPlayDisconnected] = useState(settings.autoPlayDisconnected);

  const handleSave = () => {
    settings.updateSettings({
      moneyPerPoint,
      moneyPerPunt,
      startingScore,
      winningScore,
      eliminationScore,
      soundEnabled,
      musicEnabled,
      defaultAIDifficulty,
      turnTimeLimit,
      autoPlayDisconnected
    });
    onClose();
  };

  const handleReset = () => {
    settings.resetToDefaults();
    setMoneyPerPoint(0.25);
    setMoneyPerPunt(1.00);
    setStartingScore(16);
    setWinningScore(0);
    setEliminationScore(32);
    setSoundEnabled(true);
    setMusicEnabled(true);
    setDefaultAIDifficulty('hard');
    setTurnTimeLimit(30);
    setAutoPlayDisconnected(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-100">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900">Game Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stakes" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stakes">
              <DollarSign className="w-4 h-4 mr-2" />
              Stakes
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Trophy className="w-4 h-4 mr-2" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="multiplayer">
              <Users className="w-4 h-4 mr-2" />
              Online
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
                <Label htmlFor="moneyPerPoint" className="text-base text-gray-900">Coins Per Point</Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🪙</span>
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
                  Coins losers pay per point difference to the winner
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moneyPerPunt" className="text-base text-gray-900">Coins Per Punt</Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🪙</span>
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
                  Coins losers pay per successful punt to the winner
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startingScore" className="text-base text-gray-900">Starting Score</Label>
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
                <Label htmlFor="winningScore" className="text-base text-gray-900">Winning Score</Label>
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
                <Label htmlFor="eliminationScore" className="text-base text-gray-900">Elimination Score</Label>
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

          <TabsContent value="multiplayer" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="turnTimeLimit" className="text-base text-gray-900">Turn Time Limit</Label>
                <Input
                  id="turnTimeLimit"
                  type="number"
                  min="0"
                  max="120"
                  value={turnTimeLimit}
                  onChange={(e) => setTurnTimeLimit(parseInt(e.target.value) || 0)}
                  className="max-w-[150px]"
                />
                <p className="text-sm text-muted-foreground">
                  Seconds per turn (0 = no limit). Default is 30 seconds.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoPlayDisconnected" className="text-base text-gray-900">Auto-Play for Disconnected</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically play safe moves for disconnected or timed-out players
                  </p>
                </div>
                <Switch
                  id="autoPlayDisconnected"
                  checked={autoPlayDisconnected}
                  onCheckedChange={setAutoPlayDisconnected}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="audio" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="soundEnabled" className="text-base text-gray-900">Sound Effects</Label>
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
                  <Label htmlFor="musicEnabled" className="text-base text-gray-900">Background Music</Label>
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
                <Label htmlFor="aiDifficulty" className="text-base text-gray-900">Default AI Difficulty</Label>
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
