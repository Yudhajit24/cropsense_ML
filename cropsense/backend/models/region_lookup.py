"""
region_lookup.py — Region-to-climate lookup for 20 major Indian states.

CropSense v2 addition. Used by predict_from_image() to add climate features
(temperature, humidity, rainfall) alongside the CNN-derived soil NPK/pH values,
producing a complete 7-dimensional feature vector for the crop recommender.

Climate values: annual averages from IMD (India Meteorological Department)
and state agricultural department reports.

CNN architecture trained from scratch per CSE3231 Session 10 lab requirement.
"""

# ------------------------------------------------------------------
# Climate data — 20 major Indian states / agricultural regions
# Temperature: avg annual °C
# Humidity:    avg annual %
# Rainfall:    avg annual mm
# ------------------------------------------------------------------
REGION_CLIMATE = {
    "Punjab": {
        "temperature": 23.5,
        "humidity": 58.0,
        "rainfall": 649.0,
    },
    "Haryana": {
        "temperature": 25.0,
        "humidity": 55.0,
        "rainfall": 617.0,
    },
    "Uttar Pradesh": {
        "temperature": 25.5,
        "humidity": 66.0,
        "rainfall": 902.0,
    },
    "Bihar": {
        "temperature": 26.5,
        "humidity": 70.0,
        "rainfall": 1205.0,
    },
    "West Bengal": {
        "temperature": 27.0,
        "humidity": 78.0,
        "rainfall": 1582.0,
    },
    "Odisha": {
        "temperature": 27.5,
        "humidity": 75.0,
        "rainfall": 1489.0,
    },
    "Andhra Pradesh": {
        "temperature": 28.5,
        "humidity": 72.0,
        "rainfall": 933.0,
    },
    "Telangana": {
        "temperature": 29.0,
        "humidity": 65.0,
        "rainfall": 901.0,
    },
    "Tamil Nadu": {
        "temperature": 28.5,
        "humidity": 74.0,
        "rainfall": 945.0,
    },
    "Karnataka": {
        "temperature": 24.5,
        "humidity": 68.0,
        "rainfall": 1139.0,
    },
    "Kerala": {
        "temperature": 27.0,
        "humidity": 85.0,
        "rainfall": 3055.0,
    },
    "Maharashtra": {
        "temperature": 27.5,
        "humidity": 63.0,
        "rainfall": 1290.0,
    },
    "Gujarat": {
        "temperature": 28.0,
        "humidity": 57.0,
        "rainfall": 820.0,
    },
    "Rajasthan": {
        "temperature": 30.5,
        "humidity": 38.0,
        "rainfall": 313.0,
    },
    "Madhya Pradesh": {
        "temperature": 26.5,
        "humidity": 60.0,
        "rainfall": 1117.0,
    },
    "Jharkhand": {
        "temperature": 25.5,
        "humidity": 70.0,
        "rainfall": 1300.0,
    },
    "Assam": {
        "temperature": 24.0,
        "humidity": 82.0,
        "rainfall": 2818.0,
    },
    "Himachal Pradesh": {
        "temperature": 13.5,
        "humidity": 60.0,
        "rainfall": 1469.0,
    },
    "Uttarakhand": {
        "temperature": 15.0,
        "humidity": 65.0,
        "rainfall": 1720.0,
    },
    "Chhattisgarh": {
        "temperature": 26.5,
        "humidity": 68.0,
        "rainfall": 1292.0,
    },
}


def get_region_climate(region: str) -> dict:
    """
    Return climate data for a given Indian state/region.

    Args:
        region: State name as a string (case-sensitive, must match REGION_CLIMATE keys).

    Returns:
        Dict with keys: temperature (°C), humidity (%), rainfall (mm/year).

    Raises:
        KeyError: If region is not in REGION_CLIMATE.
    """
    return dict(REGION_CLIMATE[region])


def get_all_regions() -> list:
    """Return list of all supported region names. Used by GET /regions endpoint."""
    return list(REGION_CLIMATE.keys())


# ------------------------------------------------------------------
# Quick self-test
# ------------------------------------------------------------------
if __name__ == "__main__":
    for region, data in REGION_CLIMATE.items():
        print(f"{region:20s} → T={data['temperature']}°C  H={data['humidity']}%  R={data['rainfall']}mm")
