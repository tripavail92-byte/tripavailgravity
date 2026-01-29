import { motion } from 'motion/react';
import type { QuickAction } from '../../modules/types/drawer';

interface QuickActionsProps {
  actions: QuickAction[];
  onActionClick: (actionId: string) => void;
  animationDelay?: number;
}

export function QuickActions({ actions, onActionClick, animationDelay = 0.2 }: QuickActionsProps) {
  if (actions.length === 0) return null;

  return (
    <motion.div
      className="mb-4 space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
    >
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          onClick={() => onActionClick(action.id)}
          className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 group text-left"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: animationDelay + 0.1 + index * 0.05 }}
        >
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: action.color }}
          >
            <action.icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-foreground">{action.label}</span>
            <p className="text-xs text-gray-600 dark:text-muted-foreground">{action.description}</p>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}