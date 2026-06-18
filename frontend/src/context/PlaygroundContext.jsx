import { createContext, useContext, useState } from 'react';

const PlaygroundContext = createContext(null);

const defaultIds = {
  product_id: null,
  price_id: null,
  customer_id: null,
  payment_link_id: null,
  checkout_session_id: null,
  subscription_id: null,
  payment_intent_id: null,
};

export function PlaygroundProvider({ children }) {
  const [lastResponse, setLastResponse] = useState(null);
  const [ids, setIds] = useState(defaultIds);

  return (
    <PlaygroundContext.Provider
      value={{
        lastResponse,
        setLastResponse,
        ids,
        setIds,
      }}
    >
      {children}
    </PlaygroundContext.Provider>
  );
}

export function usePlayground() {
  const context = useContext(PlaygroundContext);
  if (!context) {
    throw new Error('usePlayground must be used within PlaygroundProvider');
  }
  return context;
}
