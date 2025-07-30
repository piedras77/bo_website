from flask import Flask, render_template, request, jsonify, send_from_directory

import sys
import os
import random  # For simulating payment success/failure
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from reservations_data import AzureTableManager

app = Flask(__name__)
# app.secret_key = os.environ.get("SESSION_SECRET")

with open("./static/js/translations.json", encoding="utf-8") as f:
    translations = json.load(f)

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
def booking_page():
    return redirect("https://boarenal.hospitable.rentals/")

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
    with open('./static/js/countryInfo.json') as f:
        country_data = json.load(f)
    return render_template('checkout.html', 
                         client_reference_id=client_reference_id,
                         price=price,
                         lang=language,
                         t=translations[language],
                         country_info=json.dumps(country_data))

@app.route('/process-payment', methods=['POST'])
def process_payment():
    language = request.args.get('language', 'EN').upper()
    if language not in ['EN', 'ES']:
        language = 'EN'

    # Simulate payment processing (random success/failure)
    success = random.choice([True, False])
    
    # TODO: add stripe / BAC / ONVO payment handler here

    if success:
        return render_template('success.html', lang=language, t=translations[language])
    else:
        return render_template('failure.html', lang=language, t=translations[language])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
