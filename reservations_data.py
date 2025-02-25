import os
import logging
import json
from azure.data.tables import TableServiceClient
from azure.core.exceptions import ResourceNotFoundError

class AzureTableManager:
    ACCOUNT_NAME = os.getenv("AZURE_STORAGE_ACCOUNT")
    ACCOUNT_KEY = os.getenv("AZURE_STORAGE_KEY")
    TABLE_NAME = "BoArenal1Reservations"

    @staticmethod
    def get_table_client():
        """Establishes a connection to Azure Table Storage."""
        try:
            connection_string = (
                f"DefaultEndpointsProtocol=https;"
                f"AccountName={AzureTableManager.ACCOUNT_NAME};"
                f"AccountKey={AzureTableManager.ACCOUNT_KEY};"
                f"TableEndpoint=https://{AzureTableManager.ACCOUNT_NAME}.table.core.windows.net/"
            )
            service_client = TableServiceClient.from_connection_string(connection_string)
            return service_client.get_table_client(AzureTableManager.TABLE_NAME)
        except Exception as e:
            logging.error(f"Error connecting to Azure Table Storage: {e}")
            return None

    @staticmethod
    def add_reservation_exception(reservation):
        """Inserts a reservation record into Azure Table Storage."""
        table_client = AzureTableManager.get_table_client()
        if not table_client:
            return {"success": "false", "error": "Failed to connect to Table Storage"}

        entity = {
            "PartitionKey": reservation["code"],
            "RowKey": "Room",
            "Rooms": str([prop["id"] for prop in reservation["properties"]]),
            "Extras": '{}'
        }

        try:
            table_client.upsert_entity(entity)  # Upsert to handle existing records
            logging.info("Reservation added successfully.")
            return {"success": "true"}
        except Exception as e:
            logging.error(f"Failed to insert reservation: {e}")
            return {"success": "false", "error": str(e)}

    @staticmethod
    def check_for_exception(reservation):
        """Checks if a reservation exception exists in Azure Table Storage."""
        table_client = AzureTableManager.get_table_client()
        if not table_client:
            return {"success": "false", "error": "Failed to connect to Table Storage"}

        try:
            entity = table_client.get_entity(partition_key=reservation["code"], row_key="Room")
            return entity  
        except ResourceNotFoundError:
            return "NOT FOUND"


    @staticmethod
    def update_room(reservation_code, room_number):
        table_client = AzureTableManager.get_table_client()
        if not table_client:
            return {"success": "false", "error": "Failed to connect to Table Storage"}

        try:
            entity = table_client.get_entity(partition_key=reservation_code, row_key="Room")
            entity["Rooms"] = json.dumps([room_number])
            table_client.update_entity(entity)
            return {"message": "✅ Reservation updated successfully!"}
        except ResourceNotFoundError:
            reservation = {
                "code": reservation_code,
                "properties": [{"id": room_number}]
            }
            AzureTableManager.add_reservation_exception(reservation)

            return {"message": "✅ Reservation created successfully!"}
        except Exception as e:
            return {"message": f"❌ Failed to update: {str(e)}"}