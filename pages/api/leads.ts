import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../lib/supabaseServer";
import axios from "axios";
import cors from "cors";
import { runMiddleware } from "@/utils/runMiddleware";
// Normalize any input data to a string
const normalizeInput = (data: any): string => {
  if (data === null || data === undefined) {
    return "";
  }

  try {
    if (typeof data === "string") {
      return data;
    }
    return JSON.stringify(data);
  } catch (e) {
    return String(data);
  }
};

// Basic validation of lead data
const isValidLead = (data: any): boolean => {
  if (!data) return false;

  // Check if we have at least a name or phone
  const hasName =
    data.first_name || (data.custom_data && data.custom_data.name);
  const hasPhone = data.phone || (data.custom_data && data.custom_data.phone);

  return Boolean(hasName || hasPhone);
};

export async function validateEmail(email: string): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://emailverifier.reoon.com/api/v1/verify?email=${email}&key=XL7ZTf8wKJLCBtE1pCLMvPr53zfHPRIw&mode=quick`
    );

    return (
      response.data.is_valid_syntax &&
      response.data.mx_accepts_mail &&
      response.data.status === "valid"
    );
  } catch (error) {
    console.error("Email validation error:", error);
    return false;
  }
}

// Phone number validation function
export async function validatePhoneNumber(
  phoneNumber: string
): Promise<boolean> {
  try {
    const response = await axios.get(
      `https://api-bdc.net/data/phone-number-validate?number=${phoneNumber}&countryCode=IN&localityLanguage=en&key=bdc_a38fe464805a4a87a7da7dc81ff059cd`
    );

    // Check if phone number is valid based on API response
    return response.data.isValid;
  } catch (error) {
    console.error("Phone number validation error:", error);
    return false;
  }
}

function processData(inputData: any, appType?: string) {
  switch (appType) {
    case 'facebook':
      return processFacebookData(inputData);
    case 'makeform':
      return processMakeFormData(inputData);
    case 'swipepages':
    default:
      return createFallbackData(inputData);
  }
}

// Process Facebook lead data
function processFacebookData(data: any) {
  const staticFields = {
    name: "",
    email: "",
    phone: "",
    message: "",
    custom_data: {}
  };

  try {
    const inputData = typeof data === "string" ? JSON.parse(data) : data;
    
    // Store all data in custom_data
    const custom_data: Record<string, any> = {};
    
    // Facebook typically sends data in specific format
    if (inputData.field_data && Array.isArray(inputData.field_data)) {
      inputData.field_data.forEach((field: any) => {
        if (field.name && field.values && field.values.length > 0) {
          const cleanKey = field.name.replace(/[_\s]/g, "").toLowerCase();
          custom_data[cleanKey] = field.values[0];
          
          // Map to standard fields
          if (field.name === "email") {
            staticFields.email = String(field.values[0]).toLowerCase();
          } else if (field.name === "phone_number" || field.name === "phone") {
            staticFields.phone = String(field.values[0]).replace(/[^\d+]/g, "");
          } else if (field.name === "full_name" || field.name === "name") {
            staticFields.name = String(field.values[0]).trim();
          }
        }
      });
    } else if (typeof inputData === "object") {
      // Handle direct object format
      Object.entries(inputData).forEach(([key, value]) => {
        const cleanKey = key.replace(/[_\s]/g, "").toLowerCase();
        custom_data[cleanKey] = value;
      });
      
      // Extract standard fields
      if (inputData.email) staticFields.email = String(inputData.email).toLowerCase();
      if (inputData.phone || inputData.phone_number) {
        staticFields.phone = String(inputData.phone || inputData.phone_number).replace(/[^\d+]/g, "");
      }
      if (inputData.full_name || inputData.name) {
        staticFields.name = String(inputData.full_name || inputData.name).trim();
      }
    }
    
    if (!staticFields.name) {
      staticFields.name = "Facebook Lead";
    }
    
    return {
      ...staticFields,
      custom_data
    };
  } catch (error) {
    console.error("Facebook processing error:", error);
    return {
      ...staticFields,
      name: "Facebook Lead",
      custom_data: { raw_data: data }
    };
  }
}

