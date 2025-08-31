"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetLeadsByWorkspaceQuery,
  useUpdateLeadMutation,
} from "@/lib/store/services/leadsApi";
import { useGetStatusQuery } from "@/lib/store/services/status";
import { useGetTagsQuery } from "@/lib/store/services/tags";
import {
  useGetActiveWorkspaceQuery,
  useGetWorkspaceMembersQuery,
} from "@/lib/store/services/workspace";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  ChevronDown,
  ChevronUp,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Send,
  Filter,
  MoreHorizontal,
  Grid3X3,
  List,
  TableIcon,
  Trash2,
  MapPin,
  Calendar,
  Building,
  User,
  Star,
  StarOff,
  Users,
  SortAsc,
  SortDesc,
  Download,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";
import { Resizable } from "react-resizable";
import "react-resizable/css/styles.css";
import { toast } from "sonner";

import { CardTitle } from "@/components/ui/card";
import WebhookStatus from "@/components/ui/WebhookStatus";
import { RootState } from "@/lib/store/store";
import { useSelector } from "react-redux";
// import { useRouter } from "next/router";
// import { Loader2} from "@/components/ui";

const mockContacts = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Contact ${i + 1}`,
  email: `contact${i + 1}@example.com`,
  phone: `+1 555-${String(i + 1).padStart(4, "0")}`,
  status: ["Active", "Inactive", "Pending"][Math.floor(Math.random() * 3)],
  lastContact: new Date(
    Date.now() - Math.random() * 10000000000
  ).toLocaleDateString(),
}));

interface Tags {
  id?: string;
  name: string;
  color: string;
}

export default function ContactPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leads, setLeads] = useState<any[]>([]);

  // Add state to track data processing
  const [isProcessingData, setIsProcessingData] = useState(false);
  const [lastProcessedTimestamp, setLastProcessedTimestamp] = useState<number>(0);
  const [contactStatuses, setContactStatuses] = useState<Set<string>>(new Set());
  const [editNameId, setEditNameId] = useState(null);
  const [nameInfo, setNameInfo] = useState("");
  const [editEmailId, setEditEmailId] = useState(null);
  const [emailInfo, setEmailInfo] = useState("");
  const [editPhoneId, setEditPhoneId] = useState(null);
  const [phoneInfo, setPhoneInfo] = useState("");
  const [editInfoId, setEditInfoId] = useState(null);
  const [editEmailValidationId, setEditEmailValidationId] = useState(null);
  const [emailValidation, setEmailValidation] = useState(false);

  // New state for enhanced UI
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'list'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'date' | 'company'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Infinite scrolling state
  const [displayedContacts, setDisplayedContacts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_LOAD = 20;

  const [businessInfo, setBusinessInfo] = useState(""); // Single field for input
  const [tags, setTags] = useState<Tags[]>([]);
  const [selectedTags, setSelectedTags] = useState<Record<string, string[]>>(
    {}
  );
  const [openAddress, setopenAddress] = useState<Record<string, string[]>>({});
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const isCollapsed = useSelector(
    (state: RootState) => state.sidebar.isCollapsed
  );

  const [updateLead, { isLoading }] = useUpdateLeadMutation();
  const toggleRow = (id: any) => {
    setExpandedRow(expandedRow === id ? null : id);
  };



  // Contact selection handlers
  const toggleContactSelection = (contactId: number) => {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  };

  const selectAllContacts = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(contact => contact.id)));
    }
  };

  // Sorting handler
  const handleSort = (field: 'name' | 'email' | 'date' | 'company') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    phone: "",
    status: "Active",
  });

  // fetching leads - ORIGINAL REDUX PATTERN with improved error handling
  const { data: activeWorkspace, isLoading: isLoadingWorkspace, error: workspaceError } =
    useGetActiveWorkspaceQuery<any>(undefined);

  const workspaceId = activeWorkspace?.data?.id;

  const { data: workspaceData, isLoading: isLoadingLeads, error: leadsError }: any =
    useGetLeadsByWorkspaceQuery(
      workspaceId
        ? ({ workspaceId: workspaceId.toString() } as { workspaceId: string })
        : skipToken,
      {
        pollingInterval: 10000,
        // Add retry logic for better reliability
        refetchOnMountOrArgChange: true,
        refetchOnReconnect: true,
      }
    );

  const { data: workspaceMembers, isLoading: isLoadingMembers } =
    useGetWorkspaceMembersQuery(workspaceId ? workspaceId : skipToken);

  const { data: tagsData, isLoading: isLoadingTags }: any =
    useGetTagsQuery(workspaceId ? workspaceId : skipToken);

  const POLLING_INTERVAL = 10000;

  const { data: statusData, isLoading: isLoadingStatus, error: statusError }: any =
    useGetStatusQuery(workspaceId ? workspaceId : skipToken, {
      // Ensure status data is fetched reliably
      refetchOnMountOrArgChange: true,
    });

  // Add error logging for debugging
  useEffect(() => {
    if (workspaceError) console.error('Workspace error:', workspaceError);
    if (leadsError) console.error('Leads error:', leadsError);
    if (statusError) console.error('Status error:', statusError);
  }, [workspaceError, leadsError, statusError]);

  const handleView = (id: number) => {
    router.push(`/leads/${id}`);
  };

  // Process leads and contacts with proper dependency management
  useEffect(() => {
    const processLeadsAndContacts = () => {
      // Enhanced loading checks
      if (isLoadingLeads || isLoadingStatus || isLoadingWorkspace) {
        console.log('Still loading data:', {
          isLoadingLeads,
          isLoadingStatus,
          isLoadingWorkspace,
          hasWorkspaceData: !!workspaceData?.data,
          hasStatusData: !!statusData?.data
        });
        return;
      }

      // Check if we have workspace data
      if (!workspaceData?.data || !Array.isArray(workspaceData.data)) {
        console.log('No workspace data available:', workspaceData);
        setLeads([]);
        setContacts([]);
        return;
      }

      console.log('Processing leads and contacts:', {
        leadsCount: workspaceData.data.length,
        statusData: statusData?.data,
        hasStatusData: !!statusData?.data
      });

      // Calculate contact statuses with fallback
      let newContactStatuses = new Set<string>();

      if (Array.isArray(statusData?.data)) {
        newContactStatuses = new Set(
          statusData.data
            .filter((status: any) => status && status.count_statistics)
            .map((status: any) => status.name)
            .filter(Boolean) // Remove any null/undefined names
        );
      }

      // If no contact statuses found, use common fallback statuses
      if (newContactStatuses.size === 0) {
        console.log('No contact statuses found, using fallback statuses');
        newContactStatuses = new Set(['Qualified', 'Customer', 'Hot Lead', 'Warm Lead']);
      }

      console.log('Contact statuses:', Array.from(newContactStatuses));

      // Update the state
      setContactStatuses(newContactStatuses);

      let fetchedLeads = workspaceData.data.map(
        (lead: any, index: number) => ({
          id: lead.id || index + 1,
          Name: lead.name || "",
          email: lead.email || "",
          phone: lead.phone || "",
          company: lead.company || "",
          position: lead.position || "",
          contact_method: lead.contact_method,
          owner: lead.owner || "Unknown",
          status: lead.status || { name: "New" },
          revenue: lead.revenue || 0,
          assign_to: lead.assign_to || "Not Assigned",
          createdAt: lead.created_at
            ? new Date(lead.created_at).toISOString()
            : new Date().toISOString(),
          isDuplicate: false,
          is_email_valid: lead.is_email_valid,
          is_phone_valid: lead.is_phone_valid,
          sourceId: lead?.lead_source_id ?? null,
          businessInfo: lead?.businessInfo ?? "",
          tag: lead?.tags ?? {},
          address: lead?.address ?? "",
        })
      );

      console.log('Fetched leads before processing:', fetchedLeads.length);

      const duplicates = new Set();
      fetchedLeads.forEach((lead: any) => {
        const duplicate = fetchedLeads.find(
          (l: any) =>
            l.id !== lead.id &&
            (l.email === lead.email || l.phone === lead.phone)
        );
        if (duplicate) {
          duplicates.add(lead.id);
          duplicates.add(duplicate.id);
        }
      });

      // Mark duplicates
      const updatedLeads = fetchedLeads.map((lead: any) => ({
        ...lead,
        isDuplicate: duplicates.has(lead.id),
      }));

      // Sort by most recent
      const sortedLeads = updatedLeads.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setLeads(sortedLeads);

      // Filter leads to show only qualified contacts with enhanced logic
      const QualifiedContacts = sortedLeads.filter((lead: any) => {
        try {
          // Enhanced validation
          if (!lead || !lead.status) {
            console.log(`Lead ${lead?.id || 'unknown'}: No status object`);
            return false;
          }

          const statusName = lead.status.name || lead.status;
          if (!statusName || typeof statusName !== 'string') {
            console.log(`Lead ${lead.id}: Invalid status name:`, statusName);
            return false;
          }

          const isContactStatus = newContactStatuses.has(statusName);
          console.log(`Lead ${lead.id}: status="${statusName}", isContact=${isContactStatus}`);
          return isContactStatus;
        } catch (error) {
          console.error(`Error processing lead ${lead?.id}:`, error);
          return false;
        }
      });

      console.log('Final qualified contacts:', QualifiedContacts.length);

      // Prevent unnecessary re-renders by checking if data actually changed
      const currentTimestamp = Date.now();
      if (currentTimestamp - lastProcessedTimestamp > 1000) { // Debounce updates
        setContacts(QualifiedContacts);
        setLastProcessedTimestamp(currentTimestamp);
      }

      setIsProcessingData(false);
    };

    setIsProcessingData(true);

    // Add small delay to ensure all data is settled
    const timeoutId = setTimeout(() => {
      processLeadsAndContacts();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [workspaceData, isLoadingLeads, statusData, isLoadingStatus, isLoadingWorkspace, lastProcessedTimestamp]);

  // Separate polling effect to avoid interference
  useEffect(() => {
    if (!workspaceId) return;

    const pollInterval = setInterval(() => {
      console.log('Polling for updates...', {
        workspaceId,
        contactsCount: contacts.length,
        leadsCount: leads.length,
        isProcessingData
      });
      // The polling will trigger re-renders which will cause the above effect to run
    }, POLLING_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [workspaceId, contacts.length, leads.length, isProcessingData]);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('Contact state updated:', {
      contactsCount: contacts.length,
      leadsCount: leads.length,
      isLoadingLeads,
      isLoadingStatus,
      isLoadingWorkspace,
      isProcessingData,
      hasWorkspaceData: !!workspaceData?.data,
      hasStatusData: !!statusData?.data,
      workspaceId
    });
  }, [contacts.length, leads.length, isLoadingLeads, isLoadingStatus, isLoadingWorkspace, isProcessingData, workspaceData, statusData, workspaceId]);

  // useEffect(() => {
  //   console.log("contact", contacts);
  // }, [contacts]);

  useEffect(() => {
    if (editInfoId) {
      const contactToEdit = contacts.find((c) => c.id === editInfoId);
      if (contactToEdit) {
        setAddressData({
          address1: contactToEdit.address1 || "",
          address2: contactToEdit.address2 || "",
          country: contactToEdit.country || "",
          zipCode: contactToEdit.zipCode || "",
        });
      }
    }
  }, [editInfoId, contacts]);

  useEffect(() => {
    if (tagsData?.data) {
      setTags(tagsData.data);
    }
  }, [tagsData]);

  // Filter contacts based on search and status
  const filteredContacts = Array.isArray(contacts)
    ? contacts.filter((contact) => {
        const searchLower = search.toLowerCase();
        const statusLower = statusFilter.toLowerCase();

        const matchesSearch =
          contact?.Name?.toLowerCase().includes(searchLower) || // Use contact.Name (capital N)
          contact?.name?.toLowerCase().includes(searchLower) || // Also check lowercase name
          contact?.email?.toLowerCase().includes(searchLower) ||
          contact?.phone?.includes(search);

        const matchesStatus =
          statusFilter === "all" ||
          contact?.status?.name?.toLowerCase() === statusLower;

        return matchesSearch && matchesStatus;
      })
    : [];

  // contact
  const initiateDirectContact = (lead: any, method: string) => {
    const sanitizedPhone = lead.phone.replace(/\D/g, "");

    switch (method) {
      case "WhatsApp":
        window.open(`https://wa.me/${sanitizedPhone}`, "_blank");
        break;
      case "Call":
        window.location.href = `tel:${lead.phone}`;
        break;
      case "SMS":
        window.location.href = `sms:${lead.phone}`;
        break;
      default:
    }
  };

  //update

  // const tags = [
  //   { name: "Facebook", color: "#1877F2" }, // Blue
  //   { name: "SEO", color: "#22C55E" }, // Green
  //   { name: "Google Ads", color: "#FACC15" }, // Yellow
  //   { name: "LinkedIn", color: "#0A66C2" }, // Dark Blue
  // ];

  const handleUpdate = async (
    id: string | number,
    updatedData: Partial<{
      businessInfo: string;
      tags: string[];
      address: string;
      email: string;
      name: string;
      phone: string;
      is_email_valid: boolean;
    }>
  ) => {
    if (
      !updatedData.businessInfo === undefined &&
      (!updatedData.tags || updatedData.tags.length === 0) &&
      !updatedData.address?.trim() &&
      !updatedData.email?.trim() &&
      !updatedData.phone?.trim() &&
      updatedData.is_email_valid === undefined &&
      !updatedData.name?.trim()
    ) {
      return; // Prevent empty updates
    }

    try {
      await updateLead({
        id,
        leads: updatedData,
      }).unwrap();
    } catch (error) {
      toast.error("Update failed");
    }

    toast.success("Update successfully");
  };

  const handleTagChange = (id: string, value: string) => {
    setSelectedTags((prev) => {
      const currentTags = prev?.[id] ?? [];

      const updatedTags = currentTags.includes(value)
        ? currentTags.filter((tag) => tag !== value) // Remove tag if already selected
        : [...currentTags, value];

      handleUpdate?.(id, { tags: updatedTags });

      return { ...prev, [id]: updatedTags };
    });
  };
  useEffect(() => {}, [selectedTags]);

  // useEffect(() => {
  //   if (contacts.length > 0) {
  //     const initialTags = contacts.reduce((acc, contact) => {
  //       acc[contact.id] = JSON.parse(contact.tag || "[]"); // Ensure it's an array
  //       return acc;
  //     }, {} as Record<string, string[]>);

  //     setSelectedTags(initialTags);
  //   }
  // }, [contacts]); // Make sure to update when `contacts` change

  const handleRemoveTag = async (contactId: string, tagToRemove: string) => {
    setSelectedTags((prev) => {
      if (!prev || !prev[contactId]) return prev;

      const updatedTags = prev[contactId].filter((tag) => tag !== tagToRemove);

      handleUpdate(contactId, { tags: updatedTags.length ? updatedTags : [] });

      return {
        ...prev,
        [contactId]: updatedTags.length ? updatedTags : [],
      };
    });
  };

  // Daynamic Table/////////////
  const tableHeaders = [
    "Name",
    "Email",
    "Phone",
    "Email Validation",
    "Platform",
    "Bussiness Info",
    "Tag",
    "Address",
  ];
  const [selectedHeaders, setSelectedHeaders] = useState<any[]>([
    "Name",
    "Email",
    "Phone",
    "Email Validation",
    "Platform",
    "Bussiness Info",
    "Tag",
  ]);
  const [addressData, setAddressData] = useState({
    address1: "",
    address2: "",
    country: "",
    zipCode: "",
  });
  const defaultHeaders = [
    "Name",
    "Email",
    "Phone",
    "Email Validation",
    "Platform",
    "Bussiness Info",
    "Tag",
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [newColumn, setNewColumn] = useState("");

  const addColumn = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedColumn = event.target.value;
    if (selectedColumn && !selectedHeaders.includes(selectedColumn)) {
      const updatedHeaders = [...selectedHeaders];

      // Find the correct index in the original tableHeaders
      const insertIndex = tableHeaders.indexOf(selectedColumn);

      // Find the correct position in selectedHeaders based on tableHeaders order
      for (let i = 0; i < selectedHeaders.length; i++) {
        if (tableHeaders.indexOf(selectedHeaders[i]) > insertIndex) {
          updatedHeaders.splice(i, 0, selectedColumn);
          setSelectedHeaders(updatedHeaders);
          return;
        }
      }

      // If it's the last item, push normally
      updatedHeaders.push(selectedColumn);
      setSelectedHeaders(updatedHeaders);
    }
  };

  // const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [dropdownOpenRemove, setDropdownOpenRemove] = useState<string | null>(
    null
  );

  // Toggle dropdown for headers
  const toggleDropdown = (header: string) => {
    setDropdownOpenRemove((prev) => (prev === header ? null : header));
  };

  // };
  const removeColumn = (header: string) => {
    setSelectedHeaders((prevHeaders) =>
      prevHeaders.filter((h) => h !== header)
    );
    setDropdownOpenRemove(null); // Close dropdown after removing
  };

  // Infinite scrolling logic
  useEffect(() => {
    // Initialize displayed contacts when contacts data changes or search/filter changes
    const initialContacts = filteredContacts.slice(0, ITEMS_PER_LOAD);
    setDisplayedContacts(initialContacts);
    setHasMore(filteredContacts.length > ITEMS_PER_LOAD);
  }, [contacts, search, statusFilter]); // Depend on contacts data, search and filter changes

  const loadMoreContacts = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);

    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedContacts(prev => {
        const currentLength = prev.length;
        const nextContacts = filteredContacts.slice(currentLength, currentLength + ITEMS_PER_LOAD);
        const newDisplayed = [...prev, ...nextContacts];

        setHasMore(newDisplayed.length < filteredContacts.length);
        setIsLoadingMore(false);

        return newDisplayed;
      });
    }, 300);
  }, [filteredContacts, hasMore, isLoadingMore]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // Close tag dropdown if clicking outside
      if (openDropdownId && !target.closest('.tag-dropdown-container')) {
        setOpenDropdownId(null);
      }

      // Close column dropdown if clicking outside
      if (dropdownOpenRemove && !target.closest('.column-dropdown-container')) {
        setDropdownOpenRemove(null);
      }

      // Close other dropdowns if clicking outside
      if (dropdownOpen && !target.closest('.dropdown-container')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId, dropdownOpenRemove, dropdownOpen]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreContacts();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [hasMore, isLoadingMore, loadMoreContacts]);

  // Resizable columns with better default widths
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    Name: 200,
    Email: 250,
    Phone: 150,
    Company: 180,
    Status: 120,
    "Created Date": 150,
    Platform: 150,
    "Bussiness Info": 200,
    Tag: 150,
    Address: 200,
    "Email Validation": 150,
  });

  // Row height state for resizable rows
  const [rowHeight, setRowHeight] = useState<number>(60); // Default row height in pixels
  const [isResizingRow, setIsResizingRow] = useState<boolean>(false);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [dragStartHeight, setDragStartHeight] = useState<number>(60);

  // Correctly type 'size' as ResizeCallbackData
  type ResizeCallbackData = {
    size: { width: number; height: number };
  };

  const handleResize =
    (header: string) =>
    (_event: React.SyntheticEvent, { size }: ResizeCallbackData) => {
      // Ensure minimum width of 80px and maximum of 500px
      const newWidth = Math.max(80, Math.min(500, size.width));
      setColumnWidths((prevWidths) => ({
        ...prevWidths,
        [header]: newWidth,
      }));
    };

  // Row resize handler
  const handleRowResize = (newHeight: number) => {
    const clampedHeight = Math.max(40, Math.min(120, newHeight)); // Min 40px, Max 120px
    setRowHeight(clampedHeight);
  };

  // Enhanced resize handler with visual feedback
  const handleColumnResizeStart = (header: string) => {
    setIsResizingRow(true);
  };

  const handleColumnResizeEnd = (header: string) => {
    setIsResizingRow(false);
  };

  // Row resize drag handlers
  const handleRowResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRow(true);
    setDragStartY(e.clientY);
    setDragStartHeight(rowHeight);

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - dragStartY;
      const newHeight = Math.max(40, Math.min(120, dragStartHeight + deltaY));
      setRowHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizingRow(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = contacts.length + 1;
    setContacts([
      ...contacts,
      {
        ...newContact,
        id: newId,
        lastContact: new Date().toLocaleDateString(),
      },
    ]);
    setNewContact({
      name: "",
      email: "",
      phone: "",
      status: "Active",
    });
  };

  // Loading state is now handled by loading.tsx

  return (
    <div
      className={`transition-all duration-500 ease-in-out px-6 py-8 ${
        isCollapsed ? "md:ml-[80px]" : "md:ml-[250px]"
      } w-auto overflow-hidden min-h-screen bg-gray-50 dark:bg-gray-900`}
    >
      <div className="max-w-8xl mx-auto space-y-6">
        {/* Modern Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Title Section */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  People
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {filteredContacts.length} Contacts
                  </span>
                  {selectedContacts.size > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {selectedContacts.size} Selected
                    </span>
                  )}
                </p>
              </div>
            </div>


          </div>
        </div>

        {/* <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Contacts</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddContact} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newContact.name}
                    onChange={(e) =>
                      setNewContact({ ...newContact, name: e.target.value })
                    }
                    placeholder="Enter name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) =>
                      setNewContact({ ...newContact, email: e.target.value })
                    }
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) =>
                      setNewContact({ ...newContact, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newContact.status}
                    onValueChange={(value) =>
                      setNewContact({ ...newContact, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">
                  Add Contact
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div> */}

        {/* Modern Filters & Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Left Side - Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
              {/* Enhanced Search */}
              <div className="relative flex-1 min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-800 transition-colors"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Array.from(contactStatuses).map((statusName) => (
                    <SelectItem key={statusName as string} value={statusName as string}>
                      {statusName as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Favorites Toggle */}
              <Button
                variant={showFavorites ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavorites(!showFavorites)}
                className="gap-2"
              >
                {showFavorites ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                Favorites
              </Button>
            </div>

            {/* Right Side - View Controls & Actions */}
            <div className="flex items-center gap-3">
              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSort(sortBy)}
                  className="gap-2"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  Sort
                </Button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-8 w-8 p-0"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Table Controls (only show for table view) */}
              {viewMode === 'table' && (
                <div className="flex items-center gap-3">
                  {/* Row Height Control */}
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Row Height:</span>
                    <input
                      type="range"
                      min="40"
                      max="120"
                      value={rowHeight}
                      onChange={(e) => handleRowResize(Number(e.target.value))}
                      className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((rowHeight - 40) / 80) * 100}%, #e5e7eb ${((rowHeight - 40) / 80) * 100}%, #e5e7eb 100%)`,
                        WebkitAppearance: 'none',
                        outline: 'none'
                      }}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[30px]">{rowHeight}px</span>
                  </div>

                  {/* Reset Columns Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setColumnWidths({
                        Name: 200,
                        Email: 250,
                        Phone: 150,
                        Company: 180,
                        Status: 120,
                        "Created Date": 150,
                        Platform: 150,
                        "Bussiness Info": 200,
                        Tag: 150,
                        Address: 200,
                        "Email Validation": 150,
                      });
                      setRowHeight(60);
                    }}
                    className="text-xs"
                  >
                    Reset Layout
                  </Button>
                </div>
              )}

              {/* Bulk Actions */}
              {selectedContacts.size > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Multi-View Contact Display */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Table View */}
          {viewMode === 'table' && (
            <div className="overflow-x-auto">
              <Table className={`min-w-full ${isResizingRow ? 'select-none' : ''}`}>
                <TableHeader className="hidden md:table-header-group">
                  <TableRow className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <TableHead className="w-12 p-3">
                      <input
                        type="checkbox"
                        checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                        onChange={selectAllContacts}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </TableHead>
                    {selectedHeaders?.map((header) => (
                      <TableHead
                        key={header}
                        className="relative text-left font-semibold p-0 text-gray-900 dark:text-gray-100 group"
                        style={{ width: columnWidths[header], minWidth: '80px', maxWidth: '500px' }}
                      >
                        <Resizable
                          width={columnWidths[header]}
                          height={48}
                          axis="x"
                          resizeHandles={["e"]}
                          onResize={handleResize(header)}
                          onResizeStart={() => handleColumnResizeStart(header)}
                          onResizeStop={() => handleColumnResizeEnd(header)}
                          minConstraints={[80, 48]}
                          maxConstraints={[500, 48]}
                        >
                          <div className="flex items-center justify-between w-full h-12 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-200 dark:border-gray-700">
                            <span
                              onClick={() => toggleDropdown(header)}
                              className="flex-1 font-medium text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100 truncate select-none"
                            >
                              {header}
                            </span>
                            {/* Enhanced resize handle */}
                            <div className="w-1 h-8 cursor-ew-resize bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors duration-200 opacity-60 group-hover:opacity-100 ml-2 rounded-sm"></div>
                          </div>
                        </Resizable>

                        {dropdownOpenRemove === header && (
                          <div className="column-dropdown-container absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md p-2 w-40 z-50">
                            <button
                              className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-900 dark:text-gray-100"
                              onClick={() => removeColumn(header)}
                            >
                              Hide Column
                            </button>
                          </div>
                        )}
                      </TableHead>
                    ))}
                    <TableHead className="text-center p-4">
                      <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="p-2 rounded-full bg-gray-900 dark:bg-gray-100 hover:bg-gray-700 dark:hover:bg-gray-300 text-white dark:text-gray-900"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {dropdownOpen && (
                        <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-md p-2 w-40 z-50">
                          <select
                            className="w-full border border-gray-200 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            onChange={(e) => {
                              addColumn(e);
                              setDropdownOpen(false);
                            }}
                          >
                            <option value="">Select Column</option>
                            {tableHeaders
                              .filter((header) => !selectedHeaders.includes(header))
                              .map((header) => (
                                <option key={header} value={header}>
                                  {header}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </TableHead>

                    {/* Row Resize Handle Header */}
                    <TableHead className="w-0 p-0">
                      <div className="w-4 h-12 bg-gray-50 dark:bg-gray-800/50" />
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {/* Loading State */}
                  {isLoadingLeads && (
                    <TableRow>
                      <TableCell colSpan={selectedHeaders.length + 2} className="py-8 text-center">
                        <div className="text-gray-500 dark:text-gray-400">Loading contacts...</div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Empty State */}
                  {!isLoadingLeads && displayedContacts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={selectedHeaders.length + 2} className="py-8 text-center">
                        <div className="text-gray-500 dark:text-gray-400">
                          {search || statusFilter !== 'all' ? 'No contacts found matching your criteria' : 'No contacts available'}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                  {/* Desktop Table Rows */}
                  {!isLoadingLeads && displayedContacts.map((contact: any) => (
                    <TableRow
                      key={contact.id}
                      className="hidden md:table-row border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 group transition-colors duration-150 relative"
                      style={{ height: `${rowHeight}px` }}
                    >
                      <TableCell className="p-3" style={{ height: `${rowHeight}px` }}>
                        <div className="flex items-center h-full">
                          <input
                            type="checkbox"
                            checked={selectedContacts.has(contact.id)}
                            onChange={() => toggleContactSelection(contact.id)}
                            className="rounded border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      </TableCell>

                      {selectedHeaders?.includes("Name") && (
                        <TableCell className="p-3" style={{ height: `${rowHeight}px` }}>
                          <div className="flex items-center gap-3 h-full">
                            {/* Colored Initial Avatar */}
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                              style={{
                                backgroundColor: `hsl(${(contact.Name || 'Unknown').charCodeAt(0) * 137.508 % 360}, 70%, 50%)`
                              }}
                            >
                              {(contact.Name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              {editNameId === contact.id ? (
                                <input
                                  type="text"
                                  placeholder="Enter Name..."
                                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  value={nameInfo}
                                  onChange={(e) => setNameInfo(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleUpdate(contact.id, { name: nameInfo });
                                      setEditNameId(null);
                                    } else if (e.key === "Escape") {
                                      setEditNameId(null);
                                      setNameInfo(contact.Name || "");
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                                  onDoubleClick={() => {
                                    setEditNameId(contact.id);
                                    setNameInfo(contact.Name || "");
                                  }}
                                >
                                  {contact.Name || (
                                    <span className="text-gray-400 italic">Double-click to add name</span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      )}

                      {selectedHeaders.includes("Email") && (
                        <TableCell className="p-3">
                          {editEmailId === contact.id ? (
                            <input
                              type="email"
                              placeholder="Enter Email..."
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              value={emailInfo}
                              onChange={(e) => setEmailInfo(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleUpdate(contact.id, { email: emailInfo });
                                  setEditEmailId(null);
                                } else if (e.key === "Escape") {
                                  setEditEmailId(null);
                                  setEmailInfo(contact.email || "");
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                              onDoubleClick={() => {
                                setEditEmailId(contact.id);
                                setEmailInfo(contact?.email || "");
                              }}
                            >
                              {contact.email || (
                                <span className="text-gray-400 italic">
                                  Double-click to add email
                                </span>
                              )}
                            </span>
                          )}
                        </TableCell>
                      )}

                      {selectedHeaders.includes("Phone") && (
                        <TableCell className="p-3">
                          <span className="text-gray-900 dark:text-gray-100">
                            {contact.phone || '-'}
                          </span>
                        </TableCell>
                      )}

                      {selectedHeaders.includes("Email Validation") && (
                        <TableCell className="p-3">
                          {editEmailValidationId === contact.id ? (
                            <select
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              value={emailValidation ? "true" : "false"}
                              onChange={async (e) => {
                                const newValue = e.target.value === "true";
                                setEmailValidation(newValue);
                                await handleUpdate(contact.id, {
                                  is_email_valid: newValue,
                                });
                                setEditEmailValidationId(null);
                              }}
                              autoFocus
                            >
                              <option value="true">True</option>
                              <option value="false">False</option>
                            </select>
                          ) : (
                            <span
                              className="cursor-pointer px-2 py-1 text-xs font-semibold rounded"
                              style={{
                                backgroundColor: contact.is_email_valid ? '#dcfce7' : '#fecaca',
                                color: contact.is_email_valid ? '#166534' : '#dc2626'
                              }}
                              onDoubleClick={() => {
                                setEditEmailValidationId(contact.id);
                                setEmailValidation(contact.is_email_valid);
                              }}
                            >
                              {contact.is_email_valid ? "Valid" : "Invalid"}
                            </span>
                          )}
                        </TableCell>
                      )}

                      {selectedHeaders.includes("Company") && (
                        <TableCell className="p-3">
                          <span className="text-gray-900 dark:text-gray-100">
                            {contact.company || '-'}
                          </span>
                        </TableCell>
                      )}

                      {selectedHeaders.includes("Status") && (
                        <TableCell className="p-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {contact.status?.name || 'New'}
                          </span>
                        </TableCell>
                      )}

                      {selectedHeaders.includes("Created Date") && (
                        <TableCell className="p-3">
                          <span className="text-gray-600 dark:text-gray-400">
                            {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : '-'}
                          </span>
                        </TableCell>
                      )}

                      {selectedHeaders.includes("Platform") && (
                        <TableCell className="p-3">
                          <span className="text-gray-900 dark:text-gray-100">
                            {contact.sourceId ? (
                              <WebhookStatus sourceId={contact.sourceId} workspaceId={workspaceId} />
                            ) : (
                              <span className="text-gray-500">No Source</span>
                            )}
                          </span>
                        </TableCell>
                      )}

                      {selectedHeaders.includes("Bussiness Info") && (
                        <TableCell className="p-3">
                          {editInfoId === contact.id ? (
                            <input
                              type="text"
                              placeholder="Enter Business Info..."
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              value={businessInfo}
                              onChange={(e) => setBusinessInfo(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleUpdate(contact.id, { businessInfo });
                                  setEditInfoId(null);
                                } else if (e.key === "Escape") {
                                  setEditInfoId(null);
                                  setBusinessInfo(contact.businessInfo || "");
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="cursor-pointer text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                              onDoubleClick={() => {
                                setEditInfoId(contact.id);
                                setBusinessInfo(contact.businessInfo || "");
                              }}
                            >
                              {contact.businessInfo || (
                                <span className="text-gray-400 italic">
                                  Double-click to add business info
                                </span>
                              )}
                            </span>
                          )}
                        </TableCell>
                      )}

                      {selectedHeaders.includes("Tag") && (
                        <TableCell className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {/* Display selected tags */}
                            {selectedTags[contact.id]?.map((tagName) => {
                              const tag = tags.find((t) => t.name === tagName);
                              return (
                                <div
                                  key={tagName}
                                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                  style={{
                                    backgroundColor: tag?.color || "#e5e7eb",
                                    color: "#374151",
                                  }}
                                >
                                  <span>{tagName}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveTag(contact.id, tagName);
                                    }}
                                    className="ml-1 text-gray-500 hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}

                            {/* Add Tag Button */}
                            <button
                              className="px-2 py-1 text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400"
                              onClick={() => {
                                setOpenDropdownId(openDropdownId === contact.id ? null : contact.id);
                              }}
                            >
                              + Add Tag
                            </button>

                            {/* Select Dropdown */}
                            {openDropdownId === contact.id && (
                              <div className="tag-dropdown-container absolute z-50 mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 w-48">
                                <div className="max-h-40 overflow-y-auto">
                                  {tags.map((tag) => (
                                    <button
                                      key={tag.name}
                                      className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm flex items-center gap-2"
                                      onClick={() => {
                                        handleTagChange(contact.id, tag.name);
                                        setOpenDropdownId(null);
                                      }}
                                    >
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: tag.color }}
                                      />
                                      <span className="text-gray-900 dark:text-gray-100">{tag.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {selectedHeaders.includes("Address") && (
                        <TableCell className="p-3">
                          <span className="text-gray-900 dark:text-gray-100">
                            {contact.address || (
                              <span className="text-gray-400 italic">No address</span>
                            )}
                          </span>
                        </TableCell>
                      )}

                      {/* Row Resize Handle */}
                      <TableCell className="p-0 w-4 relative">
                        <div className="relative w-full h-full">
                          {/* Resize handle at the bottom of the row */}
                          <div
                            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize bg-transparent hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors duration-200 opacity-0 group-hover:opacity-100 z-10"
                            onMouseDown={handleRowResizeStart}
                            title="Drag to resize row height"
                          />
                          {/* Visual indicator */}
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-0.5 bg-gray-300 dark:bg-gray-600 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        </div>
                      </TableCell>

                    </TableRow>
                  ))}

                  {/* Global Row Resize Handle */}
                  {!isLoadingLeads && displayedContacts.length > 0 && (
                    <TableRow className="hidden md:table-row">
                      <TableCell
                        colSpan={selectedHeaders.length + 2}
                        className="p-0 h-2 border-0 relative group cursor-ns-resize"
                        onMouseDown={handleRowResizeStart}
                        title="Drag to resize all rows"
                      >
                        <div className="w-full h-2 bg-transparent hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors duration-200 opacity-0 group-hover:opacity-100 relative">
                          {/* Visual indicator */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-0.5 bg-gray-400 dark:bg-gray-500 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-3">
                            Drag to resize rows
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}

                </TableBody>
              </Table>
            </div>
          )}

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="p-6">
              {isLoadingLeads ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading contacts...</div>
              ) : displayedContacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {search || statusFilter !== 'all' ? 'No contacts found matching your criteria' : 'No contacts available'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedContacts.map((contact: any) => (
                    <div key={contact.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={() => toggleContactSelection(contact.id)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${contact.Name || 'Unknown'}&backgroundColor=000000&textColor=ffffff`}
                            alt={contact.Name || 'Unknown'}
                            className="w-12 h-12 rounded-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {contact.Name || 'Unknown'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {contact.email || 'No email'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {contact.phone && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.company && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Building className="h-4 w-4" />
                            <span>{contact.company}</span>
                          </div>
                        )}

                        {/* Business Info */}
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Building className="h-4 w-4" />
                          {editInfoId === contact.id ? (
                            <input
                              type="text"
                              placeholder="Enter Business Info..."
                              className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              value={businessInfo}
                              onChange={(e) => setBusinessInfo(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleUpdate(contact.id, { businessInfo });
                                  setEditInfoId(null);
                                } else if (e.key === "Escape") {
                                  setEditInfoId(null);
                                  setBusinessInfo(contact.businessInfo || "");
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="flex-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                              onDoubleClick={() => {
                                setEditInfoId(contact.id);
                                setBusinessInfo(contact.businessInfo || "");
                              }}
                            >
                              {contact.businessInfo || (
                                <span className="text-gray-400 italic text-xs">
                                  Double-click to add business info
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1 items-center">
                          {selectedTags[contact.id]?.map((tagName) => {
                            const tag = tags.find((t) => t.name === tagName);
                            return (
                              <div
                                key={tagName}
                                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                style={{
                                  backgroundColor: tag?.color || "#e5e7eb",
                                  color: "#374151",
                                }}
                              >
                                <span>{tagName}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTag(contact.id, tagName);
                                  }}
                                  className="ml-1 text-gray-500 hover:text-red-500"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}

                          {/* Add Tag Button */}
                          <button
                            className="px-2 py-1 text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400"
                            onClick={() => {
                              setOpenDropdownId(openDropdownId === contact.id ? null : contact.id);
                            }}
                          >
                            + Tag
                          </button>

                          {/* Tag Dropdown */}
                          {openDropdownId === contact.id && (
                            <div className="tag-dropdown-container absolute z-50 mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 w-48">
                              <div className="max-h-40 overflow-y-auto">
                                {tags.map((tag) => (
                                  <button
                                    key={tag.name}
                                    className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm flex items-center gap-2"
                                    onClick={() => {
                                      handleTagChange(contact.id, tag.name);
                                      setOpenDropdownId(null);
                                    }}
                                  >
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: tag.color }}
                                    />
                                    <span className="text-gray-900 dark:text-gray-100">{tag.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                            {contact.status?.name || 'New'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoadingLeads ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading contacts...</div>
              ) : displayedContacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {search || statusFilter !== 'all' ? 'No contacts found matching your criteria' : 'No contacts available'}
                </div>
              ) : (
                displayedContacts.map((contact: any) => (
                  <div key={contact.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={() => toggleContactSelection(contact.id)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${contact.Name || 'Unknown'}&backgroundColor=000000&textColor=ffffff`}
                            alt={contact.Name || 'Unknown'}
                            className="w-10 h-10 rounded-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                {contact.Name || 'Unknown'}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {contact.email || 'No email'}
                              </p>
                            </div>
                            {contact.phone && (
                              <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                                {contact.phone}
                              </div>
                            )}
                            {contact.company && (
                              <div className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
                                {contact.company}
                              </div>
                            )}

                            {/* Business Info */}
                            <div className="hidden lg:block text-sm">
                              {editInfoId === contact.id ? (
                                <input
                                  type="text"
                                  placeholder="Enter Business Info..."
                                  className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-32"
                                  value={businessInfo}
                                  onChange={(e) => setBusinessInfo(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleUpdate(contact.id, { businessInfo });
                                      setEditInfoId(null);
                                    } else if (e.key === "Escape") {
                                      setEditInfoId(null);
                                      setBusinessInfo(contact.businessInfo || "");
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <span
                                  className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                  onDoubleClick={() => {
                                    setEditInfoId(contact.id);
                                    setBusinessInfo(contact.businessInfo || "");
                                  }}
                                >
                                  {contact.businessInfo || (
                                    <span className="text-gray-400 italic text-xs">
                                      Double-click for business info
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Tags */}
                            <div className="hidden xl:flex flex-wrap gap-1 items-center max-w-32">
                              {selectedTags[contact.id]?.slice(0, 2).map((tagName) => {
                                const tag = tags.find((t) => t.name === tagName);
                                return (
                                  <div
                                    key={tagName}
                                    className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                    style={{
                                      backgroundColor: tag?.color || "#e5e7eb",
                                      color: "#374151",
                                    }}
                                  >
                                    <span>{tagName}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTag(contact.id, tagName);
                                      }}
                                      className="ml-1 text-gray-500 hover:text-red-500"
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}

                              {selectedTags[contact.id]?.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{selectedTags[contact.id].length - 2}
                                </span>
                              )}

                              <button
                                className="px-2 py-1 text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400"
                                onClick={() => {
                                  setOpenDropdownId(openDropdownId === contact.id ? null : contact.id);
                                }}
                              >
                                +
                              </button>

                              {/* Tag Dropdown */}
                              {openDropdownId === contact.id && (
                                <div className="tag-dropdown-container absolute z-50 mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 w-48">
                                  <div className="max-h-40 overflow-y-auto">
                                    {tags.map((tag) => (
                                      <button
                                        key={tag.name}
                                        className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm flex items-center gap-2"
                                        onClick={() => {
                                          handleTagChange(contact.id, tag.name);
                                          setOpenDropdownId(null);
                                        }}
                                      >
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: tag.color }}
                                        />
                                        <span className="text-gray-900 dark:text-gray-100">{tag.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="hidden lg:block">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                {contact.status?.name || 'New'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Mobile Expanded View */}
                    <div className="md:hidden mt-3 pl-14">
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        {contact.phone && (
                          <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Phone:</span> {contact.phone}
                          </div>
                        )}
                        {contact.company && (
                          <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Company:</span> {contact.company}
                          </div>
                        )}

                        {/* Business Info */}
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Business Info:</span>{" "}
                          {editInfoId === contact.id ? (
                            <input
                              type="text"
                              placeholder="Enter Business Info..."
                              className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                              value={businessInfo}
                              onChange={(e) => setBusinessInfo(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleUpdate(contact.id, { businessInfo });
                                  setEditInfoId(null);
                                } else if (e.key === "Escape") {
                                  setEditInfoId(null);
                                  setBusinessInfo(contact.businessInfo || "");
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <span
                              className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                              onDoubleClick={() => {
                                setEditInfoId(contact.id);
                                setBusinessInfo(contact.businessInfo || "");
                              }}
                            >
                              {contact.businessInfo || (
                                <span className="text-gray-400 italic">
                                  Double-click to add
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedTags[contact.id]?.map((tagName) => {
                              const tag = tags.find((t) => t.name === tagName);
                              return (
                                <div
                                  key={tagName}
                                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                  style={{
                                    backgroundColor: tag?.color || "#e5e7eb",
                                    color: "#374151",
                                  }}
                                >
                                  <span>{tagName}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveTag(contact.id, tagName);
                                    }}
                                    className="ml-1 text-gray-500 hover:text-red-500"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            })}

                            <button
                              className="px-2 py-1 text-xs border border-dashed border-gray-300 dark:border-gray-600 rounded-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-400"
                              onClick={() => {
                                setOpenDropdownId(openDropdownId === contact.id ? null : contact.id);
                              }}
                            >
                              + Add Tag
                            </button>

                            {/* Tag Dropdown */}
                            {openDropdownId === contact.id && (
                              <div className="tag-dropdown-container absolute z-50 mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg p-2 w-48">
                                <div className="max-h-40 overflow-y-auto">
                                  {tags.map((tag) => (
                                    <button
                                      key={tag.name}
                                      className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm flex items-center gap-2"
                                      onClick={() => {
                                        handleTagChange(contact.id, tag.name);
                                        setOpenDropdownId(null);
                                      }}
                                    >
                                      <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: tag.color }}
                                      />
                                      <span className="text-gray-900 dark:text-gray-100">{tag.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Status:</span> {contact.status?.name || 'New'}
                        </div>
                        {contact.createdAt && (
                          <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Created:</span> {new Date(contact.createdAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Mobile Table View */}
          {viewMode === 'table' && (
            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {isLoadingLeads ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading contacts...</div>
              ) : displayedContacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {search || statusFilter !== 'all' ? 'No contacts found matching your criteria' : 'No contacts available'}
                </div>
              ) : (
                displayedContacts.map((contact: any) => (
                  <div key={contact.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={() => toggleContactSelection(contact.id)}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${contact.Name || 'Unknown'}&backgroundColor=000000&textColor=ffffff`}
                            alt={contact.Name || 'Unknown'}
                            className="w-10 h-10 rounded-full"
                          />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {contact.Name || 'Unknown'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {contact.email || 'No email'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(contact.id)}
                        className="h-8 w-8 p-0"
                      >
                        {expandedRow === contact.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {expandedRow === contact.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          {selectedHeaders.includes("Phone") && contact.phone && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                              <span className="text-gray-900 dark:text-gray-100">{contact.phone}</span>
                            </div>
                          )}
                          {selectedHeaders.includes("Company") && contact.company && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Company:</span>
                              <span className="text-gray-900 dark:text-gray-100">{contact.company}</span>
                            </div>
                          )}
                          {selectedHeaders.includes("Status") && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Status:</span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                {contact.status?.name || 'New'}
                              </span>
                            </div>
                          )}
                          {selectedHeaders.includes("Created Date") && contact.createdAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Created:</span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {new Date(contact.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Infinite Scroll Sentinel */}
        <div id="scroll-sentinel" className="h-4 w-full" />

        {/* Loading More Indicator */}
        {isLoadingMore && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-gray-100"></div>
              <span>Loading more contacts...</span>
            </div>
          </div>
        )}

        {/* End of Results Indicator */}
        {!hasMore && displayedContacts.length > 0 && (
          <div className="text-center py-8">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              You've reached the end of the list. Showing {displayedContacts.length} of {filteredContacts.length} contacts.
            </span>
          </div>
        )}

      </div>
    </div>
  );
}
