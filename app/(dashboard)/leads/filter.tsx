// import React from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Separator } from "@/components/ui/separator";
// import { X, Filter, Calendar, User, Phone, Mail, Tag } from "lucide-react";

// interface FilterComponentProps {
//   values: any;
//   onChange: (values: any) => void;
//   onReset: () => void;
//   owner: [];
//   status: [];
// }

// export const FilterComponent: React.FC<FilterComponentProps> = ({
//   values,
//   onChange,
//   onReset,
//   owner,
//   status
// }) => {
//   const updateFilter = (key: keyof any, value: string | boolean) => {
//     onChange({
//       ...values,
//       [key]: value === "all" ? "" : value,
//     });
//   };

//   return (
//     <Card className="mb-6 shadow-md">
//       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
//         <div className="flex items-center gap-2">
//           <Filter className="h-5 w-5 text-primary" />
//           <CardTitle className="text-lg font-semibold">Lead Filters</CardTitle>
//         </div>
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={onReset}
//           className="hover:bg-destructive/10 hover:text-destructive"
//         >
//           <X className="mr-2 h-4 w-4" />
//           Clear All
//         </Button>
//       </CardHeader>
//       <CardContent className="pt-6">
//         <div className="grid gap-6">
//           {/* Basic Filters Section */}
//           <div className="grid gap-4 md:grid-cols-3">
//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 <User className="h-4 w-4 text-muted-foreground" />
//                 Owner
//               </Label>
//               <Input
//                 id="owner"
//                 placeholder="Filter by owner name"
//                 value={values.owner}
//                 onChange={(e) => updateFilter("owner", e.target.value)}
//                 className="w-full"
//               />
//             </div>

//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 <Tag className="h-4 w-4 text-muted-foreground" />
//                 Status
//               </Label>
//               <Select
//                 value={values.status}
//                 onValueChange={(value) => updateFilter("status", value)}
//               >
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder="Select status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Select">All Statuses</SelectItem>
//                   <SelectItem value="Pending">Pending</SelectItem>
//                   <SelectItem value="Completed">Completed</SelectItem>
//                   <SelectItem value="Not Completed">Not Completed</SelectItem>

//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 <Phone className="h-4 w-4 text-muted-foreground" />
//                 Contact Method
//               </Label>
//               <Select
//                 value={values.contact_method}
//                 onValueChange={(value) => updateFilter("contact_method", value)}
//               >
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder="Select method" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Select">All Methods</SelectItem>
//                   <SelectItem value="WhatsApp">WhatsApp</SelectItem>
//                   <SelectItem value="SMS">SMS</SelectItem>
//                   <SelectItem value="Call">Call</SelectItem>
//                   <SelectItem value="Email">Email</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           <Separator className="my-2" />

//           {/* Advanced Filters Section */}
//           <div className="grid gap-4 md:grid-cols-3">
//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 <Mail className="h-4 w-4 text-muted-foreground" />
//                 Contact Type
//               </Label>
//               <Select
//                 value={values.contactType}
//                 onValueChange={(value) => updateFilter("contactType", value)}
//               >
//                 <SelectTrigger className="w-full">
//                   <SelectValue placeholder="Select type" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="Select">All Types</SelectItem>
//                   <SelectItem value="phone">Phone</SelectItem>
//                   <SelectItem value="email">Email</SelectItem>
//                   <SelectItem value="id">ID</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             <div className="space-y-2">
//               <Label className="flex items-center gap-2">
//                 <Calendar className="h-4 w-4 text-muted-foreground" />
//                 Date Range
//               </Label>
//               <div className="grid grid-cols-2 gap-2">
//                 <Input
//                   id="startDate"
//                   type="date"
//                   value={values.startDate}
//                   onChange={(e) => updateFilter("startDate", e.target.value)}
//                   className="w-full"
//                 />
//                 <Input
//                   id="endDate"
//                   type="date"
//                   value={values.endDate}
//                   onChange={(e) => updateFilter("endDate", e.target.value)}
//                   className="w-full"
//                 />
//               </div>
//             </div>

//             <div className="flex items-start space-x-2 pt-8">
//               <Checkbox
//                 id="showDuplicates"
//                 checked={values.showDuplicates}
//                 onCheckedChange={(checked) =>
//                   updateFilter("showDuplicates", checked as boolean)
//                 }
//                 className="mt-0.5"
//               />
//               <Label
//                 htmlFor="showDuplicates"
//                 className="font-normal cursor-pointer text-sm text-muted-foreground"
//               >
//                 Show duplicate leads only
//               </Label>
//             </div>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default FilterComponent;

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  Filter,
  Mail,
  Phone,
  Tag,
  User,
  Users,
  X,
} from "lucide-react";
import React from "react";

interface FilterComponentProps {
  values: any;
  onChange: (values: any) => void;
  onReset: () => void;
  owner: { id: string; name: string }[]; // Added proper type for owner
  status: { id: string; name: string }[]; // Added proper type for status
  leadSources: { id: string; name: string }[]; // Added leadsSource
}

export const FilterComponent: React.FC<FilterComponentProps> = ({
  values,
  onChange,
  onReset,
  owner,
  status,
  leadSources,
}) => {
  const updateFilter = (key: keyof any, value: string | boolean) => {
    onChange({
      ...values,
      [key]: value === "all" ? "" : value,
    });
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Lead Filters</CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="mr-2 h-4 w-4" />
          Clear All
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6">
          {/* Basic Filters Section */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Owner
              </Label>
              <Select
                value={values.owner}
                onValueChange={(value) => updateFilter("owner", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  {owner
                    .filter(
                      (status: { name: string | null }) =>
                        status.name && status.name !== "null"
                    )
                    .map((item) => (
                      <SelectItem key={item.id} value={item.name}>
                        {item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Leads sources
              </Label>
              <Select
                value={values.leadsSource}
                onValueChange={(value) => updateFilter("leadsSource", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select leads source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All leads sources</SelectItem>
                  {leadSources.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Status
              </Label>
              <Select
                value={values.status}
                onValueChange={(value) => updateFilter("status", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Arrived">Arrived</SelectItem>{" "}
                  {/* New option added */}
                  {status.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Contact Method
              </Label>
              <Select
                value={values.contact_method}
                onValueChange={(value) => updateFilter("contact_method", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Advanced Filters Section */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Contact Type
              </Label>
              <Select
                value={values.contactType}
                onValueChange={(value) => updateFilter("contactType", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="id">ID</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date Range
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  id="startDate"
                  type="date"
                  value={values.startDate}
                  onChange={(e) => updateFilter("startDate", e.target.value)}
                  className="w-full"
                />
                <Input
                  id="endDate"
                  type="date"
                  value={values.endDate}
                  onChange={(e) => updateFilter("endDate", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-8">
              <Checkbox
                id="showDuplicates"
                checked={values.showDuplicates}
                onCheckedChange={(checked) =>
                  updateFilter("showDuplicates", checked as boolean)
                }
                className="mt-0.5"
              />
              <Label
                htmlFor="showDuplicates"
                className="font-normal cursor-pointer text-sm text-muted-foreground"
              >
                Show duplicate leads only
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterComponent;
