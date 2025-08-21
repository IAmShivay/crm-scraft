"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useAddNotesMutation,
  useGetLeadByIdQuery,
  useUpdateLeadMutation,
} from "@/lib/store/services/leadsApi";
import { useGetStatusQuery } from "@/lib/store/services/status";
import { useGetActiveWorkspaceQuery } from "@/lib/store/services/workspace";
import { supabase } from "@/lib/supabaseClient";
import { formatDate } from "@/utils/date";
import { Calendar, Loader2, Mail, Phone } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { RootState } from "@/lib/store/store";
import { extractUserNameAndTimestamp } from "@/utils/message";
import { Player } from "@lottiefiles/react-lottie-player";
import { useSelector } from "react-redux";
const IndividualLeadPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const isCollapsed = useSelector(
    (state: RootState) => state.sidebar.isCollapsed
  );
  const [expandedItems, setExpandedItems] = useState<{
    [key: number]: boolean;
  }>({});
  const [updateLead] = useUpdateLeadMutation();
  const [addNotes] = useAddNotesMutation();
  const leadId = params?.id as string;
  const {
    data: leadsData,
    isLoading,
    error,
  } = useGetLeadByIdQuery(
    { id: leadId },
    {
      pollingInterval: 2000, // 2 seconds
    }
  );
  const currentLead = leadsData?.data?.[0];
  const [newNote, setNewNote] = useState("");
  const [user, setUser] = useState<any>(null);
  const [notes, setNotes] = useState<Array<{ message: string }>>([]);
  const { data: activeWorkspace, isLoading: isLoadingWorkspace } =
    useGetActiveWorkspaceQuery<any>(undefined);
  const workspaceId = activeWorkspace?.data.id;
  // Type the notes state properly
  const { data: statusData, isLoading: isLoadingStatus }: any =
    useGetStatusQuery(workspaceId);

  useEffect(() => {
    // Set initial notes when lead data loads
    if (currentLead?.text_area) {
      setNotes(currentLead.text_area);
    }
  }, [currentLead]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user?.user_metadata);
    };

    fetchUser();
  }, []);
  const handleGoBack = () => {
    router.push("/leads");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <CardTitle className="text-red-500">
            Error loading lead data
          </CardTitle>
          <CardDescription>Please try again later</CardDescription>
          <Button className="mt-4" onClick={handleGoBack}>
            Back to Leads
          </Button>
        </Card>
      </div>
    );
  }

  // Show not found state
  if (!currentLead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <CardTitle>Lead not found</CardTitle>
          <CardDescription>
            The requested lead could not be found
          </CardDescription>
          <Button className="mt-4" onClick={handleGoBack}>
            Back to Leads
          </Button>
        </Card>
      </div>
    );
  }
  console.log(notes);
  const handleAddNote = () => {
    if (newNote.trim()) {
      const author = user?.firstName || user?.name || "Unknown";
      const timestamp = new Date().toLocaleString(); // Or use .toISOString() for a standard format
      const newNoteText = `${newNote} (added by ${author} at ${timestamp})`;
      const newNoteObj = { message: newNoteText };
      const updatedNotes = [...notes, newNoteObj];

      setNotes(updatedNotes);
      setNewNote("");
      addNotes({ id: leadId, Note: updatedNotes });
    }
  };

  const handleStatusChange = async (id: number, value: string) => {
    const { name, color } = JSON.parse(value);

    try {
      updateLead({ id, leads: { name, color } });
      toast.success(`Lead status updated to ${name}`);
    } catch (error) {
      toast.error("Failed to update lead status");
    }
  };
  const truncate = (text: string, length = 50) => {
    return text.length > length ? `${text.slice(0, length)}...` : text;
  };

  // Toggle the expanded state
  const handleToggle = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  // const { userName, timestamp } = extractUserNameAndTimestamp(notes.map(note => note.message).join(' '));
  const result = extractUserNameAndTimestamp(
    notes.map((note) => note?.message)
  );
  console.log(result);
  // console.log(notes.map(note => note.message))
  const sanitizedPhone = currentLead?.phone.replace(/\D/g, "");
  return (
    <div
      className={`transition-all duration-500 ease-in-out px-4 py-6 ${
        isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"
      } w-auto overflow-hidden`}
    >
      <Card className="p-2">
        <CardHeader className="md:flex md:flex-row grid grid-cols-3  md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row col-start-1 col-end-3 md:items-center gap-4">
            <CardTitle>{currentLead?.name}</CardTitle>
            <CardDescription className="my-2">
              <Badge className="text-[9px]">
                {currentLead?.lead_source_id}
              </Badge>
            </CardDescription>
            <div className="flex ">
              <button
                className=""
                onClick={() => {
                  window.open(`tel:${currentLead?.phone}`, "_blank");
                }}
              >
                <Player
                  autoplay
                  loop
                  src="https://res.cloudinary.com/dyiso4ohk/raw/upload/v1736332984/Call_o3ga1m.json"
                  className="fixed-player"
                  style={{
                    width: "50px",
                  }}
                />
              </button>
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={() => {
                  window.open(`https://wa.me/${sanitizedPhone}`, "_blank");
                }}
              >
                <Player
                  autoplay
                  loop
                  src="https://res.cloudinary.com/dyiso4ohk/raw/upload/v1736331912/Whatsapp_vemsbg.json"
                  className="fixed-player"
                  style={{
                    width: "50px",
                  }}
                />
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row col-start-3 col-end-4 space-x-2 gap-4">
            <Button variant="outline" onClick={handleGoBack}>
              Back to Leads
            </Button>
            <Select
              defaultValue={JSON.stringify({
                name: currentLead?.status?.name || "Pending",
                color: currentLead?.status?.color || "#ea1212",
              })}
              onValueChange={(value) =>
                handleStatusChange(currentLead.id, value)
              } // Uncomment and use for status change handler
            >
              <SelectTrigger
                className="group relative md:w-[200px]  overflow-hidden rounded-md border-0 bg-white px-4 py-3 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:bg-gray-800"
                style={{
                  outline: `2px solid ${currentLead?.status?.color || "gray"}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="absolute -inset-1 rounded-lg bg-gray-400 opacity-20 blur-sm transition-opacity duration-200 group-hover:opacity-30"
                      style={{ backgroundColor: currentLead?.status?.color }}
                    />
                    <div
                      className="relative h-3 w-3 rounded-lg bg-gray-400"
                      style={{ backgroundColor: currentLead?.status?.color }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {currentLead?.status?.name}
                  </span>
                </div>
              </SelectTrigger>

              <SelectContent className="overflow-hidden rounded-xl border-0 bg-white p-2 shadow-2xl dark:bg-gray-800">
                {statusData?.data.map(
                  (status: { name: string; color: string }) => (
                    <SelectItem
                      key={status.name}
                      value={JSON.stringify({
                        name: status?.name,
                        color: status?.color,
                      })}
                      className="cursor-pointer rounded-lg outline-none transition-colors focus:bg-transparent"
                    >
                      <div className="group flex items-center gap-3 rounded-lg p-2 transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <div className="relative">
                          {/* Glow effect */}
                          <div
                            className="absolute -inset-1 rounded-lg opacity-20 blur-sm transition-all duration-200 group-hover:opacity-40"
                            style={{ backgroundColor: status?.color }}
                          />
                          {/* Main dot */}
                          <div
                            className="relative h-3 w-3 rounded-lg transition-transform duration-200 group-hover:scale-110"
                            style={{ backgroundColor: status?.color }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          {status.name}
                        </span>
                      </div>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-2">
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="mr-2 text-gray-500" size={20} />
                        <span>{currentLead?.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="mr-2 text-gray-500" size={20} />
                        <span>{currentLead?.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-2 text-gray-500" size={20} />
                        <span>{formatDate(currentLead?.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Lead Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentLead?.custom_data && (
                      <Card className="relative border-border/40">
                        <CardContent className="p-4 pt-0">
                          <ScrollArea className="h-[400px] pr-4">
                            <div className="w-full max-w-2xl mx-auto space-y-2 ">
                              {Object.entries(
                                currentLead?.custom_data || {}
                              ).map(([question, answer], index) => (
                                <Card
                                  key={index}
                                  className="border-0 shadow-none bg-accent/40 hover:bg-accent/60 transition-colors"
                                >
                                  <Accordion
                                    type="single"
                                    collapsible
                                    className="w-full"
                                  >
                                    <AccordionItem
                                      value={`item-${index}`}
                                      className="border-0"
                                    >
                                      <AccordionTrigger
                                        className="py-4 px-4 hover:no-underline"
                                        onClick={() => handleToggle(index)}
                                      >
                                        <div className="flex text-left items-start justify-start w-full ">
                                          <span className="text-auto  text-left font-medium  whitespace-normal break-words">
                                            {expandedItems[index]
                                              ? question
                                              : truncate(question)}{" "}
                                            {/* Toggle full/truncated text */}
                                          </span>
                                        </div>
                                      </AccordionTrigger>
                                      <AccordionContent className="px-4 pb-4 pt-1">
                                        <p className="text-[14px] text-gray-800 leading-relaxed bg-white p-2 rounded-md shadow-sm">
                                          {answer as string}{" "}
                                          {/* Answer displayed */}
                                        </p>
                                      </AccordionContent>
                                    </AccordionItem>
                                  </Accordion>
                                </Card>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 flex items-center space-x-4">
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: currentLead?.status?.color }}
                >
                  Status: {currentLead?.status?.name || "Pending"}
                </Badge>
              </div>
            </TabsContent>
            <TabsContent value="interactions">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                {/* <TableBody>
                  {lead.interactions.map((interaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{interaction.date}</TableCell>
                      <TableCell>{interaction.type}</TableCell>
                      <TableCell>{interaction.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody> */}
              </Table>
            </TabsContent>
            <TabsContent value="notes">
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write a new note..."
                      rows={6}
                      className="w-full resize-vertical"
                    />
                    <Button
                      onClick={handleAddNote}
                      className="mt-2"
                      variant="default"
                    >
                      Add Note
                    </Button>
                  </div>

                  <div className="grid gap-3">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 bg-primary text-white p-4 rounded-lg">
                      <div className="col-span-4 font-semibold">Author</div>
                      <div className="col-span-4 font-semibold pl-2">
                        Message
                      </div>
                      <div className="col-span-4 font-semibold text-right">
                        Timestamp
                      </div>
                    </div>

                    {/* Notes */}
                    {result.map((noteItem, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <div className="group grid grid-cols-12 gap-2 items-center rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:bg-accent hover:border-accent">
                            <div className="col-span-4 text-sm text-muted-foreground">
                              {noteItem?.userName || "Not Added"}
                            </div>
                            <div className="col-span-4 text-sm text-muted-foreground break-all pl-2">
                              {noteItem?.message || "Not Added"}
                            </div>
                            <div className="col-span-4 text-sm text-muted-foreground text-right">
                              {noteItem?.timestamp || "Not Added"}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-popover">
                          <p className="text-popover-foreground">
                            Click to copy
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default IndividualLeadPage;
