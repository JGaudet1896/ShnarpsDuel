import { useShnarps } from '@/lib/stores/useShnarps';
import { Card, CardContent } from '../ui/card';

export function TurnTimer() {
  const { turnTimeRemaining, multiplayerMode } = useShnarps();

  // Only show in multiplayer
  if (multiplayerMode !== 'online' || turnTimeRemaining === null) {
    return null;
  }

  const percentage = Math.max(0, (turnTimeRemaining / 30) * 100);
  const isLowTime = turnTimeRemaining <= 10;
  const isVeryLowTime = turnTimeRemaining <= 5;

  return (
    <div className="fixed top-20 right-4 z-40">
      <Card className={`
        bg-gray-900 bg-opacity-95 border-2 transition-colors duration-300
        ${isVeryLowTime ? 'border-red-500 animate-pulse' : isLowTime ? 'border-yellow-500' : 'border-blue-500'}
      `}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">⏱️</div>
            <div>
              <div className={`text-2xl font-bold ${isVeryLowTime ? 'text-red-400' : isLowTime ? 'text-yellow-400' : 'text-blue-400'}`}>
                {turnTimeRemaining}s
              </div>
              <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isVeryLowTime ? 'bg-red-500' : isLowTime ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
