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

    // E-posta ayarları
    const client = new SmtpClient()

    await client.connectTLS({
      hostname: "smtp.gmail.com",
      port: 587,
      username: Deno.env.get("EMAIL_USERNAME") || "your-email@gmail.com",
      password: Deno.env.get("EMAIL_PASSWORD") || "your-app-password",
    })

    let subject = ""
    let htmlContent = ""

    if (type === 'admin_response') {
      subject = `✅ Destek Talebinize Yanıt: ${ticket.subject}`
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Destek Talebinize Yanıt Verildi</h2>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${ticket.subject}</h3>
            <p><strong>Talep Tarihi:</strong> ${new Date(ticket.created_at).toLocaleDateString('tr-TR')}</p>
            <p><strong>Durum:</strong> <span style="color: #059669; font-weight: bold;">Çözüldü</span></p>
          </div>
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #2563eb;">Yanıtımız:</h4>
            <div style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb;">
              <p>${ticket.admin_response}</p>
            </div>
          </div>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Orijinal Talebiniz:</h4>
            <p>${ticket.message}</p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${Deno.env.get("CRM_URL") || "https://your-crm.com"}/dashboard/support" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Destek Taleplerimi Görüntüle
            </a>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
            <p>Başka bir sorunuz varsa, destek sayfamızdan yeni bir talep oluşturabilirsiniz.</p>
          </div>
        </div>
      `
    }

    await client.send({
      from: Deno.env.get("EMAIL_USERNAME") || "your-email@gmail.com",
      to: ticket.email,
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
