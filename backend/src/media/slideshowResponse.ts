import { SlideshowResponse } from '../../../shared/types';
import { getConfig } from '../config/configStore';

export function getSlideshowResponse(): SlideshowResponse {
  const { slideshow } = getConfig();
  return {
    overviewDurationSeconds: slideshow.overviewDurationSeconds,
    itemDurationSeconds: slideshow.itemDurationSeconds,
    items: slideshow.items.map((item) => ({
      id: item.id,
      filename: item.filename,
      type: item.type,
    })),
  };
}
