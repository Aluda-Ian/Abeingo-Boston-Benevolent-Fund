/* ===========================
   REGISTRATION PAGE
   Multi-step form with digital signature, file upload, waiver
   =========================== */
Pages.register = {
  currentStep: 0,
  totalSteps: 6,
  formData: {},
  signatureData: null,
  signatureCanvas: null,
  signatureCtx: null,
  drawing: false,
  token: null,
  memberId: null,
  uploadedFiles: {},

  steps: ['Personal Info', 'Family', 'Beneficiary', 'Documents', 'Waiver', 'Review'],

  async render() {
    const params = Utils.getUrlParams();
    const tokenId = params.token;
    
    if (tokenId) {
      const result = DB.validateToken(tokenId);
      if (!result.valid) {
        this.renderExpired(result.reason);
        return;
      }
      this.token = result.token;
      this.memberId = result.token.memberId;
    } else {
      this.renderExpired('not_found');
      return;
    }

    const member = this.memberId ? DB.getMember(this.memberId) : null;
    const waiver = DB.getLatestWaiver();

    document.getElementById('app-root').innerHTML = `
      <div class="public-page">
        <div class="public-header">
          <div class="public-logo">A</div>
          <div class="public-title">${I18N.t('appName')}</div>
          <div class="public-subtitle">New Member Registration</div>
          <div class="expiry-badge" style="margin-top:0.75rem">⏰ ${I18N.t('linkExpiry')}</div>
        </div>

        <div class="form-card" style="max-width:760px">
          <div class="form-card-header">
            <div class="form-card-title">Member Registration Form</div>
            <div class="form-card-subtitle">Step ${this.currentStep + 1} of ${this.totalSteps}: ${this.steps[this.currentStep]}</div>
          </div>
          <div class="form-card-body">
            <!-- Progress -->
            <div class="progress-steps">
              ${this.steps.map((s, i) => `
                <div class="step-item ${i < this.currentStep ? 'completed' : i === this.currentStep ? 'active' : ''}">
                  <div class="step-circle">${i < this.currentStep ? '✓' : i + 1}</div>
                  <div class="step-label">${s}</div>
                </div>
              `).join('')}
            </div>

            <!-- Steps -->
            <div id="form-steps">
              ${this.renderSteps(member, waiver)}
            </div>
          </div>
        </div>

        <div style="text-align:center;margin-top:1.5rem">
          <select class="lang-select" onchange="I18N.setLang(this.value);Pages.register.render()">
            <option value="en" ${I18N.currentLang==='en'?'selected':''}>🇺🇸 English</option>
            <option value="pt" ${I18N.currentLang==='pt'?'selected':''}>🇧🇷 Português</option>
            <option value="es" ${I18N.currentLang==='es'?'selected':''}>🇪🇸 Español</option>
            <option value="it" ${I18N.currentLang==='it'?'selected':''}>🇮🇹 Italiano</option>
          </select>
        </div>
      </div>
    `;

    if (this.currentStep === 4) {
      setTimeout(() => this.initSignaturePad(), 100);
    }
  },

  renderExpired(reason) {
    document.getElementById('app-root').innerHTML = `
      <div class="public-page">
        <div class="public-header">
          <div class="public-logo">A</div>
          <div class="public-title">${I18N.t('appName')}</div>
        </div>
        <div class="form-card">
          <div class="form-card-body">
            <div class="expired-screen">
              <div class="expired-icon">⏰</div>
              <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:0.75rem">
                ${reason === 'expired' ? I18N.t('linkExpired') : 'Invalid Link'}
              </h2>
              <p style="color:var(--clr-text-muted);margin-bottom:1.5rem">
                ${reason === 'used' ? 'This registration link has already been used.' : 
                  reason === 'expired' ? I18N.t('requestNewLink') : 
                  'This registration link is not valid. Please contact the administrator.'}
              </p>
              <div class="alert alert-info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">Registration links expire after 72 hours. Please contact the fund admin to receive a new link.</div>
              </div>
              <button class="btn btn-primary" style="margin-top:1rem" onclick="Router.navigate('landing')">← Back to Home</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderSteps(member, waiver) {
    return `
      <!-- Step 0: Personal Info -->
      <div class="form-step ${this.currentStep === 0 ? 'active' : ''}" id="step-0">
        <div class="form-section-title">👤 Personal Information</div>
        <div class="form-grid">
          <div class="form-field">
            <label class="field-label">${I18N.t('firstName')}<span class="field-required">*</span></label>
            <input type="text" id="r-fname" class="field-input" value="${Utils.sanitize(this.formData.firstName || member?.firstName || '')}" required/>
          </div>
          <div class="form-field">
            <label class="field-label">${I18N.t('lastName')}<span class="field-required">*</span></label>
            <input type="text" id="r-lname" class="field-input" value="${Utils.sanitize(this.formData.lastName || member?.lastName || '')}" required/>
          </div>
          <div class="form-field">
            <label class="field-label">${I18N.t('email')}<span class="field-required">*</span></label>
            <input type="email" id="r-email" class="field-input" value="${Utils.sanitize(this.formData.email || member?.email || this.token?.email || '')}" required/>
          </div>
          <div class="form-field">
            <label class="field-label">${I18N.t('phone')}<span class="field-required">*</span></label>
            <input type="tel" id="r-phone" class="field-input" value="${Utils.sanitize(this.formData.phone || member?.phone || '')}" placeholder="+1-617-555-0000"/>
          </div>
          <div class="form-field">
            <label class="field-label">${I18N.t('dateOfBirth')}<span class="field-required">*</span></label>
            <input type="date" id="r-dob" class="field-input" value="${this.formData.dateOfBirth || member?.dateOfBirth || ''}" required/>
          </div>
          <div class="form-field">
            <label class="field-label">${I18N.t('gender')}</label>
            <select id="r-gender" class="field-select">
              <option value="">Select...</option>
              <option value="male" ${(this.formData.gender || member?.gender) === 'male' ? 'selected' : ''}>${I18N.t('male')}</option>
              <option value="female" ${(this.formData.gender || member?.gender) === 'female' ? 'selected' : ''}>${I18N.t('female')}</option>
              <option value="other" ${(this.formData.gender || member?.gender) === 'other' ? 'selected' : ''}>${I18N.t('preferNotToSay')}</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">${I18N.t('occupation')}</label>
            <input type="text" id="r-occupation" class="field-input" value="${Utils.sanitize(this.formData.occupation || member?.occupation || '')}"/>
          </div>
        </div>
        <div class="form-section-title">📍 Address</div>
        <div class="form-grid">
          <div class="form-field full-width">
            <label class="field-label">${I18N.t('address')}<span class="field-required">*</span></label>
            <input type="text" id="r-address" class="field-input" value="${Utils.sanitize(this.formData.address || member?.address || '')}" placeholder="123 Main Street" required/>
          </div>
          <div class="form-field">
            <label class="field-label">${I18N.t('city')}<span class="field-required">*</span></label>
            <input type="text" id="r-city" class="field-input" value="${Utils.sanitize(this.formData.city || member?.city || '')}" required/>
          </div>
          <div class="form-field">
            <label class="field-label">${I18N.t('state')}</label>
            <input type="text" id="r-state" class="field-input" value="${Utils.sanitize(this.formData.state || member?.state || '')}"/>
          </div>
          <div class="form-field">
            <label class="field-label">${I18N.t('zipCode')}</label>
            <input type="text" id="r-zip" class="field-input" value="${Utils.sanitize(this.formData.zipCode || member?.zipCode || '')}"/>
          </div>
          <div class="form-field">
            <label class="field-label">${I18N.t('country')}</label>
            <input type="text" id="r-country" class="field-input" value="${Utils.sanitize(this.formData.country || member?.country || 'USA')}"/>
          </div>
          <div class="form-field">
            <label class="field-label">Set Password<span class="field-required">*</span></label>
            <input type="password" id="r-password" class="field-input" placeholder="Create a password for member portal"/>
          </div>
        </div>
        ${this.renderFormNav(0)}
      </div>

      <!-- Step 1: Family Members -->
      <div class="form-step ${this.currentStep === 1 ? 'active' : ''}" id="step-1">
        <div class="form-section-title">👨‍👩‍👧 Family Members</div>
        <div class="alert alert-info">
          <span class="alert-icon">ℹ️</span>
          <div class="alert-content">Only immediate family members (spouse, children, parents, siblings) are covered by the fund. Next of kin must be an immediate family member.</div>
        </div>
        <div id="family-rows-container">
          ${this.renderFamilyRows()}
        </div>
        <button type="button" class="add-row-btn" onclick="Pages.register.addFamilyMember()">+ Add Family Member</button>
        ${this.renderFormNav(1)}
      </div>

      <!-- Step 2: Beneficiaries -->
      <div class="form-step ${this.currentStep === 2 ? 'active' : ''}" id="step-2">
        <div class="form-section-title">🏦 Beneficiaries</div>
        <div class="alert alert-warning">
          <span class="alert-icon">⚠️</span>
          <div class="alert-content">Beneficiaries must be family members listed in the previous step. Primary + Secondary percentages must total 100%.</div>
        </div>
        <div id="beneficiary-container">
          ${this.renderBeneficiarySection()}
        </div>
        ${this.renderFormNav(2)}
      </div>

      <!-- Step 3: Documents -->
      <div class="form-step ${this.currentStep === 3 ? 'active' : ''}" id="step-3">
        <div class="form-section-title">📁 Document Upload</div>
        <div class="alert alert-info">
          <span class="alert-icon">ℹ️</span>
          <div class="alert-content">Please upload a government-issued ID. This is required for registration.</div>
        </div>
        <div class="form-field" style="margin-bottom:1.5rem">
          <label class="field-label">${I18N.t('uploadID')}<span class="field-required">*</span></label>
          <div class="file-upload-zone" onclick="document.getElementById('id-upload-input').click()" id="id-upload-zone">
            <div class="file-upload-icon">🪪</div>
            <div class="file-upload-text">Click to upload or drag and drop<br><span style="color:var(--clr-primary);font-weight:600">Government-issued ID</span></div>
            <div class="file-upload-hint">Passport, Driver's License, National ID (JPG, PNG, PDF – max 10MB)</div>
          </div>
          <input type="file" id="id-upload-input" class="file-upload-input" accept=".jpg,.jpeg,.png,.pdf" onchange="Pages.register.handleFileUpload('id', this)"/>
          <div id="id-upload-preview"></div>
        </div>
        <div class="form-field">
          <label class="field-label">Additional Documents (optional)</label>
          <div class="file-upload-zone" onclick="document.getElementById('other-upload-input').click()">
            <div class="file-upload-icon">📎</div>
            <div class="file-upload-text">Upload any additional supporting documents</div>
            <div class="file-upload-hint">Multiple files accepted (JPG, PNG, PDF)</div>
          </div>
          <input type="file" id="other-upload-input" class="file-upload-input" accept=".jpg,.jpeg,.png,.pdf" multiple onchange="Pages.register.handleFileUpload('other', this)"/>
          <div id="other-upload-preview"></div>
        </div>
        ${this.renderFormNav(3)}
      </div>

      <!-- Step 4: Waiver & Signature -->
      <div class="form-step ${this.currentStep === 4 ? 'active' : ''}" id="step-4">
        <div class="form-section-title">📜 Waiver of Liability</div>
        <div class="alert alert-warning">
          <span class="alert-icon">⚠️</span>
          <div class="alert-content">Please read the entire waiver carefully before signing. Your digital signature is legally binding.</div>
        </div>
        <div class="waiver-box">${waiver ? waiver.content : WAIVER_TEXT}</div>
        
        <div class="form-section-title">✍️ Digital Signature</div>
        <div class="signature-area">
          <canvas id="signature-canvas"></canvas>
          <div class="sig-hint" id="sig-hint">Sign here with mouse or touch</div>
          <div class="signature-toolbar">
            <button type="button" class="btn btn-ghost btn-sm" onclick="Pages.register.clearSignature()">Clear</button>
          </div>
        </div>
        <div id="sig-warning" class="field-error-msg" style="display:none;margin-top:0.5rem">Please provide your signature before continuing.</div>

        <div style="margin-top:1.5rem">
          <label class="checkbox-item">
            <input type="checkbox" id="r-consent-waiver"/>
            <span class="checkbox-label">I have read and understand the Waiver of Liability and agree to be bound by its terms. <strong>I am at least 18 years of age.</strong></span>
          </label>
        </div>
        ${this.renderFormNav(4)}
      </div>

      <!-- Step 5: Review & Submit -->
      <div class="form-step ${this.currentStep === 5 ? 'active' : ''}" id="step-5">
        <div class="form-section-title">✅ Review Your Information</div>
        <div id="review-content">
          ${this.renderReview()}
        </div>
        <div style="margin-top:1.5rem">
          <label class="checkbox-item">
            <input type="checkbox" id="r-consent-final"/>
            <span class="checkbox-label"><strong>${I18N.t('consent')}</strong> I authorize the Abeingo Boston Benevolent Fund to process my membership application.</span>
          </label>
        </div>
        ${this.renderFormNav(5)}
      </div>
    `;
  },

  renderFamilyRows() {
    const family = this.formData.familyMembers || [];
    if (!family.length) return '<div style="color:var(--clr-text-muted);font-size:0.875rem;text-align:center;padding:1rem">No family members added yet. Click the button below to add one.</div>';
    return family.map((f, i) => `
      <div class="family-row" id="family-row-${i}">
        <div class="family-row-header">
          <div class="family-row-title">Family Member ${i + 1}: ${Utils.sanitize(f.firstName || '')} ${Utils.sanitize(f.lastName || '')} ${f.relationship ? `(${f.relationship})` : ''}</div>
          <button type="button" class="family-row-remove" onclick="Pages.register.removeFamilyMember(${i})">✕</button>
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label class="field-label">First Name<span class="field-required">*</span></label>
            <input type="text" class="field-input fm-fname" value="${Utils.sanitize(f.firstName || '')}" onchange="Pages.register.updateFamilyMember(${i},'firstName',this.value)"/>
          </div>
          <div class="form-field">
            <label class="field-label">Last Name<span class="field-required">*</span></label>
            <input type="text" class="field-input fm-lname" value="${Utils.sanitize(f.lastName || '')}" onchange="Pages.register.updateFamilyMember(${i},'lastName',this.value)"/>
          </div>
          <div class="form-field">
            <label class="field-label">Relationship<span class="field-required">*</span></label>
            <select class="field-select fm-rel" onchange="Pages.register.updateFamilyMember(${i},'relationship',this.value)">
              <option value="">Select...</option>
              <option value="spouse" ${f.relationship==='spouse'?'selected':''}>Spouse</option>
              <option value="child" ${f.relationship==='child'?'selected':''}>Child</option>
              <option value="parent" ${f.relationship==='parent'?'selected':''}>Parent</option>
              <option value="sibling" ${f.relationship==='sibling'?'selected':''}>Sibling</option>
            </select>
          </div>
          <div class="form-field">
            <label class="field-label">Date of Birth</label>
            <input type="date" class="field-input fm-dob" value="${f.dateOfBirth || ''}" onchange="Pages.register.updateFamilyMember(${i},'dateOfBirth',this.value)"/>
          </div>
        </div>
      </div>
    `).join('');
  },

  addFamilyMember() {
    if (!this.formData.familyMembers) this.formData.familyMembers = [];
    this.formData.familyMembers.push({ id: DB.newGenId('FM'), firstName: '', lastName: '', relationship: '', dateOfBirth: '', status: 'alive' });
    document.getElementById('family-rows-container').innerHTML = this.renderFamilyRows();
  },

  removeFamilyMember(i) {
    this.formData.familyMembers.splice(i, 1);
    document.getElementById('family-rows-container').innerHTML = this.renderFamilyRows();
  },

  updateFamilyMember(i, field, value) {
    if (this.formData.familyMembers[i]) {
      this.formData.familyMembers[i][field] = value;
      // Update header
      const row = document.getElementById(`family-row-${i}`);
      if (row) {
        const title = row.querySelector('.family-row-title');
        const f = this.formData.familyMembers[i];
        if (title) title.textContent = `Family Member ${i+1}: ${f.firstName || ''} ${f.lastName || ''} ${f.relationship ? `(${f.relationship})` : ''}`;
      }
    }
  },

  renderBeneficiarySection() {
    const family = this.formData.familyMembers || [];
    const bens = this.formData.beneficiaries || [{ type: 'primary', familyMemberId: '', percentage: 100 }];

    if (!family.length) {
      return '<div class="alert alert-warning"><span class="alert-icon">⚠️</span><div class="alert-content">Please add family members in the previous step before setting beneficiaries.</div></div>';
    }

    return `
      <div class="form-field" style="margin-bottom:1.5rem">
        <label class="field-label">Primary Beneficiary<span class="field-required">*</span></label>
        <select id="ben-primary-member" class="field-select" onchange="Pages.register.updateBeneficiary('primary','familyMemberId',this.value)">
          <option value="">Select family member...</option>
          ${family.map((f, i) => `<option value="${f.id}" ${(bens.find(b=>b.type==='primary')?.familyMemberId)===f.id?'selected':''}>${Utils.sanitize(f.firstName)} ${Utils.sanitize(f.lastName)} (${f.relationship})</option>`).join('')}
        </select>
      </div>
      <div class="form-field" style="margin-bottom:1.5rem">
        <label class="field-label">Primary Beneficiary Percentage</label>
        <div class="beneficiary-slider">
          <input type="range" id="ben-primary-pct" min="1" max="100" value="${bens.find(b=>b.type==='primary')?.percentage||100}" oninput="Pages.register.onPrimaryPctChange(this.value)"/>
          <div class="beneficiary-pct" id="primary-pct-display">${bens.find(b=>b.type==='primary')?.percentage||100}%</div>
        </div>
      </div>

      <div style="height:1px;background:var(--clr-border);margin:1.5rem 0"></div>

      <div class="form-field" style="margin-bottom:1.5rem">
        <label class="field-label">Secondary Beneficiary (optional)</label>
        <select id="ben-secondary-member" class="field-select" onchange="Pages.register.updateBeneficiary('secondary','familyMemberId',this.value)">
          <option value="">None</option>
          ${family.map((f, i) => `<option value="${f.id}" ${(bens.find(b=>b.type==='secondary')?.familyMemberId)===f.id?'selected':''}>${Utils.sanitize(f.firstName)} ${Utils.sanitize(f.lastName)} (${f.relationship})</option>`).join('')}
        </select>
      </div>
      <div class="form-field">
        <label class="field-label">Secondary Beneficiary Percentage</label>
        <div class="beneficiary-slider">
          <input type="range" id="ben-secondary-pct" min="0" max="99" value="${bens.find(b=>b.type==='secondary')?.percentage||0}" oninput="Pages.register.onSecondaryPctChange(this.value)" ${!(bens.find(b=>b.type==='secondary')?.familyMemberId)?'disabled':''}/>
          <div class="beneficiary-pct" id="secondary-pct-display">${bens.find(b=>b.type==='secondary')?.percentage||0}%</div>
        </div>
      </div>

      <!-- Next of Kin -->
      <div style="height:1px;background:var(--clr-border);margin:1.5rem 0"></div>
      <div class="form-section-title">🆘 Next of Kin</div>
      <div class="form-field">
        <label class="field-label">Next of Kin<span class="field-required">*</span></label>
        <select id="next-of-kin" class="field-select">
          <option value="">Select family member...</option>
          ${family.map(f => `<option value="${f.id}" ${this.formData.nextOfKinId===f.id?'selected':''}>${Utils.sanitize(f.firstName)} ${Utils.sanitize(f.lastName)} (${f.relationship})</option>`).join('')}
        </select>
        <div class="field-hint">Must be an immediate family member listed above</div>
      </div>
    `;
  },

  onPrimaryPctChange(val) {
    document.getElementById('primary-pct-display').textContent = val + '%';
    this.updateBeneficiary('primary', 'percentage', parseInt(val));
    const secSlider = document.getElementById('ben-secondary-pct');
    if (secSlider) {
      const remaining = 100 - parseInt(val);
      secSlider.max = remaining;
      if (parseInt(secSlider.value) > remaining) {
        secSlider.value = remaining;
        document.getElementById('secondary-pct-display').textContent = remaining + '%';
        this.updateBeneficiary('secondary', 'percentage', remaining);
      }
    }
  },

  onSecondaryPctChange(val) {
    document.getElementById('secondary-pct-display').textContent = val + '%';
    this.updateBeneficiary('secondary', 'percentage', parseInt(val));
  },

  updateBeneficiary(type, field, value) {
    if (!this.formData.beneficiaries) this.formData.beneficiaries = [];
    let b = this.formData.beneficiaries.find(x => x.type === type);
    if (!b) {
      b = { type, familyMemberId: '', percentage: type === 'primary' ? 100 : 0 };
      this.formData.beneficiaries.push(b);
    }
    b[field] = value;
    if (field === 'familyMemberId') {
      const fam = (this.formData.familyMembers || []).find(f => f.id === value);
      if (fam) b.name = `${fam.firstName} ${fam.lastName}`;
      if (type === 'secondary') {
        const slider = document.getElementById('ben-secondary-pct');
        if (slider) slider.disabled = !value;
      }
    }
  },

  handleFileUpload(type, input) {
    const files = Array.from(input.files);
    this.uploadedFiles[type] = files;
    const previewId = type === 'id' ? 'id-upload-preview' : 'other-upload-preview';
    const preview = document.getElementById(previewId);
    if (!preview) return;
    preview.innerHTML = files.map(f => `
      <div class="uploaded-file">
        <span class="uploaded-file-icon">${f.type.includes('pdf') ? '📄' : '🖼️'}</span>
        <span class="uploaded-file-name">${Utils.sanitize(f.name)}</span>
        <span class="uploaded-file-size">${(f.size / 1024).toFixed(1)} KB</span>
      </div>
    `).join('');
  },

  initSignaturePad() {
    this.signatureCanvas = document.getElementById('signature-canvas');
    if (!this.signatureCanvas) return;
    this.signatureCtx = this.signatureCanvas.getContext('2d');
    const rect = this.signatureCanvas.getBoundingClientRect();
    this.signatureCanvas.width = rect.width || 600;
    this.signatureCanvas.height = 160;

    const ctx = this.signatureCtx;
    ctx.strokeStyle = '#1a3a5c';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e) => {
      const r = this.signatureCanvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      return { x: touch.clientX - r.left, y: touch.clientY - r.top };
    };

    this.signatureCanvas.addEventListener('mousedown', e => { this.drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); document.getElementById('sig-hint').classList.add('hidden'); });
    this.signatureCanvas.addEventListener('mousemove', e => { if (!this.drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); this.signatureData = this.signatureCanvas.toDataURL(); });
    this.signatureCanvas.addEventListener('mouseup', () => { this.drawing = false; });
    this.signatureCanvas.addEventListener('mouseleave', () => { this.drawing = false; });

    this.signatureCanvas.addEventListener('touchstart', e => { e.preventDefault(); this.drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); document.getElementById('sig-hint').classList.add('hidden'); }, { passive: false });
    this.signatureCanvas.addEventListener('touchmove', e => { e.preventDefault(); if (!this.drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); this.signatureData = this.signatureCanvas.toDataURL(); }, { passive: false });
    this.signatureCanvas.addEventListener('touchend', () => { this.drawing = false; });
  },

  clearSignature() {
    if (this.signatureCtx && this.signatureCanvas) {
      this.signatureCtx.clearRect(0, 0, this.signatureCanvas.width, this.signatureCanvas.height);
      this.signatureData = null;
      document.getElementById('sig-hint').classList.remove('hidden');
    }
  },

  renderReview() {
    const d = this.formData;
    return `
      <div class="confirm-section">
        <div class="confirm-section-title">Personal Information</div>
        ${[
          ['Name', `${d.firstName || ''} ${d.lastName || ''}`],
          ['Email', d.email || '—'],
          ['Phone', d.phone || '—'],
          ['Date of Birth', Utils.formatDate(d.dateOfBirth)],
          ['Gender', d.gender || '—'],
          ['Occupation', d.occupation || '—'],
          ['Address', `${d.address || ''}, ${d.city || ''}, ${d.state || ''} ${d.zipCode || ''}`],
          ['Country', d.country || '—'],
        ].map(([l, v]) => `<div class="confirm-row"><span class="confirm-label">${l}</span><span class="confirm-value">${Utils.sanitize(v)}</span></div>`).join('')}
      </div>
      ${d.familyMembers && d.familyMembers.length ? `
        <div class="confirm-section">
          <div class="confirm-section-title">Family Members (${d.familyMembers.length})</div>
          ${d.familyMembers.map(f => `
            <div class="confirm-row">
              <span class="confirm-label">${Utils.sanitize(f.firstName)} ${Utils.sanitize(f.lastName)}</span>
              <span class="confirm-value">${Utils.sanitize(f.relationship)} &bull; Born ${Utils.formatDate(f.dateOfBirth)}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${d.beneficiaries && d.beneficiaries.length ? `
        <div class="confirm-section">
          <div class="confirm-section-title">Beneficiaries</div>
          ${d.beneficiaries.map(b => `
            <div class="confirm-row">
              <span class="confirm-label">${Utils.sanitize(b.name || '')} (${b.type})</span>
              <span class="confirm-value">${b.percentage}%</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${this.signatureData ? `
        <div class="confirm-section">
          <div class="confirm-section-title">Signature</div>
          <img src="${this.signatureData}" style="max-width:100%;border:1px solid var(--clr-border);border-radius:var(--radius);height:80px;object-fit:contain"/>
          <div style="font-size:0.75rem;color:var(--clr-text-muted);margin-top:0.5rem">Signed on ${Utils.formatDateTime(new Date().toISOString())}</div>
        </div>
      ` : ''}
    `;
  },

  renderFormNav(step) {
    return `
      <div class="form-nav">
        ${step > 0 
          ? `<button type="button" class="btn btn-ghost" onclick="Pages.register.prevStep()">← ${I18N.t('previous')}</button>` 
          : '<div></div>'}
        ${step < this.totalSteps - 1
          ? `<button type="button" class="btn btn-primary" onclick="Pages.register.nextStep(${step})">${I18N.t('next')} →</button>`
          : `<button type="button" class="btn btn-success btn-lg" onclick="Pages.register.submit()">✅ Submit Registration</button>`
        }
      </div>
    `;
  },

  collectStep0() {
    this.formData.firstName = document.getElementById('r-fname').value.trim();
    this.formData.lastName = document.getElementById('r-lname').value.trim();
    this.formData.email = document.getElementById('r-email').value.trim();
    this.formData.phone = document.getElementById('r-phone').value.trim();
    this.formData.dateOfBirth = document.getElementById('r-dob').value;
    this.formData.gender = document.getElementById('r-gender').value;
    this.formData.occupation = document.getElementById('r-occupation').value.trim();
    this.formData.address = document.getElementById('r-address').value.trim();
    this.formData.city = document.getElementById('r-city').value.trim();
    this.formData.state = document.getElementById('r-state').value.trim();
    this.formData.zipCode = document.getElementById('r-zip').value.trim();
    this.formData.country = document.getElementById('r-country').value.trim();
    this.formData.password = document.getElementById('r-password').value;
  },

  nextStep(step) {
    if (step === 0) {
      this.collectStep0();
      if (!this.formData.firstName || !this.formData.lastName || !this.formData.email || !this.formData.dateOfBirth) {
        Utils.toast('Please fill all required fields', 'error'); return;
      }
      if (!Utils.isValidEmail(this.formData.email)) { Utils.toast('Please enter a valid email', 'error'); return; }
      if (!this.formData.password) { Utils.toast('Please set a password for the member portal', 'error'); return; }
    }
    if (step === 4) {
      if (!this.signatureData) {
        document.getElementById('sig-warning').style.display = 'block';
        Utils.toast('Please sign the waiver before continuing', 'error'); return;
      }
      if (!document.getElementById('r-consent-waiver').checked) {
        Utils.toast('Please confirm you have read the waiver', 'error'); return;
      }
      document.getElementById('sig-warning').style.display = 'none';
    }
    if (step === 2) {
      this.formData.nextOfKinId = document.getElementById('next-of-kin')?.value || '';
    }
    this.currentStep++;
    this.render();
  },

  prevStep() {
    if (this.currentStep > 0) { this.currentStep--; this.render(); }
  },

  async submit() {
    if (!document.getElementById('r-consent-final').checked) {
      Utils.toast('Please confirm the information is accurate and complete', 'error'); return;
    }

    // Build final member object
    const memberId = this.memberId || DB.newId();
    const waiver = DB.getLatestWaiver();
    const member = {
      id: memberId,
      ...this.formData,
      status: 'pending',
      joinDate: null,
      kittyBalance: 0,
      lastVerified: null,
      approvedAt: null,
      approvedBy: null,
    };

    DB.saveMember(member);
    DB.useToken(this.token.id);

    // Save signature
    if (this.signatureData && waiver) {
      DB.saveSignature(memberId, waiver.id, this.signatureData);
    }

    // Save documents
    if (this.uploadedFiles.id) {
      this.uploadedFiles.id.forEach(f => {
        DB.saveDocument({ memberId, filename: f.name, type: 'government_id', size: f.size });
      });
    }
    if (this.uploadedFiles.other) {
      this.uploadedFiles.other.forEach(f => {
        DB.saveDocument({ memberId, filename: f.name, type: 'other', size: f.size });
      });
    }

    DB.addAuditLog(memberId, 'member', 'registration_submitted', null, { email: this.formData.email });

    // Show success
    document.getElementById('app-root').innerHTML = `
      <div class="public-page">
        <div class="form-card" style="max-width:560px">
          <div class="form-card-body">
            <div class="success-screen">
              <div class="success-icon">✅</div>
              <h2 class="success-title">${I18N.t('registrationSuccess')}</h2>
              <p class="success-message">${I18N.t('awaitingApproval')}</p>
              <div class="alert alert-info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                  <strong>What's next?</strong><br>
                  The admin will review your application and notify you once approved. You'll receive an email with your member portal login details.
                </div>
              </div>
              <div style="margin-top:1rem;padding:1rem;background:var(--clr-surface-2);border-radius:var(--radius);font-size:0.8rem;color:var(--clr-text-muted)">
                Member ID: <strong style="color:var(--clr-primary)">${memberId}</strong><br>
                Email: ${Utils.sanitize(this.formData.email)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
