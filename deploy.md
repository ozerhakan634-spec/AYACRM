# CRM Production Deployment Checklist

## ✅ Pre-deployment
- [ ] GitHub repo created and pushed
- [ ] Production Supabase project created
- [ ] Database schema migrated
- [ ] Storage buckets created
- [ ] Admin user created

## ✅ Netlify Setup
- [ ] Site deployed from GitHub
- [ ] Environment variables configured
- [ ] Custom domain added
- [ ] SSL certificate active

## ✅ DNS Setup (Customer side)
```
Type: CNAME
Name: crm
Value: [your-netlify-site].netlify.app
TTL: 3600
```

## ✅ Final Testing
- [ ] Site loads at custom domain
- [ ] Login works with admin credentials
- [ ] Database operations functional
- [ ] File uploads working
- [ ] PDF generation working
- [ ] Toast notifications working

## 📞 Customer Handover
- [ ] Login credentials provided
- [ ] User manual delivered
- [ ] Support contact information shared
- [ ] Training session scheduled (if needed)

## 🔐 Production Credentials
- Website: https://crm.[customer-domain].com
- Username: admin  
- Password: [secure-password]
- Support: [your-contact]
