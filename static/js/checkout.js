document.addEventListener('DOMContentLoaded', function () {
    const email = document.getElementById('email');
    let rawTranslations = document.getElementById('t').value;
    rawTranslations = rawTranslations.replace(/'/g, '"').replace(/\bFalse\b/g, 'false').replace(/\bTrue\b/g, 'true');
    const translations = JSON.parse(rawTranslations);
    const basePrice = document.getElementById('price').value;
    const clientReferenceId = document.getElementById('clientReferenceId').value;

    const priceDisplay = document.querySelector('.price-display h2');
    const paypalContainer = document.getElementById('paypal-button-container');

    let showValidationErrors = true;


    // Simple email validation and enable pay button
    function validateForm() {
        const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) || email.value === '';
        const isPriceValid = parseFloat(priceDisplay.textContent.replace(/[$,]/g, '')) > 0;
        if (showValidationErrors) {
            showValidationMessage(email, isEmailValid, translations.invalid_email);
            showValidationMessage(priceDisplay, isPriceValid, translations.invalid_price);
        }

        if (!isEmailValid || !isPriceValid) {
            paypalContainer.classList.add('disabled-container');
        } else {
            paypalContainer.classList.remove('disabled-container');
        }

        return isEmailValid;
    }

    function showValidationMessage(element, isValid, message) {
        let errorDiv = element.nextElementSibling;
        // If there's no next sibling or it's not an error message, create one
        if (!errorDiv || !errorDiv.classList.contains('error-message')) {
            errorDiv = document.createElement('div');
            errorDiv.classList.add('error-message');
            element.parentNode.insertBefore(errorDiv, element.nextElementSibling);
        }

        // Toggle error styles
        element.classList.toggle('error-input', !isValid);
        errorDiv.classList.toggle('show', !isValid);

        // Set message
        errorDiv.textContent = isValid ? '' : message;
    }

    email.addEventListener('input', () => validateForm());
    validateForm();

    const paypalButtons = window.paypal.Buttons({
        style: {
            shape: "rect",
            layout: "vertical",
            color: "gold",
            label: "paypal",
        },
        async createOrder() {
            // # TODO: disable paypal payment button and replace with message if price is 0
            const price = parseFloat(priceDisplay.textContent.replace(/[$,]/g, '')) || 0;
            const cart = {
                "client_reference_id": clientReferenceId,
                "items": [
                    {
                        id: `room_fee`,
                        amount: price
                    }
                ]
            };

            // Add selected add-ons
            document.querySelectorAll('#addOns input[type="checkbox"]:checked').forEach(checkbox => {
                cart["items"].push({
                    id: checkbox.id,
                    amount: checkbox.dataset.price
                });
            });

            const response = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ cart }),
            });

            const orderData = await response.json();

            if (orderData.id) {
                return orderData.id;
            }
            const errorDetail = orderData?.details?.[0];
            const errorMessage = errorDetail
                ? `${errorDetail.issue} ${errorDetail.description} (${orderData.debug_id})`
                : JSON.stringify(orderData);

            throw new Error(errorMessage);
        },
        async onApprove(data, actions) {
            const response = await fetch(
                `/api/orders/${data.orderID}/capture`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const orderData = await response.json();
            // Three cases to handle:
            //   (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
            //   (2) Other non-recoverable errors -> Show a failure message
            //   (3) Successful transaction -> Show confirmation or thank you message

            const errorDetail = orderData?.details?.[0];

            if (errorDetail?.issue === "INSTRUMENT_DECLINED") {
                // (1) Recoverable INSTRUMENT_DECLINED -> call actions.restart()
                // recoverable state, per
                // https://developer.paypal.com/docs/checkout/standard/customize/handle-funding-failures/
                return actions.restart();
            } else if (errorDetail) {
                // (2) Other non-recoverable errors -> Show a failure message
                throw new Error(
                    `${errorDetail.description} (${orderData.debug_id})`
                );
            } else if (!orderData.purchase_units) {
                throw new Error(JSON.stringify(orderData));
            } else {
                // (3) Successful transaction -> Show confirmation or thank you message
                // Or go to another URL:  actions.redirect('thank_you.html');
                const transaction =
                    orderData?.purchase_units?.[0]?.payments?.captures?.[0] ||
                    orderData?.purchase_units?.[0]?.payments
                        ?.authorizations?.[0];
                // Redirect to payment success page
                window.location.href = '/payment-success';
            }
        },

        async onError(err) {
            // # TODO: consider loggin errorr to azure
            window.location.href = `/payment-failure?price=${basePrice}&error=${encodeURIComponent(err.message)}`;
        }
    });
    paypalButtons.render("#paypal-button-container");

});
