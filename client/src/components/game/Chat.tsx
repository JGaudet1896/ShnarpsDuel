import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MessageCircle, X, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
  isSystem?: boolean;
}

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentPlayerName: string;
}

export default function Chat({ messages, onSendMessage, currentPlayerName }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 rounded-full h-14 w-14 p-0 shadow-lg"
        variant="default"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 md:w-96 shadow-2xl bg-white">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Chat</CardTitle>
        <Button
          onClick={() => setIsOpen(false)}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Messages */}
        <div className="h-64 overflow-y-auto space-y-2 bg-gray-50 rounded-lg p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No messages yet. Say hello!
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`text-sm ${
                  msg.isSystem
                    ? 'text-center text-muted-foreground italic'
                    : msg.playerName === currentPlayerName
                    ? 'text-right'
                    : 'text-left'
                }`}
              >
                {!msg.isSystem && (
                  <p className="font-semibold text-xs mb-0.5">
                    {msg.playerName}
                  </p>
                )}
                <p
                  className={`inline-block rounded-lg px-3 py-1.5 ${
                    msg.isSystem
                      ? 'bg-gray-200 text-gray-600'
                      : msg.playerName === currentPlayerName
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-900'
                  }`}
                >
                  {msg.message}
                </p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
