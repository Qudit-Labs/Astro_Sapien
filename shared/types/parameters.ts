/**
 * FIRELINE — Shared Parameter Dictionary & SI Unit Normalization Standards
 *
 * Defines canonical parameter codes, categories, measurement roles, canonical SI units,
 * display units, and deterministic unit conversion rules.
 */

export const PARAMETER_CODES = [
  'oxygen_concentration',
  'airflow_velocity',
  'pressure',
  'temperature',
  'fuel_diameter',
  'fuel_thickness',
  'flame_spread_rate',
  'burning_duration',
  'heat_release_rate',
  'carbon_monoxide_concentration',
  'carbon_dioxide_concentration',
  'particle_diameter',
  'particle_number_concentration',
  'particle_mass_concentration',
  'soot_volume_fraction',
  'smoke_aging_time',
  'detector_response',
] as const;

export type ParameterCode = (typeof PARAMETER_CODES)[number];

export type ParameterCategory =
  | 'atmospheric_condition'
  | 'flow_condition'
  | 'fuel_geometry'
  | 'flame_dynamics'
  | 'thermal_output'
  | 'gas_emissions'
  | 'smoke_aerosol'
  | 'soot_properties'
  | 'detection_response';

export type MeasurementRole = 'condition' | 'outcome';

export interface ParameterDefinition {
  code: ParameterCode;
  label: string;
  category: ParameterCategory;
  defaultRole: MeasurementRole;
  canonicalUnit: string;
  defaultDisplayUnit: string;
  description: string;
  supportedRawUnits: string[];
  applicableModules: Array<'FIRELINE' | 'TESTMATCH' | 'SMOKEWISE'>;
}

