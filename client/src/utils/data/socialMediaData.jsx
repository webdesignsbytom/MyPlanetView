// Icons
import SvgIcon from '@/components/common/SvgIcon';
import { FACEBOOK_ICON, GOOGLE_ICON, INSTAGRAM_ICON, TIKTOK_ICON, X_ICON } from '@/utils/data/svgIcons';
// Constants
import { CompanyName } from '@/utils/constants/constants';
import {
  FACEBOOK_URL,
  GOOGLE_BUSINESS_URL,
  INSTAGRAM_URL,
  TIKTOK_URL,
  X_URL,
} from '@/utils/constants/links';

// Links with no URL are hidden
export const socialMediaLinks = [
  {
    serviceName: 'Facebook',
    icon: <SvgIcon icon={FACEBOOK_ICON} />,
    url: FACEBOOK_URL,
    ariaLabel: `Open ${CompanyName} Facebook page in a new tab`,
    title: `${CompanyName} on Facebook`,
  },
  {
    serviceName: 'Instagram',
    icon: <SvgIcon icon={INSTAGRAM_ICON} />,
    url: INSTAGRAM_URL,
    ariaLabel: `Open ${CompanyName} Instagram profile in a new tab`,
    title: `${CompanyName} on Instagram`,
  },
  {
    serviceName: 'TikTok',
    icon: <SvgIcon icon={TIKTOK_ICON} />,
    url: TIKTOK_URL,
    ariaLabel: `Open ${CompanyName} TikTok page in a new tab`,
    title: `${CompanyName} on TikTok`,
  },
  {
    serviceName: 'X (Twitter)',
    icon: <SvgIcon icon={X_ICON} />,
    url: X_URL,
    ariaLabel: `Open ${CompanyName} X (Twitter) profile in a new tab`,
    title: `${CompanyName} on X`,
  },
  {
    serviceName: 'Google',
    icon: <SvgIcon icon={GOOGLE_ICON} />,
    url: GOOGLE_BUSINESS_URL,
    ariaLabel: `Open ${CompanyName} Google Business page in a new tab`,
    title: `${CompanyName} on Google`,
  },
].filter((link) => link.url);
