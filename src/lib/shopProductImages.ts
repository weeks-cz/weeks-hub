export const DEFAULT_SHOP_PRODUCT_IMAGE_URL = '/images/gallery/iot-breadboard-detail.jpg';

const LEGACY_SHOP_PRODUCT_IMAGE_REPLACEMENTS: Record<string, string> = {
  '/images/gallery/iot-arduino-breadboard.jpg': '/images/gallery/iot-breadboard-detail.jpg',
  '/images/gallery/iot-circuit-design.jpg': '/images/gallery/shop-iot-component-closeup.jpg',
  '/images/gallery/iot-arduino-programming.jpg': '/images/gallery/shop-iot-component-closeup.jpg',
  'https://weeks.cz/images/gallery/iot-breadboard-detail.jpg': '/images/gallery/iot-breadboard-detail.jpg',
  'https://weeks.cz/images/gallery/iot-plant-sensor.jpg': '/images/gallery/iot-plant-sensor.jpg',
  'https://weeks.cz/images/gallery/iot-plant-sensor-2.jpg': '/images/gallery/iot-plant-sensor-2.jpg',
  'https://weeks.cz/images/gallery/shop-iot-component-closeup.jpg': '/images/gallery/shop-iot-component-closeup.jpg',
  'https://weeks.cz/images/gallery/iot-arduino-breadboard.jpg': '/images/gallery/iot-breadboard-detail.jpg',
  'https://weeks.cz/images/gallery/iot-circuit-design.jpg': '/images/gallery/shop-iot-component-closeup.jpg',
  'https://weeks.cz/images/gallery/iot-arduino-programming.jpg': '/images/gallery/shop-iot-component-closeup.jpg',
};

export function getSafeShopProductImageUrl(imageUrl: string) {
  return LEGACY_SHOP_PRODUCT_IMAGE_REPLACEMENTS[imageUrl] || imageUrl || DEFAULT_SHOP_PRODUCT_IMAGE_URL;
}
