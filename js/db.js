/* ===========================
   DB.js - LocalStorage Database
   All persistent data management
   =========================== */
const DB = {
  _state: null,

  async init() {
    try {
      const res = await fetch('http://localhost:3000/api/db');
      if (res.ok) {
        this._state = await res.json();
        
        if (Object.keys(this._state).length === 0) {
          let migrated = false;
          Object.values(this.KEYS).forEach(k => {
            const val = localStorage.getItem(k);
            if (val) {
               this._state[k] = JSON.parse(val);
               migrated = true;
            }
          });
          if (migrated) {
            await fetch('http://localhost:3000/api/db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this._state)
            });
          }
        }
      } else {
        this._state = {};
      }
    } catch (e) {
      console.error('Failed to connect to backend DB, falling back to LocalStorage', e);
      this._state = null;
    }
  },

  KEYS: {
    members: 'abbf_members',
    admins: 'abbf_admins',
    tokens: 'abbf_tokens',
    contributions: 'abbf_contributions',
    payments: 'abbf_payments',
    deathEvents: 'abbf_death_events',
    documents: 'abbf_documents',
    auditLog: 'abbf_audit_log',
    waiverVersions: 'abbf_waiver_versions',
    settings: 'abbf_settings',
    memberSignatures: 'abbf_member_signatures',
    emailTemplates: 'abbf_email_templates',
  },

  get(key) {
    if (this._state) return this._state[key] || [];
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch { return []; }
  },

  getObj(key) {
    if (this._state) return this._state[key] || {};
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch { return {}; }
  },

  set(key, value) {
    if (this._state) {
      this._state[key] = value;
      fetch('http://localhost:3000/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this._state)
      }).catch(e => console.error("Sync failed", e));
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  // ID generator
  newId() {
    return 'MBR-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  },

  newGenId(prefix = '') {
    return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
  },

  // ============ Members ============
  getMembers() { return this.get(this.KEYS.members); },

  getMember(id) {
    return this.getMembers().find(m => m.id === id);
  },

  getMemberByEmail(email) {
    return this.getMembers().find(m => m.email.toLowerCase() === email.toLowerCase());
  },

  saveMember(member) {
    const members = this.getMembers();
    const i = members.findIndex(m => m.id === member.id);
    if (i >= 0) {
      members[i] = { ...members[i], ...member, updatedAt: new Date().toISOString() };
    } else {
      members.push({ ...member, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.set(this.KEYS.members, members);
    return member;
  },

  deleteMember(id) {
    const members = this.getMembers().filter(m => m.id !== id);
    this.set(this.KEYS.members, members);
    
    // Remove associated tokens so they can register fresh
    const tokens = this.get(this.KEYS.tokens).filter(t => t.memberId !== id);
    this.set(this.KEYS.tokens, tokens);
  },

  updateMemberStatus(id, status) {
    const members = this.getMembers();
    const m = members.find(m => m.id === id);
    if (m) {
      const old = m.status;
      m.status = status;
      m.updatedAt = new Date().toISOString();
      this.set(this.KEYS.members, members);
      this.addAuditLog(id, 'member', 'status_change', { status: old }, { status });
    }
  },

  // ============ Admins ============
  getAdmins() { return this.get(this.KEYS.admins); },

  getAdmin(id) { return this.getAdmins().find(a => a.id === id); },

  getAdminByEmail(email) {
    return this.getAdmins().find(a => a.email.toLowerCase() === email.toLowerCase());
  },

  saveAdmin(admin) {
    const admins = this.getAdmins();
    const i = admins.findIndex(a => a.id === admin.id);
    if (i >= 0) {
      admins[i] = { ...admins[i], ...admin, updatedAt: new Date().toISOString() };
    } else {
      admins.push({ ...admin, createdAt: new Date().toISOString() });
    }
    this.set(this.KEYS.admins, admins);
  },

  // ============ Tokens ============
  generateToken(type, memberId, email) {
    const tokens = this.get(this.KEYS.tokens);
    const expiryDays = type === 'registration' ? 30 : 3; // 30 days for registration, 3 days (72h) for update
    const token = {
      id: this.newGenId('TKN'),
      type, // 'registration' | 'update'
      memberId,
      email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString(),
      used: false
    };
    tokens.push(token);
    this.set(this.KEYS.tokens, tokens);
    return token;
  },

  getToken(id) {
    return this.get(this.KEYS.tokens).find(t => t.id === id);
  },

  validateToken(id) {
    const token = this.getToken(id);
    if (!token) return { valid: false, reason: 'not_found' };
    if (token.used) return { valid: false, reason: 'used' };
    if (new Date() > new Date(token.expiresAt)) return { valid: false, reason: 'expired' };
    return { valid: true, token };
  },

  useToken(id) {
    const tokens = this.get(this.KEYS.tokens);
    const t = tokens.find(t => t.id === id);
    if (t) {
      t.used = true;
      t.usedAt = new Date().toISOString();
      this.set(this.KEYS.tokens, tokens);
    }
  },

  // ============ Contributions ============
  getContributions() { return this.get(this.KEYS.contributions); },

  getMemberContributions(memberId) {
    return this.getContributions().filter(c => c.memberId === memberId);
  },

  saveContribution(contribution) {
    const cs = this.getContributions();
    const i = cs.findIndex(c => c.id === contribution.id);
    if (i >= 0) cs[i] = { ...cs[i], ...contribution };
    else cs.push({ id: this.newGenId('CTB'), ...contribution, createdAt: new Date().toISOString() });
    this.set(this.KEYS.contributions, cs);
  },

  // ============ Payments ============
  getPayments() { return this.get(this.KEYS.payments); },

  getMemberPayments(memberId) {
    return this.getPayments().filter(p => p.memberId === memberId);
  },

  addPayment(payment) {
    const payments = this.getPayments();
    const p = { id: this.newGenId('PAY'), ...payment, createdAt: new Date().toISOString() };
    payments.push(p);
    this.set(this.KEYS.payments, payments);
    // Update kitty balance
    this.updateKittyBalance(payment.memberId, payment.amount);
    return p;
  },

  getMemberKittyBalance(memberId) {
    const member = this.getMember(memberId);
    return member ? (member.kittyBalance || 0) : 0;
  },

  updateKittyBalance(memberId, amount) {
    const members = this.getMembers();
    const m = members.find(m => m.id === memberId);
    if (m) {
      m.kittyBalance = (m.kittyBalance || 0) + amount;
      m.updatedAt = new Date().toISOString();
      this.set(this.KEYS.members, members);
    }
  },

  // ============ Death Events ============
  getDeathEvents() { return this.get(this.KEYS.deathEvents); },

  getDeathEvent(id) { return this.getDeathEvents().find(d => d.id === id); },

  saveDeathEvent(event) {
    const events = this.getDeathEvents();
    const i = events.findIndex(e => e.id === event.id);
    if (i >= 0) {
      events[i] = { ...events[i], ...event, updatedAt: new Date().toISOString() };
    } else {
      const e = { id: this.newGenId('DTH'), ...event, createdAt: new Date().toISOString() };
      events.push(e);
      // Auto-create contribution records for all active members
      this.createContributionsForDeath(e);
      return e;
    }
    this.set(this.KEYS.deathEvents, events);
    return event;
  },

  createContributionsForDeath(deathEvent) {
    const activeMembers = this.getMembers().filter(m => m.status === 'active' && m.id !== deathEvent.reportedByMemberId);
    const perMember = deathEvent.payoutAmount ? Math.ceil(deathEvent.payoutAmount / activeMembers.length) : 0;
    activeMembers.forEach(m => {
      this.saveContribution({
        memberId: m.id,
        deathEventId: deathEvent.id,
        deceasedName: deathEvent.deceasedName,
        amount: perMember,
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'unpaid',
        lateFee: 0
      });
    });
    const events = this.getDeathEvents();
    events.push(deathEvent);
    this.set(this.KEYS.deathEvents, events);
  },

  // ============ Documents ============
  getDocuments() { return this.get(this.KEYS.documents); },

  getMemberDocuments(memberId) {
    return this.getDocuments().filter(d => d.memberId === memberId);
  },

  saveDocument(doc) {
    const docs = this.getDocuments();
    const d = { id: this.newGenId('DOC'), ...doc, uploadedAt: new Date().toISOString() };
    docs.push(d);
    this.set(this.KEYS.documents, docs);
    return d;
  },

  // ============ Audit Log ============
  getAuditLog() { return this.get(this.KEYS.auditLog); },

  addAuditLog(entityId, entityType, action, oldValue, newValue, performedBy) {
    const logs = this.getAuditLog();
    logs.push({
      id: this.newGenId('AUD'),
      entityId, entityType, action,
      oldValue: JSON.stringify(oldValue),
      newValue: JSON.stringify(newValue),
      performedBy: performedBy || (window.Auth && window.Auth.currentUser ? window.Auth.currentUser.email : 'system'),
      timestamp: new Date().toISOString()
    });
    this.set(this.KEYS.auditLog, logs);
  },

  // ============ Waiver Versions ============
  getWaiverVersions() { return this.get(this.KEYS.waiverVersions); },

  getLatestWaiver() {
    const versions = this.getWaiverVersions();
    return versions.length ? versions[versions.length - 1] : null;
  },

  addWaiverVersion(content) {
    const versions = this.getWaiverVersions();
    const v = {
      id: this.newGenId('WVR'),
      version: `v${versions.length + 1}.0`,
      content,
      effectiveDate: new Date().toISOString(),
      createdBy: window.Auth && window.Auth.currentUser ? window.Auth.currentUser.email : 'admin'
    };
    versions.push(v);
    this.set(this.KEYS.waiverVersions, versions);
    return v;
  },

  // ============ Member Signatures ============
  getSignatures() { return this.get(this.KEYS.memberSignatures); },

  saveSignature(memberId, waiverVersionId, signatureData) {
    const sigs = this.getSignatures();
    sigs.push({
      id: this.newGenId('SIG'),
      memberId,
      waiverVersionId,
      signatureData,
      signedAt: new Date().toISOString(),
      ipAddress: 'collected-locally'
    });
    this.set(this.KEYS.memberSignatures, sigs);
  },

  getMemberSignatures(memberId) {
    return this.getSignatures().filter(s => s.memberId === memberId);
  },

  // ============ Notifications ============
  getNotifications() { return this.get(this.KEYS.notifications); },

  addNotification(notif) {
    const notifs = this.getNotifications();
    notifs.push({ id: this.newGenId('NOT'), ...notif, sentAt: new Date().toISOString() });
    this.set(this.KEYS.notifications, notifs);
  },

  apiSendEmails(notifications) {
    return new Promise(async (resolve, reject) => {
      try {
        const settings = this.getSettings();
        if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
          throw new Error('SMTP is not fully configured in the Settings page.');
        }

        const response = await fetch('http://localhost:3000/api/send-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifications, smtpSettings: settings })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.message || 'Unknown server error');

        const notifs = this.getNotifications();
        data.results.forEach(n => {
          notifs.push({ id: this.newGenId('NOT'), ...n, sentAt: new Date().toISOString() });
        });
        this.set(this.KEYS.notifications, notifs);

        resolve({ success: true, message: data.message });
      } catch (err) {
        reject(new Error('Network or Server Error: ' + err.message));
      }
    });
  },

  // ============ Email Templates ============
  getEmailTemplates() {
    let templates = this.get(this.KEYS.emailTemplates);
    if (!templates.length) {
      templates = [
        { id: 'tpl_general', name: 'General Announcement', subject: 'Important Update from Abeingo BBF', body: 'Dear {member_name},\n\n', isDefault: true },
        { id: 'tpl_reminder', name: 'Semi-annual Reminder', subject: 'Abeingo BBF — Semi-annual Update', body: 'Dear {member_name},\n\nThis is a gentle reminder to verify your profile information for this semi-annual period.\n\nThank you,\n{admin_name}', isDefault: true },
        { id: 'tpl_death', name: 'Notice of Bereavement', subject: 'Abeingo BBF — Notice of Bereavement', body: 'Dear {member_name},\n\nWe regret to inform you of the passing of [Name].\n\nPlease keep the family in your thoughts.\n\nSincerely,\n{admin_name}', isDefault: true },
        { id: 'tpl_reg_link', name: 'Registration Link', subject: 'Your Registration Link - Abeingo BBF', body: 'Dear {member_name},\n\nYou have been invited to join the Abeingo Boston Benevolent Fund.\n\nPlease click the link below to complete your registration:\n<a href="{link}">{link}</a>\n\nThis link will expire in {expiry} hours.\n\nSincerely,\n{admin_name}', isDefault: true },
        { id: 'tpl_update_link', name: 'Profile Update Link', subject: 'Update Your Profile - Abeingo BBF', body: 'Dear {member_name},\n\nPlease click the link below to update your member profile and beneficiaries:\n<a href="{link}">{link}</a>\n\nThis link will expire in {expiry} hours.\n\nSincerely,\n{admin_name}', isDefault: true }
      ];
      this.set(this.KEYS.emailTemplates, templates);
    } else {
      let needsSave = false;
      if (!templates.find(t => t.id === 'tpl_reg_link')) {
        templates.push({ id: 'tpl_reg_link', name: 'Registration Link', subject: 'Your Registration Link - Abeingo BBF', body: 'Dear {member_name},\n\nYou have been invited to join the Abeingo Boston Benevolent Fund.\n\nPlease click the link below to complete your registration:\n<a href="{link}">{link}</a>\n\nThis link will expire in {expiry} hours.\n\nSincerely,\n{admin_name}', isDefault: true });
        needsSave = true;
      }
      if (!templates.find(t => t.id === 'tpl_update_link')) {
        templates.push({ id: 'tpl_update_link', name: 'Profile Update Link', subject: 'Update Your Profile - Abeingo BBF', body: 'Dear {member_name},\n\nPlease click the link below to update your member profile and beneficiaries:\n<a href="{link}">{link}</a>\n\nThis link will expire in {expiry} hours.\n\nSincerely,\n{admin_name}', isDefault: true });
        needsSave = true;
      }
      if (needsSave) this.set(this.KEYS.emailTemplates, templates);
    }
    return templates;
  },

  saveEmailTemplate(template) {
    const templates = this.getEmailTemplates();
    const i = templates.findIndex(t => t.id === template.id);
    if (i >= 0) {
      templates[i] = { ...templates[i], ...template };
    } else {
      templates.push({ id: this.newGenId('TPL'), ...template });
    }
    this.set(this.KEYS.emailTemplates, templates);
  },

  deleteEmailTemplate(id) {
    let templates = this.getEmailTemplates();
    templates = templates.filter(t => t.id !== id || t.isDefault); // Prevent deleting defaults
    this.set(this.KEYS.emailTemplates, templates);
  },

  // ============ Settings ============
  getSettings() {
    return this.getObj(this.KEYS.settings);
  },

  saveSettings(settings) {
    this.set(this.KEYS.settings, settings);
  },

  getDefaultSettings() {
    return {
      orgName: 'Abeingo Boston Benevolent Fund',
      registrationFee: 10,
      gracePeriodDays: 90,
      lateFeeWeek1: 5,
      lateFeeWeek2Plus: 2,
      paymentDueDays: 15,
      semiAnnualReminderMonths: 6,
      linkExpiryHours: 72,
      emailEnabled: true,
      whatsappEnabled: false,
      smtpHost: '',
      smtpPort: '',
      smtpUser: '',
      smtpPass: '',
      whatsappApiKey: '',
      adminPhone: '',
      adminEmail: '',
      currency: 'USD',
      emailLogoUrl: '',
      emailBrandColor: '#0f3a63',
      emailHeader: 'Abeingo Boston Benevolent Fund',
      emailFooter: '© 2024 Abeingo Boston Benevolent Fund. All rights reserved.\nThis email was sent to members of the fund.',
    };
  },

  // ============ Seed Data ============
  seedIfEmpty() {
    // Seed default admin
    if (!this.getAdmins().length) {
      this.saveAdmin({
        id: 'admin-001',
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@abeingo.org',
        password: 'Admin@1234',
        role: 'super_admin',
        active: true
      });
      this.saveAdmin({
        id: 'admin-002',
        firstName: 'Committee',
        lastName: 'Member',
        email: 'committee@abeingo.org',
        password: 'Committee@1234',
        role: 'committee',
        active: true
      });
    }

    // Seed default waiver
    if (!this.getWaiverVersions().length) {
      this.addWaiverVersion(WAIVER_TEXT);
    }

    // Seed default settings
    if (!Object.keys(this.getSettings()).length) {
      this.saveSettings(this.getDefaultSettings());
    }

    // Seed sample members if empty
    if (!this.getMembers().length) {
      const sampleMembers = [
        {
          id: 'MBR-001',
          firstName: 'John',
          lastName: 'Abeingo',
          email: 'john.abeingo@email.com',
          phone: '+1-617-555-0101',
          address: '123 Main Street',
          city: 'Boston',
          state: 'MA',
          zipCode: '02101',
          country: 'USA',
          dateOfBirth: '1985-03-15',
          gender: 'male',
          occupation: 'Engineer',
          status: 'active',
          joinDate: '2023-01-15',
          kittyBalance: 150,
          gracePeriodEnd: null,
          lastVerified: '2024-07-01',
          familyMembers: [
            { id: 'FM-001', firstName: 'Mary', lastName: 'Abeingo', relationship: 'spouse', dateOfBirth: '1987-06-20', status: 'alive' },
            { id: 'FM-002', firstName: 'James', lastName: 'Abeingo', relationship: 'child', dateOfBirth: '2010-09-05', status: 'alive' }
          ],
          nextOfKinId: 'FM-001',
          beneficiaries: [
            { familyMemberId: 'FM-001', name: 'Mary Abeingo', type: 'primary', percentage: 70 },
            { familyMemberId: 'FM-002', name: 'James Abeingo', type: 'secondary', percentage: 30 }
          ],
          approvedAt: '2023-01-16',
          approvedBy: 'admin-001'
        },
        {
          id: 'MBR-002',
          firstName: 'Grace',
          lastName: 'Okonkwo',
          email: 'grace.okonkwo@email.com',
          phone: '+1-617-555-0202',
          address: '456 Elm Avenue',
          city: 'Boston',
          state: 'MA',
          zipCode: '02102',
          country: 'USA',
          dateOfBirth: '1979-11-22',
          gender: 'female',
          occupation: 'Nurse',
          status: 'active',
          joinDate: '2023-03-01',
          kittyBalance: 200,
          gracePeriodEnd: null,
          lastVerified: '2024-07-15',
          familyMembers: [
            { id: 'FM-003', firstName: 'Paul', lastName: 'Okonkwo', relationship: 'spouse', dateOfBirth: '1977-04-10', status: 'alive' }
          ],
          nextOfKinId: 'FM-003',
          beneficiaries: [
            { familyMemberId: 'FM-003', name: 'Paul Okonkwo', type: 'primary', percentage: 100 }
          ],
          approvedAt: '2023-03-02',
          approvedBy: 'admin-001'
        },
        {
          id: 'MBR-003',
          firstName: 'David',
          lastName: 'Mensah',
          email: 'david.mensah@email.com',
          phone: '+1-617-555-0303',
          address: '789 Oak Drive',
          city: 'Cambridge',
          state: 'MA',
          zipCode: '02139',
          country: 'USA',
          dateOfBirth: '1990-07-08',
          gender: 'male',
          occupation: 'Teacher',
          status: 'grace',
          joinDate: '2024-10-01',
          kittyBalance: 25,
          gracePeriodEnd: '2025-01-01',
          lastVerified: null,
          familyMembers: [],
          beneficiaries: [],
          approvedAt: null,
          approvedBy: null
        },
        {
          id: 'MBR-004',
          firstName: 'Amina',
          lastName: 'Diallo',
          email: 'amina.diallo@email.com',
          phone: '+1-617-555-0404',
          address: '101 Pine Street',
          city: 'Roxbury',
          state: 'MA',
          zipCode: '02119',
          country: 'USA',
          dateOfBirth: '1983-02-28',
          gender: 'female',
          occupation: 'Accountant',
          status: 'pending',
          joinDate: null,
          kittyBalance: 0,
          gracePeriodEnd: null,
          lastVerified: null,
          familyMembers: [],
          beneficiaries: [],
          approvedAt: null,
          approvedBy: null
        }
      ];
      sampleMembers.forEach(m => this.saveMember(m));
    }
  },

  importData(type, items, overwrite = false) {
    const key = this.KEYS[type];
    if (!key) throw new Error(`Invalid import type: ${type}`);
    
    let current = this.get(key);
    let count = 0;

    items.forEach(item => {
      // Generate ID if missing
      if (!item.id) {
        if (type === 'members') item.id = this.newId();
        else if (type === 'contributions') item.id = this.newGenId('CTB');
        else item.id = this.newGenId('IMP');
      }

      const existingIndex = current.findIndex(x => x.id === item.id);
      if (existingIndex >= 0) {
        if (overwrite) {
          current[existingIndex] = { ...current[existingIndex], ...item, updatedAt: new Date().toISOString() };
          count++;
        }
      } else {
        current.push({ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        count++;
      }
    });

    this.set(key, current);
    this.addAuditLog('system', type, 'imported', null, { count });
    return count;
  }
};

// Waiver text constant
const WAIVER_TEXT = `<h4>Waiver of Liabilities</h4>
<p>1. In consideration of my voluntary participation in the Abeingo Boston Benevolent Fund, I hereby RELEASE, WAIVE, DISCHARGE AND agree NOT TO SUE, The Abeingo Boston Benevolent Group Committee (herein after referred to as RELEASEES) from all liability, claims, demands, action and causes of action whatsoever arising out of or related to all issues, WHETHER CAUSED BY THE NEGLIGENCE OF THE RELEASEES, or otherwise, while participating in the Abeingo Benevolent Fund.</p>
<p>2. If there is no proof of death and a payment is declined, I will not SUE the committee, and the members of the committee will not be liable.</p>
<p>3. I further hereby agree that my membership to the said fund is non-transferable. The registration fee is nonrefundable and I will not sue or request any refund from Abeingo Boston Benevolent Fund after membership termination either voluntary or any other reason deemed to render me as non Abeingo Boston Benevolent Fund member.</p>
<h4>Contribution Replenishment</h4>
<p>I hereby agree and covenant to submit and will replenish contribution within 15 business days after being notified of the death of an individual covered by the Benevolent fund. This amount may vary from time to time based on the membership of fund. If the payment is not received by the deadline date, there will be a late fee $5.00 for the first week and additional of $2.00 for the second week and $2.00 for each subsequent week until I have exhausted all the funds in the Kitty.</p>
<h4>Beneficiaries/Data Update</h4>
<p>I further hereby affirm that it is my understanding that only members of my immediate family are included in my fund application Form and are covered in this benevolent fund. I further hereby agree that it is my sole responsibility to update my membership data with any new members of my family limited to newborn children and spouse in the event of marriage after the initial application submission.</p>
<h4>Exceptions</h4>
<p>Whereas the $10 registration fee is non-refundable, members can be refunded part of their membership fees. To be refunded, members need to submit a written request to the committee, which will have 30 days to review the letter. In case of a death occurs within the 30-day review, a member will be refunded their money minus the payout for the death.</p>
<h4>Grace Period</h4>
<p>Notwithstanding all terms and provisions of this program, I further hereby consent that nothing shall be paid to me during the (90 days) grace period of the said fund. Accordingly, therefore, unless otherwise stated the benefits shall accrue not earlier than the benevolent start date.</p>
<h4>Death Verification</h4>
<p>I further hereby agree and consent that Abeingo Boston Benevolent Fund committee, at their discretion may verify any reported death. Verifiable proof may include, but not limited to, burial permit, newspaper announcement, member testimonials, local authorities, religious leaders and/or congregations, social media and/or public forums etc. I agree to submit all requested documents that maybe required before or after the funds are disbursed depending on the request. I hereby consent that in case of any disputes, the same shall be referred to the Committee and upon fair hearing their decision will be final.</p>
<h4>Acknowledgment</h4>
<p>IN SIGNING THIS WAIVER/RELEASE, I ACKNOWLEDGE AND REPRESENT THAT I have read the foregoing waivers, waiver of Liability and hold harmless agreement, understand it and sign it voluntarily as my own free act and deed; no oral representations, statements, or inducements, apart from the foregoing written agreement, have been made; I am at least eighteen (18 yrs) years of age and fully competent; and I have voluntarily executed the release for full, adequate and complete consideration fully intending to be bound by same.</p>`;

window.DB = DB;
window.WAIVER_TEXT = WAIVER_TEXT;
