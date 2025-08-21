"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useChangeWebhookStatusMutation,
  useDeleteWebhookMutation,
  useGetWebhooksQuery,
  useUpdateWebhookMutation,
  useWebhookMutation,
} from "@/lib/store/services/webhooks";
import { useGetActiveWorkspaceQuery } from "@/lib/store/services/workspace";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import * as z from "zod";
import { LeadSourcesSkeleton } from "./leads-sources-skeleton";

// Zod validation schema
const sourceSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  type: z.string().min(2, { message: "Type must be at least 2 characters" }),
  app_type: z.string().min(1, { message: "Please select an app type" }),
  description: z.string().optional(),
  status: z.boolean().optional(),
});

export type Source = {
  webhook?: any;
  created_at?: any;
  description?: any;
  id: any;
  name: any;
  status: any;
  type: any;
  app_type?: any;
  user_id?: any;
  webhook_url?: any;
  workspace_id?: any;
};

export function LeadSourceManagerClient() {
  const isCollapsed = useSelector((state: any) => state.sidebar.isCollapsed);

  const reduxActiveWorkspaceId = useSelector(
    (state: any) => state.sidebar.activeWorkspaceId
  );

  const workspaceChangeCounter = useSelector(
    (state: any) => state.sidebar.workspaceChangeCounter
  );

  const prevWorkspaceChangeCounterRef = useRef<any>(workspaceChangeCounter);

  const {
    data: workspacesData,
    isLoading: workspaceLoading,
    error: workspaceError,
    refetch: refetchWorkspace,
  } = useGetActiveWorkspaceQuery<any>(undefined);

  const [changeWebhookStatus] = useChangeWebhookStatusMutation();
  const [webhook, { isLoading: isWebhookAdded, error: webhookAddingError }] =
    useWebhookMutation();
  const [deleteWebhook, { isLoading: isDeleted, error: deleteError }] =
    useDeleteWebhookMutation();
  const [updateWebhook, { isLoading: isUpdated, error: updateError }] =
    useUpdateWebhookMutation();

  const {
    data: webhooks,
    isLoading,
    isError,
    error,
    refetch: refetchWebhooks,
  } = useGetWebhooksQuery<any>({ id: workspacesData?.data.id });

  const webhooksData = webhooks?.data;
  const [sources, setSources] = useState<Source[]>(webhooksData || []);
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<any>(null);
  const [expandedRow, setExpandedRow] = useState<any>(null);

  useEffect(() => {
    if (workspaceChangeCounter > prevWorkspaceChangeCounterRef.current) {
      prevWorkspaceChangeCounterRef.current = workspaceChangeCounter;

      console.log(
        "Workspace changed in Redux, refetching lead sources data..."
      );

      refetchWorkspace();
      if (workspacesData?.data.id) {
        refetchWebhooks();
      }
    }
  }, [
    workspaceChangeCounter,
    refetchWorkspace,
    refetchWebhooks,
    workspacesData?.data.id,
  ]);

  const toggleRow = (id: any) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  useEffect(() => {
    if (webhooks?.data) {
      setSources(webhooks.data);
    }
  }, [webhooks]);

  console.log("Lead Sources Data:", {
    workspaceId: workspacesData?.data.id,
    reduxActiveWorkspaceId,
    workspaceChangeCounter,
    webhooksData,
  });

  const form = useForm<any>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      name: "",
      type: "",
      app_type: "",
      description: "",
    },
  });

  const resetDialog = () => {
    form.reset({
      name: "",
      type: "",
      app_type: "",
      description: "",
    });
    setSelectedSource(null);
    setDialogMode(null);
  };

  const openCreateDialog = () => {
    if (workspacesData === undefined) {
      toast.error("No workspace selected. Please select a workspace");
      return; // Prevent dialog from opening
    }
    resetDialog();
    setDialogMode("create");
  };

  const openEditDialog = (source: any) => {
    form.reset({
      name: source.name,
      type: source.type,
      app_type: source.app_type || "",
      description: source.description,
    });
    setSelectedSource(source);
    setDialogMode("edit");
  };

  const openDeleteDialog = (source: any) => {
    setSelectedSource(source);
    setDialogMode("delete");
  };

  const copyWebhook = (webhook: any) => {
    navigator.clipboard.writeText(webhook);
    toast.success("Webhook URL copied to clipboard");
  };

  // Function to toggle webhook status
  const toggleWebhookStatus = async (sourceId: any) => {
    try {
      const currentStatus = sources.find(
        (source) => source.id === sourceId
      )?.status;
      const result = await changeWebhookStatus({
        id: sourceId,
        status: !currentStatus,
      }).unwrap();

      // If the API call succeeds, update local state and show success message
      setSources(
        sources.map((source) =>
          source.id === sourceId
            ? { ...source, status: !source.status }
            : source
        )
      );
      toast.success("Webhook status updated successfully");
    } catch (error: any) {
      // Handle specific API error
      const errorMessage =
        error.data?.error || "Failed to update webhook status";
      toast.error(errorMessage);
    }
  };

  const onSubmit = async (data: any) => {
    if (dialogMode === "create") {
      try {
        // Validate workspace data before proceeding
        if (!workspacesData?.data.id) {
          toast.error("No workspace selected. Please select a workspace");
          return;
        }

        const newId: any = uuidv4().toString();
        const newWebhook = `${
          process.env.NEXT_PUBLIC_BASE_URL
        }/leads?action=${"getLeads"}&sourceId=${newId}&workspaceId=${
          workspacesData?.data.id
        }&appType=${data.app_type}`;

        const response = await webhook({
          status: true,
          type: data.type,
          name: data.name,
          app_type: data.app_type,
          webhook_url: newWebhook,
          workspace_id: workspacesData.data.id,
        }).unwrap();

        // Only update local state if API call succeeds
        setSources((prevSources) => [
          ...prevSources,
          {
            id: newId,
            ...data,
            webhook_url: newWebhook,
            description: data.description || "",
            workspace_id: workspacesData.data.id,
            status: true,
          },
        ]);
        refetchWebhooks();
        toast.success("Lead source created successfully");
        resetDialog();
      } catch (error: any) {
        // Handle specific error cases
        if (error.status === 409) {
          toast.error("A lead source with this name already exists");
        } else if (error.status === 403) {
          toast.error("You don't have permission to create a lead source");
        } else {
          const errorMessage =
            error.data?.error || "Failed to create lead source";
          toast.error(errorMessage);
        }
      }
    } else if (dialogMode === "edit" && selectedSource) {
      try {
        await updateWebhook({ data, id: selectedSource.id }).unwrap();

        const updatedSources = sources.map((source) =>
          source.id === selectedSource.id
            ? {
                ...source,
                ...data,
                description: data.description || "",
              }
            : source
        );
        setSources(updatedSources);
        toast.success("Lead source updated successfully");
        resetDialog();
      } catch (error: any) {
        const errorMessage =
          error.data?.error || "Failed to update lead source";
        toast.error(errorMessage);
      }
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await deleteWebhook({ id }).unwrap();
      resetDialog();
      setSources(sources.filter((source) => source.id !== id));
      toast.success("Lead source deleted successfully");
    } catch (error: any) {
      // Handle specific API error
      const errorMessage = error.data?.error || "Failed to delete lead source";
      toast.error(errorMessage);
    }
  };

  if (workspaceLoading || isLoading) {
    return <LeadSourcesSkeleton />;
  }

  return (
    <div
      className={`grid align-center gap-0 md:gap-2 md:rounded-none rounded-[4px] transition-all duration-500 ease-in-out px-2 py-6 w-auto 
      ${isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"}
      overflow-hidden `}
    >
      <Card className="w-full rounded-[16px] md:rounded-[4px] overflow-hidden ">
        {/* Header: Move Title and Button to opposite ends on mobile */}
        <CardHeader className="flex flex-row justify-between items-center bg-gray-100 dark:bg-gray-800 md:bg-white md:dark:bg-gray-900">
          <div className="flex gap-6">
            <div className="md:hidden lg:hidden w-2 h-2 pb-4 text-gray-700 dark:text-gray-300">
              <Users />
            </div>
            <CardTitle className="text-sm md:text-xl lg:text-2xl text-gray-900 dark:text-white">
              Lead Sources
            </CardTitle>
          </div>
          <Button
            onClick={openCreateDialog}
            className="md:w-auto bg-primary dark:bg-primary-dark text-white dark:text-gray-700"
          >
            <Plus className="mr-2 h-3 w-3 text-md md:h-4 md:w-4 text-gray-700 dark:text-gray-700" />
            Add Source
          </Button>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className=" ">
                <TableRow>
                  <TableHead className="hidden md:table-cell">Name</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Count</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Processing Rate
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Qualification Rate
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Webhook
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="w-auto">
                {sources.map((source) => (
                  <React.Fragment key={source.id}>
                    {/* Mobile View (Show Only Name, Type, and Expand Button) */}
                    <TableRow className="flex md:hidden lg:hidden items-center justify-between border-b border-gray-300 p-2 last:border-none">
                      <div className="flex flex-col gap-0 md:hidden">
                        <div className="text-[1rem]">{source.name}</div>
                        <div className="text-gray-500">{source.type}</div>
                      </div>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleRow(source.id)}
                          className="h-8 w-8 border-none bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md"
                        >
                          {expandedRow === source.id ? (
                            <ChevronUp />
                          ) : (
                            <ChevronDown />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Details for Mobile */}
                    {expandedRow === source.id && (
                      <TableRow className="md:hidden lg:hidden">
                        <TableCell colSpan={3}>
                          <div className=" rounded-md ">
                            <p className="flex items-center gap-4">
                              {source.description}
                            </p>
                            <p className="flex items-center  gap-[7.5rem] text-[1rem] pb-2">
                              {" "}
                              <span className="text-gray-500">Count</span>0
                            </p>
                            <p className="flex items-center gap-9 text-[1rem] pb-2">
                              {" "}
                              <span className="text-gray-500">
                                Processing Rate
                              </span>
                              N/A
                            </p>
                            <p className="flex items-center gap-7 text-[1rem] pb-2">
                              <span className="text-gray-500">
                                Qualification Rate
                              </span>
                              N/A
                            </p>
                            <div className="flex items-center  space-x-2  text-[1rem] pb-2">
                              <span className="text-gray-500 mr-20">
                                Webhook
                              </span>
                              <span className="truncate max-w-[120px]">
                                {source.webhook_url}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  copyWebhook(source.webhook_url ?? "")
                                }
                                className="h-8 w-8"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="flex flex-col  mt-1">
                              <div className="flex items-center gap-28 text-[1rem] pb-2">
                                <span className="text-gray-500 text-[1rem]">
                                  Status
                                </span>
                                <div className="flex items-center gap-4">
                                  <Switch
                                    checked={source.status}
                                    onCheckedChange={() =>
                                      toggleWebhookStatus(source.id)
                                    }
                                  />
                                  <span
                                    className={`text-sm ${
                                      source.status
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {source.status ? "Enabled" : "Disabled"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-28 text-[1rem] pb-2 mt-2">
                                <span className="text-gray-500 text-[1rem]">
                                  Action
                                </span>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => openEditDialog(source)}
                                    className="h-8 w-8"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => openDeleteDialog(source)}
                                    className="h-8 w-8"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Desktop View (Show Full Data) */}
                    <TableRow
                      key={`${source.id}-desktop`}
                      className="hidden md:table-row"
                    >
                      <TableCell>{source.name}</TableCell>
                      <TableCell>{source.type}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {source.description}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        N/A
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        N/A
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center space-x-2">
                          <span className="truncate max-w-xs">
                            {source.webhook_url}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              copyWebhook(source.webhook_url ?? "")
                            }
                            className="h-8 w-8"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={source.status}
                            onCheckedChange={() =>
                              toggleWebhookStatus(source.id)
                            }
                          />
                          <span
                            className={`text-sm ${
                              source.status ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {source.status ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(source)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => openDeleteDialog(source)}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogMode === "create" || dialogMode === "edit"}
        onOpenChange={() => resetDialog()}
      >
        <DialogContent className="w-[90%] max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create"
                ? "Add New Lead Source"
                : "Edit Lead Source"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter source name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter source type" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="app_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>App Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select app type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="swipepages">Swipe Pages</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="makeform">MakeForm</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter source description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="flex md:flex-col flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" className="w-full sm:w-auto">
                  {isWebhookAdded || isUpdated ? (
                    <>
                      <Loader2 className="h-5 w-5" />
                      <span className="ml-2">
                        {dialogMode === "create"
                          ? "Adding..."
                          : isUpdated
                          ? "Updating..."
                          : "Updating..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="ml-2">
                        {dialogMode === "create"
                          ? "Add Source"
                          : "Update Source"}
                      </span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogMode === "delete"} onOpenChange={() => resetDialog()}>
        <DialogContent className="w-[90%] max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="mb-4">
            Are you sure you want to delete the lead source &quot;
            {selectedSource?.name}&quot;?
          </p>
          <DialogFooter className="flex md:flex-col flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => handleDelete(selectedSource?.id)}
              className="w-full sm:w-auto"
            >
              {isDeleted ? (
                <>
                  <Loader2 className="h-5 w-5" />
                  <span className="ml-2">Deleting...</span>
                </>
              ) : (
                "Delete Source"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
