from flask import Flask, render_template, request, jsonify, send_from_directory, redirect, Response, url_for

import sys
import os
import json
import logging

from dotenv import load_dotenv

from paypalserversdk.http.auth.o_auth_2 import ClientCredentialsAuthCredentials
from paypalserversdk.logging.configuration.api_logging_configuration import (
    LoggingConfiguration,
    RequestLoggingConfiguration,
    ResponseLoggingConfiguration,
)
from paypalserversdk.paypal_serversdk_client import PaypalServersdkClient
from paypalserversdk.controllers.orders_controller import OrdersController
from paypalserversdk.controllers.payments_controller import PaymentsController
from paypalserversdk.models.amount_breakdown import AmountBreakdown
from paypalserversdk.models.amount_with_breakdown import AmountWithBreakdown
from paypalserversdk.models.checkout_payment_intent import CheckoutPaymentIntent
from paypalserversdk.models.order_request import OrderRequest
from paypalserversdk.models.capture_request import CaptureRequest
from paypalserversdk.models.money import Money
from paypalserversdk.models.shipping_details import ShippingDetails
from paypalserversdk.models.shipping_option import ShippingOption
from paypalserversdk.models.shipping_type import ShippingType
from paypalserversdk.models.purchase_unit_request import PurchaseUnitRequest
from paypalserversdk.models.payment_source import PaymentSource
from paypalserversdk.models.card_request import CardRequest
from paypalserversdk.models.card_attributes import CardAttributes
from paypalserversdk.models.card_verification import CardVerification
from paypalserversdk.models.orders_card_verification_method import OrdersCardVerificationMethod
from paypalserversdk.models.item import Item
from paypalserversdk.models.item_category import ItemCategory
from paypalserversdk.models.payment_source import PaymentSource
from paypalserversdk.models.paypal_wallet import PaypalWallet
from paypalserversdk.models.paypal_wallet_experience_context import (
    PaypalWalletExperienceContext,
)
from paypalserversdk.models.shipping_preference import ShippingPreference
from paypalserversdk.models.paypal_experience_landing_page import (
    PaypalExperienceLandingPage,
)
from paypalserversdk.models.paypal_experience_user_action import (
    PaypalExperienceUserAction,
)
from paypalserversdk.exceptions.error_exception import ErrorException
from paypalserversdk.api_helper import ApiHelper

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from reservations_data import AzureTableManager

app = Flask(__name__)

load_dotenv()

paypal_client: PaypalServersdkClient = PaypalServersdkClient(
    client_credentials_auth_credentials=ClientCredentialsAuthCredentials(
        o_auth_client_id=os.getenv("PAYPAL_CLIENT_ID"),
        o_auth_client_secret=os.getenv("PAYPAL_CLIENT_SECRET"),
    ),
    logging_configuration=LoggingConfiguration(
        log_level=logging.INFO,
        # Disable masking of sensitive headers for Sandbox testing.
        # This should be set to True (the default if unset)in production.
        mask_sensitive_headers=False,
        request_logging_config=RequestLoggingConfiguration(
            log_headers=True, log_body=True
        ),
        response_logging_config=ResponseLoggingConfiguration(
            log_headers=True, log_body=True
        ),
    ),
)

orders_controller: OrdersController = paypal_client.orders
payments_controller: PaymentsController = paypal_client.payments

with open("./static/js/translations.json", encoding="utf-8") as f:
    translations = json.load(f)

@app.route("/")
def booking_page():
    return redirect("https://boarenal.hospitable.rentals/")

@app.route("/update_reservation", methods=["GET"])
def update_reservation_menu():
    return render_template("update_reservation.html")

@app.route("/update_reservation", methods=["POST"])
def update_reservation():
    data = request.get_json()
    reservation_code = data.get("reservationCode")
    new_room_number = data.get("newRoomNumber")

    return jsonify(AzureTableManager.update_room(reservation_code, new_room_number))

def normalize_language(lang):
    lang = (lang or 'EN').upper()
    return lang if lang in ['EN', 'ES'] else 'EN'

@app.route('/checkout')
def checkout():
    # TODO: get the price from the reservation table instead
    client_reference_id = request.args.get('client_reference_id', '')
    price = request.args.get('price', '0.00')
    language = normalize_language(request.args.get('language'))

    # TODO: get production paypal client ID from environment variable
    paypal_client_id = os.getenv("PAYPAL_CLIENT_ID")
    try:
        # Ensure price is formatted correctly
        price = "{:.2f}".format(float(price))
    except ValueError:
        price = "0.00"

    try:
        return render_template('checkout.html', 
                            client_reference_id=client_reference_id,
                            price=price,
                            lang=language,
                            t=translations[language],
                            paypal_client_id=paypal_client_id)
    except Exception as e:
        return redirect(url_for('payment_failure', error=str(e)))

@app.route('/payment-success')
def payment_success():
    language = normalize_language(request.args.get('language'))
    return render_template('success.html', lang=language, t=translations[language])

@app.route('/payment-failure')
def payment_failure():
    price = request.args.get('price', '0.00')
    try:
        # Ensure price is formatted correctly
        price = "{:.2f}".format(float(price))
    except ValueError:
        price = "0.00"
    language = normalize_language(request.args.get('language'))
    return render_template('failure.html',
                           lang=language,
                           price=price,
                           t=translations[language])

@app.route("/api/orders", methods=["POST"])
def create_order():
    request_body = request.get_json()
    cart = request_body["cart"]
    items = [
        Item(
            name=item["id"],  # or a more descriptive name if available
            unit_amount=Money(currency_code="USD", value=str(item["amount"])),
            quantity="1",
            description=item.get("description", ""),
            sku=item.get("id", ""),
            category=ItemCategory.PHYSICAL_GOODS,
        )
        for item in cart["items"]
    ]
    total_amount = sum(float(item["amount"]) for item in cart["items"])
    order = orders_controller.create_order(
        {
            "body": OrderRequest(
                intent=CheckoutPaymentIntent.CAPTURE,
                purchase_units = [
                    PurchaseUnitRequest(
                        amount=AmountWithBreakdown(
                            currency_code="USD",
                            value=str(total_amount),
                            breakdown=AmountBreakdown(
                                item_total=Money(currency_code="USD", value=str(total_amount))
                            ),
                        ),
                        items=items,
                        custom_id=cart["client_reference_id"],
                        invoice_id=f"INV-{cart['client_reference_id']}"
                    )
                ],
            )
        }
    )

    return Response(
        ApiHelper.json_serialize(order.body), status=200, mimetype="application/json"
    )

@app.route("/api/orders/<order_id>/capture", methods=["POST"])
def capture_order(order_id):
    order = orders_controller.capture_order(
        {"id": order_id, "prefer": "return=representation"}
    )
    return Response(
        ApiHelper.json_serialize(order.body),
        status=200,
        mimetype="application/json"
    )


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