// Process MakeForm data
function processMakeFormData(data: any) {
  const staticFields = {
    name: "",
    email: "",
    phone: "",
    message: "",
    custom_data: {}
  };

  try {
    const inputData = typeof data === "string" ? JSON.parse(data) : data;
    
    // Store all data in custom_data
    const custom_data: Record<string, any> = {};
    
    // MakeForm typically sends data as an array of field objects
    if (Array.isArray(inputData)) {
      inputData.forEach((field) => {
        if (field.id && field.value) {
          const cleanKey = field.id.replace(/[_\s]/g, "").toLowerCase();
          custom_data[cleanKey] = field.value;
          
          // Map common MakeForm field IDs to standard fields
          if (field.id.toLowerCase().includes("email")) {
            staticFields.email = String(field.value).toLowerCase();
          } else if (field.id.toLowerCase().includes("phone") || field.id.toLowerCase().includes("mobile")) {
            staticFields.phone = String(field.value).replace(/[^\d+]/g, "");
          } else if (field.id.toLowerCase().includes("name") && !field.id.toLowerCase().includes("company")) {
            staticFields.name = String(field.value).trim();
          } else if (field.id.toLowerCase().includes("message") || field.id.toLowerCase().includes("comment")) {
            staticFields.message = String(field.value);
          }
        }
      });
    } else if (inputData.submission && inputData.submission.fields) {
      // Alternative MakeForm format with submission object
      Object.entries(inputData.submission.fields).forEach(([key, value]) => {
        const cleanKey = key.replace(/[_\s]/g, "").toLowerCase();
        custom_data[cleanKey] = value;
        
        if (key.toLowerCase().includes("email")) {
          staticFields.email = String(value).toLowerCase();
        } else if (key.toLowerCase().includes("phone")) {
          staticFields.phone = String(value).replace(/[^\d+]/g, "");
        } else if (key.toLowerCase().includes("name") && !key.toLowerCase().includes("company")) {
          staticFields.name = String(value).trim();
        }
      });
    }
    
    if (!staticFields.name) {
      staticFields.name = "MakeForm Lead";
    }
    
    return {
      ...staticFields,
      custom_data
    };
  } catch (error) {
    console.error("MakeForm processing error:", error);
    return {
      ...staticFields,
      name: "MakeForm Lead",
      custom_data: { raw_data: data }
    };
  }
}

