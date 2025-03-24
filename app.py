from flask import Flask, render_template, request, jsonify, send_from_directory

import sys
import os
import random  # For simulating payment success/failure

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from reservations_data import AzureTableManager

app = Flask(__name__)
# app.secret_key = os.environ.get("SESSION_SECRET")


@app.route("/update_reservation", methods=["GET"])
def update_reservation_menu():
    return render_template("update_reservation.html")

@app.route("/update_reservation", methods=["POST"])
def update_reservation():
    data = request.get_json()
    reservation_code = data.get("reservationCode")
    new_room_number = data.get("newRoomNumber")

    return jsonify(AzureTableManager.update_room(reservation_code, new_room_number))

@app.route("/")
@app.route('/checkout')
def checkout():
    client_reference_id = request.args.get('client_reference_id', '')
    price = request.args.get('price', '0.00')
    language = request.args.get('language', 'EN').upper()

    # Default to English if invalid language
    if language not in ['EN', 'ES']:
        language = 'EN'

    try:
        # Ensure price is formatted correctly
        price = "{:.2f}".format(float(price))
    except ValueError:
        price = "0.00"

    return render_template('checkout.html', 
                         client_reference_id=client_reference_id,
                         price=price,
                         lang=language,
                         t=TRANSLATIONS[language])

@app.route('/process-payment', methods=['POST'])
def process_payment():
    language = request.args.get('language', 'EN').upper()
    if language not in ['EN', 'ES']:
        language = 'EN'

    # Simulate payment processing (random success/failure)
    success = random.choice([True, False])
    
    # TODO: add stripe / BAC / ONVO payment handler here

    if success:
        return render_template('success.html', lang=language, t=TRANSLATIONS[language])
    else:
        return render_template('failure.html', lang=language, t=TRANSLATIONS[language])

# Translations dictionary
TRANSLATIONS = {
    'EN': {
        'payment_details': 'Payment Details',
        'email': 'Email',
        'card': 'Card',
        'card_information': 'Card information',
        'name_on_card': 'Name on card',
        'country_region': 'Country or region',
        'pay': 'Pay',
        'full_name_placeholder': 'Full name on card',
        'zipcode': 'ZIP code',
        'postalcode': 'Postal code',
        'postcode': 'Postcode',
        'payment_success': 'Payment Successful',
        'thank_you': 'Thank You!',
        'payment_success_message': 'Your payment has been processed successfully.',
        'return_home': 'Return to Home',
        'payment_failed': 'Payment Failed',
        'payment_failed_message': 'We were unable to process your payment. Please try again.',
        'try_again': 'Try Again',
        'add_ons_title': 'Enhance Your Getaways with Add-ons',
        'tagline': 'Make Your Stay Unforgettable'
    },
    'ES': {
        'payment_details': 'Detalles del Pago',
        'email': 'Correo electrónico',
        'card': 'Tarjeta',
        'card_information': 'Información de tarjeta',
        'name_on_card': 'Nombre en la tarjeta',
        'country_region': 'País o región',
        'pay': 'Pagar',
        'full_name_placeholder': 'Nombre completo en la tarjeta',
        'zipcode': 'Código ZIP',
        'postalcode': 'Código postal',
        'postcode': 'Código postal',
        'payment_success': 'Pago Exitoso',
        'thank_you': '¡Gracias!',
        'payment_success_message': 'Su pago ha sido procesado exitosamente.',
        'return_home': 'Volver al Inicio',
        'payment_failed': 'Pago Fallido',
        'payment_failed_message': 'No pudimos procesar su pago. Por favor, intente nuevamente.',
        'try_again': 'Intentar Nuevamente',
        'add_ons_title': 'Mejora Tu Escapada con Add-ons',
        'tagline': 'Disfruta de una estadía inolvidable'
    }
}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
