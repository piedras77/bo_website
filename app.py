from flask import Flask, render_template, request, jsonify

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from reservations_data import AzureTableManager

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("update_reservation.html")

@app.route("/update_reservation", methods=["POST"])
def update_reservation():
    data = request.get_json()
    reservation_code = data.get("reservationCode")
    new_room_number = data.get("newRoomNumber")

    return jsonify(AzureTableManager.update_room(reservation_code, new_room_number))

if __name__ == "__main__":
    app.run(debug=True)
