import json
import random
import time
import argparse
from datetime import datetime, timedelta
from opensearchpy import OpenSearch, helpers
from concurrent.futures import ThreadPoolExecutor


def generate_esp_pump_data(start_date, end_date, assets=None, specific_sensors=None):
    """
    Generate ESP pump sensor data documents with readings every minute for date range.
    Simulates continuously running pumps with occasional operational issues.

    Args:
        start_date: Starting timestamp
        end_date: Ending timestamp
        assets: List of assets to generate data for (defaults to all if None)
        specific_sensors: List of specific sensors to generate data for (defaults to all if None)

    Returns:
        Generator that yields dictionaries with ESP pump data in batches and annotations
    """
    # Define possible assets, sensors, and units
    all_assets = [
        "ESP_PUMP_01", "ESP_PUMP_02", "ESP_PUMP_03",
        "ESP_PUMP_04", "ESP_PUMP_05"
    ]

    all_sensors = {
        # Existing sensors
        "intake_pressure": {"min": 100, "max": 500, "unit": "psi", "is_float": False},
        "discharge_pressure": {"min": 1000, "max": 3000, "unit": "psi", "is_float": False},
        "motor_temperature": {"min": 70, "max": 250, "unit": "°F", "is_float": False},
        "vibration": {"min": 0.1, "max": 5.0, "unit": "mm/s", "is_float": True},
        "motor_current": {"min": 10, "max": 50, "unit": "A", "is_float": False},
        "motor_voltage": {"min": 380, "max": 480, "unit": "V", "is_float": False},
        "flow_rate": {"min": 100, "max": 2000, "unit": "bbl/d", "is_float": False},
        "motor_frequency": {"min": 40, "max": 60, "unit": "Hz", "is_float": True},
        "motor_power": {"min": 5, "max": 100, "unit": "kW", "is_float": False},

        # New sensors
        "pump_efficiency": {"min": 40, "max": 85, "unit": "%", "is_float": True},
        "wellhead_pressure": {"min": 50, "max": 400, "unit": "psi", "is_float": False},
        "motor_oil_temperature": {"min": 60, "max": 200, "unit": "°F", "is_float": False},
        "pump_stage_differential_pressure": {"min": 50, "max": 300, "unit": "psi", "is_float": False},
        "casing_pressure": {"min": 20, "max": 300, "unit": "psi", "is_float": False},
        "tubing_pressure": {"min": 50, "max": 500, "unit": "psi", "is_float": False},
        "gas_oil_ratio": {"min": 200, "max": 2000, "unit": "scf/bbl", "is_float": False},
        "water_cut": {"min": 0, "max": 100, "unit": "%", "is_float": True},
        "sand_rate": {"min": 0, "max": 50, "unit": "ppm", "is_float": True},
        "motor_vibration_axial": {"min": 0.05, "max": 4.0, "unit": "mm/s", "is_float": True},
        "motor_vibration_radial": {"min": 0.05, "max": 4.0, "unit": "mm/s", "is_float": True},
        "motor_leakage_current": {"min": 0, "max": 10, "unit": "mA", "is_float": True},
        "motor_winding_resistance": {"min": 0.1, "max": 2.0, "unit": "Ω", "is_float": True},
        "motor_insulation_resistance": {"min": 1, "max": 100, "unit": "MΩ", "is_float": True},
        "variable_frequency_drive_temperature": {"min": 70, "max": 180, "unit": "°F", "is_float": False}
    }

    # Define ESP pump operational issues with additional types
    pump_issues = {
        "gas_locking": {
            "probability": 0.00005,
            "duration": (30, 120),
            "description": "Gas locking detected - pump efficiency severely reduced",
            "effects": {
                "intake_pressure": {"factor": -0.5},
                "discharge_pressure": {"factor": -0.4},
                "flow_rate": {"factor": -0.7},
                "motor_current": {"factor": -0.3},
                "motor_power": {"factor": -0.4},
                "vibration": {"factor": 0.5},
                "motor_temperature": {"factor": -0.1},
                "pump_efficiency": {"factor": -0.6},  # Major efficiency drop
                "pump_stage_differential_pressure": {"factor": -0.5},
                "gas_oil_ratio": {"factor": 0.7},  # Increased GOR
                "motor_vibration_axial": {"factor": 0.4},
                "motor_vibration_radial": {"factor": 0.5}
            }
        },
        "gas_interference": {
            "probability": 0.0001,
            "duration": (15, 60),
            "description": "Gas interference detected - flow rate fluctuations observed",
            "effects": {
                "flow_rate": {"factor": -0.4},
                "intake_pressure": {"factor": -0.3},
                "discharge_pressure": {"factor": -0.2},
                "vibration": {"factor": 0.3},
                "motor_current": {"factor": -0.2},
                "motor_power": {"factor": -0.25},
                "motor_frequency": {"factor": 0.1},
                "pump_efficiency": {"factor": -0.3},
                "gas_oil_ratio": {"factor": 0.5},
                "pump_stage_differential_pressure": {"factor": -0.25},
                "motor_vibration_axial": {"factor": 0.2},
                "motor_vibration_radial": {"factor": 0.3}
            }
        },
        "sanding": {
            "probability": 0.00002,
            "duration": (60, 240),
            "description": "Sand production detected - increased wear and vibration",
            "effects": {
                "flow_rate": {"factor": -0.5},
                "intake_pressure": {"factor": -0.2},
                "discharge_pressure": {"factor": -0.3},
                "vibration": {"factor": 0.8},
                "motor_current": {"factor": 0.3},
                "motor_power": {"factor": 0.35},
                "motor_temperature": {"factor": 0.2},
                "motor_frequency": {"factor": -0.05},
                "pump_efficiency": {"factor": -0.4},
                "sand_rate": {"factor": 0.9},  # Major increase in sand
                "motor_vibration_axial": {"factor": 0.7},
                "motor_vibration_radial": {"factor": 0.8},
                "pump_stage_differential_pressure": {"factor": -0.3}
            }
        },
        "shutdown": {
            "probability": 0.000005,
            "duration": (120, 480),
            "description": "Pump shutdown - maintenance required",
            "effects": {
                "flow_rate": {"factor": -1.0},
                "motor_current": {"factor": -1.0},
                "motor_power": {"factor": -1.0},
                "motor_frequency": {"factor": -1.0},
                "vibration": {"factor": -0.9},
                "motor_temperature": {"factor": -0.5},
                "intake_pressure": {"factor": -0.3},
                "discharge_pressure": {"factor": -0.8},
                "pump_efficiency": {"factor": -1.0},
                "wellhead_pressure": {"factor": -0.4},
                "motor_vibration_axial": {"factor": -0.9},
                "motor_vibration_radial": {"factor": -0.9},
                "variable_frequency_drive_temperature": {"factor": -0.3}
            }
        },
        "motor_overheating": {
            "probability": 0.00003,
            "duration": (45, 180),
            "description": "Motor overheating detected - cooling system issue or excessive load",
            "effects": {
                "motor_temperature": {"factor": 0.7},
                "motor_current": {"factor": 0.2},
                "motor_power": {"factor": 0.25},
                "vibration": {"factor": 0.3},
                "flow_rate": {"factor": -0.2},
                "motor_frequency": {"factor": -0.1},
                "motor_oil_temperature": {"factor": 0.8},  # Significant oil temp increase
                "variable_frequency_drive_temperature": {"factor": 0.5},
                "motor_winding_resistance": {"factor": 0.3},
                "motor_insulation_resistance": {"factor": -0.4},  # Decreased insulation resistance
                "motor_leakage_current": {"factor": 0.6}  # Increased leakage current
            }
        },
        "pump_cavitation": {
            "probability": 0.000025,
            "duration": (20, 90),
            "description": "Pump cavitation - insufficient suction pressure causing vapor bubbles",
            "effects": {
                "intake_pressure": {"factor": -0.6},
                "discharge_pressure": {"factor": -0.3},
                "vibration": {"factor": 0.9},
                "flow_rate": {"factor": -0.4},
                "motor_current": {"factor": 0.1},
                "motor_power": {"factor": 0.15},
                "pump_efficiency": {"factor": -0.5},
                "pump_stage_differential_pressure": {"factor": -0.4},
                "motor_vibration_axial": {"factor": 0.8},
                "motor_vibration_radial": {"factor": 0.9},
                "wellhead_pressure": {"factor": -0.2}
            }
        },
        "scale_buildup": {
            "probability": 0.000015,
            "duration": (240, 720),
            "description": "Scale buildup detected - gradual performance degradation",
            "effects": {
                "flow_rate": {"factor": -0.35},
                "discharge_pressure": {"factor": -0.25},
                "motor_power": {"factor": 0.3},
                "motor_current": {"factor": 0.25},
                "motor_temperature": {"factor": 0.2},
                "vibration": {"factor": 0.15},
                "pump_efficiency": {"factor": -0.4},
                "pump_stage_differential_pressure": {"factor": -0.3},
                "tubing_pressure": {"factor": -0.2},
                "wellhead_pressure": {"factor": -0.15},
                "water_cut": {"factor": 0.2}  # Often associated with water production
            }
        },
        "electrical_fault": {
            "probability": 0.000008,
            "duration": (10, 60),
            "description": "Electrical fault detected - power supply or motor winding issue",
            "effects": {
                "motor_voltage": {"factor": -0.4},
                "motor_current": {"factor": 0.5},
                "motor_frequency": {"factor": -0.3},
                "motor_power": {"factor": 0.4},
                "vibration": {"factor": 0.6},
                "motor_temperature": {"factor": 0.5},
                "motor_leakage_current": {"factor": 0.9},  # Major increase
                "motor_winding_resistance": {"factor": 0.5},
                "motor_insulation_resistance": {"factor": -0.7},  # Major decrease
                "variable_frequency_drive_temperature": {"factor": 0.6}
            }
        },
        "bearing_wear": {
            "probability": 0.000012,
            "duration": (180, 600),
            "description": "Bearing wear detected - increased friction and vibration",
            "effects": {
                "vibration": {"factor": 0.7},
                "motor_temperature": {"factor": 0.4},
                "motor_current": {"factor": 0.2},
                "motor_power": {"factor": 0.3},
                "flow_rate": {"factor": -0.15},
                "motor_frequency": {"factor": -0.05},
                "motor_vibration_axial": {"factor": 0.8},
                "motor_vibration_radial": {"factor": 0.9},
                "motor_oil_temperature": {"factor": 0.5},
                "pump_efficiency": {"factor": -0.2}
            }
        },
        "pump_wear": {
            "probability": 0.000018,
            "duration": (240, 720),
            "description": "Pump wear detected - impeller or diffuser erosion",
            "effects": {
                "flow_rate": {"factor": -0.45},
                "discharge_pressure": {"factor": -0.4},
                "motor_power": {"factor": 0.15},
                "vibration": {"factor": 0.4},
                "intake_pressure": {"factor": -0.1},
                "pump_efficiency": {"factor": -0.5},
                "pump_stage_differential_pressure": {"factor": -0.4},
                "motor_vibration_axial": {"factor": 0.3},
                "motor_vibration_radial": {"factor": 0.4}
            }
        },
        "water_breakthrough": {
            "probability": 0.000014,
            "duration": (360, 1440),  # Can be long-lasting
            "description": "Water breakthrough detected - increased water production",
            "effects": {
                "water_cut": {"factor": 0.8},  # Major increase in water cut
                "flow_rate": {"factor": -0.2},
                "pump_efficiency": {"factor": -0.25},
                "motor_power": {"factor": 0.1},
                "motor_current": {"factor": 0.1},
                "gas_oil_ratio": {"factor": -0.3}  # Usually decreases with water
            }
        },
        "vfd_fault": {
            "probability": 0.000007,
            "duration": (15, 120),
            "description": "Variable frequency drive fault - electrical or cooling issue",
            "effects": {
                "motor_frequency": {"factor": -0.4},
                "motor_voltage": {"factor": -0.3},
                "motor_current": {"factor": 0.3},
                "variable_frequency_drive_temperature": {"factor": 0.8},
                "motor_power": {"factor": -0.3},
                "flow_rate": {"factor": -0.3}
            }
        }
    }

    # Use specified assets or all assets
    assets_to_use = assets if assets else all_assets

    # Use specified sensors or all sensors
    sensors_to_use = {k: v for k, v in all_sensors.items()
                      if not specific_sensors or k in specific_sensors}

    # Process data in daily chunks to manage memory
    current_date = start_date
    day_count = 0

    # Keep track of last values for each asset-sensor pair
    last_values = {}

    # Track active issues for each asset
    active_issues = {asset: {"issue": None, "end_time": None, "severity": 0, "start_time": None} for asset in
                     assets_to_use}

    # Track normal values to restore after issues resolve
    normal_values = {asset: {} for asset in assets_to_use}

    # List to store annotations
    annotations = []

    # Calculate total days for progress reporting
    total_days = (end_date - start_date).days + 1

    # Process one day at a time
    while current_date <= end_date:
        day_count += 1
        print(f"Generating day {day_count}/{total_days}: {current_date.strftime('%Y-%m-%d')}")

        batch = []
        day_end = datetime(current_date.year, current_date.month, current_date.day, 23, 59, 0)

        for asset_name in assets_to_use:
            # Initialize normal values for this asset if not already done
            if not normal_values[asset_name]:
                for sensor_name in sensors_to_use:
                    sensor_config = sensors_to_use[sensor_name]
                    if sensor_config["is_float"]:
                        normal_values[asset_name][sensor_name] = round(random.uniform(
                            sensor_config["min"], sensor_config["max"]), 2)
                    else:
                        normal_values[asset_name][sensor_name] = random.randint(
                            int(sensor_config["min"]), int(sensor_config["max"]))

            for sensor_name, sensor_config in sensors_to_use.items():
                asset_sensor_key = f"{asset_name}_{sensor_name}"

                # Initialize with normal value if this is the first reading
                if asset_sensor_key not in last_values:
                    last_values[asset_sensor_key] = normal_values[asset_name][sensor_name]

                current_time = datetime(current_date.year, current_date.month, current_date.day, 0, 0, 0)

                # Generate minute-by-minute readings for the day
                while current_time <= day_end:
                    # Create timestamp with microsecond precision and ISO format
                    # Create timestamp with format like this: 2024-10-08T08:08:00.000Z
                    timestamp = current_time.strftime("%Y-%m-%dT%H:%M:%S") + ".000Z"


                    # Check if an active issue has ended
                    if active_issues[asset_name]["end_time"] and current_time >= active_issues[asset_name]["end_time"]:
                        active_issues[asset_name] = {"issue": None, "end_time": None, "severity": 0, "start_time": None}
                        # Don't immediately reset values - they'll gradually return to normal

                    # Check for new issues if no active issue
                    if active_issues[asset_name]["issue"] is None:
                        for issue_name, issue_config in pump_issues.items():
                            if random.random() < issue_config["probability"]:
                                # Start a new issue
                                duration_minutes = random.randint(issue_config["duration"][0],
                                                                  issue_config["duration"][1])
                                issue_start_time = current_time
                                issue_end_time = current_time + timedelta(minutes=duration_minutes)

                                active_issues[asset_name] = {
                                    "issue": issue_name,
                                    "start_time": issue_start_time,
                                    "end_time": issue_end_time,
                                    "severity": random.uniform(0.7, 1.0)  # Random severity between 70-100%
                                }

                                # Create annotation document
                                annotation = {
                                    "sourceIndex": "esp_pump_data",  # Keep as is
                                    "filterField": "asset_name",  # Keep as is
                                    "filterValue": asset_name,  # Set pump name
                                    "description": issue_config["description"],
                                    "startDate": issue_start_time.strftime("%Y-%m-%dT%H:%M:%S") + ".000Z",
                                    "endDate": issue_end_time.strftime("%Y-%m-%dT%H:%M:%S") + ".000Z",
                                    "deleted": False,  # Keep as false
                                    "annotationType": issue_name.replace("_", " ").title(),  # Format the issue name
                                    "indicator": "critical",  # Keep as critical
                                    "recommendation": "monitor"  # Keep as monitor
                                }

                                # Add to annotations list
                                annotations.append(annotation)

                                break

                    # Base drift - small random changes for continuous operation
                    drift_factor = 0.01  # 1% maximum change per reading for continuous operation

                    # Calculate sensor value based on normal operation or active issue
                    current_value = last_values[asset_sensor_key]

                    if active_issues[asset_name]["issue"]:
                        issue_name = active_issues[asset_name]["issue"]
                        issue_config = pump_issues[issue_name]
                        severity = active_issues[asset_name]["severity"]

                        # Apply issue effects if this sensor is affected
                        if sensor_name in issue_config["effects"]:
                            effect = issue_config["effects"][sensor_name]["factor"]

                            # Calculate target value during issue
                            if effect < 0:  # Reduction effect
                                # For negative effects, reduce the value toward min or zero
                                reduction = abs(effect) * severity
                                if effect == -1.0:  # Complete shutdown
                                    target_value = 0 if sensor_name != "motor_temperature" else sensor_config["min"]
                                else:
                                    normal_value = normal_values[asset_name][sensor_name]
                                    min_value = sensor_config["min"]
                                    range_to_min = normal_value - min_value
                                    target_value = normal_value - (range_to_min * reduction)
                            else:  # Increase effect
                                # For positive effects, increase the value toward max
                                increase = effect * severity
                                normal_value = normal_values[asset_name][sensor_name]
                                max_value = sensor_config["max"]
                                range_to_max = max_value - normal_value
                                target_value = normal_value + (range_to_max * increase)

                            # Gradually move toward target value (10% change per reading)
                            adjustment_rate = 0.1
                            sensor_value = current_value + (target_value - current_value) * adjustment_rate

                            # Apply small random fluctuation
                            fluctuation = sensor_value * random.uniform(-0.02, 0.02)
                            sensor_value += fluctuation
                        else:
                            # Sensors not directly affected still have normal drift
                            base_change = current_value * random.uniform(-drift_factor, drift_factor)
                            sensor_value = current_value + base_change
                    else:
                        # Normal operation with drift
                        # If recovering from an issue, gradually return to normal
                        normal_value = normal_values[asset_name][sensor_name]
                        if abs(current_value - normal_value) > 0.05 * normal_value:  # If more than 5% off from normal
                            # Move 5% closer to normal value
                            sensor_value = current_value + (normal_value - current_value) * 0.05
                            # Add small random fluctuation
                            fluctuation = sensor_value * random.uniform(-0.01, 0.01)
                            sensor_value += fluctuation
                        else:
                            # Regular drift
                            base_change = current_value * random.uniform(-drift_factor, drift_factor)
                            sensor_value = current_value + base_change

                    # Ensure value is within allowed range
                    if sensor_config["is_float"]:
                        sensor_value = round(max(min(
                            sensor_value,
                            sensor_config["max"]),
                            sensor_config["min"]),
                            2)
                    else:
                        sensor_value = int(max(min(
                            sensor_value,
                            sensor_config["max"]),
                            sensor_config["min"]))

                    # Create document - ONLY include sensor data, no issue information
                    document = {
                        "timestamp": timestamp,
                        "asset_name": asset_name,
                        "sensor_name": sensor_name,
                        "sensor_value": sensor_value,
                        "sensor_unit": sensor_config["unit"]
                    }

                    # No issue information added to the main documents

                    batch.append(document)

                    # Update for next iteration
                    last_values[asset_sensor_key] = sensor_value
                    current_time += timedelta(minutes=1)

        # Yield the batch for this day along with any annotations
        yield {"data": batch, "annotations": annotations}
        annotations = []  # Clear annotations after yielding
        current_date += timedelta(days=1)



