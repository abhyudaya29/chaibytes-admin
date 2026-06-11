import { useChai } from './context/ChaiContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Blogs } from './pages/Blogs';
import { Newsletter } from './pages/Newsletter';
import { Emails } from './pages/Emails';
import { Leads } from './pages/Leads';
import { Clients } from './pages/Clients';
import { Media } from './pages/Media';
import { Settings } from './pages/Settings';
import { Templates } from './pages/Templates';

function App() {
  const { activeNav } = useChai();

  const renderActivePage = () => {
    switch (activeNav) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Blogs':
        return <Blogs />;
      case 'Subscribers':
        return <Newsletter />;
      case 'Email Templates':
        return <Templates />;
      case 'Email Logs':
        return <Emails />;
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
    <Layout>
      {renderActivePage()}
    </Layout>
  );
}

export default App;
