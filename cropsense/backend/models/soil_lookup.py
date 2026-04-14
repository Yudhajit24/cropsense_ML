"""
soil_lookup.py — Agronomic soil-type to NPK/pH lookup table.

CropSense v2 addition. Used by predict_from_image() to convert a CNN-classified
soil type into a deterministic feature vector for the crop recommendation ensemble.

NOTE: Midpoint values are used (not random sampling) so the same soil type always
produces the same feature vector — important for reproducibility and viva explanation.

CNN architecture trained from scratch per CSE3231 Session 10 lab requirement
(no pretrained ImageNet weights).
"""

# ------------------------------------------------------------------
# Agronomic lookup table — 8 soil classes
# NPK in mg/kg (ppm), pH dimensionless
# Ranges sourced from ICAR soil health card norms and agronomic literature
# ------------------------------------------------------------------
SOIL_PROFILES = {
    "alluvial": {
        "N":  (60, 90),
        "P":  (30, 60),
        "K":  (80, 120),
        "ph": (6.5, 7.5),
        "label": "Alluvial soil — fertile river deposit, good for most crops",
    },
    "black": {
        "N":  (50, 80),
        "P":  (25, 50),
        "K":  (100, 150),
        "ph": (7.0, 8.5),
        "label": "Black cotton soil — high clay content, ideal for cotton and sorghum",
    },
    "clay": {
        "N":  (40, 70),
        "P":  (20, 45),
        "K":  (90, 130),
        "ph": (6.0, 7.0),
        "label": "Clay soil — moisture retentive, good for rice and wheat",
    },
    "red": {
        "N":  (20, 50),
        "P":  (15, 35),
        "K":  (40, 80),
        "ph": (5.5, 6.5),
        "label": "Red lateritic soil — needs fertilizer, suitable for groundnut and ragi",
    },
    "sandy": {
        "N":  (10, 30),
        "P":  (10, 25),
        "K":  (20, 50),
        "ph": (5.5, 6.5),
        "label": "Sandy soil — low fertility, fast-draining, best for drought-tolerant crops",
    },
    "loamy": {
        "N":  (70, 100),
        "P":  (40, 70),
        "K":  (100, 140),
        "ph": (6.0, 7.0),
        "label": "Loamy soil — ideal texture, supports wide variety of crops",
    },
    "laterite": {
        "N":  (15, 35),
        "P":  (10, 20),
        "K":  (30, 60),
        "ph": (5.0, 6.0),
        "label": "Laterite soil — acidic, needs liming, suits tea and cashew",
    },
    "chalky": {
        "N":  (25, 50),
        "P":  (35, 65),
        "K":  (60, 100),
        "ph": (7.5, 8.5),
        "label": "Chalky soil — alkaline, high drainage, suits barley and spinach",
    },
}


def soil_to_features(soil_type: str) -> dict:
    """
    Convert a classified soil type to its midpoint NPK/pH feature values.

    Args:
        soil_type: One of the 8 soil class names (lowercase string).

    Returns:
        Dict with keys N, P, K, ph — all floats (midpoint of agronomic range).

    Raises:
        KeyError: If soil_type is not in SOIL_PROFILES.
    """
    profile = SOIL_PROFILES[soil_type.lower()]
    return {
        k: (v[0] + v[1]) / 2
        for k, v in profile.items()
        if isinstance(v, tuple)
    }


def get_soil_label(soil_type: str) -> str:
    """Return the human-readable description for a soil type."""
    return SOIL_PROFILES[soil_type.lower()]["label"]


def get_all_soil_info() -> list:
    """
    Return all 8 soil profiles with their ranges and labels.
    Used by the GET /soil-types endpoint.
    """
    result = []
    for name, profile in SOIL_PROFILES.items():
        entry = {"soil_type": name, "label": profile["label"]}
        for k, v in profile.items():
            if isinstance(v, tuple):
                entry[k] = {"min": v[0], "max": v[1], "midpoint": (v[0] + v[1]) / 2}
        result.append(entry)
    return result


# ------------------------------------------------------------------
# Quick self-test
# ------------------------------------------------------------------
if __name__ == "__main__":
    for soil in SOIL_PROFILES:
        print(f"{soil:10s} → {soil_to_features(soil)}")
