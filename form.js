// Auto-Save Contact Form JavaScript
class AutoSaveForm {
  constructor(formId, storageKey = 'contactFormData') {
    this.formId = formId;
    this.storageKey = storageKey;
    this.form = document.getElementById(formId);
    this.saveTimeout = null;
    this.saveDelay = 1000; // Save after 1 second of inactivity
    this.isLoading = false;

    if (!this.form) {
      console.error(`Form with ID "${formId}" not found`);
      return;
    }

    this.init();
  }

  init() {
    // Load saved data on page load
    this.loadSavedData();

    // Set up auto-save on input changes
    this.setupAutoSave();

    // Set up form submission
    this.setupFormSubmission();

    // Set up clear form functionality
    this.setupClearForm();

    // Update storage display
    this.updateStorageDisplay();
  }

  setupAutoSave() {
    const inputs = this.form.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.debouncedSave();
      });

      input.addEventListener('change', () => {
        this.debouncedSave();
      });
    });
  }

  debouncedSave() {
    clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveFormData();
    }, this.saveDelay);
  }

  saveFormData() {
    if (this.isLoading) return; // Don't save while loading

    const formData = new FormData(this.form);
    const data = {};

    // Convert FormData to object
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Add metadata
    data.lastSaved = new Date().toISOString();
    data.saveCount = (this.getSavedData()?.saveCount || 0) + 1;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this.showAutoSaveIndicator();
      this.updateStorageDisplay();
      console.log('Form data auto-saved:', data);
    } catch (error) {
      console.error('Failed to save form data:', error);
      // Could show user notification here
    }
  }

  loadSavedData() {
    this.isLoading = true;

    try {
      const savedData = this.getSavedData();
      if (savedData) {
        // Populate form fields
        Object.keys(savedData).forEach(key => {
          const input = this.form.querySelector(`[name="${key}"]`);
          if (input && key !== 'lastSaved' && key !== 'saveCount') {
            input.value = savedData[key];

            // Add visual indicator for loaded data
            input.classList.add('loaded-from-storage');
            setTimeout(() => {
              input.classList.remove('loaded-from-storage');
            }, 2000);
          }
        });

        console.log('Form data loaded from storage:', savedData);
      }
    } catch (error) {
      console.error('Failed to load saved form data:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getSavedData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to parse saved data:', error);
      return null;
    }
  }

  clearSavedData() {
    try {
      localStorage.removeItem(this.storageKey);
      this.updateStorageDisplay();
      console.log('Saved form data cleared');
    } catch (error) {
      console.error('Failed to clear saved data:', error);
    }
  }

  setupFormSubmission() {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validate form
      if (!this.form.checkValidity()) {
        this.form.reportValidity();
        return;
      }

      // Simulate form submission
      this.showSuccessMessage();

      // Clear saved data after successful submission
      setTimeout(() => {
        this.clearSavedData();
        this.form.reset();
      }, 2000);
    });
  }

  setupClearForm() {
    const clearBtn = document.getElementById('clearFormBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the form? This will also clear any auto-saved data.')) {
          this.form.reset();
          this.clearSavedData();
        }
      });
    }
  }

  showAutoSaveIndicator() {
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
      indicator.classList.add('show');
      setTimeout(() => {
        indicator.classList.remove('show');
      }, 2000);
    }
  }

  showSuccessMessage() {
    const message = document.getElementById('successMessage');
    if (message) {
      message.style.display = 'block';
      setTimeout(() => {
        message.style.display = 'none';
      }, 3000);
    }
  }

  updateStorageDisplay() {
    const display = document.getElementById('storageDisplay');
    if (!display) return;

    const savedData = this.getSavedData();

    if (!savedData) {
      display.innerHTML = '<p>No saved data found.</p>';
      return;
    }

    const items = [
      { label: 'Name', key: 'name' },
      { label: 'Email', key: 'email' },
      { label: 'Phone', key: 'phone' },
      { label: 'Company', key: 'company' },
      { label: 'Subject', key: 'subject' },
      { label: 'Priority', key: 'priority' },
      { label: 'Last Saved', key: 'lastSaved', format: (val) => new Date(val).toLocaleString() },
      { label: 'Save Count', key: 'saveCount' }
    ];

    display.innerHTML = items.map(item => {
      const value = savedData[item.key];
      const displayValue = item.format ? item.format(value) : (value || '-');
      return `
        <div class="storage-item">
          <strong>${item.label}:</strong>
          <span>${displayValue}</span>
        </div>
      `;
    }).join('');

    // Add message preview if it exists
    if (savedData.message) {
      display.innerHTML += `
        <div class="storage-item">
          <strong>Message Preview:</strong>
          <span>${savedData.message.substring(0, 50)}${savedData.message.length > 50 ? '...' : ''}</span>
        </div>
      `;
    }
  }

  // Utility method to get form data as object
  getFormData() {
    const formData = new FormData(this.form);
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    return data;
  }

  // Method to manually trigger save
  manualSave() {
    this.saveFormData();
  }

  // Method to check if data exists in storage
  hasSavedData() {
    return this.getSavedData() !== null;
  }

  // Method to get storage size
  getStorageSize() {
    const data = localStorage.getItem(this.storageKey);
    return data ? new Blob([data]).size : 0;
  }
}

