import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ticket, type } = await req.json()

    // E-posta ayarları (Gmail SMTP kullanıyoruz)
    const client = new SmtpClient()

    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 587,
      username: Deno.env.get("EMAIL_USERNAME") || "your-email@gmail.com",
      password: Deno.env.get("EMAIL_PASSWORD") || "your-app-password",
    })

    let subject = ""
    let htmlContent = ""

    if (type === 'new_ticket') {
      subject = `🔔 Yeni Destek Talebi: ${ticket.subject}`
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Yeni Destek Talebi Alındı</h2>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${ticket.subject}</h3>
            <p><strong>Gönderen:</strong> ${ticket.name} (${ticket.email})</p>
            <p><strong>Öncelik:</strong> ${getPriorityText(ticket.priority)}</p>
            <p><strong>Tarih:</strong> ${new Date(ticket.created_at).toLocaleDateString('tr-TR')}</p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 15px;">
              <p><strong>Mesaj:</strong></p>
              <p>${ticket.message}</p>
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${Deno.env.get("CRM_URL") || "https://your-crm.com"}/dashboard/support-management" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Destek Talebini Görüntüle
            </a>
          </div>
        </div>
      `
    }

    await client.send({
      from: Deno.env.get("EMAIL_USERNAME") || "your-email@gmail.com",
      to: Deno.env.get("ADMIN_EMAIL") || "admin@yourcompany.com",
      subject: subject,
      content: htmlContent,
      html: htmlContent,
    })

    await client.close()

    return new Response(
      JSON.stringify({ success: true, message: "E-posta başarıyla gönderildi" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )

  } catch (error) {
    console.error('E-posta gönderme hatası:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    )
  }
})

function getPriorityText(priority: string): string {
  switch (priority) {
    case 'urgent': return '🔴 Acil'
    case 'high': return '🟠 Yüksek'
    case 'medium': return '🟡 Orta'
    case 'low': return '🟢 Düşük'
    default: return priority
  }
}
