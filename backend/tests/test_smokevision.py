import pytest
from app.engines.smokevision_engine import (
    generate_preset_frames,
    analyze_microscopy_sample,
    compare_smoke_experiments,
    analyze_video_file,
)
import os


def test_analyze_video_file():
    demo_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "demo_microgravity_smoke.mp4")
    if os.path.exists(demo_path):
        res = analyze_video_file(demo_path, material="Kapton")
        assert res["status"] == "success"
        assert res["surveillance_status"]["smoke_detected"] is True
        assert res["surveillance_status"]["first_detection_time_s"] is not None
        assert "events_log" in res
        assert len(res["events_log"]) > 0
        assert "threat_level" in res["surveillance_status"]



def test_generate_preset_frames_quiescent():
    res = generate_preset_frames("SAME-R-101", num_frames=6)
    assert res["preset_id"] == "SAME-R-101"
    assert res["frames_count"] == 6
    assert len(res["frames"]) == 6
    assert "accumulation_map" in res
    assert res["accumulation_map"]["stagnation_severity_score"] > 50.0  # High stagnation in quiescent microgravity
    assert "recommended_detector_placement" in res["accumulation_map"]
    assert len(res["expansion_kinetics"]) == 6
    assert len(res["flow_vector_field"]) > 0


def test_generate_preset_frames_duct():
    res = generate_preset_frames("SAME-R-104", num_frames=6)
    assert res["preset_id"] == "SAME-R-104"
    assert res["metadata"]["airflow_cm_s"] == 2.0


def test_analyze_microscopy():
    res = analyze_microscopy_sample("Kapton")
    assert res["material"] == "Kapton"
    assert res["particles_detected_count"] > 0
    assert "count_mean_diameter_nm" in res["statistics"]
    assert "mass_mean_diameter_dmm_nm" in res["statistics"]
    assert len(res["size_distribution_bins"]) == 5


def test_compare_smoke_experiments():
    res = compare_smoke_experiments()
    assert res["compared_experiments_count"] >= 4
    assert len(res["experiments"]) >= 4
