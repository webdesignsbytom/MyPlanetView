import './globals.css';

export const metadata = {
  title: 'My Planet View',
  description: 'Explore an interactive travel map and open a sample photo album.',
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
