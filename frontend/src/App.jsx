import Navigation from './pages/Auth/Navigation';
import { Outlet } from 'react-router-dom';
import { Toaster, toast } from 'sonner';

function App() {
  return (
    <>
      <Navigation />
      <Toaster richColors />
      <main className="pt-16">
        <Outlet />
      </main>
    </>
  )
}

export default App
