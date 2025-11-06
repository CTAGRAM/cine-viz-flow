import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Shuffle, Sparkles, RotateCw } from "lucide-react";
import { RandomBook, getRandomBook, getRandomBooks } from "@/lib/randomBooks";
import { toast } from "sonner";

interface BookQuickFillProps {
  onFillBook: (book: RandomBook) => void;
}

export function BookQuickFill({ onFillBook }: BookQuickFillProps) {
  const [suggestions, setSuggestions] = useState<RandomBook[]>(() => getRandomBooks(5));

  const handleUseSuggestion = (book: RandomBook) => {
    onFillBook(book);
    toast.success(`Form filled with "${book.title}"`);
  };

  const handleFillRandom = () => {
    const book = getRandomBook();
    onFillBook(book);
    toast.success(`Random book selected: "${book.title}"`);
  };

  const handleRefreshSuggestions = () => {
    setSuggestions(getRandomBooks(5));
    toast.success("New suggestions loaded");
  };

  return (
    <Card className="p-6 border-2 border-dashed border-primary/20 bg-primary/5">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Quick Fill with Random Book
            </h3>
            <p className="text-sm text-muted-foreground">
              Select a book from suggestions or get a random one instantly
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSuggestions}
            className="gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={handleFillRandom}
            className="gap-2"
          >
            <Shuffle className="w-4 h-4" />
            Fill Random Book
          </Button>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-4">
            {suggestions.map((book) => (
              <Card
                key={book.id}
                className="inline-block w-[200px] cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleUseSuggestion(book)}
              >
                <div className="p-3 space-y-2">
                  <div className="aspect-[2/3] bg-muted rounded overflow-hidden">
                    <img
                      src={book.posterUrl}
                      alt={book.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = `https://via.placeholder.com/200x300/1a1a1a/ffffff?text=${encodeURIComponent(book.title)}`;
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold line-clamp-2 leading-tight">
                      {book.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">
                      {book.author}
                    </p>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                        {book.subject}
                      </span>
                      <span className="text-muted-foreground">★ {book.rating}</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full text-xs h-7">
                    Use This
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </Card>
  );
}
