/**
 * Mock scrapers for testing
 */

const testVehicles = [
  { id: 'test-vehicle-1', vehicle_id: 'test-vehicle-1', make: 'Honda', model: 'Civic', year: 2022, price: 95000, km: 15000, score: 8.5 },
  { id: 'test-vehicle-2', vehicle_id: 'test-vehicle-2', make: 'Toyota', model: 'Corolla', year: 2021, price: 98000, km: 32000, score: 8.3 },
  { id: 'test-vehicle-3', vehicle_id: 'test-vehicle-3', make: 'Volkswagen', model: 'Golf', year: 2020, price: 85000, km: 48000, score: 7.9 },
];

export const scrapeMultiplePlatforms = async () => testVehicles;
export const scrapeOLX = async () => [testVehicles[0]];
export const scrapeWebMotors = async () => [testVehicles[1]];
export const generateRealisticVehicles = () => testVehicles;
export const calculateScore = () => 8;
