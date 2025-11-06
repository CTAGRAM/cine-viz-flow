import { supabase } from '@/integrations/supabase/client';

interface EmailNotification {
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

export const sendEmailNotification = async (notification: EmailNotification) => {
  try {
    const response = await supabase.functions.invoke('send-notification-email', {
      body: notification,
    });

    if (response.error) {
      console.error('Error sending email notification:', response.error);
      return false;
    }

    console.log('Email notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
};