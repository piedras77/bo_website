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
    let rawTranslations = document.getElementById('t').value;
    rawTranslations = rawTranslations.replace(/'/g, '"').replace(/\bFalse\b/g, 'false').replace(/\bTrue\b/g, 'true');
    const translations = JSON.parse(rawTranslations);
    const zipLabel = document.getElementById('zipLabel');
    const addOns = document.getElementById('addOns');
    const priceDisplay = document.querySelector('.price-display h2');
    const basePrice = new URLSearchParams(window.location.search).get('price');

    let showValidationErrors = false;
    const countryInfo = JSON.parse(document.getElementById('countryInfo').value);
    // Populate the country dropdown
    const countrySelect = document.getElementById('country');
    Object.entries(countryInfo).forEach(([key, value]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = value.name;
        countrySelect.appendChild(option);
      });

    // Country change handler
    country.addEventListener('change', function() {
        const selectedCountry = countryInfo[this.value];
        // todo consider moving
        const zipContainer = document.getElementById('zipContainer');
        if (selectedCountry.required) {
            zipLabel.textContent = translations.zipcode;
            zip.required = selectedCountry.required;
            zip.pattern = selectedCountry.pattern || null;
            zipContainer.style.display = 'block';
        } else {
            zipContainer.style.display = 'none';
        }

        validateForm();
    });

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
        { id: 'shuttle', label: 'Shuttle to from SJO airport', price: 100 },
        { id: 'atv', label: 'ATV Tour with Pickup & Drop-Off', price: 75 },
        { id: 'hotspring', label: 'Entrance to Ecotermales hotsprings', price: 55 },
        { id: 'zipline', label: 'Zip line Tour with Pickup & Drop-Off', price: 60 }
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