def opensearch_doc_generator(documents, index_name):
    """Generator for OpenSearch helpers.bulk"""
    for doc in documents:
        yield {
            "_index": index_name,
            "_source": doc
        }



def write_batch_to_opensearch(os_client, batch, index_name, batch_num):
    """Write a batch of documents to OpenSearch"""
    try:
        success, failed = helpers.bulk(
            os_client,
            opensearch_doc_generator(batch, index_name),
            max_retries=3,
            request_timeout=60,
            stats_only=True
        )

        print(f"Batch {batch_num}: Indexed {success} documents, Failed: {failed}")
        return success, failed
    except Exception as e:
        print(f"Error in batch {batch_num}: {str(e)}")
        return 0, len(batch)


def write_to_opensearch(documents_generator, index_name="esp_pump_data", annotations_index="annotations",
                        max_workers=4):
    """
    Write documents to OpenSearch using parallel processing

    Args:
        documents_generator: Generator yielding batches of documents and annotations
        index_name: Name of the index to write to
        annotations_index: Name of the index for annotations
        max_workers: Number of parallel workers for batch processing

    Returns:
        Total count of documents in the index
    """
    # Connect to OpenSearch
    os_client = OpenSearch(
        ['https://127.0.0.1:9200'],
        http_auth=('admin', 'password'),
        verify_certs=False,  # Disable SSL certificate verification
        ssl_show_warn=False,
        ssl_assert_hostname=False,  # Disable hostname verification if required
        request_timeout=120  # Increased timeout
    )

    # Create main index with optimized settings if it doesn't exist
    if not os_client.indices.exists(index=index_name):
        index_body = {
            "settings": {
                "number_of_shards": 2,  # Increased for 6 months of data
                "number_of_replicas": 0,
                "refresh_interval": "-1",  # Reduced refresh rate for better performance
                "index.mapping.total_fields.limit": 2000,
                "index.max_result_window": 100000
            },
            "mappings": {
                "properties": {
                    "timestamp": {"type": "date"}
                }
            }
        }
        os_client.indices.create(index=index_name, body=index_body)
        print(f"Created index '{index_name}' with optimized settings for large datasets")

    # Create annotations index if it doesn't exist
    if not os_client.indices.exists(index=annotations_index):
        annotations_index_body = {
            "settings": {
                "number_of_shards": 1,  # Smaller index
                "number_of_replicas": 0,
                "refresh_interval": "-1"  # Faster refresh for smaller index
            },
            "mappings": {
                "properties": {
                    "startDate": {"type": "date"},
                    "endDate": {"type": "date"}
                }
            }
        }
        os_client.indices.create(index=annotations_index, body=annotations_index_body)
        print(f"Created index '{annotations_index}' for pump issue annotations")

    total_docs = 0
    total_annotations = 0
    batch_num = 0

    # Process document batches from the generator
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = []

        for batch_data in documents_generator:
            day_batch = batch_data["data"]
            day_annotations = batch_data["annotations"]

            # Process annotations
            if day_annotations:
                for annotation in day_annotations:
                    try:
                        os_client.index(
                            index=annotations_index,  # Make sure we're using the string 'annotations'
                            body=annotation,
                            refresh=True
                        )
                        total_annotations += 1
                    except Exception as e:
                        print(f"Error indexing annotation: {str(e)}")

            # Split large day batches into smaller chunks if needed
            chunk_size = 20000  # Optimal size for bulk operations

            if len(day_batch) > chunk_size:
                for i in range(0, len(day_batch), chunk_size):
                    batch_num += 1
                    chunk = day_batch[i:i + chunk_size]
                    futures.append(executor.submit(
                        write_batch_to_opensearch,
                        os_client,
                        chunk,
                        index_name,
                        batch_num
                    ))
            else:
                batch_num += 1
                futures.append(executor.submit(
                    write_batch_to_opensearch,
                    os_client,
                    day_batch,
                    index_name,
                    batch_num
                ))

        # Collect results
        for future in futures:
            success, failed = future.result()
            total_docs += success

    # Refresh indexes to make sure count is accurate
    print("Finalizing indexes...")
    os_client.indices.refresh(index=index_name)
    os_client.indices.refresh(index=annotations_index)

    # Set to one replica for redundancy now that indexing is complete
    os_client.indices.put_settings(
        index=index_name,
        body={"index": {"refresh_interval": "1s", "number_of_replicas": 1}}
    )

    os_client.indices.put_settings(
        index=annotations_index,
        body={"index": {"number_of_replicas": 1}}
    )

    final_count = os_client.count(index=index_name)["count"]
    annotations_count = os_client.count(index=annotations_index)["count"]

    print(f"Total annotations created: {total_annotations}")
    print(f"Final annotations count: {annotations_count}")

    return final_count



