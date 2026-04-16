import React from "react";
import { Search, ChevronRight, UserPlus, MessageCircle, Home, BarChart2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export default function DiscoverView() {
  const collections = [
    { id: 1, name: "Solana Monkeys", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=1" },
    { id: 2, name: "Bored Ape", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=2" },
    { id: 3, name: "Crypto Punks", avatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=3" },
  ];

  const nfts = [
    { id: 1, title: "Hawaii", price: "12 SOL", author: "Chill Monkeys", image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop" },
    { id: 2, title: "Apiens", price: "5 SOL", author: "Apiens", image: "https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?q=80&w=1000&auto=format&fit=crop" },
  ];

  return (
    <div className="relative h-full w-full bg-[#0d0d0d] overflow-hidden">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#1a1a1a] to-black" />
      
      <div className="relative z-10 flex h-full flex-col px-6 pt-12">
        {/* Search Bar */}
        <div className="search-glass mb-8 flex h-14 items-center rounded-[24px] px-6">
          <span className="text-sm font-medium text-white/60">Solana Monkeys</span>
          <Search className="ml-auto h-5 w-5 text-white/40" />
        </div>

        {/* Results Header */}
        <div className="mb-6">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white">Results</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">Collections</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full glass-surface text-[10px] font-bold text-white/60">
              8
            </span>
          </div>
        </div>

        {/* Collections Row */}
        <div className="mb-10 flex items-center gap-4 overflow-x-auto pb-2 no-scrollbar">
          {collections.map((col) => (
            <div key={col.id} className="relative h-14 w-14 shrink-0 rounded-full border-2 border-purple-500/50 p-0.5">
              <img src={col.avatar} alt={col.name} className="h-full w-full rounded-full object-cover" />
            </div>
          ))}
          <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full glass-surface text-white/60 transition-colors hover:text-white">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Top Seller Header */}
        <div className="mb-6 flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-white/40">Top - Seller NFT</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full glass-surface text-[10px] font-bold text-white/60">
            12
          </span>
        </div>

        {/* NFT Stack */}
        <div className="relative flex-1 overflow-visible">
          {nfts.map((nft, i) => (
            <motion.div
              key={nft.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, type: "spring", bounce: 0.2 }}
              className={`absolute left-0 right-0 overflow-hidden rounded-[40px] glass-card-dark p-6 h-[280px] flex flex-col justify-end transition-all duration-500 ${
                i === 0 ? "z-20 scale-100 top-20 shadow-2xl" : "z-10 scale-[0.9] -top-8 opacity-60 grayscale-[50%]"
              }`}
              style={{
                 backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url(${nft.image})`,
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
              }}
            >
              <div className="absolute top-8 left-8">
                <div className="text-2xl font-bold text-white">{nft.price}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/40">Floor price</div>
              </div>
              
              <div className="absolute top-8 right-8 h-12 w-12 rounded-full glass-surface flex items-center justify-center backdrop-blur-3xl">
                  <div className="h-5 w-5 bg-white/20 rotate-45" />
              </div>

              <div>
                <h3 className="text-4xl font-bold text-white mb-2">{nft.title}</h3>
                <p className="text-sm font-bold uppercase tracking-widest text-white/60">{nft.author}</p>
              </div>

              <button className="absolute bottom-8 right-8 h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110">
                  <ChevronRight className="h-6 w-6 text-black" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
