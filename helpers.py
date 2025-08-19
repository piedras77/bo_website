import requests
import os

from dotenv import load_dotenv
load_dotenv()

BASE_URL = "https://automationfunctions-dra3aebaabdncqgr.westus3-01.azurewebsites.net/api"
FUNCTION_KEY = os.getenv("AZURE_FUNCTION_KEY")

def get_price(reservation_code):
    function_url = f"{BASE_URL}/get_price_by_reservation?code={FUNCTION_KEY}"
    params = {"reservation_code": reservation_code}
    headers = {
        # "x-functions-key": FUNCTION_KEY,
        "Content-Type": "application/json"
    }

    response = requests.get(function_url, params=params, headers=headers)
    if response.status_code == 200:
        data = response.json()
        return data.get("price")
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return None