// Enhanced Form Validation
class FormValidator {
  constructor(form) {
    this.form = form;
    this.errors = {};
    this.init();
  }

  init() {
    this.setupRealTimeValidation();
  }

  setupRealTimeValidation() {
    const inputs = this.form.querySelectorAll('input, textarea, select');

    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input);
      });

      input.addEventListener('input', () => {
        // Clear error on input
        this.clearFieldError(input);
      });
    });
  }

  validateField(field) {
    const value = field.value.trim();
    const name = field.name;
    let error = null;

    switch (name) {
      case 'name':
        if (!value) {
          error = 'Name is required';
        } else if (value.length < 2) {
          error = 'Name must be at least 2 characters';
        }
        break;

      case 'email':
        if (!value) {
          error = 'Email is required';
        } else if (!this.isValidEmail(value)) {
          error = 'Please enter a valid email address';
        }
        break;

      case 'phone':
        if (value && !this.isValidPhone(value)) {
          error = 'Please enter a valid phone number';
        }
        break;

      case 'message':
        if (!value) {
          error = 'Message is required';
        } else if (value.length < 10) {
          error = 'Message must be at least 10 characters';
        }
        break;
    }

    if (error) {
      this.showFieldError(field, error);
      this.errors[name] = error;
    } else {
      this.clearFieldError(field);
      delete this.errors[name];
    }

    return !error;
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    // Simple phone validation - allows various formats
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, '');
    return phoneRegex.test(cleanPhone) || cleanPhone.length >= 10;
  }

  showFieldError(field, error) {
    field.classList.add('error');

    // Remove existing error message
    this.clearFieldError(field);

    // Add error message
    const errorEl = document.createElement('div');
    errorEl.className = 'field-error';
    errorEl.textContent = error;

    field.parentNode.appendChild(errorEl);
  }

  clearFieldError(field) {
    field.classList.remove('error');

    const errorEl = field.parentNode.querySelector('.field-error');
    if (errorEl) {
      errorEl.remove();
    }
  }

  validateAll() {
    const inputs = this.form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  getErrors() {
    return { ...this.errors };
  }
}

// Initialize the auto-save form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize auto-save functionality
  const autoSaveForm = new AutoSaveForm('contactForm');

  // Initialize form validation
  const validator = new FormValidator(document.getElementById('contactForm'));

  // Override form submission to use our validation
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (validator.validateAll()) {
      // Simulate successful submission
      autoSaveForm.showSuccessMessage();

      // Clear saved data after successful submission
      setTimeout(() => {
        autoSaveForm.clearSavedData();
        form.reset();
      }, 2000);
    } else {
      console.log('Form validation failed:', validator.getErrors());
    }
  });

  // Add some CSS for error states
  const style = document.createElement('style');
  style.textContent = `
    .error {
      border-color: #dc3545 !important;
      box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
    }

    .field-error {
      color: #dc3545;
      font-size: 14px;
      margin-top: 5px;
      font-weight: 500;
    }
  `;
  document.head.appendChild(style);

  // Log storage events for debugging
  window.addEventListener('storage', (e) => {
    if (e.key === 'contactFormData') {
      console.log('Storage event:', e);
      autoSaveForm.updateStorageDisplay();
    }
  });

  console.log('Auto-save contact form initialized');
});