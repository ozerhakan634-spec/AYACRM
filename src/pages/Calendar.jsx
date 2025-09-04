import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Edit,
  Trash2,
  CheckCircle,
  Eye,
  CreditCard,
  FileText,
  Download
} from 'lucide-react';
import { DatabaseService } from '../services/database';
import { useToastContext } from '../components/Toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Calendar = () => {
  const toast = useToastContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('month');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentDay, setCurrentDay] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDateInput, setSelectedDateInput] = useState('');
  const [sortType, setSortType] = useState('date'); // Yeni eklenen sıralama tipi
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState('all'); // Seçilen danışman
  const calendarRef = useRef(null);

  // Mock müşteri verisi (randevu bilgileri ile)
  const initialClients = [
    {
      id: 1,
      name: 'Ahmet Yılmaz',
      email: 'ahmet.yilmaz@email.com',
      phone: '+90 532 123 45 67',
      status: 'active',
      visa_type: 'Öğrenci Vizesi',
      country: 'Almanya',
      appointment_date: new Date().toISOString().split('T')[0], // Bugün
      appointment_time: '14:00',
      consultant_id: 1,
      notes: 'Öğrenci vizesi başvuru görüşmesi',
      passport_number: 'A12345678',
      application_number: 'DS-2024-001'
    },
    {
      id: 2,
      name: 'Fatma Demir',
      email: 'fatma.demir@email.com',
      phone: '+90 533 987 65 43',
      status: 'pending',
      visa_type: 'Çalışma Vizesi',
      country: 'Hollanda',
      appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yarın
      appointment_time: '10:00',
      consultant_id: 2,
      notes: 'Çalışma vizesi belge kontrolü',
      passport_number: 'B87654321',
      application_number: 'DS-2024-002'
    },
    {
      id: 3,
      name: 'Mehmet Kaya',
      email: 'mehmet.kaya@email.com',
      phone: '+90 534 456 78 90',
      status: 'completed',
      visa_type: 'Turist Vizesi',
      country: 'İtalya',
      appointment_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 gün sonra
      appointment_time: '16:00',
      consultant_id: 3,
      notes: 'Turist vizesi sonuç görüşmesi',
      passport_number: 'C11223344',
      application_number: 'DS-2024-003'
    },
    {
      id: 4,
      name: 'Ayşe Özkan',
      email: 'ayse.ozkan@email.com',
      phone: '+90 535 111 22 33',
      status: 'active',
      visa_type: 'Aile Birleşimi',
      country: 'Fransa',
      appointment_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Dün
      appointment_time: '09:00',
      consultant_id: 4,
      notes: 'Aile birleşimi belge kontrolü',
      passport_number: 'D55667788',
      application_number: 'DS-2024-004'
    }
  ];

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'appointment': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'task': return 'bg-green-100 text-green-800 border-green-200';
      case 'meeting': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'reminder': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'appointment': return <CalendarIcon size={14} />;
      case 'task': return <CheckCircle size={14} />;
      case 'meeting': return <User size={14} />;
      case 'reminder': return <Clock size={14} />;
      default: return <CalendarIcon size={14} />;
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // ISO 8601 standardına göre haftanın Pazartesi'den başlaması için
    // getDay() 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
    // ISO: 1=Pazartesi, 2=Salı, ..., 7=Pazar
    let isoDayOfWeek = firstDay.getDay();
    if (isoDayOfWeek === 0) {
      isoDayOfWeek = 7; // Pazar = 7
    }
    
    // Önceki ayın günlerini hesapla (Pazartesi'den önceki günler)
    const daysFromPrevMonth = isoDayOfWeek - 1;
    if (daysFromPrevMonth > 0) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const lastDayOfPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
      
      for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
        const day = lastDayOfPrevMonth - i;
        const prevDate = new Date(prevYear, prevMonth, day);
        days.push({ date: prevDate, isCurrentMonth: false });
      }
    }
    
    // Mevcut ayın günleri
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    // Sonraki ayın günleri (42 hücreye tamamlamak için)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const nextDate = new Date(nextYear, nextMonth, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const getDaysInWeek = (date) => {
    const current = new Date(date);
    const week = [];
    
    // ISO 8601 standardına göre haftanın Pazartesi'den başlaması için
    let currentDayOfWeek = current.getDay();
    if (currentDayOfWeek === 0) {
      currentDayOfWeek = 7; // Pazar = 7
    }
    
    // Pazartesi'den başlayan haftanın ilk gününü hesapla
    const daysToMonday = currentDayOfWeek - 1;
    const mondayDate = new Date(current);
    mondayDate.setDate(current.getDate() - daysToMonday);
    
    // Haftanın 7 gününü oluştur
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(mondayDate);
      dayDate.setDate(mondayDate.getDate() + i);
      
      week.push({ 
        date: dayDate, 
        isCurrentMonth: dayDate.getMonth() === current.getMonth() 
      });
    }
    
    return week;
  };

  const getDaysInDay = (date) => {
    return [{ date: new Date(date), isCurrentMonth: true }];
  };

  // Tarih karşılaştırması için yardımcı fonksiyon
  const formatDateForComparison = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEventsForDate = (date) => {
    const dateString = formatDateForComparison(date);
    return events.filter(event => event.date === dateString);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const navigateWeek = (direction) => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction * 7));
      return newDate;
    });
  };

  const navigateDay = (direction) => {
    setCurrentDay(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + direction);
      return newDate;
    });
  };

  const handleViewChange = (newView) => {
    setView(newView);
    if (newView === 'week') {
      setCurrentWeek(currentDate);
    } else if (newView === 'day') {
      setCurrentDay(currentDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setCurrentWeek(today);
    setCurrentWeek(today);
    setCurrentDay(today);
    setSelectedDate(null);
  };

  const openDatePicker = () => {
    setIsDatePickerOpen(true);
    setSelectedDateInput('');
  };

  const closeDatePicker = () => {
    setIsDatePickerOpen(false);
    setSelectedDateInput('');
  };

  const handleDateSelect = () => {
    if (selectedDateInput) {
      const selectedDate = new Date(selectedDateInput);
      setCurrentDate(selectedDate);
      setCurrentWeek(selectedDate);
      setCurrentDay(selectedDate);
      setSelectedDate(null);
      closeDatePicker();
    }
  };

  // Font yükleme fonksiyonu - şimdilik devre dışı
  const loadRobotoFont = async () => {
    try {
      // jsPDF'de varsayılan olarak desteklenen fontları kullan
      // Türkçe karakterler için en iyi destek sağlayan font
      setFontLoaded(true);
      return true;
    } catch (error) {
      console.error('Font yükleme hatası:', error);
      setFontLoaded(false);
      return false;
    }
  };

  // PDF indirme fonksiyonu
  const generateMonthlyCalendarPDF = async () => {
    if (view !== 'month') {
      toast.warning('PDF indirmek için önce "Ay" görünümüne geçin', 'Görünüm Uyarısı');
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      // Şirket bilgilerini al
      let companySettings = {};
      try {
        companySettings = await DatabaseService.getCompanySettings();
        console.log('✅ Şirket bilgileri alındı:', companySettings);
      } catch (error) {
        console.warn('⚠️ Şirket bilgileri alınamadı, varsayılan değerler kullanılıyor:', error);
        // Varsayılan şirket bilgileri
        companySettings = {
          company_name: 'Vize Danışmanlık',
          company_address: '',
          company_phone: '',
          company_email: '',
          company_website: '',
          company_logo_url: ''
        };
      }
      
      // PDF oluştur
      generateMonthlyCalendarPDFHelper(events, currentDate, companySettings);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast.error('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.', 'PDF Hatası');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

    // Takvim günlerini HTML olarak oluşturan yardımcı fonksiyon
  const generateCalendarDaysHTML = (currentDate, monthEvents) => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Pazartesi=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = '';
    let day = 1;
    
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < firstDay) {
          html += '<div class="calendar-cell empty"></div>';
        } else if (day <= daysInMonth) {
          const hasEvent = monthEvents.some(ev => {
            const evDate = new Date(ev.date);
            return evDate.getDate() === day;
          });
          
          const cellClass = hasEvent ? 'calendar-cell has-event' : 'calendar-cell';
          const eventCount = hasEvent ? monthEvents.filter(ev => new Date(ev.date).getDate() === day).length : 0;
          const eventIndicator = hasEvent ? `<div class="event-indicator">${eventCount}</div>` : '';
          
          html += `
            <div class="${cellClass}">
              <div class="day-number">${day}</div>
              ${eventIndicator}
            </div>
          `;
          day++;
        } else {
          html += '<div class="calendar-cell empty"></div>';
        }
      }
    }
    return html;
  };

  // PDF oluşturma yardımcı fonksiyonu - HTML tabanlı
  const generateMonthlyCalendarPDFHelper = (events, currentDate, companySettings) => {
    try {
      // Türkçe ay isimleri
      const turkishMonths = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
      ];
      const monthName = turkishMonths[currentDate.getMonth()];
      const year = currentDate.getFullYear();
      
             // O ayın randevularını filtrele (danışman filtresi ile)
       const monthEvents = events.filter(ev => {
         const d = new Date(ev.date);
         const isCorrectMonth = d.getMonth() === currentDate.getMonth() && d.getFullYear() === year;
         const isCorrectConsultant = selectedConsultant === 'all' || ev.consultant_id == selectedConsultant;
         return isCorrectMonth && isCorrectConsultant;
       });

      // HTML içeriği oluştur
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${companySettings.company_name || 'Vize Danışmanlık'} - ${monthName} ${year} Takvimi</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none; }
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0;
              line-height: 1.4;
              color: #374151;
              background: #ffffff;
              font-size: 12px;
            }
            
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            
            /* Company Header Styles */
            .company-header {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 20px;
              margin-bottom: 25px;
              text-align: left;
            }
            
            .company-info {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 15px;
            }
            
            .company-logo-section {
              display: flex;
              align-items: center;
              justify-content: flex-start;
            }
            
            .company-logo {
              width: 120px;
              height: 90px;
              object-fit: contain;
              border-radius: 8px;
            }
            
            .company-contact {
              text-align: right;
              font-size: 11px;
              color: #6b7280;
              line-height: 1.5;
            }
            
            .company-contact div {
              margin-bottom: 3px;
            }
            
            .company-divider {
              height: 1px;
              background: #e5e7eb;
              margin: 0;
            }
            
            .header { 
              background: #f8fafc;
              color: #1f2937;
              padding: 15px 20px;
              border-radius: 6px;
              margin-bottom: 20px;
              border: 1px solid #e5e7eb;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            
            .header-left {
              text-align: left;
            }
            
            .header h1 { 
              font-size: 18px; 
              font-weight: 600;
              margin-bottom: 2px;
              color: #111827;
            }
            
            .header .subtitle {
              font-size: 12px;
              font-weight: 400;
              color: #6b7280;
            }
            
            .header-right {
              text-align: right;
              font-size: 10px;
              color: #6b7280;
            }
            
            .header-right .period-info {
              background: #f3f4f6;
              padding: 4px 8px;
              border-radius: 4px;
              font-weight: 500;
              color: #4b5563;
              margin-top: 5px;
              display: inline-block;
              border: 1px solid #e5e7eb;
            }
            
            .calendar {
              background: white;
              border-radius: 8px;
              overflow: hidden;
              border: 1px solid #e5e7eb;
              margin-bottom: 20px;
            }
            
            .calendar-header {
              display: grid;
              grid-template-columns: repeat(7, 1fr);
              background: #f9fafb;
              border-bottom: 1px solid #e5e7eb;
            }
            
            .calendar-header-cell {
              padding: 12px 8px;
              text-align: center;
              font-weight: 600;
              color: #374151;
              font-size: 11px;
              border-right: 1px solid #e5e7eb;
            }
            
            .calendar-header-cell:last-child {
              border-right: none;
            }
            
            .calendar-body {
              display: grid;
              grid-template-columns: repeat(7, 1fr);
            }
            
            .calendar-cell {
              min-height: 60px;
              padding: 8px;
              border-right: 1px solid #e5e7eb;
              border-bottom: 1px solid #e5e7eb;
              position: relative;
            }
            
            .calendar-cell:nth-child(7n) {
              border-right: none;
            }
            
            .calendar-cell.empty {
              background: #f9fafb;
            }
            
            .calendar-cell.has-event {
              background: #dbeafe;
              border: 2px solid #2563eb;
            }
            
            .day-number {
              font-weight: 600;
              color: #111827;
              margin-bottom: 4px;
            }
            
            .event-indicator {
              position: absolute;
              top: 4px;
              right: 4px;
              background: #2563eb;
              color: white;
              border-radius: 50%;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: 600;
            }
            
            .event-details {
              margin-top: 20px;
              background: #f9fafb;
              border-radius: 8px;
              padding: 20px;
              border: 1px solid #e5e7eb;
            }
            
            .event-details h3 {
              color: #111827;
              font-size: 16px;
              margin-bottom: 15px;
              font-weight: 600;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 8px;
            }
            
            .event-item {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              padding: 8px 12px;
              margin-bottom: 8px;
              font-size: 11px;
            }
            
            .event-date {
              font-weight: 600;
              color: #2563eb;
            }
            
            .event-client {
              color: #374151;
              margin-left: 8px;
            }
            
            .event-country {
              color: #6b7280;
              font-style: italic;
              margin-left: 8px;
            }
            
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #6b7280;
              font-size: 11px;
              padding: 15px;
              background: #f9fafb;
              border-radius: 4px;
              border: 1px solid #e5e7eb;
            }
            
            .print-button {
              background: #2563eb;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Company Header -->
            ${companySettings.company_logo_url ? `
              <div class="company-header">
                <div class="company-info">
                  <div class="company-logo-section">
                    <img src="${companySettings.company_logo_url}" alt="Şirket Logosu" class="company-logo" />
                  </div>
                  <div class="company-contact">
                    ${companySettings.company_address ? `<div>${companySettings.company_address}</div>` : ''}
                    ${companySettings.company_phone ? `<div>Tel: ${companySettings.company_phone}</div>` : ''}
                    ${companySettings.company_email ? `<div>E-posta: ${companySettings.company_email}</div>` : ''}
                    ${companySettings.company_website ? `<div>Web: ${companySettings.company_website}</div>` : ''}
                  </div>
                </div>
                <hr class="company-divider" />
              </div>
            ` : ''}
            
            <!-- Calendar Header -->
            <div class="header">
              <div class="header-left">
                <h1>${monthName} ${year} Takvimi</h1>
                <div class="subtitle">
                  ${selectedConsultant === 'all' 
                    ? 'Tüm Danışmanlar - Randevu Takvimi'
                    : `${consultants.find(c => c.id == selectedConsultant)?.name || `Danışman ${selectedConsultant}`} - Randevu Takvimi`
                  }
                </div>
              </div>
              <div class="header-right">
                <div>Tarih: ${new Date().toLocaleDateString('tr-TR')}</div>
                <div>Saat: ${new Date().toLocaleTimeString('tr-TR')}</div>
                <div class="period-info">${monthName} ${year}</div>
              </div>
            </div>
            
            <div class="calendar">
              <div class="calendar-header">
                <div class="calendar-header-cell">Pazartesi</div>
                <div class="calendar-header-cell">Salı</div>
                <div class="calendar-header-cell">Çarşamba</div>
                <div class="calendar-header-cell">Perşembe</div>
                <div class="calendar-header-cell">Cuma</div>
                <div class="calendar-header-cell">Cumartesi</div>
                <div class="calendar-header-cell">Pazar</div>
              </div>
              
              <div class="calendar-body">
                ${generateCalendarDaysHTML(currentDate, monthEvents)}
              </div>
            </div>
            
            ${monthEvents.length > 0 ? `
              <div class="event-details">
                <h3>Randevu Detayları</h3>
                ${monthEvents.map(event => {
                  const eventDate = new Date(event.date);
                  const eventDateStr = `${eventDate.getDate().toString().padStart(2, '0')}.${(eventDate.getMonth() + 1).toString().padStart(2, '0')}.${eventDate.getFullYear()}`;
                  const eventTime = event.time || 'Belirtilmemiş';
                  const eventClient = event.client || 'Belirtilmemiş';
                  const eventCountry = event.country || 'Belirtilmemiş';
                  
                  return `
                    <div class="event-item">
                      <span class="event-date">${eventDateStr} ${eventTime}</span>
                      <span class="event-client">- ${eventClient}</span>
                      <span class="event-country">(${eventCountry})</span>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}
            
            <div class="footer">
              <div class="logo">${companySettings.company_name || 'Vize Danışmanlık'} - Takvim Sistemi</div>
              <div>Bu rapor otomatik olarak oluşturulmuştur</div>
              <div style="margin-top: 8px; font-size: 11px; opacity: 0.8;">
                Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')} | Toplam Randevu: ${monthEvents.length}
              </div>
              ${companySettings.company_website ? `
                <div style="margin-top: 6px; font-size: 10px; color: #6b7280;">
                  ${companySettings.company_website}
                </div>
              ` : ''}
            </div>
            
            <div class="no-print" style="text-align: center;">
              <button class="print-button" onclick="window.print()">
                PDF Olarak İndir
              </button>
              <p style="color: #6b7280; margin-top: 12px; font-size: 13px;">
                Yazdır butonuna tıklayıp "Hedef" olarak "PDF olarak kaydet" seçeneğini kullanın
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      // Yeni sekmede aç
      const newWindow = window.open('', '_blank');
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      
      console.log('HTML takvim raporu başarıyla açıldı!');
      toast.success(
        'PDF olarak kaydetmek için "PDF Olarak İndir" butonuna tıklayın.',
        'Takvim raporu hazır!'
      );
      
    } catch (error) {
      console.error('Takvim raporu oluşturma hatası:', error);
      toast.error('Takvim raporu oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.', 'Takvim Hatası');
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const handleEditEvent = (event) => {
    setEditingEvent({ ...event });
    setIsEditModalOpen(true);
    setIsEventModalOpen(false);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingEvent(null);
  };

  const handleSaveEvent = () => {
    if (editingEvent) {
      // Events array'ini güncelle
      const updatedEvents = events.map(event => 
        event.id === editingEvent.id ? editingEvent : event
      );
      
      // Clients array'ini de güncelle
      const updatedClients = clients.map(client => {
        if (client.id === editingEvent.id) {
          return {
            ...client,
            appointmentDate: editingEvent.date,
            appointmentTime: editingEvent.time,
            notes: editingEvent.notes
          };
        }
        return client;
      });

      // State'leri güncelle
      setEvents(updatedEvents);
      setClients(updatedClients);
      
      // Modal'ları kapat
      closeEditModal();
      setSelectedEvent(editingEvent);
      setIsEventModalOpen(true);
    }
  };

  // State'leri başlat
  useEffect(() => {
    loadCalendarData();
  }, []);

  // Veritabanından takvim verilerini yükle
  const loadCalendarData = async () => {
    try {
      // Gerçek veritabanından müşteri verilerini çek
      const clientsData = await DatabaseService.getClients();
      console.log('Veritabanından gelen müşteri verileri:', clientsData);
      
      // Gerçek veritabanından danışman verilerini çek
      const consultantsData = await DatabaseService.getConsultants();
      console.log('Veritabanından gelen danışman verileri:', consultantsData);
      
      if (clientsData && Array.isArray(clientsData)) {
        setClients(clientsData);
      } else {
        // Eğer veritabanı verisi yoksa mock veriyi kullan
        console.log('Veritabanı verisi bulunamadı, mock veri kullanılıyor');
        setClients(initialClients);
      }
      
      if (consultantsData && Array.isArray(consultantsData)) {
        setConsultants(consultantsData);
      }
    } catch (error) {
      console.error('Takvim verisi yüklenirken hata:', error);
      // Hata durumunda mock veriyi kullan
      setClients(initialClients);
    }
  };

  // Events'i clients'tan oluştur
  useEffect(() => {
    console.log('Clients state güncellendi:', clients);
    console.log('Toplam müşteri sayısı:', clients.length);
    
    // Randevu bilgileri eksik olan müşterileri kontrol et
    const clientsWithoutAppointment = clients.filter(client => !client.appointment_date || !client.appointment_time);
    if (clientsWithoutAppointment.length > 0) {
      console.log('Randevu bilgileri eksik olan müşteriler:', clientsWithoutAppointment.map(c => ({
        id: c.id,
        name: c.name,
        appointment_date: c.appointment_date,
        appointment_time: c.appointment_time
      })));
    }
    
    const eventsList = clients
      .filter(client => client.appointment_date && client.appointment_time)
      .map(client => {
        console.log('Randevu oluşturuluyor:', client);
        
        // Danışman ismini bul
        let consultantName = 'Belirtilmemiş';
        if (client.consultant_id && consultants.length > 0) {
          const consultant = consultants.find(c => c.id == client.consultant_id);
          consultantName = consultant ? consultant.name : `Danışman ${client.consultant_id}`;
        }
        
        return {
          id: client.id,
          title: `${client.visa_type || 'Randevu'} - ${client.name}`,
          type: 'appointment',
          date: client.appointment_date,
          time: client.appointment_time,
          duration: '60',
          client: client.name,
          phone: client.phone,
          email: client.email,
          location: 'Ofis',
          notes: client.notes,
          consultant: consultantName,
          consultant_id: client.consultant_id, // Danışman ID'sini ekle
          country: client.country,
          status: client.status,
          passportNo: client.passport_number,
          applicationNo: client.application_number
        };
      });
    
    console.log('Randevu bilgileri olan müşteri sayısı:', eventsList.length);
    console.log('Oluşturulan events:', eventsList);
    setEvents(eventsList);
  }, [clients, consultants]);

  const getDaysForView = () => {
    switch (view) {
      case 'month':
        return getDaysInMonth(currentDate);
      case 'week':
        return getDaysInWeek(currentWeek);
      case 'day':
        return getDaysInDay(currentDay);
      default:
        return getDaysInMonth(currentDate);
    }
  };

  const days = getDaysForView();

  // Danışman filtresini uygula
  const getFilteredEvents = () => {
    if (selectedConsultant === 'all') {
      return events;
    }
    return events.filter(event => event.consultant_id == selectedConsultant);
  };

  const getSortedEvents = () => {
    let sortedEvents = [...getFilteredEvents()];

    switch (sortType) {
      case 'date':
        // Tarihe göre sırala (en eski önce)
        sortedEvents.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
        break;
      case 'appointmentNear':
        // En yakın randevu (bugünden en yakın tarih, geçmiş veya gelecek)
        const now = new Date();
        sortedEvents.sort((a, b) => {
          const aDate = new Date(a.date + 'T' + a.time);
          const bDate = new Date(b.date + 'T' + b.time);
          
          // Her iki tarihin bugünden uzaklığını hesapla (mutlak değer)
          const aDistance = Math.abs(aDate.getTime() - now.getTime());
          const bDistance = Math.abs(bDate.getTime() - now.getTime());
          
          // En yakın olanı önce getir
          return aDistance - bDistance;
        });
        break;
      case 'appointmentFar':
        // En uzak randevu (bugünden en uzak tarih, geçmiş veya gelecek)
        const today = new Date();
        sortedEvents.sort((a, b) => {
          const aDate = new Date(a.date + 'T' + a.time);
          const bDate = new Date(b.date + 'T' + b.time);
          
          // Her iki tarihin bugünden uzaklığını hesapla (mutlak değer)
          const aDistance = Math.abs(aDate.getTime() - today.getTime());
          const bDistance = Math.abs(bDate.getTime() - today.getTime());
          
          // En uzak olanı önce getir
          return bDistance - aDistance;
        });
        break;
      case 'clientName':
        // Müşteri adına göre alfabetik sırala
        sortedEvents.sort((a, b) => a.client.localeCompare(b.client, 'tr'));
        break;
      case 'visaType':
        // Vize türüne göre alfabetik sırala
        sortedEvents.sort((a, b) => {
          const aType = a.title.split(' - ')[0] || '';
          const bType = b.title.split(' - ')[0] || '';
          return aType.localeCompare(bType, 'tr');
        });
        break;
      default:
        // Varsayılan: tarihe göre sırala
        sortedEvents.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    }
    return sortedEvents;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Takvim</h1>
          <p className="text-gray-600 mt-2">Randevuları ve görevleri planlayın</p>
        </div>
                 <div className="flex items-center space-x-3 mt-4 sm:mt-0">
           {/* Danışman Seçimi */}
           <div className="flex items-center space-x-2">
             <label htmlFor="consultantSelect" className="text-sm font-medium text-gray-700">
               Danışman:
             </label>
             <select
               id="consultantSelect"
               value={selectedConsultant}
               onChange={(e) => setSelectedConsultant(e.target.value)}
               className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-colors"
             >
               <option value="all">Tüm Danışmanlar</option>
               {consultants.map(consultant => (
                 <option key={consultant.id} value={consultant.id}>
                   {consultant.name || `Danışman ${consultant.id}`}
                 </option>
               ))}
             </select>
           </div>
           
           <button
             onClick={generateMonthlyCalendarPDF}
             disabled={isGeneratingPDF || view !== 'month'}
             className={`btn-secondary flex items-center ${
               isGeneratingPDF || view !== 'month' 
                 ? 'opacity-50 cursor-not-allowed' 
                 : ''
             }`}
             title={view !== 'month' ? 'PDF indirmek için önce "Ay" görünümüne geçin' : 'Aylık takvimi PDF olarak indir'}
           >
             <Download size={20} className="mr-2" />
             {isGeneratingPDF ? 'PDF Oluşturuluyor...' : 'PDF Takvim'}
           </button>
           {view !== 'month' && (
             <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
               PDF için "Ay" görünümü gerekli
             </div>
           )}
         </div>
      </div>

      {/* Calendar Navigation */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (view === 'month') navigateMonth(-1);
                else if (view === 'week') navigateWeek(-1);
                else if (view === 'day') navigateDay(-1);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {view === 'month' && formatDate(currentDate)}
              {view === 'week' && `${formatDate(currentWeek)} - ${formatDate(new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000))}`}
              {view === 'day' && currentDay.toLocaleDateString('tr-TR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <button
              onClick={() => {
                if (view === 'month') navigateMonth(1);
                else if (view === 'week') navigateWeek(1);
                else if (view === 'day') navigateDay(1);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={openDatePicker}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Tarih Seç
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Bugün
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => handleViewChange('month')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  view === 'month' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Ay
              </button>
              <button
                onClick={() => handleViewChange('week')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  view === 'week' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Hafta
              </button>
              <button
                onClick={() => handleViewChange('day')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  view === 'day' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Gün
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div 
          ref={calendarRef}
          className={`grid gap-px bg-gray-200 rounded-lg overflow-hidden ${
            view === 'month' ? 'grid-cols-7' : 
            view === 'week' ? 'grid-cols-7' : 
            'grid-cols-1'
          }`}
        >
          {/* Day Headers */}
          {view !== 'day' && ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
            <div key={day} className="bg-gray-50 p-3 text-center">
              <span className="text-sm font-medium text-gray-700">{day}</span>
            </div>
          ))}
          
                     {/* Calendar Days */}
           {days.map((day, index) => {
             const dayEvents = getEventsForDate(day.date);
             // Danışman filtresini uygula
             const filteredDayEvents = selectedConsultant === 'all' 
               ? dayEvents 
               : dayEvents.filter(event => event.consultant_id == selectedConsultant);
             const isToday = formatDateForComparison(day.date) === formatDateForComparison(new Date());
             const isSelected = selectedDate && formatDateForComparison(day.date) === formatDateForComparison(selectedDate);
             const hasAppointments = filteredDayEvents.length > 0;
            
            return (
              <div
                key={index}
                onClick={() => setSelectedDate(day.date)}
                className={`${view === 'day' ? 'min-h-[400px]' : 'min-h-[120px]'} p-2 cursor-pointer hover:bg-gray-50 transition-colors relative ${
                  !day.isCurrentMonth ? 'text-gray-400' : ''
                } ${isToday ? 'bg-blue-50' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''} ${
                  hasAppointments ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-400 shadow-md' : 'bg-white'
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  hasAppointments ? 'text-blue-900 font-bold' : ''
                }`}>
                  {day.date.getDate()}
                                     {hasAppointments && (
                     <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                       {filteredDayEvents.length}
                     </div>
                   )}
                 </div>
                 
                 {/* Events */}
                 <div className="space-y-1">
                   {filteredDayEvents.slice(0, view === 'day' ? 10 : 2).map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                      className={`text-xs p-1 rounded border bg-blue-300 text-blue-900 border-blue-400 flex items-center space-x-1 cursor-pointer hover:bg-blue-400 transition-colors font-medium`}
                    >
                      {getEventTypeIcon(event.type)}
                      <span className="truncate">{event.title.split(' - ')[0]}</span>
                    </div>
                  ))}
                                     {filteredDayEvents.length > (view === 'day' ? 10 : 2) && (
                     <div className="text-xs text-blue-700 text-center font-bold bg-blue-200 rounded px-2 py-1">
                       +{filteredDayEvents.length - (view === 'day' ? 10 : 2)} daha
                     </div>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('tr-TR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
                     <div className="space-y-4">
             {getEventsForDate(selectedDate)
               .filter(event => selectedConsultant === 'all' || event.consultant_id == selectedConsultant)
               .map(event => (
              <div key={event.id} className="border-2 border-blue-300 bg-blue-50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-200 text-blue-800 border border-blue-300">
                        Randevu
                      </span>
                      <span className="text-sm text-blue-600 font-medium">{event.time} - {event.duration} dk</span>
                    </div>
                    <h4 className="font-medium text-blue-900 mb-2">{event.title}</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-center space-x-2">
                        <User size={14} className="text-blue-600" />
                        <span>{event.client}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone size={14} className="text-blue-600" />
                        <span>{event.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail size={14} className="text-blue-600" />
                        <span>{event.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} className="text-blue-600" />
                        <span>{event.location}</span>
                      </div>
                      {event.consultant && (
                        <div className="flex items-center space-x-2">
                          <User size={14} className="text-blue-600" />
                          <span>Danışman: {event.consultant}</span>
                        </div>
                      )}
                      {event.country && (
                        <div className="flex items-center space-x-2">
                          <MapPin size={14} className="text-blue-600" />
                          <span>Hedef Ülke: {event.country}</span>
                        </div>
                      )}
                      {event.notes && (
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-400">•</span>
                          <span>{event.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="text-blue-600 hover:text-blue-900 p-1">
                      <Edit size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-900 p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
                         {getEventsForDate(selectedDate)
               .filter(event => selectedConsultant === 'all' || event.consultant_id == selectedConsultant)
               .length === 0 && (
               <div className="text-center py-8 text-gray-500">
                 {selectedConsultant === 'all' 
                   ? 'Bu tarihte etkinlik bulunmuyor' 
                   : 'Bu tarihte seçili danışmana ait etkinlik bulunmuyor'
                 }
               </div>
             )}
          </div>
        </div>
      )}

             {/* All Events */}
       <div className="card">
         <div className="flex items-center justify-between mb-4">
           <div className="flex items-center space-x-3">
             <h3 className="text-lg font-semibold text-gray-900">
               {selectedConsultant === 'all' ? 'Tüm Randevular' : 'Seçili Danışmanın Randevuları'}
             </h3>
             <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
               {getFilteredEvents().length} randevu bulundu
             </span>
           </div>
           <div className="flex items-center space-x-2">
             <label htmlFor="sortSelect" className="text-sm font-medium text-gray-700">
               Sırala:
             </label>
             <select
               id="sortSelect"
               value={sortType}
               onChange={(e) => setSortType(e.target.value)}
               className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-colors"
             >
               <option value="date">Tarihe Göre</option>
               <option value="appointmentNear">En Yakın Randevu</option>
               <option value="appointmentFar">En Uzak Randevu</option>
               <option value="clientName">Müşteri Adına Göre</option>
               <option value="visaType">Vize Türüne Göre</option>
             </select>
                           <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {sortType === 'date' && 'Tarihe göre sıralanıyor'}
                {sortType === 'appointmentNear' && 'Bugünden en yakın randevular önce'}
                {sortType === 'appointmentFar' && 'Bugünden en uzak randevular önce'}
                {sortType === 'clientName' && 'Müşteri adına göre sıralanıyor'}
                {sortType === 'visaType' && 'Vize türüne göre sıralanıyor'}
              </div>
           </div>
         </div>
         <div className="space-y-3">
           {getSortedEvents().length > 0 ? (
             getSortedEvents().map(event => (
               <div 
                 key={event.id} 
                 onClick={() => handleEventClick(event)}
                 className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
               >
                 <div className="p-2 rounded-lg bg-blue-200 text-blue-800">
                   <CalendarIcon size={16} />
                 </div>
                 <div className="flex-1">
                   <h4 className="font-medium text-blue-900">{event.title}</h4>
                   <p className="text-sm text-blue-700">{event.date} - {event.time}</p>
                   {event.consultant && (
                     <p className="text-xs text-blue-600">Danışman: {event.consultant}</p>
                   )}
                 </div>
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     handleEventClick(event);
                   }}
                   className="text-blue-600 hover:text-blue-900 p-1"
                 >
                   <Eye size={16} />
                 </button>
               </div>
             ))
                        ) : (
               <div className="text-center py-8 text-gray-500">
                 <CalendarIcon size={48} className="mx-auto mb-2 text-gray-300" />
                 <p>
                   {selectedConsultant === 'all' 
                     ? 'Henüz randevu bulunmuyor' 
                     : 'Seçili danışmana ait randevu bulunmuyor'
                   }
                 </p>
                 <p className="text-sm text-gray-400 mt-1">
                   {selectedConsultant === 'all' 
                     ? 'Müşterilerin randevu tarihi ve saati bilgileri eksik olabilir'
                     : 'Bu danışmana ait müşterilerin randevu bilgileri eksik olabilir'
                   }
                 </p>
               </div>
             )}
         </div>
       </div>

      {/* Event Detail Modal */}
      {isEventModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-blue-900">Randevu Detayları</h3>
              <button
                onClick={closeEventModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xl font-semibold text-blue-900">{selectedEvent.title}</h4>
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-200 text-blue-800 border border-blue-300">
                    Randevu
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon size={16} className="text-blue-600" />
                    <span className="text-blue-800 font-medium">{selectedEvent.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={16} className="text-blue-600" />
                    <span className="text-blue-800 font-medium">{selectedEvent.time} - {selectedEvent.duration} dk</span>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-lg font-semibold text-gray-900 mb-3 border-b pb-2">Müşteri Bilgileri</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User size={16} className="text-blue-600" />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Ad Soyad:</span> {selectedEvent.client}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone size={16} className="text-blue-600" />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Telefon:</span> {selectedEvent.phone}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail size={16} className="text-blue-600" />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">E-posta:</span> {selectedEvent.email}
                      </span>
                    </div>
                    {selectedEvent.passportNo && (
                      <div className="flex items-center space-x-2">
                        <CreditCard size={16} className="text-blue-600" />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">Pasaport No:</span> {selectedEvent.passportNo}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {selectedEvent.applicationNo && (
                      <div className="flex items-center space-x-2">
                        <FileText size={16} className="text-blue-600" />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">Başvuru No:</span> {selectedEvent.applicationNo}
                        </span>
                      </div>
                    )}
                    {selectedEvent.consultant && (
                      <div className="flex items-center space-x-2">
                        <User size={16} className="text-blue-600" />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">Danışman:</span> {selectedEvent.consultant}
                        </span>
                      </div>
                    )}
                    {selectedEvent.country && (
                      <div className="flex items-center space-x-2">
                        <MapPin size={16} className="text-blue-600" />
                        <span className="text-sm text-gray-700">
                          <span className="font-medium">Hedef Ülke:</span> {selectedEvent.country}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <MapPin size={16} className="text-blue-600" />
                      <span className="text-sm text-gray-700">
                        <span className="font-medium">Konum:</span> {selectedEvent.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedEvent.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="text-lg font-semibold text-yellow-900 mb-2">Notlar</h5>
                  <p className="text-sm text-yellow-800">{selectedEvent.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={closeEventModal}
                  className="btn-secondary"
                >
                  Kapat
                </button>
                <button 
                  onClick={() => handleEditEvent(selectedEvent)}
                  className="btn-primary flex items-center"
                >
                  <Edit size={16} className="mr-2" />
                  Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && editingEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-blue-900">Randevu Düzenle</h3>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-xl font-semibold text-blue-900 mb-3">{editingEvent.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Tarih</label>
                    <input
                      type="date"
                      value={editingEvent.date}
                      onChange={(e) => setEditingEvent({...editingEvent, date: e.target.value})}
                      className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-800 mb-1">Saat</label>
                    <input
                      type="time"
                      value={editingEvent.time}
                      onChange={(e) => setEditingEvent({...editingEvent, time: e.target.value})}
                      className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="block text-lg font-semibold text-yellow-900 mb-2">Notlar</label>
                <textarea
                  value={editingEvent.notes || ''}
                  onChange={(e) => setEditingEvent({...editingEvent, notes: e.target.value})}
                  rows={4}
                  className="w-full p-3 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Randevu notları..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={closeEditModal}
                  className="btn-secondary"
                >
                  İptal
                </button>
                <button 
                  onClick={handleSaveEvent}
                  className="btn-primary flex items-center"
                >
                  <Edit size={16} className="mr-2" />
                  Kaydet
                </button>
              </div>
            </div>
          </div>
                 </div>
       )}

       {/* Date Picker Modal */}
       {isDatePickerOpen && (
         <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
           <div className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-gray-900">Tarih Seç</h3>
               <button
                 onClick={closeDatePicker}
                 className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
               >
                 ×
               </button>
             </div>
             
             <div className="space-y-6">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Gitmek istediğiniz tarihi seçin
                 </label>
                 <input
                   type="date"
                   value={selectedDateInput}
                   onChange={(e) => setSelectedDateInput(e.target.value)}
                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 />
               </div>

               <div className="flex justify-end space-x-3 pt-4 border-t">
                 <button
                   onClick={closeDatePicker}
                   className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                 >
                   İptal
                 </button>
                 <button 
                   onClick={handleDateSelect}
                   disabled={!selectedDateInput}
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                 >
                   Git
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default Calendar;
