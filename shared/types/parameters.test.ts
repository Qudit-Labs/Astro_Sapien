import { describe, it, expect } from 'vitest';
import {
  PARAMETER_CODES,
  PARAMETER_DICTIONARY,
  normalizeParameterValue,
} from './parameters';

describe('FIRELINE Parameter Dictionary and Unit Normalization', () => {
  it('defines all 17 required parameter codes', () => {
    expect(PARAMETER_CODES.length).toBe(17);
    for (const code of PARAMETER_CODES) {
      expect(PARAMETER_DICTIONARY[code]).toBeDefined();
    }
    expect(PARAMETER_CODES).toContain('oxygen_concentration');
    expect(PARAMETER_CODES).toContain('airflow_velocity');
    expect(PARAMETER_CODES).toContain('pressure');
    expect(PARAMETER_CODES).toContain('temperature');
    expect(PARAMETER_CODES).toContain('fuel_diameter');
    expect(PARAMETER_CODES).toContain('fuel_thickness');
    expect(PARAMETER_CODES).toContain('flame_spread_rate');
    expect(PARAMETER_CODES).toContain('burning_duration');
    expect(PARAMETER_CODES).toContain('heat_release_rate');
    expect(PARAMETER_CODES).toContain('carbon_monoxide_concentration');
    expect(PARAMETER_CODES).toContain('carbon_dioxide_concentration');
    expect(PARAMETER_CODES).toContain('particle_diameter');
    expect(PARAMETER_CODES).toContain('particle_number_concentration');
    expect(PARAMETER_CODES).toContain('particle_mass_concentration');
    expect(PARAMETER_CODES).toContain('soot_volume_fraction');
    expect(PARAMETER_CODES).toContain('smoke_aging_time');
    expect(PARAMETER_CODES).toContain('detector_response');
  });

  it('normalizes airflow velocity from cm/s to m/s', () => {
    const res = normalizeParameterValue('airflow_velocity', 20, 'cm/s');
    expect(res.normalizedValue).toBe(0.2);
    expect(res.normalizedUnit).toBe('m/s');
    expect(res.isAmbiguous).toBe(false);
  });

  it('normalizes smoke particle diameter from nm to m', () => {
    const res = normalizeParameterValue('particle_diameter', 300, 'nm');
    expect(res.normalizedValue).toBe(3e-7);
    expect(res.normalizedUnit).toBe('m');
    expect(res.isAmbiguous).toBe(false);
  });

  it('normalizes oxygen concentration from % vol to mol/mol', () => {
    const res = normalizeParameterValue('oxygen_concentration', 21, '% vol');
    expect(res.normalizedValue).toBe(0.21);
    expect(res.normalizedUnit).toBe('mol/mol');
    expect(res.isAmbiguous).toBe(false);
  });

  it('normalizes pressure from kPa to Pa', () => {
    const res = normalizeParameterValue('pressure', 1, 'kPa');
    expect(res.normalizedValue).toBe(1000);
    expect(res.normalizedUnit).toBe('Pa');
    expect(res.isAmbiguous).toBe(false);
  });

  it('normalizes temperature from °C to K', () => {
    const res = normalizeParameterValue('temperature', 25, '°C');
    expect(res.normalizedValue).toBeCloseTo(298.15);
    expect(res.normalizedUnit).toBe('K');
    expect(res.isAmbiguous).toBe(false);
  });

  it('returns null normalizedValue for missing or null raw values without failing or defaulting to zero', () => {
    const res = normalizeParameterValue('airflow_velocity', null, 'cm/s');
    expect(res.normalizedValue).toBeNull();
    expect(res.normalizedUnit).toBe('m/s');
  });

  it('marks ambiguous or unsupported units as ambiguous and sets normalizedValue to null', () => {
    const res = normalizeParameterValue('airflow_velocity', 15, 'knots_unsupported');
    expect(res.normalizedValue).toBeNull();
    expect(res.isAmbiguous).toBe(true);
    expect(res.note).toBeDefined();
  });
});
