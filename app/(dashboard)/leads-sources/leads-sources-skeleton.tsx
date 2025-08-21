import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function LeadSourcesSkeleton() {
  return (
    <Card className="w-full overflow-hidden transition-all duration-500 ease-in-out">
      <CardHeader className="flex flex-row items-center justify-between bg-gray-100 dark:bg-gray-800 md:bg-white md:dark:bg-gray-900">
        <div className="flex gap-6">
          <div className="md:hidden lg:hidden w-2 h-2 pb-4">
            <Skeleton className="h-6 w-6" />
          </div>
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-5 w-[200px]" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-5 w-[100px]" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-6 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[100px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-[200px]" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-10" />
                        <Skeleton className="h-6 w-[80px]" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-300 p-2">
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-[150px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