export const PARAMETER_DICTIONARY: Record<ParameterCode, ParameterDefinition> = {
  oxygen_concentration: {
    code: 'oxygen_concentration',
    label: 'Oxygen Concentration',
    category: 'atmospheric_condition',
    defaultRole: 'condition',
    canonicalUnit: 'mol/mol',
    defaultDisplayUnit: '% vol',
    description: 'Ambient oxygen mole fraction in the combustion chamber or cabin environment.',
    supportedRawUnits: ['mol/mol', '% vol', '%', 'vol%'],
    applicableModules: ['FIRELINE', 'TESTMATCH', 'SMOKEWISE'],
  },
  airflow_velocity: {
    code: 'airflow_velocity',
    label: 'Airflow Velocity',
    category: 'flow_condition',
    defaultRole: 'condition',
    canonicalUnit: 'm/s',
    defaultDisplayUnit: 'cm/s',
    description: 'Forced oxidizer flow velocity across the fuel sample or test duct.',
    supportedRawUnits: ['m/s', 'cm/s', 'mm/s'],
    applicableModules: ['FIRELINE', 'TESTMATCH', 'SMOKEWISE'],
  },
  pressure: {
    code: 'pressure',
    label: 'Ambient Pressure',
    category: 'atmospheric_condition',
    defaultRole: 'condition',
    canonicalUnit: 'Pa',
    defaultDisplayUnit: 'kPa',
    description: 'Static ambient gas pressure inside the chamber or spacecraft module.',
    supportedRawUnits: ['Pa', 'kPa', 'atm', 'bar', 'psia'],
    applicableModules: ['FIRELINE', 'TESTMATCH', 'SMOKEWISE'],
  },
  temperature: {
    code: 'temperature',
    label: 'Temperature',
    category: 'atmospheric_condition',
    defaultRole: 'condition',
    canonicalUnit: 'K',
    defaultDisplayUnit: 'K',
    description: 'Ambient gas temperature, duct heater temperature, or flame temperature.',
    supportedRawUnits: ['K', '°C', 'C'],
    applicableModules: ['FIRELINE', 'TESTMATCH', 'SMOKEWISE'],
  },
  fuel_diameter: {
    code: 'fuel_diameter',
    label: 'Fuel Sample / Droplet Diameter',
    category: 'fuel_geometry',
    defaultRole: 'condition',
    canonicalUnit: 'm',
    defaultDisplayUnit: 'mm',
    description: 'Initial diameter of cylindrical rods, spheres, or liquid fuel droplets.',
    supportedRawUnits: ['m', 'cm', 'mm', 'µm', 'um'],
    applicableModules: ['FIRELINE', 'TESTMATCH'],
  },
  fuel_thickness: {
    code: 'fuel_thickness',
    label: 'Fuel Sample Thickness',
    category: 'fuel_geometry',
    defaultRole: 'condition',
    canonicalUnit: 'm',
    defaultDisplayUnit: 'mm',
    description: 'Thickness or areal density equivalent thickness of planar solid fuel sheets or fabrics.',
    supportedRawUnits: ['m', 'cm', 'mm', 'µm', 'um'],
    applicableModules: ['FIRELINE', 'TESTMATCH', 'SMOKEWISE'],
  },
  flame_spread_rate: {
    code: 'flame_spread_rate',
    label: 'Flame Spread Rate',
    category: 'flame_dynamics',
    defaultRole: 'outcome',
    canonicalUnit: 'm/s',
    defaultDisplayUnit: 'mm/s',
    description: 'Velocity of the pyrolysis or visible flame front along the fuel surface.',
    supportedRawUnits: ['m/s', 'cm/s', 'mm/s'],
    applicableModules: ['FIRELINE', 'TESTMATCH'],
  },
  burning_duration: {
    code: 'burning_duration',
    label: 'Burning Duration',
    category: 'flame_dynamics',
    defaultRole: 'outcome',
    canonicalUnit: 's',
    defaultDisplayUnit: 's',
    description: 'Total elapsed time from ignition to flame extinction or test termination.',
    supportedRawUnits: ['s', 'ms', 'min'],
    applicableModules: ['FIRELINE', 'TESTMATCH'],
  },
  heat_release_rate: {
    code: 'heat_release_rate',
    label: 'Heat Release Rate',
    category: 'thermal_output',
    defaultRole: 'outcome',
    canonicalUnit: 'W',
    defaultDisplayUnit: 'W',
    description: 'Thermal power released during combustion.',
    supportedRawUnits: ['W', 'kW', 'mW'],
    applicableModules: ['FIRELINE', 'TESTMATCH'],
  },
  carbon_monoxide_concentration: {
    code: 'carbon_monoxide_concentration',
    label: 'Carbon Monoxide (CO) Concentration',
    category: 'gas_emissions',
    defaultRole: 'outcome',
    canonicalUnit: 'mol/mol',
    defaultDisplayUnit: 'ppm',
    description: 'Mole fraction of carbon monoxide generated by combustion or pyrolysis.',
    supportedRawUnits: ['mol/mol', 'ppm', '% vol', '%'],
    applicableModules: ['FIRELINE', 'TESTMATCH', 'SMOKEWISE'],
  },
  carbon_dioxide_concentration: {
    code: 'carbon_dioxide_concentration',
    label: 'Carbon Dioxide (CO₂) Concentration',
    category: 'gas_emissions',
    defaultRole: 'outcome',
    canonicalUnit: 'mol/mol',
    defaultDisplayUnit: 'ppm',
    description: 'Mole fraction of carbon dioxide generated or accumulated during combustion.',
    supportedRawUnits: ['mol/mol', 'ppm', '% vol', '%'],
    applicableModules: ['FIRELINE', 'TESTMATCH', 'SMOKEWISE'],
  },
  particle_diameter: {
    code: 'particle_diameter',
    label: 'Smoke Particle Diameter',
    category: 'smoke_aerosol',
    defaultRole: 'outcome',
    canonicalUnit: 'm',
    defaultDisplayUnit: 'nm',
    description: 'Count median, geometric mean, or mass mean aerodynamic/mobility diameter of smoke particles.',
    supportedRawUnits: ['m', 'µm', 'um', 'nm'],
    applicableModules: ['SMOKEWISE', 'TESTMATCH'],
  },
  particle_number_concentration: {
    code: 'particle_number_concentration',
    label: 'Particle Number Concentration',
    category: 'smoke_aerosol',
    defaultRole: 'outcome',
    canonicalUnit: '1/m³',
    defaultDisplayUnit: '1/cm³',
    description: 'Number of suspended smoke aerosol particles per unit volume of gas.',
    supportedRawUnits: ['1/m³', '1/cm³', '#/cm³', 'cm^-3', 'm^-3'],
    applicableModules: ['SMOKEWISE', 'TESTMATCH'],
  },
  particle_mass_concentration: {
    code: 'particle_mass_concentration',
    label: 'Particle Mass Concentration',
    category: 'smoke_aerosol',
    defaultRole: 'outcome',
    canonicalUnit: 'kg/m³',
    defaultDisplayUnit: 'mg/m³',
    description: 'Total mass of smoke particulate matter per unit volume of gas.',
    supportedRawUnits: ['kg/m³', 'g/m³', 'mg/m³', 'µg/m³', 'ug/m³'],
    applicableModules: ['SMOKEWISE', 'TESTMATCH'],
  },
  soot_volume_fraction: {
    code: 'soot_volume_fraction',
    label: 'Soot Volume Fraction',
    category: 'soot_properties',
    defaultRole: 'outcome',
    canonicalUnit: 'm³/m³',
    defaultDisplayUnit: 'ppm',
    description: 'Volume of soot particulates per unit volume of the flame or plume.',
    supportedRawUnits: ['m³/m³', 'ppm', 'ppb'],
    applicableModules: ['FIRELINE', 'SMOKEWISE', 'TESTMATCH'],
  },
  smoke_aging_time: {
    code: 'smoke_aging_time',
    label: 'Smoke Aging Residence Time',
    category: 'smoke_aerosol',
    defaultRole: 'condition',
    canonicalUnit: 's',
    defaultDisplayUnit: 's',
    description: 'Residence time allowed for smoke coagulation and thermal aging prior to measurement.',
    supportedRawUnits: ['s', 'ms', 'min'],
    applicableModules: ['SMOKEWISE', 'TESTMATCH'],
  },
  detector_response: {
    code: 'detector_response',
    label: 'Smoke Detector Signal Response',
    category: 'detection_response',
    defaultRole: 'outcome',
    canonicalUnit: 'V',
    defaultDisplayUnit: 'V',
    description: 'Analog output response from ionization or photoelectric smoke detector instruments.',
    supportedRawUnits: ['V', 'mV'],
    applicableModules: ['SMOKEWISE', 'TESTMATCH'],
  },
};

