/* ===========================
   NOTIFICATIONS.js
   Simulated email/WhatsApp notification system
   =========================== */
const Notifications = {
  // Generic templated email sender
  async sendTemplatedEmail(memberId, templateId, customData = {}) {
    const member = DB.getMember(memberId);
    if (!member) return;

    const templates = DB.getEmailTemplates();
    const tpl = templates.find(t => t.id === templateId) || templates.find(t => t.isDefault);
    if (!tpl) return;

    const adminName = (window.Auth && Auth.currentUser) ? Utils.fullName(Auth.currentUser) : 'Abeingo Admin';
    const dateStr = Utils.formatDate(new Date().toISOString());
    
    const data = {
      member_name: member.firstName,
      member_id: member.id,
      admin_name: adminName,
      date: dateStr,
      balance: Utils.formatCurrency(member.kittyBalance),
      ...customData
    };

    let subject = tpl.subject;
    let body = tpl.body;

    // Replace placeholders
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      subject = subject.replace(regex, data[key]);
      body = body.replace(regex, data[key]);
    });

    const notification = {
      memberId: member.id,
      type: templateId.replace('tpl_', ''),
      channel: 'email',
      message: Utils.wrapEmailBody(body),
      subject: subject,
      status: 'sent',
      recipientEmail: member.email
    };

    try {
      await DB.apiSendEmails([notification]);
      return true;
    } catch (err) {
      console.error('Failed to send notification:', err);
      return false;
    }
  },

  // 1. Success after member fills registration form
  async sendRegistrationSuccess(memberId) {
    return this.sendTemplatedEmail(memberId, 'tpl_reg_success');
  },

  // 2. Success after member updates profile
  async sendProfileUpdateSuccess(memberId) {
    return this.sendTemplatedEmail(memberId, 'tpl_update_link', { subject: 'Profile Updated Successfully' }); // Custom override if needed
  },

  // 3. Admin approves member
  async sendApprovalNotification(memberId) {
    return this.sendTemplatedEmail(memberId, 'tpl_approval');
  },

  // 4. Payment Receipt
  async sendPaymentReceipt(memberId, amount) {
    return this.sendTemplatedEmail(memberId, 'tpl_payment', { amount: Utils.formatCurrency(amount) });
  },

  // 5. Death Notification (Custom logic for bulk)
  async sendDeathNotification(deathEvent) {
    const members = DB.getMembers().filter(m => m.status === 'active');
    const tpl = DB.getEmailTemplates().find(t => t.id === 'tpl_death');
    
    const adminName = (window.Auth && Auth.currentUser) ? Utils.fullName(Auth.currentUser) : 'Abeingo Admin';
    const dateStr = Utils.formatDate(new Date().toISOString());

    const notifications = members.map(m => {
      const contribution = DB.getMemberContributions(m.id).find(c => c.deathEventId === deathEvent.id);
      const amount = contribution ? Utils.formatCurrency(contribution.amount) : 'TBD';
      const dueDate = contribution ? Utils.formatDate(contribution.dueDate) : 'TBD';

      let body = tpl.body
        .replace(/{member_name}/g, m.firstName)
        .replace(/\[Name\]/g, deathEvent.deceasedName)
        .replace(/{admin_name}/g, adminName);
      
      body += `<br><br><strong>Contribution Required:</strong> ${amount}<br><strong>Due Date:</strong> ${dueDate}`;

      return {
        memberId: m.id,
        type: 'death_notification',
        channel: 'email',
        message: Utils.wrapEmailBody(body),
        subject: tpl.subject.replace(/\[Name\]/g, deathEvent.deceasedName),
        status: 'sent',
        recipientEmail: m.email
      };
    });

    try {
      await DB.apiSendEmails(notifications);
      Utils.toast(`Bereavement notice sent to ${members.length} members`, 'success');
    } catch (err) {
      Utils.toast('Failed to send bereavement notices', 'error');
    }
  },

  // 6. Payment Reminders (Unpaid contributions)
  async bulkPaymentReminder() {
    const members = DB.getMembers().filter(m => m.status === 'active');
    let count = 0;
    
    for (const m of members) {
      const unpaid = DB.getMemberContributions(m.id).filter(c => c.status === 'unpaid');
      if (unpaid.length > 0) {
        const total = unpaid.reduce((sum, c) => sum + (c.amount || 0), 0);
        await this.sendTemplatedEmail(m.id, 'tpl_reminder', { 
          body: `You have ${unpaid.length} outstanding contribution(s) totaling ${Utils.formatCurrency(total)}. Please remit payment promptly.` 
        });
        count++;
      }
    }
    Utils.toast(`Reminders sent to ${count} members`, 'success');
  },

  async sendOTP(email, otp) {
    const body = `
      <div style="text-align:center">
        <h2 style="color:var(--clr-primary)">Verification Code</h2>
        <p>Your one-time password (OTP) for Abeingo Boston Benevolent Fund is:</p>
        <div style="font-size:2.5rem;font-weight:800;letter-spacing:0.2em;color:var(--clr-accent);margin:1.5rem 0;padding:1rem;background:#f8fafc;border-radius:8px">${otp}</div>
        <p style="font-size:0.8rem;color:#6b7280">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;
    const notification = {
      type: 'otp',
      channel: 'email',
      message: Utils.wrapEmailBody(body),
      subject: 'Verification Code: ' + otp,
      status: 'sent',
      recipientEmail: email
    };
    return DB.apiSendEmails([notification]);
  },

  async sendPasswordReset(member, link) {
    const body = `
      <h2>Password Reset Request</h2>
      <p>Hi ${member.firstName},</p>
      <p>We received a request to reset your password for the Abeingo Boston Benevolent Fund member portal.</p>
      <div style="margin:2rem 0">
        <a href="${link}" style="background:#1e3a5f;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Reset My Password</a>
      </div>
      <p>Or copy this link into your browser:</p>
      <p style="font-size:0.8rem;color:#6b7280">${link}</p>
      <p>This link will expire in 72 hours.</p>
    `;
    const notification = {
      memberId: member.id,
      type: 'password_reset',
      channel: 'email',
      message: Utils.wrapEmailBody(body),
      subject: 'Reset Your Password – Abeingo BBBF',
      status: 'sent',
      recipientEmail: member.email
    };
    return DB.apiSendEmails([notification]);
  }
};

window.Notifications = Notifications;
