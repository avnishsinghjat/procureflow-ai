import { STAGES, STAGE_COLORS, type Stage } from '@/lib/types';

interface PipelineRibbonProps {
  currentStage?: Stage;
  compact?: boolean;
}

export function PipelineRibbon({ currentStage, compact }: PipelineRibbonProps) {
  return (
    <div className="flex items-center gap-0.5 w-full overflow-x-auto">
      {STAGES.map((stage, i) => {
        const isActive = currentStage === stage;
        const isPast = currentStage ? STAGES.indexOf(currentStage) > i : false;
        return (
          <div
            key={stage}
            className={`
              relative flex items-center justify-center font-medium transition-all
              ${compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-2 text-xs'}
              ${isActive
                ? `${STAGE_COLORS[stage]} text-primary-foreground shadow-md scale-105 z-10`
                : isPast
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-card text-muted-foreground border border-border'
              }
              ${i === 0 ? 'rounded-l-lg' : ''}
              ${i === STAGES.length - 1 ? 'rounded-r-lg' : ''}
              flex-1 min-w-0 whitespace-nowrap
            `}
          >
            {stage}
          </div>
        );
      })}
    </div>
  );
}
