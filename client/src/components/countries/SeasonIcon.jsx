import React from 'react';
import { FaCloudRain, FaCloudShowersHeavy, FaCloudSun, FaLeaf, FaSeedling, FaSnowflake, FaSun, FaTemperatureHigh, FaWind } from 'react-icons/fa';

// The guides' season names (spring to winter, and the tropics' dry, wet, hot and cool
// seasons, the monsoon and the rains), matched by a word in the name, each with its icon and
// ink. A name it doesn't know gets a sun behind a cloud.
const SEASON_ICONS = [
  [/after the monsoon|between/i, FaCloudSun, 'text-colour9'],
  [/monsoon/i, FaCloudShowersHeavy, 'text-colour7'],
  [/rain|wet/i, FaCloudRain, 'text-colour7'],
  [/spring/i, FaSeedling, 'text-status-good'],
  [/summer|dry/i, FaSun, 'text-status-warning'],
  [/hot/i, FaTemperatureHigh, 'text-colour6'],
  [/autumn|fall/i, FaLeaf, 'text-colour6'],
  [/winter/i, FaSnowflake, 'text-colour7'],
  [/cool/i, FaWind, 'text-colour7'],
];

// A season's icon on the country guides' "Season by season" (17 Nov 2026, the user's wish),
// as a small round stamp beside its name. Decorative: the name says it.
function SeasonIcon({ name }) {
  const [, Icon, ink] = SEASON_ICONS.find(([pattern]) => pattern.test(name)) ?? [null, FaCloudSun, 'text-colour9'];
  return (
    <span aria-hidden='true' className={`grid h-9 w-9 place-items-center rounded-full border-2 border-poster-brown/60 bg-paper-cream text-base ${ink}`}>
      <Icon />
    </span>
  );
}

export default SeasonIcon;
