import { Suspense } from 'react';

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="container"><p>Loading...</p></div>}>{children}</Suspense>;
}
