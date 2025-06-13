import { Routes, Route } from 'react-router-dom';

import './globals.css'
import RootLayout from '@/_root/RootLayout';
import { Arena, Home, LFJ, NotFound, Pangolin, PHARAOH, Uniswap } from '@/_root/pages';
import { Toaster } from "@/components/ui/sonner";
import { ScrollToTop } from './components/shared';

function App() {

  return (
    <main className="flex h-screen">
      <ScrollToTop />
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="/LFJ" element={<LFJ />} />
          <Route path="/PHARAOH" element={<PHARAOH />} />
          <Route path="/Arena" element={<Arena />} />
          <Route path="/Pangolin" element={<Pangolin />} />
          <Route path="/Uniswap" element={<Uniswap />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </main>
  )
}

export default App
