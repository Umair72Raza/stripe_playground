import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import { PlaygroundProvider, usePlayground } from './context/PlaygroundContext';
import { phases } from './config';
import { getStoredIds } from './api';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import PaymentLinksPage from './pages/PaymentLinksPage';
import CheckoutPage from './pages/CheckoutPage';
import WebhooksPage from './pages/WebhooksPage';
import PlaceholderPage from './pages/PlaceholderPage';
import './App.css';

const placeholderCopy = {
  products: 'Create products and prices — the foundation of Stripe billing.',
  'payment-links': 'Generate hosted payment links without checkout code.',
  checkout: 'Redirect users to Stripe Checkout for one-time payments.',
  customers: 'Create and retrieve customers.',
  subscriptions: 'Start subscription checkout sessions.',
  invoices: 'List and inspect invoices.',
  portal: 'Open the Stripe-hosted billing portal.',
  refunds: 'List payment intents and issue refunds.',
  elements: 'Custom card form with Payment Intents and Elements.',
};

function AppContent() {
  const [activeId, setActiveId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout')) return 'checkout';
    return 'home';
  });
  const { lastResponse, ids, setIds } = usePlayground();

  useEffect(() => {
    getStoredIds()
      .then(setIds)
      .catch(() => {});
  }, [setIds]);

  const activePhase = phases.find((phase) => phase.id === activeId);

  function renderPage() {
    switch (activeId) {
      case 'home':
        return <HomePage />;
      case 'products':
        return <ProductsPage />;
      case 'payment-links':
        return <PaymentLinksPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'webhooks':
        return <WebhooksPage />;
      default:
        return (
          <PlaceholderPage
            title={activePhase?.label}
            phase={activePhase?.phase}
            description={placeholderCopy[activeId]}
          />
        );
    }
  }

  return (
    <Layout
      activeId={activeId}
      onSelect={setActiveId}
      lastResponse={lastResponse}
      ids={ids}
    >
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <PlaygroundProvider>
      <AppContent />
    </PlaygroundProvider>
  );
}
