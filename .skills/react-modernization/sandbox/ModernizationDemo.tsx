"use client";

import React, { useOptimistic } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { DemoFormSchema, type DemoFormValues } from './schemas';

// Mock server action to demonstrate React 19 standards (Pillar 1)
async function mockServerAction(data: DemoFormValues) {
  "use server"; // Note: This directive would actually live in a separate file in a real Next.js app
  return new Promise((resolve) => setTimeout(() => resolve({ success: true, data }), 2000));
}

export function ModernizationDemo() {
  // Pillar 2: Validations via React Hook Form + Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DemoFormValues>({
    resolver: zodResolver(DemoFormSchema),
    defaultValues: {
      username: '',
      email: '',
      notificationPreference: 'mentions',
    },
  });

  // Pillar 1: React 19 Quality of Life
  const [optimisticState, addOptimisticState] = useOptimistic(
    { status: 'idle', message: '' },
    (state, newStatus: string) => ({ status: newStatus, message: 'Optimistically updating...' })
  );

  const onSubmit = async (data: DemoFormValues) => {
    // 1. Instantly update UI (Optimistic)
    addOptimisticState('submitting');
    
    // 2. Perform actual server mutation
    await mockServerAction(data);
  };

  // Pillar 5: Design Engineering (Framer Motion)
  return (
    <div className="relative p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl max-w-md mx-auto overflow-hidden">
      
      {/* 
        Pillar 5 / Kinetic Integration Note:
        If you have the Kinetic Canvas skill installed, you can drop a `<KineticMesh />` 
        here to render a highly performant WebGL background behind this glassmorphic card! 
      */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Settings</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Username Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300">Username</label>
            <input
              {...register('username')}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="e.g. upioneer"
            />
            {errors.username && <p className="text-red-400 text-xs">{errors.username.message}</p>}
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <input
              {...register('email')}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="agent@codescaffold.com"
            />
            {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
          </div>

          {/* Submit Button with Spring Physics */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 0.98 }}
            whileTap={{ scale: 0.95 }}
            className={`w-full py-3 rounded-xl font-semibold text-white transition-colors flex items-center justify-center ${
              isSubmitting ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              'Save Preferences'
            )}
          </motion.button>

        </form>

        {optimisticState.status === 'submitting' && (
          <p className="mt-4 text-sm text-blue-300 text-center animate-pulse">
            {optimisticState.message}
          </p>
        )}
      </motion.div>
    </div>
  );
}
