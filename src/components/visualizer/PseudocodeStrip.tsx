import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PseudocodeStrip() {
  return (
    <div className="border-t bg-card">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-muted/50">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="insert">Insert</TabsTrigger>
          <TabsTrigger value="topk">Top-K</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="m-0 p-4">
          <pre className="text-xs font-mono space-y-1 text-muted-foreground">
            <div>1. bucket = hash(movieId) % capacity</div>
            <div>2. chain = buckets[bucket]</div>
            <div>3. for each item in chain:</div>
            <div>4.   if item.id == movieId:</div>
            <div>5.     return item  // Found</div>
            <div>6. return null  // Not found</div>
          </pre>
        </TabsContent>

        <TabsContent value="insert" className="m-0 p-4">
          <pre className="text-xs font-mono space-y-1 text-muted-foreground">
            <div>1. bucket = hash(movie.id) % capacity</div>
            <div>2. chain = buckets[bucket]</div>
            <div>3. for item in chain:</div>
            <div>4.   if item.id == movie.id:</div>
            <div>5.     update item  // Already exists</div>
            <div>6.     return</div>
            <div>7. chain.append(movie)  // Insert new</div>
            <div>8. if loadFactor &gt; 0.75:</div>
            <div>9.   resize and rehash all items</div>
          </pre>
        </TabsContent>

        <TabsContent value="topk" className="m-0 p-4">
          <pre className="text-xs font-mono space-y-1 text-muted-foreground">
            <div>1. result = []</div>
            <div>2. reverseInOrder(root):  // Right → Node → Left</div>
            <div>3.   if node == null or len(result) &gt;= k:</div>
            <div>4.     return</div>
            <div>5.   reverseInOrder(node.right)</div>
            <div>6.   if len(result) &lt; k:</div>
            <div>7.     result.append(node.movie)</div>
            <div>8.   reverseInOrder(node.left)</div>
            <div>9. return result</div>
          </pre>
        </TabsContent>
      </Tabs>
    </div>
  );
}