// Create fallback data with all fields in custom_data
function createFallbackData(data: any) {
  const staticFields = {
    name: "",  // Initialize with empty string instead of "Failed to process"
    email: "",
    phone: "",
    message: "",
    custom_data: {}
  };

  try {
    const inputData = typeof data === "string" ? JSON.parse(data) : data;
    
    // First, store all data in custom_data
    const custom_data: Record<string, any> = {};
    
    // If it's an object, process all its fields
    if (typeof inputData === "object" && !Array.isArray(inputData)) {
      Object.entries(inputData).forEach(([key, value]) => {
        const cleanKey = key.replace(/[_\s]/g, "").toLowerCase();
        custom_data[cleanKey] = value;
      });
    }
    // If it's an array (form fields), process each field
    else if (Array.isArray(inputData)) {
      inputData.forEach((field) => {
        if (field.name && field.value) {
          const cleanKey = field.name.replace(/[_\s]/g, "").toLowerCase();
          custom_data[cleanKey] = field.value;
        }
      });
    }

    // Try to extract standard fields if possible
    if (custom_data.email) {
      staticFields.email = String(custom_data.email).toLowerCase();
    }
    if (custom_data.phone) {
      staticFields.phone = String(custom_data.phone).replace(/[^\d+]/g, "");
    }
    
    // Extract name fields from various possible sources
    const possibleNameFields = {
      fullName: custom_data.name || custom_data.fullname || custom_data.full_name || "",
      firstName: custom_data.firstname || custom_data.first_name || custom_data.fname || "",
      lastName: custom_data.lastname || custom_data.last_name || custom_data.lname || ""
    };
    
    // Process name fields
    if (possibleNameFields.fullName) {
      // If we have a full name field, use it directly
      staticFields.name = String(possibleNameFields.fullName).trim();
    } else if (possibleNameFields.firstName || possibleNameFields.lastName) {
      // Combine first name and last name if either is available
      staticFields.name = `${possibleNameFields.firstName} ${possibleNameFields.lastName}`.trim();
    }
    
    // Check if name might be in other custom fields
    if (!staticFields.name) {
      // Look for any field that might contain name information
      const nameKeywords = ['name', 'user', 'customer', 'client', 'contact'];
      for (const [key, value] of Object.entries(custom_data)) {
        if (typeof value === 'string' && 
            nameKeywords.some(keyword => key.toLowerCase().includes(keyword)) && 
            !key.toLowerCase().includes('email') && 
            !key.toLowerCase().includes('phone')) {
          staticFields.name = String(value).trim();
          break;
        }
      }
    }
    
    // Set a default name if none was found
    if (!staticFields.name) {
      staticFields.name = "Unknown";
    }
    
    if (custom_data.message) {
      staticFields.message = String(custom_data.message);
    }

    return {
      ...staticFields,
      custom_data
    };
  } catch (error) {
    console.error("Fallback processing error:", error);
    // Return basic structure with all data in custom_data
    // Make sure name is set to something other than "Failed to process"
    if (!staticFields.name) {
      staticFields.name = "Unknown";
    }
    
    return {
      ...staticFields,
      custom_data: { raw_data: data }
    };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const corsHandler = cors({
    origin: "*", // Allow all origins (use specific origins in production)
    methods: ["POST", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  });
  await runMiddleware(req, res, corsHandler);

  const { method, body, query, headers } = req;
  const action = query.action as string;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const appType = req.query.appType as string;
    const sourceWebhook = `${
      process.env.NEXT_PUBLIC_BASE_URL
    }/leads?action=${"getLeads"}&sourceId=${req.query.sourceId}&workspaceId=${
      req.query.workspaceId
    }${appType ? `&appType=${appType}` : ''}`;
    const data = req.body;
    const customData = req.body.custom_data;
    if (!data) {
      return res.status(400).json({ error: "No data provided" });
    }

    // Process data directly without AI
    let processedData = processData(data, appType);

    if (customData) {
      processedData.custom_data = {
        ...processedData.custom_data,
        ...customData,
      };
    }

    // Validate the processed data
    if (!isValidLead(processedData)) {
      return res.status(400).json({
        error: "Invalid lead data",
        details: "Name or phone number is required",
        data: processedData,
      });
    }
    const { data: webhookMatch, error: webhookError } = await supabase
      .from("webhooks")
      .select("user_id,status")
      .eq("webhook_url", sourceWebhook)
      .single(); // single() ensures a single record is returned
    if (webhookError) {
      console.error("Error fetching webhook:", webhookError.message);
      throw new Error("Failed to fetch webhook details.");
    }
    if (!webhookMatch || webhookMatch.status !== true) {
      console.error("Webhook deactivated or not found.");
      throw new Error("Webhook deactivated.");
    }

    const isEmailValid = await validateEmail(processedData.email);
    const isPhoneValid = await validatePhoneNumber(processedData.phone);
    console.log(isEmailValid, isPhoneValid);
    // Add metadata
    const leadData = {
      ...processedData,
      created_at: new Date().toISOString(),
      source: req.headers["origin"] || "unknown",
      lead_source_id: req.query.sourceId,
      user_id: webhookMatch?.user_id,
      contact_method: "Call",
      status: {
        name: "Arrived",
        color: "#FFA500",
      },
      work_id: req.query.workspaceId,
      revenue: 0,
      is_email_valid: isEmailValid || false,
      is_phone_valid: isPhoneValid || false,
    };

    // Save to database
    const { data: savedData, error: dbError } = await supabase
      .from("leads")
      .insert([leadData])
      .select();

    if (dbError) throw dbError;

    return res.status(200).json({
      message: "Lead successfully saved",
      lead: savedData[0],
    });
  } catch (error: any) {
    console.error("Error processing lead:", error);
    return res.status(500).json({
      error: "Failed to process lead",
      details: error.message,
    });
  }
}