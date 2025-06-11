import { Routes, Route } from 'react-router-dom';

import './globals.css'
import RootLayout from '@/_root/RootLayout';
import { Home, LFJ, NotFound, PHARAOH } from '@/_root/pages';
import { Toaster } from "@/components/ui/sonner";

function App() {

  return (
    <main className="flex h-screen">
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="/LFJ" element={<LFJ />} />
          <Route path="/PHARAOH" element={<PHARAOH />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </main>
  )
}

export default App
