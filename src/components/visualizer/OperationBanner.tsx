import { OperationMetadata } from '@/lib/visualizationEngine';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Star } from 'lucide-react';

interface OperationBannerProps {
  operation: OperationMetadata;
  progress: number;
  currentStep: number;
  totalSteps: number;
}

export function OperationBanner({ operation, progress, currentStep, totalSteps }: OperationBannerProps) {
  const getIcon = () => {
    switch (operation.type) {
      case 'ADD': return <Plus className="h-5 w-5" />;
      case 'SEARCH': return <Search className="h-5 w-5" />;
      case 'UPDATE': return <Edit className="h-5 w-5" />;
      case 'DELETE': return <Trash2 className="h-5 w-5" />;
      case 'TOP_K': return <Star className="h-5 w-5" />;
    }
  };

  const getColor = () => {
    switch (operation.type) {
      case 'ADD': return 'bg-green-500';
      case 'SEARCH': return 'bg-blue-500';
      case 'UPDATE': return 'bg-yellow-500';
      case 'DELETE': return 'bg-red-500';
      case 'TOP_K': return 'bg-purple-500';
    }
  };

  const getLabel = () => {
    switch (operation.type) {
      case 'ADD': return 'Adding Movie';
      case 'SEARCH': return 'Searching Movie';
      case 'UPDATE': return 'Updating Movie';
      case 'DELETE': return 'Deleting Movie';
      case 'TOP_K': return 'Finding Top Rated';
    }
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="border-b bg-gradient-to-r from-card to-muted/30 px-6 py-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`${getColor()} text-white p-2 rounded-lg`}>
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">{getLabel()}</h2>
              <Badge variant="outline" className="font-mono">
                {operation.type}
              </Badge>
            </div>
            {operation.movieName && (
              <p className="text-sm text-muted-foreground">
                {operation.movieName} {operation.movieId && `(${operation.movieId})`}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-medium">
            Step {currentStep} of {totalSteps}
          </div>
          <div className="text-xs text-muted-foreground">
            {progress.toFixed(0)}% complete
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
}
