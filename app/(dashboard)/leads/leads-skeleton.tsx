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

export function LeadsSkeleton() {
  return (
    <Card className="w-full overflow-hidden transition-all duration-500 ease-in-out">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-8 w-[150px]" />
        </div>
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </CardHeader>
      <CardContent className="px-6">
        <div className="space-y-6">
          {/* Search and Filter Bar */}
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-[350px]" />
            <div className="flex space-x-3">
              <Skeleton className="h-10 w-[130px]" />
              <Skeleton className="h-10 w-[130px]" />
              <Skeleton className="h-10 w-[130px]" />
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">
                    <Skeleton className="h-5 w-5" />
                  </TableHead>
                  <TableHead className="w-[180px]">
                    <Skeleton className="h-5 w-[120px]" />
                  </TableHead>
                  <TableHead className="w-[250px]">
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-[180px]" />
                      <Skeleton className="h-4 w-[120px]" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[250px]">
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-[180px]" />
                      <Skeleton className="h-4 w-[140px]" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <Skeleton className="h-5 w-[100px]" />
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <Skeleton className="h-5 w-[100px]" />
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <Skeleton className="h-5 w-[120px]" />
                  </TableHead>
                  <TableHead className="w-[120px] text-right">
                    <Skeleton className="h-5 w-[80px] ml-auto" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={index} className="group hover:bg-muted/50">
                    <TableCell className="w-[50px]">
                      <Skeleton className="h-5 w-5" />
                    </TableCell>
                    <TableCell className="w-[180px]">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                    </TableCell>
                    <TableCell className="w-[250px]">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </div>
                    </TableCell>
                    <TableCell className="w-[250px]">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-[180px]" />
                        <Skeleton className="h-4 w-[140px]" />
                      </div>
                    </TableCell>
                    <TableCell className="w-[150px]">
                      <Skeleton className="h-7 w-[120px] rounded-full" />
                    </TableCell>
                    <TableCell className="w-[150px]">
                      <Skeleton className="h-5 w-[100px]" />
                    </TableCell>
                    <TableCell className="w-[150px]">
                      <Skeleton className="h-5 w-[120px]" />
                    </TableCell>
                    <TableCell className="w-[120px]">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                        <Skeleton className="h-9 w-9 rounded-lg" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between py-4">
            <Skeleton className="h-9 w-[250px]" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex -space-x-px">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-9 w-9 rounded-none first:rounded-l-lg last:rounded-r-lg"
                  />
                ))}
              </div>
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
