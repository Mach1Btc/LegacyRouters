import { Routes, Route } from 'react-router-dom';

import './globals.css'
import RootLayout from '@/_root/RootLayout';
import { Home, LFJ, NotFound, PHARAOH, Uniswap } from '@/_root/pages';
import { Toaster } from "@/components/ui/sonner";

function App() {

  return (
    <main className="flex h-screen">
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="/LFJ" element={<LFJ />} />
          <Route path="/PHARAOH" element={<PHARAOH />} />
          <Route path="/Uniswap" element={<Uniswap />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </main>
  )
}

export default App
