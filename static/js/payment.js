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
    const translations = document.getElementById('t').value;
    const zipLabel = document.getElementById('zipLabel');
    const addOns = document.getElementById('addOns');
    const priceDisplay = document.querySelector('.price-display h2');
    const basePrice = new URLSearchParams(window.location.search).get('price');

    let showValidationErrors = false;

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
        console.log(zipContainer);
        if (selectedCountry) {
            zipLabel.textContent = JSON.parse(translations)[selectedCountry.format.toLowerCase().replace(' ', '')];
            zip.required = selectedCountry.required;
            zip.pattern = selectedCountry.pattern || null;
            zipContainer.style.display =  'none'; // selectedCountry.required ? 'block' : 'none';
            if (!selectedCountry.required) {
                zip.value = '';
            }
        } else {
            // TODO: remove here as well, add more countries, populate through JS 
            console.log("zip not required, remove this block");
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
            showValidationMessage(email, isEmailValid, translations.invalidEmail);
            showValidationMessage(cardNumber, isCardNumberValid, translations.invalidCard);
            showValidationMessage(expiry, isExpiryValid, translations.invalidExpiry);
            showValidationMessage(cvc, isCvcValid, translations.invalidCvc);
            showValidationMessage(cardholderName, isNameValid, translations.invalidName);
            if (selectedCountry && selectedCountry.required) {
                showValidationMessage(zip, isZipValid, translations.invalidZip);
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


    // Hardcoded add-ons (can later come from DB/API)
    const addOnOptions = [
        { id: 'wine', label: 'Wine Bottle', price: 40 },
        { id: 'flowers', label: 'Flowers', price: 50 },
        { id: 'tour1', label: 'Tour e.g. 1', price: 105 },
        { id: 'tour2', label: 'Tour e.g. 2', price: 305 }
    ];

        // Dynamically build options
    addOnOptions.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-check mb-2';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input';
        checkbox.id = item.id;
        checkbox.value = item.id;
        checkbox.dataset.price = item.price;

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = item.id;
        label.textContent = `${item.label} - $${item.price}`;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        addOns.appendChild(wrapper);
    });

    function updatePrice() {
        let total = parseFloat(basePrice) || 0;;
        const checkedBoxes = addOns.querySelectorAll('input[type="checkbox"]:checked');
        checkedBoxes.forEach(checkbox => {
            const price = parseFloat(checkbox.dataset.price);
            if (!isNaN(price)) total += price;
        });

        priceDisplay.textContent = `$${total}`;
    }

    addOns.addEventListener('change', updatePrice);
});
