import { useEffect, useState } from 'react';
import { useChai } from './context/ChaiContext';
import { Layout } from './components/Layout';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Blogs } from './pages/Blogs';
import { Newsletter } from './pages/Newsletter';
import { Leads } from './pages/Leads';
import { Clients } from './pages/Clients';
import { Media } from './pages/Media';
import { Settings } from './pages/Settings';
import { EmailOverview } from './pages/EmailOverview';
import { EmailTemplates } from './pages/EmailTemplates';
import { EmailTemplateDetail } from './pages/EmailTemplateDetail';
import { EmailActivity } from './pages/EmailActivity';
import { Integrations } from './pages/Integrations';

import { api } from './services/api';

function App() {
  const { activeNav } = useChai();
  const [isAuthenticated, setAuthenticated] = useState(() => Boolean(api.getCrmAccessToken()));
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handleRoute = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handleRoute);
    return () => window.removeEventListener('popstate', handleRoute);
  }, []);

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={() => setAuthenticated(true)} />;
  }

  const renderActivePage = () => {
    if (path === '/leads') return <Leads />;
    if (path === '/subscribers') return <Newsletter />;
    if (path === '/content') return <Blogs />;
    if (path === '/clients') return <Clients />;
    if (path === '/assets') return <Media />;
    if (path === '/settings') return <Settings />;
    if (path === '/settings/google') return <Integrations />;
    if (path === '/email') return <EmailOverview />;
    if (path === '/email/templates') return <EmailTemplates />;
    if (path.startsWith('/email/templates/')) {
      const templateId = decodeURIComponent(path.replace('/email/templates/', ''));
      return <EmailTemplateDetail templateId={templateId} />;
    }
    if (path === '/email/activity') return <EmailActivity />;
    if (path === '/settings/integrations') return <Integrations />;

    switch (activeNav) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Blogs':
        return <Blogs />;
      case 'Subscribers':
        return <Newsletter />;
      case 'Email Templates':
        return <EmailTemplates />;
      case 'Email Logs':
        return <EmailActivity />;
      case 'Email Overview':
        return <EmailOverview />;
      case 'Email Activity':
        return <EmailActivity />;
      case 'Integrations':
        return <Integrations />;
      case 'Contact Leads':
        return <Leads />;
      case 'Clients':
        return <Clients />;
      case 'Assets':
        return <Media />;
      case 'Settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout onLogout={() => {
      api.clearCrmAuth();
      window.history.replaceState({}, '', '/');
      setPath('/');
      setAuthenticated(false);
    }}>
      {renderActivePage()}
    </Layout>
  );
}

export default App;
