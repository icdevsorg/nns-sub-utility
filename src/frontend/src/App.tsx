import { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoadingSpinner } from './components/LoadingSpinner';

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Transactions = lazy(() => import('./pages/Transactions').then((m) => ({ default: m.Transactions })));
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })));
const MySubscriptions = lazy(() => import('./pages/MySubscriptions').then((m) => ({ default: m.MySubscriptions })));
const SubscriptionDetail = lazy(() => import('./pages/SubscriptionDetail').then((m) => ({ default: m.SubscriptionDetail })));
const MyPayments = lazy(() => import('./pages/MyPayments').then((m) => ({ default: m.MyPayments })));
const Subscribe = lazy(() => import('./pages/Subscribe').then((m) => ({ default: m.Subscribe })));
const ServiceAdmin = lazy(() => import('./pages/ServiceAdmin').then((m) => ({ default: m.ServiceAdmin })));
const ServiceNotifications = lazy(() => import('./pages/ServiceNotifications').then((m) => ({ default: m.ServiceNotifications })));

export function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
          <Header />
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/subscriptions" element={<MySubscriptions />} />
                <Route path="/subscriptions/:id" element={<SubscriptionDetail />} />
                <Route path="/payments" element={<MyPayments />} />
                <Route path="/subscribe" element={<Subscribe />} />
                <Route path="/service" element={<ServiceAdmin />} />
                <Route path="/service/notifications" element={<ServiceNotifications />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </ErrorBoundary>
  );
}
