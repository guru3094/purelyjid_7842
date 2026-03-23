import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const { type, to, orderNumber, customerName, items, subtotal, shipping, total, paymentId } =
      await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    let subject = "";
    let html = "";

    if (type === "order_confirmation") {
      subject = `Order Confirmed — #${orderNumber} | PurelyJid`;

      const itemsHtml = (items || [])
        .map(
          (item: { name: string; variant?: string; quantity: number; price: number }) => `
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #F2EBE1;">
              <p style="margin:0; font-size:14px; font-weight:600; color:#2A1F1A;">${item.name}</p>
              ${item.variant ? `<p style="margin:4px 0 0; font-size:12px; color:#7A6E68;">${item.variant}</p>` : ""}
              <p style="margin:4px 0 0; font-size:12px; color:#7A6E68;">Qty: ${item.quantity}</p>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #F2EBE1; text-align:right; font-size:14px; font-weight:600; color:#2A1F1A;">
              ₹${((item.price * item.quantity) / 100).toLocaleString("en-IN")}
            </td>
          </tr>`
        )
        .join("");

      html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed — PurelyJid</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF6F0; font-family:'DM Sans', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F0; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2A1F1A 0%, #3D2E27 100%); border-radius: 24px 24px 0 0; padding: 40px 40px 36px; text-align:center;">
              <p style="margin:0 0 4px; font-size:11px; letter-spacing:0.4em; text-transform:uppercase; color:rgba(255,255,255,0.6); font-weight:700;">Handcrafted with Love</p>
              <h1 style="margin:0; font-size:32px; font-weight:700; color:#ffffff; font-style:italic; letter-spacing:-0.5px;">PurelyJid</h1>
              <div style="margin: 24px auto 0; width:56px; height:56px; background:rgba(255,255,255,0.15); border-radius:50%; display:flex; align-items:center; justify-content:center;">
                <span style="font-size:28px;">✓</span>
              </div>
              <h2 style="margin:16px 0 8px; font-size:24px; font-weight:600; color:#ffffff; font-style:italic;">Order Confirmed!</h2>
              <p style="margin:0; font-size:14px; color:rgba(255,255,255,0.75);">Thank you, ${customerName || "valued customer"}. Your handcrafted items are on their way.</p>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="background:#ffffff; padding: 32px 40px; border-left: 1px solid #F2EBE1; border-right: 1px solid #F2EBE1;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 0 8px 0 0; width:50%;">
                    <p style="margin:0 0 4px; font-size:10px; text-transform:uppercase; letter-spacing:0.3em; font-weight:700; color:#7A6E68;">Order Number</p>
                    <p style="margin:0; font-size:15px; font-weight:700; color:#2A1F1A;">#${orderNumber}</p>
                  </td>
                  ${paymentId ? `
                  <td style="padding: 0 0 0 8px; width:50%;">
                    <p style="margin:0 0 4px; font-size:10px; text-transform:uppercase; letter-spacing:0.3em; font-weight:700; color:#7A6E68;">Payment ID</p>
                    <p style="margin:0; font-size:13px; font-weight:600; color:#2A1F1A;">${paymentId.slice(-12).toUpperCase()}</p>
                  </td>` : ""}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="background:#ffffff; padding: 0 40px; border-left: 1px solid #F2EBE1; border-right: 1px solid #F2EBE1;">
              <hr style="border:none; border-top: 1px solid #F2EBE1; margin:0;" />
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="background:#ffffff; padding: 24px 40px 8px; border-left: 1px solid #F2EBE1; border-right: 1px solid #F2EBE1;">
              <p style="margin:0 0 16px; font-size:11px; text-transform:uppercase; letter-spacing:0.3em; font-weight:700; color:#7A6E68;">Items Ordered</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="background:#ffffff; padding: 16px 40px 32px; border-left: 1px solid #F2EBE1; border-right: 1px solid #F2EBE1;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 6px 0; font-size:13px; color:#7A6E68;">Subtotal</td>
                  <td style="padding: 6px 0; font-size:13px; color:#2A1F1A; font-weight:600; text-align:right;">₹${((subtotal || 0) / 100).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size:13px; color:#7A6E68;">Shipping</td>
                  <td style="padding: 6px 0; font-size:13px; color:#2A1F1A; font-weight:600; text-align:right;">${shipping === 0 ? "Free" : `₹${((shipping || 0) / 100).toLocaleString("en-IN")}`}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0; font-size:15px; font-weight:700; color:#2A1F1A; border-top: 1px solid #F2EBE1;">Total Paid</td>
                  <td style="padding: 12px 0 0; font-size:18px; font-weight:700; color:#C4785A; text-align:right; border-top: 1px solid #F2EBE1;">₹${((total || 0) / 100).toLocaleString("en-IN")}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's Next -->
          <tr>
            <td style="background:#FAF6F0; padding: 28px 40px; border: 1px solid #F2EBE1; border-top: none;">
              <p style="margin:0 0 16px; font-size:11px; text-transform:uppercase; letter-spacing:0.3em; font-weight:700; color:#7A6E68;">What Happens Next</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${[
                  { icon: "📧", title: "Confirmation Email", desc: "This email is your order confirmation." },
                  { icon: "🎨", title: "Order Processing", desc: "Our artisans are carefully preparing your items (1–2 days)." },
                  { icon: "🚚", title: "Shipped & Delivered", desc: "Your order will be delivered within 3–5 business days." },
                ]
                  .map(
                    (step) => `
                <tr>
                  <td style="padding: 8px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:36px; height:36px; background:#ffffff; border-radius:50%; text-align:center; vertical-align:middle; font-size:16px; border: 1px solid #F2EBE1;">${step.icon}</td>
                        <td style="padding-left:12px;">
                          <p style="margin:0; font-size:13px; font-weight:600; color:#2A1F1A;">${step.title}</p>
                          <p style="margin:2px 0 0; font-size:12px; color:#7A6E68;">${step.desc}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`
                  )
                  .join("")}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#ffffff; padding: 28px 40px; border: 1px solid #F2EBE1; border-top: none; border-radius: 0 0 24px 24px; text-align:center;">
              <a href="${Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://purelyjid3498.builtwithrocket.new"}/products"
                 style="display:inline-block; padding: 14px 36px; background: linear-gradient(135deg, #2A1F1A 0%, #3D2E27 100%); color:#FAF6F0; text-decoration:none; border-radius:50px; font-size:11px; font-weight:700; letter-spacing:0.25em; text-transform:uppercase;">
                Continue Shopping
              </a>
              <p style="margin:20px 0 0; font-size:12px; color:#7A6E68; font-style:italic;">"Every piece is made with love and intention — thank you for supporting handcraft."</p>
              <p style="margin:4px 0 0; font-size:10px; color:#B5A89F; text-transform:uppercase; letter-spacing:0.2em;">— The PurelyJid Team</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    } else if (type === "welcome") {
      subject = "Welcome to PurelyJid — Handcrafted with Love";
      html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>Welcome to PurelyJid</title></head>
<body style="margin:0; padding:0; background:#FAF6F0; font-family:Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F0; padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
        <tr>
          <td style="background:linear-gradient(135deg,#2A1F1A 0%,#3D2E27 100%); border-radius:24px 24px 0 0; padding:40px; text-align:center;">
            <h1 style="margin:0; font-size:32px; font-weight:700; color:#fff; font-style:italic;">PurelyJid</h1>
            <p style="margin:8px 0 0; font-size:11px; letter-spacing:0.4em; text-transform:uppercase; color:rgba(255,255,255,0.6);">Handcrafted Resin Art Studio</p>
          </td>
        </tr>
        <tr>
          <td style="background:#fff; padding:40px; border:1px solid #F2EBE1; border-top:none; border-radius:0 0 24px 24px; text-align:center;">
            <h2 style="margin:0 0 12px; font-size:22px; color:#2A1F1A; font-style:italic;">Welcome, ${customerName || "friend"}!</h2>
            <p style="margin:0 0 24px; font-size:14px; color:#7A6E68; line-height:1.7;">You've joined a community of people who appreciate the beauty of handcrafted resin art. Explore our unique collection of jewelry, home décor, and DIY supplies.</p>
            <a href="${Deno.env.get("NEXT_PUBLIC_SITE_URL") || "https://purelyjid3498.builtwithrocket.new"}/products"
               style="display:inline-block; padding:14px 36px; background:linear-gradient(135deg,#2A1F1A 0%,#3D2E27 100%); color:#FAF6F0; text-decoration:none; border-radius:50px; font-size:11px; font-weight:700; letter-spacing:0.25em; text-transform:uppercase;">
              Explore the Collection
            </a>
            <p style="margin:28px 0 0; font-size:12px; color:#B5A89F; font-style:italic;">"Where every pour tells a story."</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    } else {
      throw new Error(`Unknown email type: ${type}`);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "PurelyJid <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
