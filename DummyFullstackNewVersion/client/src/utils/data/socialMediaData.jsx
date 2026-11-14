// Icons
import { FaFacebookF, FaInstagram, FaGoogle, FaTiktok } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
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
    icon: <FaFacebookF />,
    url: FACEBOOK_URL,
    ariaLabel: `Open ${CompanyName} Facebook page in a new tab`,
    title: `${CompanyName} on Facebook`,
  },
  {
    serviceName: 'Instagram',
    icon: <FaInstagram />,
    url: INSTAGRAM_URL,
    ariaLabel: `Open ${CompanyName} Instagram profile in a new tab`,
    title: `${CompanyName} on Instagram`,
  },
  {
    serviceName: 'TikTok',
    icon: <FaTiktok />,
    url: TIKTOK_URL,
    ariaLabel: `Open ${CompanyName} TikTok page in a new tab`,
    title: `${CompanyName} on TikTok`,
  },
  {
    serviceName: 'X (Twitter)',
    icon: <FaXTwitter />,
    url: X_URL,
    ariaLabel: `Open ${CompanyName} X (Twitter) profile in a new tab`,
    title: `${CompanyName} on X`,
  },
  {
    serviceName: 'Google',
    icon: <FaGoogle />,
    url: GOOGLE_BUSINESS_URL,
    ariaLabel: `Open ${CompanyName} Google Business page in a new tab`,
    title: `${CompanyName} on Google`,
  },
].filter((link) => link.url);
