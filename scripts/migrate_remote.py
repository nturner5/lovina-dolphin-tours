import sqlite3
import json
import sys
import os

DB_PATH = '/var/lib/docker/volumes/n8n-docker_n8n_data/_data/database.sqlite'
# Placeholders injected dynamically by orchestrator
CREDENTIAL_ID = 'YOUR_SUPABASE_CREDENTIAL_ID'
SUPABASE_URL = 'YOUR_SUPABASE_URL'
SERVICE_ROLE_KEY = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'

def main():
    print(f"Python Migration Script Started. Target Credential ID: {CREDENTIAL_ID}")
    if not os.path.exists(DB_PATH):
        print(f"Error: Database path {DB_PATH} not found.")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id, name, active, nodes FROM workflow_entity;")
        workflows = cursor.fetchall()
        print(f"Loaded {len(workflows)} workflows.")

        updated_count = 0

        for row in workflows:
            w_id, w_name, w_active, w_nodes_str = row
            try:
                nodes = json.loads(w_nodes_str)
            except Exception as e:
                print(f"Skip '{w_name}' (ID: {w_id}) - JSON load error: {e}")
                continue

            modified = False
            new_nodes = []

            for node in nodes:
                # We target both airtable, supabase, and httpRequest nodes to re-apply configurations
                if node.get('type') not in ['n8n-nodes-base.airtable', 'n8n-nodes-base.supabase', 'n8n-nodes-base.httpRequest']:
                    new_nodes.append(node)
                    continue

                node_name = node.get("name")
                
                # Check if this node is one of our target nodes that we want to configure/update
                target_nodes = [
                    'Get Captains List Raw', 
                    'Create Booking Row', 
                    'Check Current Assignment Raw', 
                    'Assign Captain in Sheets', 
                    'Get Guest & Stripe Details Raw', 
                    'Log Signature in Sheets', 
                    'Check Ledger Status1 Raw'
                ]

                if node_name not in target_nodes:
                    new_nodes.append(node)
                    continue

                print(f"  Configuring node '{node_name}' in workflow '{w_name}'...")
                modified = True

                # Custom mapping for Create Booking Row to use HTTP Request node (REST API Upsert)
                if node_name == 'Create Booking Row':
                    base_http = {
                        "id": node.get("id"),
                        "name": node.get("name"),
                        "type": "n8n-nodes-base.httpRequest",
                        "typeVersion": 4,
                        "position": node.get("position"),
                        "maxTries": node.get("maxTries"),
                        "retryOnFail": node.get("retryOnFail"),
                        "waitBetweenTries": node.get("waitBetweenTries")
                    }
                    params = {
                        "method": "POST",
                        "url": f"{SUPABASE_URL}/rest/v1/bookings",
                        "sendHeaders": True,
                        "headerParameters": {
                            "parameters": [
                                {
                                    "name": "apikey",
                                    "value": SERVICE_ROLE_KEY
                                },
                                {
                                    "name": "Authorization",
                                    "value": f"Bearer {SERVICE_ROLE_KEY}"
                                },
                                {
                                    "name": "Content-Type",
                                    "value": "application/json"
                                },
                                {
                                    "name": "Prefer",
                                    "value": "resolution=merge-duplicates,on-conflict=booking_code,return=representation"
                                }
                            ]
                        },
                        "sendBody": True,
                        "specifyBody": "json",
                        "jsonBody": "={\n  \"booking_code\": \"{{ $json.body.data.object.metadata.bookingCode }}\",\n  \"date\": \"{{ $json.body.data.object.metadata.date }}\",\n  \"guests\": {{ Number($json.body.data.object.metadata.guests) }},\n  \"pickup_location\": \"{{ $json.body.data.object.metadata.pickupLocation }}\",\n  \"pickup_description\": \"{{ $json.body.data.object.metadata.pickupDescription }}\",\n  \"whatsapp_number\": \"{{ $json.body.data.object.metadata.whatsappNumber }}\",\n  \"guest_phone\": \"{{ $json.body.data.object.customer_details.phone }}\",\n  \"hotel_details\": \"{{ $json.body.data.object.metadata.hotelDetails }}\",\n  \"guest_name\": \"{{ $json.body.data.object.customer_details.name }}\",\n  \"guest_email\": \"{{ $json.body.data.object.customer_details.email }}\",\n  \"tour_id\": \"{{ $json.body.data.object.metadata.tourId || 'seven-am-ethical' }}\"\n}",
                        "options": {}
                    }
                    base_http["parameters"] = params
                    new_nodes.append(base_http)
                    continue

                # For all other nodes, we continue to use the native Supabase node
                base_supabase = {
                    "id": node.get("id"),
                    "name": node.get("name"),
                    "type": "n8n-nodes-base.supabase",
                    "typeVersion": 1,
                    "position": node.get("position"),
                    "maxTries": node.get("maxTries"),
                    "retryOnFail": node.get("retryOnFail"),
                    "waitBetweenTries": node.get("waitBetweenTries"),
                    "credentials": {
                        "supabaseApi": {
                            "id": CREDENTIAL_ID,
                            "name": "Supabase account"
                        }
                    }
                }

                params = {}

                if node_name == 'Get Captains List Raw':
                    params = {
                        "operation": "get",
                        "table": "captains",
                        "selectProps": "captain_name, whatsapp_number, priority",
                        "options": {
                            "sort": {
                                "property": [
                                    {
                                        "field": "priority",
                                        "direction": "asc"
                                    }
                                ]
                            }
                        }
                    }
                elif node_name == 'Check Current Assignment Raw':
                    params = {
                        "operation": "get",
                        "table": "bookings",
                        "where": {
                            "conditions": [
                                {
                                    "key": "booking_code",
                                    "operator": "eq",
                                    "value": "={{ $('Parse Payload Data').item.json.bookingCode }}"
                                }
                            ]
                        }
                    }
                elif node_name == 'Assign Captain in Sheets':
                    params = {
                        "operation": "update",
                        "table": "bookings",
                        "id": "={{ $('Check Current Assignment Raw').item.json.id }}",
                        "fields": {
                            "assigned_captain": "={{ $('Is Captain Action?').item.json.captainName }}",
                            "captain_phone": "={{ $('Is Captain Action?').item.json.captainPhone }}"
                        }
                    }
                elif node_name == 'Get Guest & Stripe Details Raw':
                    params = {
                        "operation": "get",
                        "table": "bookings",
                        "where": {
                            "conditions": [
                                {
                                    "key": "booking_code",
                                    "operator": "eq",
                                    "value": "={{ $('Get Signed Payload').item.json.bookingId }}"
                                }
                            ]
                        }
                    }
                elif node_name == 'Log Signature in Sheets':
                    params = {
                        "operation": "update",
                        "table": "bookings",
                        "id": "={{ $('Get Guest & Stripe Details Raw').item.json.id }}",
                        "fields": {
                            "rules_signed": "signed",
                            "signature_time": "={{ $('Get Signed Payload').item.json.signedAt }}"
                        }
                    }
                elif node_name == 'Check Ledger Status1 Raw':
                    params = {
                        "operation": "get",
                        "table": "bookings",
                        "where": {
                            "conditions": [
                                {
                                    "key": "id",
                                    "operator": "eq",
                                    "value": "={{ $('Create Booking Row').item.json.id }}"
                                }
                            ]
                        }
                    }
                else:
                    params = {
                        "operation": "get",
                        "table": "bookings"
                    }

                base_supabase["parameters"] = params
                new_nodes.append(base_supabase)

            if modified:
                new_nodes_str = json.dumps(new_nodes)
                
                # Update workflow_entity
                cursor.execute(
                    "UPDATE workflow_entity SET nodes = ? WHERE id = ?;",
                    (new_nodes_str, w_id)
                )

                # Update workflow_history
                cursor.execute(
                    """
                    UPDATE workflow_history 
                    SET nodes = ? 
                    WHERE "versionId" = (SELECT "activeVersionId" FROM workflow_entity WHERE id = ?);
                    """,
                    (new_nodes_str, w_id)
                )
                
                print(f"  ✔ Successfully updated node configurations for '{w_name}' (ID: {w_id})")
                updated_count += 1

        if updated_count > 0:
            conn.commit()
            print(f"\nMigration completed successfully. Committed changes for {updated_count} workflows.")
        else:
            print("\nNo workflows needed modification.")

    except Exception as e:
        conn.rollback()
        print(f"Error during migration execution: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    main()
