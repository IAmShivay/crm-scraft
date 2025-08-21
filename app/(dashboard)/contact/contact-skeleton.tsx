import { Skeleton } from "@/components/ui/skeleton";

export function ContactSkeleton() {
  return (
    <div className="px-4 py-6 md:ml-[250px] w-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <Skeleton className="h-10 w-full md:w-[300px]" />
        <Skeleton className="h-10 w-full md:w-[180px]" />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <div className="w-full overflow-x-auto">
          {/* Table Header */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4">
            <div className="grid grid-cols-7 gap-4">
              {[...Array(7)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          </div>

          {/* Table Body */}
          {[...Array(5)].map((_, rowIndex) => (
            <div key={rowIndex} className="border-t p-4">
              <div className="grid grid-cols-7 gap-4">
                {[...Array(7)].map((_, colIndex) => (
                  <Skeleton key={colIndex} className="h-6 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-8 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
