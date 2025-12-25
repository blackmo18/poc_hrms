import { TableRow, TableCell, TableBody } from '@/app/components/ui/table';

interface LoadingSkeletonProps {
  rows?: number;
  columns: number;
  hasActions?: boolean;
  actionButtons?: number;
}

export default function LoadingSkeleton({
  rows = 5,
  columns,
  hasActions = false,
  actionButtons = 2
}: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`loading-${rowIndex}`}>
          {Array.from({ length: columns }).map((_, colIndex) => {
            // Check if this is the last column and we have actions
            const isActionColumn = hasActions && colIndex === columns - 1;

            if (isActionColumn) {
              return (
                <TableCell key={colIndex} className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    {Array.from({ length: actionButtons }).map((_, btnIndex) => (
                      <div
                        key={btnIndex}
                        className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                </TableCell>
              );
            }

            return (
              <TableCell key={colIndex} className={colIndex === 0 ? "px-5 py-4" : "px-4 py-3"}>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </TableCell>
            );
          })}
        </TableRow>
      ))}
      </>
  );
}
