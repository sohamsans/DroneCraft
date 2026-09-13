"""
Spec Sheet Sanitizer & Regex Normalizer for DroneCraft.
Extracts normalized parameters (Kv, resistance, burst ratings, thrust tables, weights)
from messy product descriptions and HTML spec tables.
"""

import re
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup

class SpecParser:
    @staticmethod
    def parse_motor_specs(text_or_html: str) -> Dict[str, Any]:
        """
        Extracts motor specs: Kv, stator size, Rm (mΩ), idle current I0 (A),
        max power (W), max current (A), weight (g), voltage range (S).
        """
        text = BeautifulSoup(text_or_html, "html.parser").get_text(" ") if "<" in text_or_html else text_or_html
        result = {}

        # KV search e.g. "1950KV", "2400 KV", "KV: 1750"
        kv_match = re.search(r'(?:KV|kv)[:\s]*([0-9]{3,5})|([0-9]{3,5})\s*(?:KV|kv)', text)
        if kv_match:
            val = kv_match.group(1) or kv_match.group(2)
            result["kv"] = float(val)

        # Stator size e.g. "2207", "2306.5", "2806.5", "1404"
        stator_match = re.search(r'\b([1-8][0-9]{3}(?:\.[0-9])?)\b', text)
        if stator_match:
            result["stator_size"] = stator_match.group(1)

        # Internal Resistance e.g. "48 mOhm", "48mΩ", "Internal Resistance: 52mohm", "0.048 ohm"
        rm_match = re.search(r'(?:resistance|Rm|rm|Resistance)[:\s]*([0-9\.]+)\s*(?:m[oO]hm|mΩ|mohm|mOhm)', text, re.I)
        if rm_match:
            result["internal_resistance_mohm"] = float(rm_match.group(1))
        else:
            rm_ohm_match = re.search(r'([0-9\.]+)\s*(?:[oO]hm|Ω)', text)
            if rm_ohm_match and float(rm_ohm_match.group(1)) < 1.0:
                result["internal_resistance_mohm"] = float(rm_ohm_match.group(1)) * 1000.0

        # Idle current e.g. "Idle Current(10V): 1.1A", "0.9A @ 10V"
        idle_match = re.search(r'(?:idle current|no load current|I0)[:\s]*([0-9\.]+)\s*A', text, re.I)
        if idle_match:
            result["idle_current_a"] = float(idle_match.group(1))

        # Max continuous current e.g. "Max Current: 46.5A", "Peak Current: 45A"
        max_curr_match = re.search(r'(?:max continuous current|max current|peak current)[:\s]*([0-9\.]+)\s*A', text, re.I)
        if max_curr_match:
            result["max_continuous_current_a"] = float(max_curr_match.group(1))

        # Max Power e.g. "Max Power (60s): 1100W", "1100 Watts"
        power_match = re.search(r'(?:max power|peak power|power)[:\s]*([0-9]{2,5})\s*(?:W|Watts|watt)', text, re.I)
        if power_match:
            result["max_power_w"] = float(power_match.group(1))

        # Voltage range e.g. "3-6S", "4S-6S", "4S", "6S"
        volt_range_match = re.search(r'([1-8])\s*-\s*([1-8])\s*S', text, re.I)
        if volt_range_match:
            result["recommended_voltage_s_min"] = int(volt_range_match.group(1))
            result["recommended_voltage_s_max"] = int(volt_range_match.group(2))
        else:
            single_s_match = re.search(r'([1-8])\s*S\b', text, re.I)
            if single_s_match:
                s_val = int(single_s_match.group(1))
                result["recommended_voltage_s_min"] = max(1, s_val - 1)
                result["recommended_voltage_s_max"] = s_val

        # Weight e.g. "Weight: 33.8g", "33.8 g (incl. cable)"
        weight_match = re.search(r'(?:weight|mass)[:\s]*([0-9\.]+)\s*g\b', text, re.I)
        if weight_match:
            result["weight_g"] = float(weight_match.group(1))

        return result

    @staticmethod
    def parse_propeller_specs(text_or_html: str) -> Dict[str, Any]:
        """
        Extracts propeller specs: diameter, pitch, blade count, weight.
        """
        text = BeautifulSoup(text_or_html, "html.parser").get_text(" ") if "<" in text_or_html else text_or_html
        result = {}

        # E.g. "5x4.3x3", "51466", "7040", "3535"
        std_format = re.search(r'\b([0-9](?:\.[0-9]+)?)\s*x\s*([0-9](?:\.[0-9]+)?)\s*(?:x\s*([0-9]))?\b', text)
        if std_format:
            result["diameter_inch"] = float(std_format.group(1))
            result["pitch_inch"] = float(std_format.group(2))
            if std_format.group(3):
                result["blade_count"] = int(std_format.group(3))
        else:
            # 4 or 5 digit code like 51466 (5.1" diameter, 4.66 pitch) or 5040
            code_match = re.search(r'\b(5[0-9]{3,4}|7[0-9]{3}|3[0-9]{3})\b', text)
            if code_match:
                code = code_match.group(1)
                if len(code) == 5:
                    result["diameter_inch"] = float(f"{code[0]}.{code[1]}")
                    result["pitch_inch"] = float(f"{code[2]}.{code[3:]}")
                elif len(code) == 4:
                    result["diameter_inch"] = float(code[0])
                    result["pitch_inch"] = float(f"{code[1]}.{code[2:]}")

        # Blade count search e.g. "Tri-blade", "3-blade", "Bi-blade", "2-blade"
        if "tri-blade" in text.lower() or "3-blade" in text.lower() or "triblade" in text.lower():
            result["blade_count"] = 3
        elif "bi-blade" in text.lower() or "2-blade" in text.lower() or "biblade" in text.lower():
            result["blade_count"] = 2

        weight_match = re.search(r'(?:weight|mass)[:\s]*([0-9\.]+)\s*g\b', text, re.I)
        if weight_match:
            result["weight_g"] = float(weight_match.group(1))

        return result

    @staticmethod
    def parse_battery_specs(text_or_html: str) -> Dict[str, Any]:
        """
        Extracts battery specs: S cell count, capacity (mAh), C ratings, weight.
        """
        text = BeautifulSoup(text_or_html, "html.parser").get_text(" ") if "<" in text_or_html else text_or_html
        result = {}

        # Cell count S e.g. "6S", "4S", "6S1P"
        s_match = re.search(r'\b([1-8])\s*S(?:1P)?\b', text, re.I)
        if s_match:
            result["cells_s"] = int(s_match.group(1))

        # Capacity mAh e.g. "1400mAh", "1550 mAh", "4200mah"
        cap_match = re.search(r'([0-9]{3,6})\s*mAh', text, re.I)
        if cap_match:
            result["capacity_mah"] = float(cap_match.group(1))

        # C-Rating e.g. "150C", "100C/200C", "120C continuous"
        c_burst_match = re.search(r'([0-9]{2,3})\s*C\s*/\s*([0-9]{2,3})\s*C', text)
        if c_burst_match:
            result["c_rating_continuous"] = float(c_burst_match.group(1))
            result["c_rating_burst"] = float(c_burst_match.group(2))
        else:
            c_single_match = re.search(r'([0-9]{2,3})\s*C\b', text)
            if c_single_match:
                c_val = float(c_single_match.group(1))
                result["c_rating_continuous"] = c_val
                result["c_rating_burst"] = c_val * 1.6

        # Weight
        weight_match = re.search(r'(?:weight|mass)[:\s]*([0-9\.]+)\s*g\b', text, re.I)
        if weight_match:
            result["weight_g"] = float(weight_match.group(1))

        return result