export interface NormalizationResult {
  normalizedValue: number | null;
  normalizedUnit: string;
  isAmbiguous: boolean;
  note?: string;
}

/**
 * Deterministically converts a raw value and raw unit to the parameter's canonical SI unit.
 * Never normalizes ambiguous units; returns normalizedValue: null when ambiguous or unsupported.
 */
export function normalizeParameterValue(
  parameterCode: ParameterCode,
  rawValue: number | null,
  rawUnit: string
): NormalizationResult {
  const def = PARAMETER_DICTIONARY[parameterCode];
  const canonicalUnit = def.canonicalUnit;

  if (rawValue === null || Number.isNaN(rawValue)) {
    return {
      normalizedValue: null,
      normalizedUnit: canonicalUnit,
      isAmbiguous: false,
      note: 'Raw value is null or not reported.',
    };
  }

  const unit = rawUnit.trim();

  // Direct match with canonical unit
  if (unit === canonicalUnit) {
    return {
      normalizedValue: rawValue,
      normalizedUnit: canonicalUnit,
      isAmbiguous: false,
    };
  }

  switch (parameterCode) {
    case 'oxygen_concentration':
    case 'carbon_monoxide_concentration':
    case 'carbon_dioxide_concentration': {
      if (unit === '% vol' || unit === 'vol%' || unit === '%') {
        return {
          normalizedValue: Number((rawValue * 0.01).toPrecision(10)),
          normalizedUnit: 'mol/mol',
          isAmbiguous: false,
        };
      }
      if (unit === 'ppm') {
        return {
          normalizedValue: Number((rawValue * 1e-6).toPrecision(10)),
          normalizedUnit: 'mol/mol',
          isAmbiguous: false,
        };
      }
      break;
    }

    case 'airflow_velocity':
    case 'flame_spread_rate': {
      if (unit === 'cm/s') {
        return {
          normalizedValue: Number((rawValue * 0.01).toPrecision(10)),
          normalizedUnit: 'm/s',
          isAmbiguous: false,
        };
      }
      if (unit === 'mm/s') {
        return {
          normalizedValue: Number((rawValue * 0.001).toPrecision(10)),
          normalizedUnit: 'm/s',
          isAmbiguous: false,
        };
      }
      break;
    }

    case 'pressure': {
      if (unit === 'kPa') {
        return {
          normalizedValue: Number((rawValue * 1000).toPrecision(10)),
          normalizedUnit: 'Pa',
          isAmbiguous: false,
        };
      }
      if (unit === 'atm') {
        return {
          normalizedValue: Number((rawValue * 101325).toPrecision(10)),
          normalizedUnit: 'Pa',
          isAmbiguous: false,
        };
      }
      if (unit === 'bar') {
        return {
          normalizedValue: Number((rawValue * 100000).toPrecision(10)),
          normalizedUnit: 'Pa',
          isAmbiguous: false,
        };
      }
      if (unit === 'psia') {
        return {
          normalizedValue: Number((rawValue * 6894.75729).toPrecision(10)),
          normalizedUnit: 'Pa',
          isAmbiguous: false,
        };
      }
      break;
    }

    case 'temperature': {
      if (unit === '°C' || unit === 'C') {
        return {
          normalizedValue: Number((rawValue + 273.15).toPrecision(10)),
          normalizedUnit: 'K',
          isAmbiguous: false,
        };
      }
      break;
    }

    case 'fuel_diameter':
    case 'fuel_thickness':
    case 'particle_diameter': {
      if (unit === 'cm') {
        return {
          normalizedValue: Number((rawValue * 1e-2).toPrecision(10)),
          normalizedUnit: 'm',
          isAmbiguous: false,
        };
      }
      if (unit === 'mm') {
        return {
          normalizedValue: Number((rawValue * 1e-3).toPrecision(10)),
          normalizedUnit: 'm',
          isAmbiguous: false,
        };
      }
      if (unit === 'µm' || unit === 'um') {
        return {
          normalizedValue: Number((rawValue * 1e-6).toPrecision(10)),
          normalizedUnit: 'm',
          isAmbiguous: false,
        };
      }
      if (unit === 'nm') {
        return {
          normalizedValue: Number((rawValue * 1e-9).toPrecision(10)),
          normalizedUnit: 'm',
          isAmbiguous: false,
        };
      }
      break;
    }

    case 'burning_duration':
    case 'smoke_aging_time': {
      if (unit === 'ms') {
        return {
          normalizedValue: Number((rawValue * 1e-3).toPrecision(10)),
          normalizedUnit: 's',
          isAmbiguous: false,
        };
      }
      if (unit === 'min') {
        return {
          normalizedValue: Number((rawValue * 60).toPrecision(10)),
          normalizedUnit: 's',
          isAmbiguous: false,
        };
      }
      break;
    }

    case 'heat_release_rate': {
      if (unit === 'kW') {
        return {
          normalizedValue: Number((rawValue * 1000).toPrecision(10)),
          normalizedUnit: 'W',
          isAmbiguous: false,
        };
      }
      if (unit === 'mW') {
        return {
          normalizedValue: Number((rawValue * 1e-3).toPrecision(10)),
          normalizedUnit: 'W',
          isAmbiguous: false,
        };
      }
      break;
    }

    case 'particle_number_concentration': {
      if (unit === '1/cm³' || unit === '#/cm³' || unit === 'cm^-3') {
        return {
          normalizedValue: Number((rawValue * 1e6).toPrecision(10)),
          normalizedUnit: '1/m³',
          isAmbiguous: false,
        };
      }
      if (unit === 'm^-3') {
        return {
          normalizedValue: rawValue,
          normalizedUnit: '1/m³',
          isAmbiguous: false,
        };
      }
      break;
    }

    case 'particle_mass_concentration': {
      if (unit === 'g/m³') {
        return {
          normalizedValue: Number((rawValue * 1e-3).toPrecision(10)),
          normalizedUnit: 'kg/m³',
          isAmbiguous: false,
        };
      }
      if (unit === 'mg/m³') {
        return {
          normalizedValue: Number((rawValue * 1e-6).toPrecision(10)),
          normalizedUnit: 'kg/m³',
          isAmbiguous: false,
        };
      }
      if (unit === 'µg/m³' || unit === 'ug/m³') {
        return {
          normalizedValue: Number((rawValue * 1e-9).toPrecision(10)),
          normalizedUnit: 'kg/m³',
          isAmbiguous: false,
        };
      }
      break;
    }

    case 'soot_volume_fraction': {
      if (unit === 'ppm') {
        return {
          normalizedValue: Number((rawValue * 1e-6).toPrecision(10)),
          normalizedUnit: 'm³/m³',
          isAmbiguous: false,
        };
      }
      if (unit === 'ppb') {
        return {
          normalizedValue: Number((rawValue * 1e-9).toPrecision(10)),
          normalizedUnit: 'm³/m³',
          isAmbiguous: false,
        };
      }
      break;
    }

    case 'detector_response': {
      if (unit === 'mV') {
        return {
          normalizedValue: Number((rawValue * 1e-3).toPrecision(10)),
          normalizedUnit: 'V',
          isAmbiguous: false,
        };
      }
      break;
    }
  }

  return {
    normalizedValue: null,
    normalizedUnit: canonicalUnit,
    isAmbiguous: true,
    note: `Unit '${rawUnit}' is ambiguous or unsupported for automatic conversion to '${canonicalUnit}'.`,
  };
}
