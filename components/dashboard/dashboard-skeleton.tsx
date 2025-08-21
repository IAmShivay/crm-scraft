// File: /components/dashboard/dashboard-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="grid grid-rows-2 md:grid-rows-[25%_75%] align-center gap-0 md:gap-2 px-2 py-6 w-auto overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 h-[322px] md:h-auto">
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6 flex items-center justify-between space-x-4 sm:space-x-6">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="min-w-0 md:flex-grow">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="w-full h-[250px] sm:h-[300px] flex items-center justify-center">
            <Skeleton className="h-[200px] w-full rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
