import { DatabaseService } from './database';
import { supabase } from '../config/supabase';

export class BackupService {
  
  /**
   * Tam sistem yedeği oluştur (JSON formatında)
   */
  static async createFullBackup() {
    try {
      console.log('🔄 Tam sistem yedeği oluşturuluyor...');

      // Tüm tabloları yedekle
      const [
        clients,
        consultants, 
        documents,
        finance,
        calendar,
        reports,
        tasks,
        taskAssignments,
        companySettings
      ] = await Promise.all([
        this.getTableData('clients'),
        this.getTableData('consultants'),
        this.getTableData('documents'),
        this.getTableData('finance'),
        this.getTableData('calendar'),
        this.getTableData('reports'),
        this.getTableData('tasks'),
        this.getTableData('task_assignments'),
        DatabaseService.getCompanySettings()
      ]);

      const backup = {
        metadata: {
          version: '1.0',
          created_at: new Date().toISOString(),
          created_by: 'CRM_System',
          total_records: clients.length + consultants.length + documents.length + 
                        finance.length + calendar.length + reports.length + 
                        tasks.length + taskAssignments.length
        },
        data: {
          clients,
          consultants: consultants.map(c => ({ ...c, password: '[HIDDEN]', plain_password: '[HIDDEN]' })), // Şifreleri gizle
          documents,
          finance,
          calendar,
          reports,
          tasks,
          task_assignments: taskAssignments,
          company_settings: companySettings
        }
      };

      console.log('✅ Tam sistem yedeği oluşturuldu:', backup.metadata.total_records, 'kayıt');
      return {
        success: true,
        data: backup,
        filename: `crm_full_backup_${new Date().toISOString().split('T')[0]}.json`
      };

    } catch (error) {
      console.error('❌ Tam sistem yedeği hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sadece veritabanı yedeği oluştur (SQL formatında)
   */
  static async createDatabaseBackup() {
    try {
      console.log('🔄 Veritabanı yedeği oluşturuluyor...');

      const backup = await this.createFullBackup();
      if (!backup.success) {
        throw new Error(backup.error);
      }

      // SQL formatına çevir
      let sql = `-- CRM Veritabanı Yedeği\n-- Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}\n-- Toplam Kayıt: ${backup.data.metadata.total_records}\n\n`;

      // Her tablo için INSERT statement'ları oluştur
      const tables = ['clients', 'consultants', 'documents', 'finance', 'calendar', 'reports', 'tasks', 'task_assignments'];
      
      for (const tableName of tables) {
        const tableData = backup.data.data[tableName];
        if (tableData && tableData.length > 0) {
          sql += `-- ${tableName.toUpperCase()} tablosu\n`;
          sql += `DELETE FROM ${tableName};\n`;
          
          for (const row of tableData) {
            const columns = Object.keys(row).join(', ');
            const values = Object.values(row).map(value => {
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
              return value;
            }).join(', ');
            
            sql += `INSERT INTO ${tableName} (${columns}) VALUES (${values});\n`;
          }
          sql += `\n`;
        }
      }

      console.log('✅ Veritabanı yedeği oluşturuldu');
      return {
        success: true,
        data: sql,
        filename: `crm_database_backup_${new Date().toISOString().split('T')[0]}.sql`
      };

    } catch (error) {
      console.error('❌ Veritabanı yedeği hatası:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Belirli bir tablodan veri al
   */
  static async getTableData(tableName) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`❌ ${tableName} tablosu veri alma hatası:`, error);
      return [];
    }
  }

  /**
   * Dosya olarak yedek indir
   */
  static downloadBackup(data, filename, type = 'application/json') {
    try {
      const content = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
      const blob = new Blob([content], { type });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('✅ Yedek dosyası indirildi:', filename);
      return { success: true };
    } catch (error) {
      console.error('❌ Dosya indirme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Yedekleme geçmişini al
   */
  static getBackupHistory() {
    // LocalStorage'dan yedekleme geçmişini al
    const history = localStorage.getItem('backup_history');
    return history ? JSON.parse(history) : [];
  }

  /**
   * Yedekleme geçmişine ekle
   */
  static addToBackupHistory(backup) {
    const history = this.getBackupHistory();
    const newEntry = {
      id: Date.now(),
      type: backup.type || 'full',
      filename: backup.filename,
      size: backup.size || 'Bilinmiyor',
      created_at: new Date().toISOString(),
      records_count: backup.records_count || 0
    };

    history.unshift(newEntry); // En yenisi başta
    
    // En fazla 10 kayıt sakla
    if (history.length > 10) {
      history.splice(10);
    }

    localStorage.setItem('backup_history', JSON.stringify(history));
    return newEntry;
  }

  /**
   * Yedek dosyasını doğrula
   */
  static validateBackupFile(fileContent) {
    try {
      const backup = JSON.parse(fileContent);
      
      // Gerekli alanları kontrol et
      if (!backup.metadata || !backup.data) {
        return { valid: false, error: 'Geçersiz yedek dosyası formatı' };
      }

      if (!backup.metadata.version || !backup.metadata.created_at) {
        return { valid: false, error: 'Yedek dosyası metadata eksik' };
      }

      return { valid: true, backup };
    } catch (error) {
      return { valid: false, error: 'JSON parse hatası: ' + error.message };
    }
  }
}