def calculate_estimated_docs(start_date, end_date, num_assets=5, num_sensors=9):
    """Calculate the estimated number of documents"""
    days = (end_date - start_date).days + 1
    readings_per_day = 24 * 60  # Minutes in a day

    return days * num_assets * num_sensors * readings_per_day

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate ESP pump data for OpenSearch')
    parser.add_argument('--months', type=int, default=6, help='Number of months to generate data for')
    parser.add_argument('--start', type=str, help='Start date in YYYY-MM-DD format (defaults to months ago from now)')
    parser.add_argument('--index', type=str, default='esp_pump_data', help='OpenSearch index name')
    parser.add_argument('--annotations_index', type=str, default='annotations', help='OpenSearch annotations index name')
    parser.add_argument('--workers', type=int, default=4, help='Number of parallel workers')
    args = parser.parse_args()

    # Set start and end dates
    end_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    if args.start:
        start_date = datetime.strptime(args.start, '%Y-%m-%d')
    else:
        # Calculate start date based on months
        days_in_period = args.months * 30  # Approximate days in months
        start_date = end_date - timedelta(days=days_in_period)

    # Calculate and show estimated document count
    estimated_docs = calculate_estimated_docs(start_date, end_date)
    print(f"Generating ESP pump sensor data from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    print(f"Period: {(end_date - start_date).days + 1} days ({args.months} months)")
    print(f"Using 5 assets and 9 sensors with readings every minute")
    print(f"Estimated document count: {estimated_docs:,} documents")
    print("Simulating continuously running pumps with occasional operational issues")

    # Ask for confirmation for large dataset
    confirm = input(f"This will generate approximately {estimated_docs:,} documents. Continue? (y/n): ")
    if confirm.lower() != 'y':
        print("Operation cancelled.")
        exit()

    # Generate and index data
    print("\nGenerating and indexing data...")
    start_time = time.time()
    documents_generator = generate_esp_pump_data(start_date, end_date)
    total_count = write_to_opensearch(documents_generator, args.index, args.annotations_index, args.workers)
    elapsed_time = time.time() - start_time

    # Print summary
    print("\n===== Operation Summary =====")
    print(f"Total documents indexed: {total_count:,}")
    hours, remainder = divmod(elapsed_time, 3600)
    minutes, seconds = divmod(remainder, 60)
    print(f"Total time: {int(hours)}h {int(minutes)}m {seconds:.2f}s")
    print(f"Indexing rate: {total_count / elapsed_time:.2f} docs/sec")
    print("============================")