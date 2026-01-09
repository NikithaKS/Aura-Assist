import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeatureCard({ icon: Icon, title, description, color, pageName, onClick }) {
  const content = (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden rounded-3xl p-6 shadow-lg border-2 ${color} cursor-pointer min-h-[140px] flex flex-col justify-between`}
      role="button"
      aria-label={title}
      tabIndex={0}
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-white/90 shadow-md">
          <Icon className="h-8 w-8 text-gray-900" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
          <p className="text-white/90 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4">
        <ChevronRight className="h-6 w-6 text-white/70" />
      </div>
    </motion.div>
  );

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return <Link to={`/${pageName}`}>{content}</Link>;
}