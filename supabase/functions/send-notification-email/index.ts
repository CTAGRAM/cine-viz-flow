import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  type: 'request_received' | 'request_accepted' | 'request_rejected' | 'request_completed';
  data: {
    userName: string;
    bookTitle: string;
    requestId: string;
    appUrl: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, type, data }: EmailRequest = await req.json();

    console.log('Sending email notification:', { to, subject, type });

    let htmlContent = '';
    
    switch (type) {
      case 'request_received':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">New Book Request</h1>
            <p>Hello,</p>
            <p><strong>${data.userName}</strong> wants to request your book:</p>
            <h2 style="color: #2563eb;">"${data.bookTitle}"</h2>
            <p>View and manage this request in your inbox:</p>
            <a href="${data.appUrl}/requests" 
               style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              View Request
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              BookSwap - Connecting students through book exchanges
            </p>
          </div>
        `;
        break;
        
      case 'request_accepted':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Request Accepted! 🎉</h1>
            <p>Great news!</p>
            <p><strong>${data.userName}</strong> accepted your request for:</p>
            <h2 style="color: #2563eb;">"${data.bookTitle}"</h2>
            <p>The book is now reserved for you. Contact the owner to arrange the exchange.</p>
            <a href="${data.appUrl}/requests" 
               style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              View Details
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              BookSwap - Connecting students through book exchanges
            </p>
          </div>
        `;
        break;
        
      case 'request_rejected':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Request Update</h1>
            <p>Hello,</p>
            <p>Your request for <strong>"${data.bookTitle}"</strong> was declined by the owner.</p>
            <p>Don't worry! There are many other books available for exchange.</p>
            <a href="${data.appUrl}/matches" 
               style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Find More Matches
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              BookSwap - Connecting students through book exchanges
            </p>
          </div>
        `;
        break;
        
      case 'request_completed':
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Exchange Completed! ✨</h1>
            <p>Congratulations!</p>
            <p>You successfully completed an exchange with <strong>${data.userName}</strong> for:</p>
            <h2 style="color: #2563eb;">"${data.bookTitle}"</h2>
            <p>Thank you for being part of our book-sharing community!</p>
            <a href="${data.appUrl}/history" 
               style="display: inline-block; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              View Exchange History
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              BookSwap - Connecting students through book exchanges
            </p>
          </div>
        `;
        break;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BookSwap <onboarding@resend.dev>",
        to: [to],
        subject,
        html: htmlContent,
      }),
    });

    const responseData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(responseData)}`);
    }

    console.log("Email sent successfully:", responseData);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);