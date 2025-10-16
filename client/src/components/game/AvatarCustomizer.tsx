import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

export interface PlayerAvatar {
  color: string;
  icon: string;
}

const AVATAR_COLORS = [
  { name: 'Red', value: '#EF4444', light: '#FEE2E2' },
  { name: 'Blue', value: '#3B82F6', light: '#DBEAFE' },
  { name: 'Green', value: '#10B981', light: '#D1FAE5' },
  { name: 'Purple', value: '#8B5CF6', light: '#EDE9FE' },
  { name: 'Orange', value: '#F97316', light: '#FFEDD5' },
  { name: 'Pink', value: '#EC4899', light: '#FCE7F3' },
  { name: 'Yellow', value: '#EAB308', light: '#FEF9C3' },
  { name: 'Teal', value: '#14B8A6', light: '#CCFBF1' },
];

const AVATAR_ICONS = [
  '👤', '😀', '😎', '🤠', '🎮', '🎯', '🎲', '🃏',
  '⭐', '🔥', '💎', '🎪', '🎨', '🎭', '🏆', '👑',
  '🦊', '🐼', '🦁', '🐯', '🐻', '🐸', '🦉', '🐧',
];

interface AvatarCustomizerProps {
  open: boolean;
  onClose: () => void;
  currentAvatar: PlayerAvatar;
  onSave: (avatar: PlayerAvatar) => void;
}

export default function AvatarCustomizer({
  open,
  onClose,
  currentAvatar,
  onSave,
}: AvatarCustomizerProps) {
  const [selectedColor, setSelectedColor] = useState(currentAvatar.color);
  const [selectedIcon, setSelectedIcon] = useState(currentAvatar.icon);

  const handleSave = () => {
    onSave({ color: selectedColor, icon: selectedIcon });
    onClose();
  };

  const selectedColorData = AVATAR_COLORS.find(c => c.value === selectedColor) || AVATAR_COLORS[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Customize Your Avatar</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
              style={{ 
                backgroundColor: selectedColorData.light,
                border: `4px solid ${selectedColor}`
              }}
            >
              <span className="text-4xl">{selectedIcon}</span>
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Choose Color:</h3>
            <div className="grid grid-cols-4 gap-3">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`h-12 rounded-lg transition-all ${
                    selectedColor === color.value
                      ? 'ring-4 ring-offset-2 ring-blue-500 scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Choose Icon:</h3>
            <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
              {AVATAR_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`h-12 w-12 flex items-center justify-center text-2xl rounded-lg transition-all ${
                    selectedIcon === icon
                      ? 'bg-blue-500 text-white scale-110'
                      : 'bg-white hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Avatar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Avatar display component for use throughout the app
interface AvatarProps {
  avatar: PlayerAvatar;
  size?: 'sm' | 'md' | 'lg';
  showBorder?: boolean;
}

export function Avatar({ avatar, size = 'md', showBorder = true }: AvatarProps) {
  const colorData = AVATAR_COLORS.find(c => c.value === avatar.color) || AVATAR_COLORS[0];
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center ${
        showBorder ? 'border-2' : ''
      }`}
      style={{
        backgroundColor: colorData.light,
        borderColor: showBorder ? avatar.color : 'transparent',
      }}
    >
      <span>{avatar.icon}</span>
    </div>
  );
}
