/**
 * @fileOverview Supabase Edge Function for handling Lenco mobile money payments.
 * This function acts as a secure backend to proxy requests to the Lenco API,
 * keeping the API secret key confidential.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LENCO_API_URL = 'https://sandbox.lenco.co/access/v2/collections/mobile-money';
// IMPORTANT: Set this in your Supabase project's environment variables.
const LENCO_API_SECRET = Deno.env.get('LENCO_API_SECRET_KEY');

// Define the expected structure of the incoming request payload from our app
interface LencoPaymentRequest {
  amount: number;
  currency: 'ZMW';
  reference: string;
  phone: string;
  // operator is now determined within the function
}

// Define a structure for our function's response
interface FunctionResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

const getOperatorFromPhone = (phone: string): 'airtel' | 'mtn' => {
  // Normalize phone number to be safe
  const cleanedPhone = phone.startsWith('+260') ? phone.substring(4) : phone;
  
  if (cleanedPhone.startsWith('077') || cleanedPhone.startsWith('77') || cleanedPhone.startsWith('076') || cleanedPhone.startsWith('76') || cleanedPhone.startsWith('075') || cleanedPhone.startsWith('75')) {
    console.log(`[lenco-handler] Detected Airtel prefix for phone: ${phone}`);
    return 'airtel';
  }
  
  console.log(`[lenco-handler] Defaulting to MTN for phone: ${phone}`);
  return 'mtn';
};


serve(async (req) => {
  // 1. Set up CORS headers. This is crucial for allowing the web app to call this function.
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Respond to OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 2. Validate environment variables and request method
  if (!LENCO_API_SECRET) {
    console.error('[lenco-handler] LENCO_API_SECRET_KEY is not set in environment variables.');
    return new Response(JSON.stringify({
        success: false,
        message: 'Payment provider is not configured on the server.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, message: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 3. Parse the incoming request body
    const requestPayload: LencoPaymentRequest = await req.json();
    
    // Determine the operator from the phone number
    const operator = getOperatorFromPhone(requestPayload.phone);

    // Construct the final payload for Lenco
    const lencoPayload = {
      ...requestPayload,
      operator: operator,
    };


    // 4. Make the secure server-to-server request to the Lenco API
    console.log('[lenco-handler] Forwarding request to Lenco with reference:', lencoPayload.reference);
    const lencoResponse = await fetch(LENCO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LENCO_API_SECRET}`,
      },
      body: JSON.stringify(lencoPayload),
    });

    const responseData = await lencoResponse.json();

    // 5. Handle Lenco's response and format our function's return value
    if (!lencoResponse.ok) {
      console.error('[lenco-handler] Lenco API Error:', responseData);
      const errorDetails = JSON.stringify(responseData);
      const errorMessage = responseData?.message ? `${responseData.message}` : `Request failed with status ${lencoResponse.status}`;
      const response: FunctionResponse = { 
          success: false, 
          message: `Lenco Error: ${errorMessage} (Details: ${errorDetails})`,
          data: responseData
      };
      return new Response(JSON.stringify(response), {
        status: 400, // Bad Request or appropriate status from Lenco
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[lenco-handler] Lenco payment simulation successful:', responseData);
    const response: FunctionResponse = { 
        success: true, 
        message: 'Payment simulation successful.', 
        data: responseData 
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[lenco-handler] Internal function error:', error);
    const response: FunctionResponse = { 
        success: false, 
        message: `Could not connect to the payment service. Error: ${error.message}` 
    };
    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
