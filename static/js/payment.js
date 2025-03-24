document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('paymentForm');
    const cardNumber = document.getElementById('cardNumber');
    const expiry = document.getElementById('expiry');
    const cvc = document.getElementById('cvc');
    const email = document.getElementById('email');
    const cardholderName = document.getElementById('cardholderName');
    const zip = document.getElementById('zip');
    const country = document.getElementById('country');
    const payButton = document.getElementById('payButton');
    const currentLanguage = document.getElementById('currentLanguage').value;
    const zipLabel = document.getElementById('zipLabel');

    let showValidationErrors = false;

    const translations = {
        EN: {
            invalidEmail: 'Please enter a valid email address',
            invalidCard: 'Please enter a valid card number',
            invalidExpiry: 'Please enter a valid expiry date',
            invalidCvc: 'Please enter a valid CVC',
            invalidName: 'Please enter the cardholder name',
            invalidZip: 'Please enter a valid postal code',
            zipCode: 'ZIP code',
            postalCode: 'Postal code',
            postcode: 'Postcode'
        },
        ES: {
            invalidEmail: 'Por favor, ingrese un correo electrónico válido',
            invalidCard: 'Por favor, ingrese un número de tarjeta válido',
            invalidExpiry: 'Por favor, ingrese una fecha de vencimiento válida',
            invalidCvc: 'Por favor, ingrese un CVC válido',
            invalidName: 'Por favor, ingrese el nombre del titular',
            invalidZip: 'Por favor, ingrese un código postal válido',
            zipCode: 'Código ZIP',
            postalCode: 'Código postal',
            postcode: 'Código postal'
        }
    };

    const countryInfo = {
        US: { format: 'ZIP code', required: true, pattern: '^\\d{5}(-\\d{4})?$' },
        CA: { format: 'Postal code', required: true, pattern: '^[A-Za-z]\\d[A-Za-z][ -]?\\d[A-Za-z]\\d$' },
        GB: { format: 'Postcode', required: true, pattern: '^[A-Z]{1,2}\\d[A-Z\\d]? ?\\d[A-Z]{2}$' },
        FR: { format: 'Postal code', required: true, pattern: '^\\d{5}$' },
        DE: { format: 'Postal code', required: true, pattern: '^\\d{5}$' },
        IT: { format: 'Postal code', required: true, pattern: '^\\d{5}$' },
        ES: { format: 'Postal code', required: true, pattern: '^\\d{5}$' },
        JP: { format: 'Postal code', required: true, pattern: '^\\d{3}-?\\d{4}$' },
        AU: { format: 'Postcode', required: true, pattern: '^\\d{4}$' },
        BR: { format: 'Postal code', required: true, pattern: '^\\d{5}-?\\d{3}$' },
        CN: { format: 'Postal code', required: true, pattern: '^\\d{6}$' },
        IN: { format: 'PIN code', required: true, pattern: '^\\d{6}$' },
        RU: { format: 'Postal code', required: true, pattern: '^\\d{6}$' },
        KR: { format: 'Postal code', required: true, pattern: '^\\d{5}$' },
        SG: { format: 'Postal code', required: true, pattern: '^\\d{6}$' },
        MX: { format: 'Postal code', required: true, pattern: '^\\d{5}$' },
        AE: { format: 'Postal code', required: false },
        HK: { format: 'Postal code', required: false },
        IE: { format: 'Eircode', required: true, pattern: '^[A-Z]\\d{2}[A-Z0-9]{4}$' }
    };

    // Card number formatting
    cardNumber.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formattedValue += ' ';
            }
            formattedValue += value[i];
        }
        e.target.value = formattedValue;
        validateForm();
    });

    // Expiry date formatting
    expiry.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2);
        }
        e.target.value = value;
        validateForm();
    });

    // CVC validation
    cvc.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
        validateForm();
    });

    // Country change handler
    country.addEventListener('change', function() {
        const selectedCountry = countryInfo[this.value];
        const zipContainer = document.getElementById('zipContainer');

        if (selectedCountry) {
            zipLabel.textContent = translations[currentLanguage][selectedCountry.format.toLowerCase().replace(' ', '')];
            zip.required = selectedCountry.required;
            zip.pattern = selectedCountry.pattern || null;
            zipContainer.style.display = selectedCountry.required ? 'block' : 'none';
            if (!selectedCountry.required) {
                zip.value = '';
            }
        }
        validateForm();
    });

    // Form validation
    function validateForm() {
        const selectedCountry = countryInfo[country.value];
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
        const isCardNumberValid = cardNumber.value.replace(/\s/g, '').length === 16;
        const isExpiryValid = /^\d{2}\/\d{2}$/.test(expiry.value);
        const isCvcValid = cvc.value.length >= 3;
        const isNameValid = cardholderName.value.trim().length > 0;
        let isZipValid = true;

        if (selectedCountry && selectedCountry.required) {
            const zipPattern = new RegExp(selectedCountry.pattern);
            isZipValid = zipPattern.test(zip.value);
        }

        const isFormValid = isEmailValid && isCardNumberValid && isExpiryValid && 
                          isCvcValid && isNameValid && isZipValid;

        payButton.disabled = !isFormValid;

        if (showValidationErrors) {
            showValidationMessage(email, isEmailValid, translations[currentLanguage].invalidEmail);
            showValidationMessage(cardNumber, isCardNumberValid, translations[currentLanguage].invalidCard);
            showValidationMessage(expiry, isExpiryValid, translations[currentLanguage].invalidExpiry);
            showValidationMessage(cvc, isCvcValid, translations[currentLanguage].invalidCvc);
            showValidationMessage(cardholderName, isNameValid, translations[currentLanguage].invalidName);
            if (selectedCountry && selectedCountry.required) {
                showValidationMessage(zip, isZipValid, translations[currentLanguage].invalidZip);
            }
        }

        return isFormValid;
    }

    function showValidationMessage(element, isValid, message) {
        const errorDiv = element.nextElementSibling?.classList.contains('error-message') 
            ? element.nextElementSibling 
            : document.createElement('div');

        if (!element.nextElementSibling?.classList.contains('error-message')) {
            errorDiv.classList.add('error-message');
            element.parentNode.insertBefore(errorDiv, element.nextElementSibling);
        }

        element.classList.toggle('error-input', !isValid);
        errorDiv.classList.toggle('show', !isValid);
        errorDiv.textContent = isValid ? '' : message;
    }

    // Add validation listeners to all inputs
    const inputs = [email, cardNumber, expiry, cvc, cardholderName, zip];
    inputs.forEach(input => {
        input.addEventListener('input', () => validateForm());
    });

    // Trigger initial country selection
    country.dispatchEvent(new Event('change'));

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        showValidationErrors = true;
        validateForm();

        if (!payButton.disabled) {
            const language = document.getElementById('currentLanguage').value;
            fetch(`/process-payment?language=${language}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.value,
                    cardNumber: cardNumber.value.replace(/\s/g, ''),
                    expiry: expiry.value,
                    cvc: cvc.value,
                    name: cardholderName.value,
                    country: country.value,
                    zip: zip.value
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(html => {
                document.documentElement.innerHTML = html;
            })
            .catch(error => {
                console.error('Error:', error);
                window.location.href = `/process-payment?language=${language}`;
            });
        }
    });
});
