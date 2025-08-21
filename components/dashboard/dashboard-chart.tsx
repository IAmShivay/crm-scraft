// File: /components/dashboard/dashboard-chart.tsx
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState, memo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardChartProps {
  data: Array<{
    month: string;
    sales: number;
  }>;
  isLoading?: boolean;
}

// Use memo to prevent unnecessary re-renders
const DashboardChart = memo(function DashboardChart({
  data,
  isLoading = false,
}: DashboardChartProps) {
  const [mounted, setMounted] = useState(false);

  // Only render the chart on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="w-full h-[300px] sm:h-[350px] flex items-center justify-center">
        <Skeleton className="h-[250px] w-full rounded" />
      </div>
    );
  }

  // If no data, show a message
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] sm:h-[350px] flex items-center justify-center">
        <p className="text-muted-foreground">No sales data available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] sm:h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="horizontal"
          margin={{ top: 5, right: 30, bottom: 5, left: 90 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            cursor={{ fill: "rgba(136, 132, 216, 0.1)" }}
            contentStyle={{
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              border: "none",
              padding: "8px 12px",
            }}
          />
          <Bar
            dataKey="sales"
            fill="#8884d8"
            radius={[0, 4, 4, 0]}
            animationDuration={750}
            animationEasing="ease-in-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

export default DashboardChart;
