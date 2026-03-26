/* ===========================
   NOTIFICATIONS.js
   Simulated email/WhatsApp notification system
   =========================== */
const Notifications = {
  // Send payment reminder to all active members
  bulkPaymentReminder(channel = 'email') {
    const members = DB.getMembers().filter(m => m.status === 'active');
    let sent = 0;
    members.forEach(m => {
      const unpaid = DB.getMemberContributions(m.id).filter(c => c.status === 'unpaid');
      if (unpaid.length > 0) {
        const total = unpaid.reduce((sum, c) => sum + (c.amount || 0), 0);
        const msg = `Dear ${Utils.fullName(m)}, you have ${unpaid.length} outstanding contribution(s) totaling ${Utils.formatCurrency(total)}. Please remit payment within the allotted time to avoid late fees. Thank you.`;
        DB.addNotification({
          memberId: m.id,
          type: 'payment_reminder',
          channel,
          message: msg,
          subject: 'Abeingo Boston Benevolent Fund – Payment Reminder',
          status: 'sent',
          recipientEmail: m.email,
          recipientPhone: m.phone
        });
        sent++;
      }
    });
    Utils.toast(`Payment reminders sent to ${sent} members via ${channel}`, 'success');
    return sent;
  },

  // Send death notification to all active members
  sendDeathNotification(deathEvent) {
    const members = DB.getMembers().filter(m => m.status === 'active');
    members.forEach(m => {
      const contribution = DB.getMemberContributions(m.id).find(c => c.deathEventId === deathEvent.id);
      const amount = contribution ? Utils.formatCurrency(contribution.amount) : 'TBD';
      const dueDate = contribution ? Utils.formatDate(contribution.dueDate) : 'TBD';
      const msg = `Dear ${Utils.fullName(m)}, we regret to inform you of the passing of ${deathEvent.deceasedName}. As per our fund rules, a contribution of ${amount} is due by ${dueDate}. Please make your payment promptly. Late fees apply after the due date. Our condolences to the bereaved family.`;
      DB.addNotification({
        memberId: m.id,
        type: 'death_notification',
        channel: 'email',
        message: msg,
        subject: `Abeingo Boston Benevolent Fund – Death Notification: ${deathEvent.deceasedName}`,
        status: 'sent',
        recipientEmail: m.email
      });
    });
    Utils.toast(`Death notification sent to ${members.length} members`, 'info');
  },

  // Send semi-annual verification reminder
  sendSemiAnnualReminder(memberId) {
    const member = DB.getMember(memberId);
    if (!member) return;
    const result = Utils.sendUpdateLink(memberId);
    if (!result) return;
    const msg = `Dear ${Utils.fullName(member)}, it's time for your semi-annual information verification. Please review and confirm your profile using this link: ${result.link}\n\nThis link expires in 72 hours. If your information is up to date, please still complete the form to confirm. Thank you.`;
    DB.addNotification({
      memberId,
      type: 'semi_annual_reminder',
      channel: 'email',
      message: msg,
      subject: 'Abeingo Boston Benevolent Fund – Semi-Annual Verification Required',
      status: 'sent',
      recipientEmail: member.email
    });
  },

  // Send bulk semi-annual reminders (to all members not verified in 6+ months)
  bulkSemiAnnualReminder() {
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
    const members = DB.getMembers().filter(m => 
      ['active', 'grace'].includes(m.status) && 
      (!m.lastVerified || m.lastVerified < sixMonthsAgo)
    );
    members.forEach(m => this.sendSemiAnnualReminder(m.id));
    Utils.toast(`Semi-annual reminders sent to ${members.length} members`, 'success');
    return members.length;
  },

  // Approval notification to member
  sendApprovalNotification(memberId) {
    const member = DB.getMember(memberId);
    if (!member) return;
    const msg = `Dear ${Utils.fullName(member)}, congratulations! Your membership application to the Abeingo Boston Benevolent Fund has been approved. Your member ID is ${member.id}. You can now access your member portal. Welcome to our family!`;
    DB.addNotification({
      memberId,
      type: 'registration_approved',
      channel: 'email',
      message: msg,
      subject: 'Abeingo Boston Benevolent Fund – Membership Approved',
      status: 'sent',
      recipientEmail: member.email
    });
    Utils.toast(`Approval email sent to ${Utils.fullName(member)}`, 'success');
  },

  // Registration link for new member (with name/email)
  sendRegistrationLinkNew(email, name) {
    return Utils.sendRegistrationLink(email, name);
  },

  // Preview notification modal
  previewNotification(memberId, type) {
    const member = DB.getMember(memberId);
    if (!member) return;

    let subject = '', message = '';
    if (type === 'registration') {
      const result = Utils.sendRegistrationLink(member.email, Utils.fullName(member));
      subject = 'Registration Link';
      message = `Registration link: ${result.link}\nExpires: ${Utils.formatDateTime(result.token.expiresAt)}`;
    } else if (type === 'update') {
      const result = Utils.sendUpdateLink(memberId);
      subject = 'Update Link';
      message = result ? `Update link: ${result.link}\nExpires: ${Utils.formatDateTime(result.token.expiresAt)}` : 'Could not generate link';
    }

    Utils.showModal(
      `📧 Notification Preview`,
      `<div>
        <div style="margin-bottom:1rem">
          <strong>To:</strong> ${Utils.sanitize(member.email)}<br>
          <strong>Subject:</strong> ${subject}
        </div>
        <div style="background:var(--clr-surface-2);border:1px solid var(--clr-border);border-radius:var(--radius);padding:1rem;font-size:0.875rem;white-space:pre-line">${Utils.sanitize(message)}</div>
      </div>`,
      `<button class="btn btn-ghost" onclick="Utils.closeModal()">Close</button>`
    );
  }
};

window.Notifications = Notifications;
