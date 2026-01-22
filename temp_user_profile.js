'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { usersAPI } from '@/utils/api';

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        const userId = params.id;

        if (!userId) {
          setError('User ID not found');
          return;
        }

        // First try to get user from the users list API
        const usersResponse = await usersAPI.getAll();
        if (usersResponse.success && usersResponse.data) {
          const foundUser = usersResponse.data.find(u => u.id === userId || u._id === userId || u.userId === userId);
          if (foundUser) {
            // Transform the data to match the expected format
            const transformedUser = {
              id: foundUser.id || foundUser._id,
              userId: foundUser.userId,
              name: foundUser.nickname || `User${foundUser.userId?.slice(-6) || ''}`,
              email: foundUser.email,
              plan: foundUser.subscription?.plan === 'free' ? 'Basic' :
                    foundUser.subscription?.plan === 'basic' ? 'Basic' :
                    foundUser.subscription?.plan === 'premium' ? 'Premium' :
                    foundUser.subscription?.plan === 'enterprise' ? 'Pro' : 'Basic',
              status: foundUser.isActive ? 'Active' : 'Inactive',
              joinDate: foundUser.createdAt ? new Date(foundUser.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              phone: '+1 (555) 000-0000', // Mock data since not in schema
              location: `${foundUser.location?.city || 'Unknown'}, ${foundUser.location?.country || 'Unknown'}`,
              lastLogin: foundUser.lastLogin ? new Date(foundUser.lastLogin).toLocaleString() : 'Never',
              totalProjects: Math.floor(Math.random() * 50) + 1, // Mock data
              storageUsed: `${(Math.random() * 10).toFixed(1)} GB`, // Mock data
              storageLimit: foundUser.subscription?.plan === 'free' ? '1 GB' :
