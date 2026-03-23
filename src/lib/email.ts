import { createClient } from '@/lib/supabase/client';

interface OrderItem {
  name: string;
  variant?: string;
  quantity: number;
  price: number;
}

interface SendOrderConfirmationParams {
  to: string;
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentId?: string;
}

interface SendWelcomeEmailParams {
  to: string;
  customerName: string;
}

async function invokeEmailFunction(payload: Record<string, unknown>): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.functions.invoke('send-order-email', {
      body: payload,
    });
    if (error) {
      console.error('[Email] Edge function error:', error.message);
    }
  } catch (err) {
    // Non-blocking — email failures should not break the user flow
    console.error('[Email] Failed to send email:', err);
  }
}

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationParams): Promise<void> {
  await invokeEmailFunction({
    type: 'order_confirmation',
    to: params.to,
    orderNumber: params.orderNumber,
    customerName: params.customerName,
    items: params.items,
    subtotal: params.subtotal,
    shipping: params.shipping,
    total: params.total,
    paymentId: params.paymentId,
  });
}

export async function sendWelcomeEmail(params: SendWelcomeEmailParams): Promise<void> {
  await invokeEmailFunction({
    type: 'welcome',
    to: params.to,
    customerName: params.customerName,
  });
}
